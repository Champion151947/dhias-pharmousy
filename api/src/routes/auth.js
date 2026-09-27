import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import { filter, find, insert, nowIso, tx, update } from '../store/index.js';
import { asyncRoute, badRequest, conflict, unauthorized } from '../utils/errors.js';
import { email as emailField, otpCode, parseBody, password, phone as phoneField } from '../utils/validate.js';
import { generateOtp, normalisePhone, sha256 } from '../utils/money.js';
import { sendOtpSms } from '../services/otp.js';
import { clearAuthCookie, publicUser, requireAuth, setAuthCookie, signToken } from '../middleware/auth.js';
import { mergeCarts } from '../services/cart.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts. Please try again in a few minutes.', code: 'RATE_LIMITED' } },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many codes requested. Please wait a few minutes.', code: 'RATE_LIMITED' } },
});

const SESSION_COOKIE = 'dp_session';

function issueSession(res) {
  const key = sha256(`${Date.now()}:${Math.random()}`);
  res.cookie(SESSION_COOKIE, key, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return key;
}

export function ensureSessionKey(req, res) {
  const existing = req.cookies?.[SESSION_COOKIE];
  if (existing) return existing;
  // A cookie set on this response is not yet visible on this request, so the
  // freshly minted key is returned for immediate use.
  return issueSession(res);
}

async function completeLogin(req, res, user) {
  const token = signToken(user);
  setAuthCookie(res, token);
  update('users', user.id, { last_login_at: nowIso() });
  if (req.cookies?.[SESSION_COOKIE]) {
    mergeCarts({ sessionKey: req.cookies[SESSION_COOKIE], userId: user.id });
  }
  return { user: publicUser(user), token };
}

const findByEmail = (email) =>
  find('users', (row) => String(row.email ?? '').toLowerCase() === String(email).toLowerCase());

/* ------------------------------------------------------------------ signup */

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: emailField,
  phone: phoneField,
  password: password,
});

router.post(
  '/signup',
  authLimiter,
  asyncRoute(async (req, res) => {
    const body = parseBody(signupSchema, req.body);
    const phoneDigits = normalisePhone(body.phone);
    const email = body.email.toLowerCase();

    if (findByEmail(email)) throw conflict('An account with that email already exists');
    if (find('users', (row) => row.phone === phoneDigits)) {
      throw conflict('An account with that mobile number already exists');
    }

    const hash = await bcrypt.hash(body.password, config.auth.bcryptRounds);
    const user = insert('users', {
      name: body.name,
      email,
      phone: phoneDigits,
      password_hash: hash,
      role: 'customer',
      phone_verified: false,
      is_active: true,
      last_login_at: null,
    });

    res.status(201).json(await completeLogin(req, res, user));
  }),
);

/* ----------------------------------------------------------------- login */

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
});

router.post(
  '/login',
  authLimiter,
  asyncRoute(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    const identifier = body.identifier.trim();
    const asPhone = /^[6-9]\d{9}$/.test(normalisePhone(identifier)) ? normalisePhone(identifier) : null;

    const user = asPhone
      ? find('users', (row) => row.phone === asPhone)
      : findByEmail(identifier);

    // Same message either way so the endpoint can't enumerate accounts.
    const invalid = unauthorized('Email or password is incorrect');
    if (!user?.password_hash) throw invalid;

    const matches = await bcrypt.compare(body.password, user.password_hash);
    if (!matches) throw invalid;
    if (!user.is_active) throw unauthorized('This account has been deactivated. Please call 9142225559.');

    res.json(await completeLogin(req, res, user));
  }),
);

/* ------------------------------------------------------------- phone OTP */

const requestOtpSchema = z.object({
  phone: phoneField,
  name: z.string().trim().max(80).optional(),
});

