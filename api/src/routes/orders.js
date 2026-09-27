import express from 'express';
import { z } from 'zod';
import config from '../config/env.js';
import { filter, find, findBy, findById, insert, nowIso, tx, update } from '../store/index.js';
import { asyncRoute, badRequest, forbidden, notFound } from '../utils/errors.js';
import { generateOrderNo, priceCart, roundMoney } from '../utils/money.js';
import { objectId, parseBody } from '../utils/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { clearCart, getOrCreateCart, readCart } from '../services/cart.js';
import { ensureSessionKey } from './auth.js';

const router = express.Router();

/** Identifies the caller for order reads: account holder or browser session. */
const ownerContext = (req) => ({
  userId: req.user?.id ?? null,
  sessionKey: req.cookies?.dp_session ?? null,
});

const ORDER_FIELDS = [
  'id',
  'order_no',
  'user_id',
  'session_key',
  'status',
  'payment_status',
  'payment_method',
  'subtotal',
  'discount',
  'delivery_fee',
  'tax',
  'total',
  'address',
  'delivery_slot',
  'notes',
  'prescription_id',
  'gateway_order_id',
  'placed_at',
  'delivered_at',
  'cancel_reason',
];

/** Joins customer + prescription details onto an order row. */
function decorateOrder(order) {
  const prescription = order.prescription_id
    ? findById('prescriptions', order.prescription_id)
    : null;
  const user = order.user_id ? findById('users', order.user_id) : null;
  return {
    ...Object.fromEntries(ORDER_FIELDS.map((field) => [field, order[field]])),
    prescription_status: prescription?.status ?? null,
    customer_name: user?.name ?? null,
    customer_phone: user?.phone ?? null,
    customer_email: user?.email ?? null,
  };
}

const itemsFor = (orderId) =>
  filter('order_items', (row) => row.order_id === orderId).map((row) => ({
    id: row.id,
    product_id: row.product_id,
    name: row.name,
    brand: row.brand,
    image_url: row.image_url,
    unit: row.unit,
    mrp: row.mrp,
    price: row.price,
    quantity: row.quantity,
    rx_required: row.rx_required,
  }));

/**
 * A signed-in customer sees their own orders; a guest sees the order tied to
 * their browser session, or any order if they can supply the order number.
 */
function canView(order, { userId, sessionKey }) {
  if (order.user_id != null) return order.user_id === userId;
  if (sessionKey && order.session_key === sessionKey) return true;
  return false;
}

function loadOrder(
  orderId,
  { userId = null, sessionKey = null, allowPublicTracking = false, isStaff = false } = {},
) {
  const order = findById('orders', orderId);
  if (!order) throw notFound('Order not found');
  if (!isStaff && !canView(order, { userId, sessionKey }) && !allowPublicTracking) {
    throw forbidden('You do not have access to that order');
  }
  return {
    ...decorateOrder(order),
    items: itemsFor(order.id),
    has_prescription: Boolean(order.prescription_id),
  };
}

/* ------------------------------------------------------ Rx safety gate */

/**
 * Indian law requires a valid prescription for Schedule H/H1 medicines.
 * The cart is checked here, on the server, and the order is refused unless an
 * approved prescription is attached. The UI mirrors this, but never replaces it.
 */
function resolvePrescription({ userId, prescriptionId, rxItems }) {
  if (rxItems.length === 0) return null;

  const names = rxItems.map((item) => item.name).join(', ');

  // Selling Schedule H/H1 medicine online needs an identifiable customer, so
  // Rx checkout always requires a signed-in account.
  if (!userId) {
    throw badRequest(
      `Please sign in to order prescription medicines: ${names}. We need your details to record the sale.`,
      { code: 'SIGN_IN_REQUIRED', details: { rxItems: rxItems.map((item) => item.name) } },
    );
  }

  if (!prescriptionId) {
    throw badRequest(
      `A valid prescription is required for: ${names}. Please upload a photo or PDF of your prescription.`,
      { code: 'PRESCRIPTION_REQUIRED', details: { rxItems: rxItems.map((item) => item.name) } },
    );
  }

  const prescription = findById('prescriptions', prescriptionId);
  if (!prescription) throw badRequest('We could not find that prescription');
  if (prescription.user_id !== userId) {
    throw badRequest('That prescription belongs to a different account. Please upload your own prescription.');
  }
  if (prescription.status === 'pending') {
    throw badRequest(
      'Our pharmacist is still reviewing your prescription. We will notify you as soon as it is approved.',
      { code: 'PRESCRIPTION_PENDING' },
    );
  }
  if (prescription.status === 'rejected') {
    throw badRequest(
      'That prescription was not accepted. Please upload a clearer photo or a fresh prescription.',
      { code: 'PRESCRIPTION_REJECTED' },
    );
  }
  return prescription;
}

