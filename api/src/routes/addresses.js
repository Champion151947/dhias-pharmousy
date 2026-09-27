import express from 'express';
import { z } from 'zod';
import { filter, find, insert, remove, tx, update, updateWhere } from '../store/index.js';
import { asyncRoute, notFound } from '../utils/errors.js';
import { addressSchema, objectId, parseBody } from '../utils/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const ADDRESS_FIELDS = [
  'id',
  'label',
  'full_name',
  'phone',
  'line1',
  'line2',
  'landmark',
  'city',
  'district',
  'state',
  'pincode',
  'is_default',
];

const project = (row) => Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, row[field]]));

const listFor = (userId) =>
  filter('addresses', (row) => row.user_id === userId).sort(
    (a, b) => Number(b.is_default) - Number(a.is_default) || b.id - a.id,
  );

router.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json({ addresses: listFor(req.user.id).map(project) });
  }),
);

function persist(userId, payload, addressId = null) {
  const data = parseBody(addressSchema, payload);

  return tx(() => {
    if (data.is_default) {
      // A user has exactly one default, so clear the others first.
      updateWhere('addresses', (row) => row.user_id === userId, { is_default: false });
    }

    const values = {
      label: data.label,
      full_name: data.full_name,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 ?? null,
      landmark: data.landmark ?? null,
      city: data.city,
      district: data.district ?? null,
      state: data.state ?? null,
      pincode: data.pincode,
      is_default: data.is_default,
    };

    if (addressId) {
      const existing = find('addresses', (row) => row.id === addressId && row.user_id === userId);
      if (!existing) return null;
      return project(update('addresses', addressId, values));
    }
    return project(insert('addresses', { user_id: userId, ...values }));
  });
}

router.post(
  '/',
  asyncRoute(async (req, res) => {
    res.status(201).json({ address: persist(req.user.id, req.body) });
  }),
);

router.put(
  '/:id',
  asyncRoute(async (req, res) => {
    const address = persist(req.user.id, req.body, Number(req.params.id));
    if (!address) throw notFound('Address not found');
    res.json({ address });
  }),
);

const idSchema = z.object({ id: objectId });

router.post(
  '/:id/default',
  asyncRoute(async (req, res) => {
    const { id } = parseBody(idSchema, { id: req.params.id });
    const address = tx(() => {
      updateWhere('addresses', (row) => row.user_id === req.user.id, { is_default: false });
      const existing = find('addresses', (row) => row.id === id && row.user_id === req.user.id);
      if (!existing) return null;
      return project(update('addresses', id, { is_default: true }));
    });
    if (!address) throw notFound('Address not found');
    res.json({ address });
  }),
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const existing = find(
      'addresses',
      (row) => row.id === Number(req.params.id) && row.user_id === req.user.id,
    );
    if (!existing) throw notFound('Address not found');
    remove('addresses', existing.id);
    res.json({ deleted: existing.id });
  }),
);

export default router;
