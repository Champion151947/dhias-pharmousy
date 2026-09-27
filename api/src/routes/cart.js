import express from 'express';
import { z } from 'zod';
import config from '../config/env.js';
import { find, rows, tx } from '../store/index.js';
import { asyncRoute, badRequest, notFound } from '../utils/errors.js';
import { objectId, parseBody } from '../utils/validate.js';
import { priceCart } from '../utils/money.js';
import {
  addIfAvailable,
  addToCart,
  clearCart,
  getOrCreateCart,
  readCart,
  removeItem,
  setItemQuantity,
} from '../services/cart.js';
import { ensureSessionKey } from './auth.js';

const router = express.Router();

function resolveCartId(req, res) {
  return getOrCreateCart({
    userId: req.user?.id ?? null,
    sessionKey: ensureSessionKey(req, res),
  });
}

/** Public cart shape: line items plus the server-computed totals. */
function summarise(cartId) {
  const lines = readCart(cartId);
  const priced = priceCart(
    lines.map((line) => ({
      product_id: line.product_id,
      slug: line.slug,
      name: line.name,
      brand: line.brand_name,
      image_url: line.image_url,
      unit: line.unit,
      pack_size: line.pack_size,
      mrp: line.mrp,
      price: line.price,
      rxRequired: line.rx_required,
      category: line.category_name,
      quantity: line.quantity,
      inStock: line.is_active && line.stock > 0,
      availableStock: line.stock,
    })),
    {
      taxRate: config.commerce.taxRate,
      deliveryFee: config.commerce.deliveryFee,
      freeDeliveryAbove: config.commerce.freeDeliveryAbove,
    },
  );

  const items = priced.items.map((item) => ({
    ...item,
    // The UI keys and mutates lines by product, so expose the product id under
    // both names. The old payload only had `product_id`, which left every
    // React key and every update call undefined.
    id: item.product_id,
    product_id: item.product_id,
    lineTotal: item.lineTotal,
    issue: !item.inStock
      ? 'out_of_stock'
      : item.quantity > item.availableStock
        ? 'insufficient_stock'
        : null,
  }));

  return {
    items,
    totals: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      mrpTotal: priced.mrpTotal,
      subtotal: priced.subtotal,
      discount: priced.discount,
      tax: priced.tax,
      deliveryFee: priced.deliveryFee,
      total: priced.total,
      freeDeliveryAbove: priced.freeDeliveryAbove,
      amountToFreeDelivery: priced.amountToFreeDelivery,
    },
    requiresPrescription: priced.hasRx,
  };
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(summarise(resolveCartId(req, res)));
  }),
);

const addSchema = z
  .object({
    product_id: objectId,
    quantity: z.coerce.number().int().min(1).max(99).optional().default(1),
  })
  .catchall(z.unknown());

router.post(
  '/items',
  asyncRoute(async (req, res) => {
    // The storefront historically sent `product_id`; accept `productId` too so
    // either spelling works against the same endpoint.
    const body = parseBody(addSchema, {
      product_id: req.body?.product_id ?? req.body?.productId,
      quantity: req.body?.quantity,
    });
    const cartId = resolveCartId(req, res);

    // Validate before writing so a rejected add never leaves a stray line.
    const product = find('products', (row) => row.id === body.product_id);
    if (!product?.is_active) throw notFound('That product is no longer available');
    if (product.stock <= 0) throw badRequest(`${product.name} is out of stock right now`);

    let notice = null;
    tx(() => {
      const line = find(
        'cart_items',
        (row) => row.cart_id === cartId && row.product_id === body.product_id,
      );
      const wanted = (line?.quantity ?? 0) + body.quantity;
      if (wanted > product.stock) {
        notice = `Only ${product.stock} in stock for ${product.name}, so we added what we could.`;
      }
      addToCart(cartId, body.product_id, body.quantity);
    });

    res.status(201).json({ ...summarise(cartId), notice });
  }),
);

const updateSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
});

/** Sets the absolute quantity for a line; 0 removes it. */
function setQuantity(req, res, productId) {
  const { quantity } = parseBody(updateSchema, req.body);
  const cartId = resolveCartId(req, res);

  const line = find(
    'cart_items',
    (row) => row.cart_id === cartId && row.product_id === productId,
  );
  if (!line) throw notFound('That item is not in your cart');

  const product = find('products', (row) => row.id === productId);
  const stock = product?.stock ?? 0;
  if (quantity > stock) {
    throw badRequest(`Only ${stock} left in stock for${product ? ` ${product.name}` : ' that item'}`);
  }

  tx(() => setItemQuantity(cartId, productId, quantity));
  return summarise(cartId);
}

router.patch(
  '/items',
  asyncRoute(async (req, res) => {
    const productId = Number(req.body?.product_id ?? req.body?.productId);
    if (!Number.isInteger(productId) || productId <= 0) throw badRequest('Which item?');
    res.json(setQuantity(req, res, productId));
  }),
);

router.patch(
  '/items/:productId',
  asyncRoute(async (req, res) => {
    res.json(setQuantity(req, res, Number(req.params.productId)));
  }),
);

router.delete(
  '/items/:productId',
  asyncRoute(async (req, res) => {
    const cartId = resolveCartId(req, res);
    removeItem(cartId, Number(req.params.productId));
    res.json(summarise(cartId));
  }),
);

router.post(
  '/clear',
  asyncRoute(async (req, res) => {
    const cartId = resolveCartId(req, res);
    clearCart(cartId);
    res.json(summarise(cartId));
  }),
);

router.delete(
  '/',
  asyncRoute(async (req, res) => {
    // Alias so the storefront can use the RESTful verb it expects.
    const cartId = resolveCartId(req, res);
    clearCart(cartId);
    res.json(summarise(cartId));
  }),
);

/** Re-adds every product from a past order in one call. */
router.post(
  '/reorder',
  asyncRoute(async (req, res) => {
    if (!req.user) throw badRequest('Please sign in to reorder');
    const cartId = resolveCartId(req, res);

    const pastItems = readOrderItems(req.user.id);
    if (pastItems.length === 0) throw badRequest('We could not find any previous items to reorder');

    tx(() => {
      for (const item of pastItems) {
        if (!item.product_id) continue;
        addIfAvailable(cartId, item.product_id, item.quantity);
      }
    });

    res.json(summarise(cartId));
  }),
);

/** Up to 60 recently ordered lines, newest order first. */
function readOrderItems(userId) {
  const orderIds = rows('orders')
    .filter((order) => order.user_id === userId)
    .sort((a, b) => b.placed_at.localeCompare(a.placed_at))
    .map((order) => order.id)
    .slice(0, 50);

  const wanted = new Set(orderIds);
  return rows('order_items').filter((item) => wanted.has(item.order_id)).slice(0, 60);
}

export default router;
