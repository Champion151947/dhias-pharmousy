import { z } from 'zod';
import { badRequest } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const email = z
  .string()
  .trim()
  .min(5)
  .max(160)
  .refine((value) => EMAIL_RE.test(value), 'Enter a valid email address');

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
    message: 'Password must contain both letters and numbers',
  });

export const phone = z
  .string()
  .trim()
  .refine((value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, '').replace(/^0?91/, '').replace(/^91/, '')), {
    message: 'Enter a valid 10-digit Indian mobile number',
  })
  .transform((value) => value.replace(/\D/g, '').replace(/^0?91/, '').replace(/^91/, ''));

export const otpCode = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');

export const id = z.coerce.number().int().positive();

export const objectId = z
  .union([z.coerce.number().int().positive(), z.string().trim().min(1)])
  .transform((value) => (typeof value === 'number' ? value : Number.parseInt(value, 10)))
  .refine((value) => Number.isInteger(value) && value > 0, 'Invalid identifier');

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default('Home'),
  full_name: z.string().trim().min(2).max(80),
  phone,
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().nullable(),
  landmark: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(60).optional().default('Thisuur'),
  district: z.string().trim().max(60).optional().nullable(),
  state: z.string().trim().max(60).optional().nullable(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  is_default: z.boolean().optional().default(false),
});

export function parseBody(schema, payload) {
  const result = schema.safeParse(payload ?? {});
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
  throw badRequest(details[0]?.message ?? 'Invalid request', { details });
}

export function parseQuery(schema, payload) {
  const result = schema.safeParse(payload ?? {});
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
  throw badRequest(details[0]?.message ?? 'Invalid query', { details });
}