function loadCoupon(code) {
  if (!code) return null;
  const now = nowIso();
  return (
    find(
      'coupons',
      (row) =>
        row.is_active &&
        String(row.code).toUpperCase() === String(code).toUpperCase() &&
        (!row.starts_at || row.starts_at <= now) &&
        (!row.ends_at || row.ends_at >= now),
    ) ?? null
  );
}

/** Returns stock to the shelf. */
function restock(orderId) {
  for (const item of filter('order_items', (row) => row.order_id === orderId)) {
    if (!item.product_id) continue;
    const product = findById('products', item.product_id);
    if (product) update('products', product.id, { stock: product.stock + item.quantity });
  }
}

/** Takes stock off the shelf, never below zero. */
function destock(orderId) {
  for (const item of filter('order_items', (row) => row.order_id === orderId)) {
    if (!item.product_id) continue;
    const product = findById('products', item.product_id);
    if (product) update('products', product.id, { stock: Math.max(0, product.stock - item.quantity) });
  }
}

/* ------------------------------------------------------------ create */

const createSchema = z.object({
  address: z
    .object({
      label: z.string().trim().max(40).optional().default('Home'),
      full_name: z.string().trim().min(2).max(80),
      phone: z
        .string()
        .trim()
        .min(6)
        .max(20)
        .refine((value) => value.replace(/\D/g, '').length >= 10, 'Enter a valid contact number'),
      line1: z.string().trim().min(4).max(160),
      line2: z.string().trim().max(160).optional().nullable(),
      landmark: z.string().trim().max(120).optional().nullable(),
      city: z.string().trim().max(60).optional().default('Thisuur'),
      district: z.string().trim().max(60).optional().nullable(),
      state: z.string().trim().max(60).optional().nullable(),
      pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
    })
    .or(z.coerce.number().int().positive('Select a saved address')),
  delivery_slot: z.string().trim().max(40).optional().nullable(),
  payment_method: z.literal('cod').default('cod'),
  prescription_id: objectId.optional().nullable(),
  coupon_code: z.string().trim().max(24).optional().nullable(),
  notes: z.string().trim().max(400).optional().nullable(),
});

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const sessionKey = ensureSessionKey(req, res);
    const body = parseBody(createSchema, req.body);

    const cartId = getOrCreateCart({
      userId: req.user?.id ?? null,
      sessionKey: req.user ? null : sessionKey,
    });

    const lines = readCart(cartId);
    if (lines.length === 0) throw badRequest('Your cart is empty');

    const unavailable = lines.filter((line) => !line.is_active || line.stock <= 0);
    if (unavailable.length > 0) {
      throw badRequest(
        `${unavailable.map((line) => line.name).join(', ')} ${
          unavailable.length === 1 ? 'is' : 'are'
        } no longer available. Please remove ${unavailable.length === 1 ? 'it' : 'them'} to continue.`,
      );
    }

    const coupon = loadCoupon(body.coupon_code);
    if (body.coupon_code && !coupon) throw badRequest('That coupon code is not valid');

    const priced = priceCart(
      lines.map((line) => ({
        product_id: line.product_id,
        name: line.name,
        brand: line.brand_name,
        image_url: line.image_url,
        unit: line.unit,
        pack_size: line.pack_size,
        mrp: line.mrp,
        price: line.price,
        rxRequired: line.rx_required,
        quantity: line.quantity,
      })),
      {
        taxRate: config.commerce.taxRate,
        deliveryFee: config.commerce.deliveryFee,
        freeDeliveryAbove: config.commerce.freeDeliveryAbove,
        coupon: coupon
          ? {
              kind: coupon.kind,
              value: Number(coupon.value),
              max_discount: coupon.max_discount == null ? null : Number(coupon.max_discount),
              applies_to_rx: coupon.applies_to_rx,
            }
          : null,
      },
    );

    const rxItems = priced.items.filter((item) => item.rxRequired);
    const prescription = resolvePrescription({
      userId: req.user?.id ?? null,
      prescriptionId: body.prescription_id ?? null,
      rxItems,
    });

    // Saved address wins so the order always reflects a verified record.
    let address = body.address;
    if (typeof address === 'number') {
      const saved = find(
        'addresses',
        (row) => row.id === address && row.user_id === (req.user?.id ?? -1),
      );
      if (!saved) throw badRequest('We could not find that delivery address');
      address = {
        id: saved.id,
        label: saved.label,
        full_name: saved.full_name,
        phone: saved.phone,
        line1: saved.line1,
        line2: saved.line2,
        landmark: saved.landmark,
        city: saved.city,
        district: saved.district,
        state: saved.state,
        pincode: saved.pincode,
        is_default: saved.is_default,
      };
    }

    const orderId = tx(() => {
      let orderNo = generateOrderNo();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (!findBy('orders', 'order_no', orderNo)) break;
        orderNo = generateOrderNo();
      }

      const order = insert('orders', {
        order_no: orderNo,
        user_id: req.user?.id ?? null,
        session_key: req.user ? null : sessionKey,
        status: 'confirmed',
        payment_status: 'pending',
        payment_method: 'cod',
        subtotal: roundMoney(priced.subtotal),
        discount: roundMoney(priced.discount),
        delivery_fee: roundMoney(priced.deliveryFee),
        tax: roundMoney(priced.tax),
        total: roundMoney(priced.total),
        address,
        delivery_slot: body.delivery_slot ?? null,
        notes: body.notes ?? null,
        prescription_id: prescription?.id ?? null,
        gateway_order_id: null,
        cancel_reason: null,
        placed_at: nowIso(),
        delivered_at: null,
      });

      for (const item of priced.items) {
        insert('order_items', {
          order_id: order.id,
          product_id: item.product_id,
          name: item.name,
          brand: item.brand ?? null,
          image_url: item.image_url ?? null,
          unit: item.unit ?? null,
          mrp: item.mrp,
          price: item.price,
          quantity: item.quantity,
          rx_required: item.rxRequired,
        });
        const product = findById('products', item.product_id);
        if (product) update('products', product.id, { stock: Math.max(0, product.stock - item.quantity) });
      }

      clearCart(cartId);
      return order.id;
    });

    res.status(201).json({
      order: loadOrder(orderId, { ...ownerContext(req) }),
      payment: null,
      message: 'Order placed. We will call you to confirm before delivery.',
    });
  }),
);

