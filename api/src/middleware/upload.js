import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import config from '../config/env.js';
import { DATA_DIR } from '../store/index.js';
import { badRequest } from '../utils/errors.js';

// Uploaded prescriptions live beside the data file, so the whole mutable state
// of the app is one directory you can back up or mount as a volume.
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['application/pdf', '.pdf'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) ?? '.bin';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

export const prescriptionUpload = multer({
  storage,
  limits: { fileSize: config.commerce.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(badRequest('Upload a JPG, PNG, WEBP image or a PDF file'));
    }
    return cb(null, true);
  },
}).single('prescription');

/** Wraps multer so its errors become clean JSON responses. */
export function handleUpload(req, res, next) {
  prescriptionUpload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(
          badRequest(`File is too large. Maximum size is ${config.commerce.maxUploadMb} MB.`),
        );
      }
      return next(badRequest(`Upload failed: ${error.message}`));
    }
    return next(error);
  });
}

/** Only ever serves files we generated ourselves, by stored name. */
export function resolveStoredFile(storedName) {
  if (!storedName || /[^a-zA-Z0-9._-]/.test(storedName)) return null;
  const absolute = path.join(UPLOAD_DIR, storedName);
  if (!absolute.startsWith(UPLOAD_DIR)) return null;
  if (!fs.existsSync(absolute)) return null;
  return absolute;
}