router.post(
  '/otp/request',
  otpLimiter,
  asyncRoute(async (req, res) => {
    const body = parseBody(requestOtpSchema, req.body);
    const phoneDigits = normalisePhone(body.phone);

    const recent = filter('otp_codes', (row) => row.phone === phoneDigits && !row.consumed_at)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (recent) {
      const waitSeconds =
        config.otp.resendCooldownSeconds -
        Math.floor((Date.now() - new Date(recent.created_at).getTime()) / 1000);
      if (waitSeconds > 0) {
        throw badRequest(`Please wait ${waitSeconds} seconds before requesting another code.`);
      }
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60_000).toISOString();

    tx(() => {
      // Any earlier unused code for this number stops working.
      for (const row of filter('otp_codes', (r) => r.phone === phoneDigits && !r.consumed_at)) {
        row.consumed_at = nowIso();
      }
      insert('otp_codes', {
        phone: phoneDigits,
        code_hash: sha256(code),
        purpose: 'login',
        attempts: 0,
        expires_at: expiresAt,
        consumed_at: null,
      });
    });

    try {
      await sendOtpSms(phoneDigits, code);
    } catch (error) {
      console.error('[otp] delivery failed', error.message);
      throw badRequest('We could not send the code right now. Please try again or call 9142225559.');
    }

    res.json({
      message: `We have sent a 6-digit code to +91 ${phoneDigits}.`,
      phone: phoneDigits,
      expiresInMinutes: config.otp.expiryMinutes,
      // Development affordance: the console provider prints the code in the
      // server log. Never surfaced when a real SMS provider is configured.
      ...(config.otp.provider === 'console' && !config.isProd ? { devCode: code } : {}),
    });
  }),
);

const verifyOtpSchema = z.object({
  phone: phoneField,
  code: otpCode,
  name: z.string().trim().min(2, 'Enter your full name').max(80).optional(),
});

router.post(
  '/otp/verify',
  otpLimiter,
  asyncRoute(async (req, res) => {
    const body = parseBody(verifyOtpSchema, req.body);
    const phoneDigits = normalisePhone(body.phone);

    const record = filter('otp_codes', (row) => row.phone === phoneDigits && !row.consumed_at)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!record) throw badRequest('Request a new code — the previous one has expired.');
    if (new Date(record.expires_at) < new Date()) throw badRequest('That code has expired. Request a new one.');
    if (record.attempts >= config.otp.maxAttempts) {
      throw badRequest('Too many incorrect attempts. Request a new code.');
    }
    if (record.code_hash !== sha256(body.code)) {
      update('otp_codes', record.id, { attempts: record.attempts + 1 });
      throw unauthorized('That code is not correct');
    }

    update('otp_codes', record.id, { consumed_at: nowIso() });

    const existing = find('users', (row) => row.phone === phoneDigits);
    let user = existing;
    if (!user) {
      if (!body.name) {
        throw badRequest('Welcome! Tell us your name to finish creating your account.', {
          code: 'NAME_REQUIRED',
        });
      }
      user = insert('users', {
        name: body.name,
        email: null,
        phone: phoneDigits,
        password_hash: null,
        role: 'customer',
        phone_verified: true,
        is_active: true,
        last_login_at: null,
      });
    } else {
      user = update('users', user.id, { phone_verified: true });
    }

    if (!user.is_active) throw unauthorized('This account has been deactivated. Please call 9142225559.');

    res.json(await completeLogin(req, res, user));
  }),
);

/* ------------------------------------------------------------------ me */

router.get(
  '/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  }),
);

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80).optional(),
  email: z
    .string()
    .trim()
    .min(5)
    .max(160)
    .refine((value) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value), 'Enter a valid email address')
    .optional(),
});

router.patch(
  '/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const body = parseBody(profileSchema, req.body);

    if (body.email) {
      const clash = findByEmail(body.email);
      if (clash && clash.id !== req.user.id) throw conflict('That email is already in use');
    }

    const user = tx(() => {
      const patch = {};
      if (body.name) patch.name = body.name;
      if (body.email) patch.email = body.email.toLowerCase();
      return update('users', req.user.id, patch);
    });
    res.json({ user: publicUser(user) });
  }),
);

router.post(
  '/logout',
  asyncRoute(async (_req, res) => {
    clearAuthCookie(res);
    res.json({ message: 'Signed out' });
  }),
);

/* ------------------------------------------------------------- google login (simple mock) */

const googleLoginSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  picture: z.union([z.string().url(), z.literal('')]).optional(),
});

router.post(
  '/google',
  authLimiter,
  asyncRoute(async (req, res) => {
    const body = parseBody(googleLoginSchema, req.body);
    const email = body.email.toLowerCase();

    const existing = findByEmail(email);
    const user =
      existing ??
      insert('users', {
        name: body.name,
        email,
        phone: null,
        password_hash: null,
        role: 'customer',
        phone_verified: true,
        is_active: true,
        last_login_at: null,
      });

    if (!user.is_active) throw unauthorized('This account has been deactivated. Please call 9142225559.');

    res.json(await completeLogin(req, res, user));
  }),
);

export default router;
