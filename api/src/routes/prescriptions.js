import express from 'express';
import { z } from 'zod';
import { filter, find, findById, insert, nowIso, remove, update } from '../store/index.js';
import { asyncRoute, badRequest, notFound } from '../utils/errors.js';
import { objectId, parseBody } from '../utils/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { handleUpload, resolveStoredFile } from '../middleware/upload.js';
import { ensureSessionKey } from './auth.js';

const router = express.Router();

const RX_FIELDS = [
  'id',
  'user_id',
  'file_name',
  'stored_name',
  'mime_type',
  'size_bytes',
  'status',
  'patient_name',
  'patient_age',
  'doctor_name',
  'review_note',
  'reviewed_at',
  'created_at',
];

/** Joins the customer and the order that referenced the prescription. */
function decorate(row) {
  const user = row.user_id ? findById('users', row.user_id) : null;
  const order = find('orders', (candidate) => candidate.prescription_id === row.id);
  return {
    ...Object.fromEntries(RX_FIELDS.map((field) => [field, row[field]])),
    customer_name: user?.name ?? null,
    customer_phone: user?.phone ?? null,
    customer_email: user?.email ?? null,
    order_no: order?.order_no ?? null,
  };
}

/* ------------------------------------------------------------- customer */

const metaSchema = z.object({
  patient_name: z.string().trim().max(80).optional(),
  patient_age: z.string().trim().max(20).optional(),
  doctor_name: z.string().trim().max(80).optional(),
});

/** Requires `multipart/form-data` with a `prescription` file field. */
router.post(
  '/',
  handleUpload,
  asyncRoute(async (req, res) => {
    ensureSessionKey(req, res);
    if (!req.file) throw badRequest('Please attach a photo or PDF of your prescription');

    const meta = parseBody(metaSchema, {
      patient_name: req.body?.patient_name,
      patient_age: req.body?.patient_age,
      doctor_name: req.body?.doctor_name,
    });

    const row = insert('prescriptions', {
      user_id: req.user?.id ?? null,
      file_name: req.file.originalname?.slice(0, 180) || 'prescription',
      stored_name: req.file.filename,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      status: 'pending',
      patient_name: meta.patient_name ?? null,
      patient_age: meta.patient_age ?? null,
      doctor_name: meta.doctor_name ?? null,
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
    });

    res.status(201).json({
      prescription: decorate(row),
      message:
        'Prescription received. Our pharmacist will review it shortly — you will be able to place the order once it is approved.',
    });
  }),
);

router.get(
  '/',
  requireAuth,
  asyncRoute(async (req, res) => {
    const prescriptions = filter('prescriptions', (row) => row.user_id === req.user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(decorate);
    res.json({ prescriptions });
  }),
);

router.get(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const isStaff = ['pharmacist', 'admin'].includes(req.user.role);
    const row = find('prescriptions', (candidate) => {
      if (candidate.id !== Number(req.params.id)) return false;
      return isStaff || candidate.user_id === req.user.id;
    });
    if (!row) throw notFound('Prescription not found');
    res.json({ prescription: decorate(row) });
  }),
);

/* ---------------------------------------------------------------- staff */

router.get(
  '/staff/queue',
  requireStaff,
  asyncRoute(async (req, res) => {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
      ? req.query.status
      : null;

    const all = filter('prescriptions', (row) => !status || row.status === status);
    const prescriptions = [...all]
      .sort(
        (a, b) =>
          (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
          b.created_at.localeCompare(a.created_at),
      )
      .slice(0, 200)
      .map(decorate);

    const counts = filter('prescriptions', () => true).reduce((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});

    res.json({ prescriptions, counts });
  }),
);

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_note: z.string().trim().max(500).optional(),
  prescriptionId: objectId,
});

router.post(
  '/staff/review',
  requireStaff,
  asyncRoute(async (req, res) => {
    const body = parseBody(reviewSchema, req.body);

    const row = update('prescriptions', body.prescriptionId, {
      status: body.status,
      ...(body.review_note ? { review_note: body.review_note } : {}),
      reviewed_by: req.user.id,
      reviewed_at: nowIso(),
    });
    if (!row) throw notFound('Prescription not found');

    res.json({
      prescription: {
        id: row.id,
        status: row.status,
        review_note: row.review_note,
        reviewed_at: row.reviewed_at,
      },
    });
  }),
);

/* --------------------------------------------------------------- serving */

router.delete(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const row = find('prescriptions', (candidate) => {
      if (candidate.id !== Number(req.params.id)) return false;
      return candidate.user_id === req.user.id;
    });
    if (!row) throw notFound('Prescription not found');
    // Only an unapproved upload can be withdrawn; once a pharmacist has acted
    // on it, the record is part of the order history.
    if (row.status !== 'pending') {
      throw badRequest('This prescription has already been reviewed, so it cannot be deleted');
    }
    remove('prescriptions', row.id);
    res.json({ deleted: row.id });
  }),
);

router.get(
  '/:id/file',
  asyncRoute(async (req, res) => {
    const row = findById('prescriptions', Number(req.params.id));
    if (!row) throw notFound('Prescription not found');

    const isOwner = req.user?.id === row.user_id;
    const isStaff = ['pharmacist', 'admin'].includes(req.user?.role);
    if (!isOwner && !isStaff) throw notFound('Prescription not found');

    const absolute = resolveStoredFile(row.stored_name);
    if (!absolute) throw notFound('The stored file is no longer available');

    res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(absolute);
  }),
);

export default router;