router.post(
  '/:id/cancel',
  requireAuth,
  asyncRoute(async (req, res) => {
    const orderId = Number(req.params.id);
    const order = findById('orders', orderId);
    if (!order) throw notFound('Order not found');
    if (order.user_id !== req.user.id) throw forbidden('You do not have access to that order');
    if (!['placed', 'confirmed', 'packed'].includes(order.status)) {
      throw badRequest('This order can no longer be cancelled. Please call us on 9142225559.');
    }

    tx(() => {
      restock(orderId);
      update('orders', orderId, {
        status: 'cancelled',
        cancel_reason: String(req.body?.reason ?? 'Cancelled by customer').slice(0, 200),
      });
    });

    res.json({ order: loadOrder(orderId, { ...ownerContext(req) }) });
  }),
);

/* ------------------------------------------------------------- read */

router.get(
  '/track/:orderNo',
  asyncRoute(async (req, res) => {
    const orderNo = String(req.params.orderNo).trim().toUpperCase();
    const order = findBy('orders', 'order_no', orderNo);
    if (!order) throw notFound('We could not find an order with that number');
    // Knowing the order number is enough — it is a high-entropy reference.
    res.json({ order: loadOrder(order.id, { allowPublicTracking: true }) });
  }),
);

router.get(
  '/mine',
  requireAuth,
  asyncRoute(async (req, res) => {
    const orders = filter('orders', (row) => row.user_id === req.user.id)
      .sort((a, b) => b.placed_at.localeCompare(a.placed_at))
      .slice(0, 50)
      .map((order) => ({ ...decorateOrder(order), items: itemsFor(order.id) }));
    res.json({ orders });
  }),
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) throw notFound('Order not found');
    res.json({ order: loadOrder(orderId, { ...ownerContext(req) }) });
  }),
);

/* ------------------------------------------------------- staff actions */

const statusSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled']),
  cancel_reason: z.string().trim().max(200).optional().nullable(),
});

router.patch(
  '/:id/status',
  requireStaff,
  asyncRoute(async (req, res) => {
    const orderId = Number(req.params.id);
    const body = parseBody(statusSchema, req.body);

    const current = findById('orders', orderId);
    if (!current) throw notFound('Order not found');

    tx(() => {
      // Stock moves with the status, and only on the transition that matters.
      if (body.status === 'cancelled' && current.status !== 'cancelled') restock(orderId);
      if (current.status === 'cancelled' && body.status !== 'cancelled') destock(orderId);

      const patch = { status: body.status };
      if (body.cancel_reason) patch.cancel_reason = body.cancel_reason;
      if (body.status === 'delivered') patch.delivered_at = nowIso();
      update('orders', orderId, patch);
    });

    res.json({ order: loadOrder(orderId, { isStaff: true }) });
  }),
);

export default router;
