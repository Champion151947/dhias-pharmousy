import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { findById } from '../store/index.js';
import { forbidden, unauthorized } from '../utils/errors.js';

const USER_FIELDS = ['id', 'name', 'email', 'phone', 'role', 'phone_verified', 'is_active'];

function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

export function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('token', { path: '/' });
}

/**
 * Whitelists the user fields that are safe to send to the browser. A whitelist
 * is used deliberately: `password_hash` must never reach a response, and a
 * blacklist would leak any sensitive column added later.
 */
export function publicUser(row) {
  if (!row) return null;
  return Object.fromEntries(USER_FIELDS.map((field) => [field, row[field]]));
}

/** Attaches `req.user` when a valid token is present. Never rejects. */
export function attachUser(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    const row = findById('users', Number(payload.sub));
    if (row?.is_active) {
      // Re-read the role on every request so a promotion or ban takes effect
      // immediately, rather than waiting for the token to expire.
      req.user = Object.fromEntries(USER_FIELDS.map((field) => [field, row[field]]));
    }
  } catch {
    /* expired or tampered token -> treat as anonymous */
  }
  return next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  return next();
}

/** Guards pharmacist + admin areas. */
export function requireStaff(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (!['pharmacist', 'admin'].includes(req.user.role)) {
    return next(forbidden('This area is restricted to pharmacy staff'));
  }
  return next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden('Administrator access required'));
  return next();
}
