import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const API_ROOT = path.resolve(here, '..', '..');
export const REPO_ROOT = path.resolve(API_ROOT, '..');

for (const candidate of [path.join(API_ROOT, '.env'), path.join(REPO_ROOT, '.env')]) {
  if (fs.existsSync(candidate)) dotenv.config({ path: candidate });
}

const num = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value, fallback = []) =>
  (value ? String(value).split(',') : fallback)
    .map((entry) => entry.trim())
    .filter(Boolean);

const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

const jwtSecret = process.env.JWT_SECRET?.trim() || '';

if (isProd && jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET must be set to at least 32 characters in production. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
  );
}

/**
 * The development admin password is intentionally a weak, well-known value so
 * a fresh clone is usable with zero setup. It is never accepted in production:
 * the store refuses to seed an admin account unless a strong password is
 * supplied through the environment, so a public repository cannot hand out a
 * working admin login.
 */
const DEMO_ADMIN_PASSWORD = 'Admin@12345';
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || '';
const hasStrongAdminPassword =
  adminPassword.length >= 12 && adminPassword !== DEMO_ADMIN_PASSWORD;

if (isProd && !hasStrongAdminPassword) {
  throw new Error(
    'ADMIN_PASSWORD must be set to at least 12 characters in production and ' +
      'must not be the development default. Generate a strong one with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(18).toString(\'base64url\'))"',
  );
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  isProd,
  isDev: !isProd,
  port: num(process.env.PORT, 4000),
  apiUrl: process.env.API_URL?.trim() || 'http://localhost:4000',
  webUrls: list(process.env.WEB_URL, [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
  ]),

  // The dataset is a plain JSON file. DATA_DIR is only needed on hosts with a
  // read-only image and a mounted volume, e.g. /data.
  data: {
    dir: process.env.DATA_DIR?.trim() || '',
  },

  auth: {
    jwtSecret: jwtSecret || 'insecure-development-only-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d',
    bcryptRounds: num(process.env.BCRYPT_ROUNDS, 10),
    hasStrongAdminPassword,
    admin: {
      email: (process.env.ADMIN_EMAIL?.trim() || 'admin@dhiaspharmousy.in').toLowerCase(),
      password: hasStrongAdminPassword ? adminPassword : DEMO_ADMIN_PASSWORD,
      phone: (process.env.ADMIN_PHONE?.trim() || '9142225559').replace(/\D/g, ''),
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID?.trim() || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
    },
  },

  otp: {
    provider: process.env.OTP_PROVIDER?.trim() || 'console',
    expiryMinutes: num(process.env.OTP_EXPIRY_MINUTES, 5),
    maxAttempts: num(process.env.OTP_MAX_ATTEMPTS, 5),
    resendCooldownSeconds: num(process.env.OTP_RESEND_COOLDOWN_SECONDS, 30),
    msg91: {
      authKey: process.env.MSG91_AUTH_KEY?.trim() || '',
      templateId: process.env.MSG91_TEMPLATE_ID?.trim() || '',
      flowId: process.env.MSG91_FLOW_ID?.trim() || '',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || '',
      authToken: process.env.TWILIO_AUTH_TOKEN?.trim() || '',
      verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID?.trim() || '',
    },
  },

  // Cash on delivery is the only payment method, so there is no gateway to
  // configure. This stays as a named constant for the storefront to read.
  payments: {
    mode: 'cod',
  },

  store: {
    name: process.env.STORE_NAME?.trim() || "Dhiya's Pharmousy",
    addressLine1: process.env.STORE_ADDRESS_LINE_1?.trim() || 'Main Bazaar Road',
    addressLine2: process.env.STORE_ADDRESS_LINE_2?.trim() || 'Thisuur, Ollur',
    city: process.env.STORE_CITY?.trim() || 'Thisuur',
    district: process.env.STORE_DISTRICT?.trim() || 'Ollur',
    state: process.env.STORE_STATE?.trim() || 'Tamil Nadu',
    pincode: process.env.STORE_PINCODE?.trim() || '682310',
    phone: (process.env.STORE_PHONE?.trim() || '9142225559').replace(/\D/g, ''),
    whatsapp: (process.env.STORE_WHATSAPP?.trim() || '919142225559').replace(/\D/g, ''),
    email: process.env.STORE_EMAIL?.trim() || 'care@dhiaspharmousy.in',
    gstin: process.env.GSTIN?.trim() || '',
    drugLicense: process.env.DRUG_LICENSE_NUMBER?.trim() || '',
  },

  commerce: {
    currency: process.env.CURRENCY?.trim() || 'INR',
    freeDeliveryAbove: num(process.env.FREE_DELIVERY_ABOVE, 499),
    deliveryFee: num(process.env.DELIVERY_FEE, 39),
    // Indian law requires the displayed MRP to include all taxes, so listed
    // prices are already tax-inclusive and nothing is added at checkout.
    // Set a non-zero rate only if you deliberately want a separate tax line.
    taxRate: num(process.env.TAX_RATE, 0),
    deliverySlots: list(process.env.DELIVERY_SLOTS, [
      '09:00 AM - 01:00 PM',
      '01:00 PM - 05:00 PM',
      '05:00 PM - 09:00 PM',
    ]),
    maxUploadMb: num(process.env.MAX_UPLOAD_MB, 5),
  },
};

export const store = config.store;
export default config;
