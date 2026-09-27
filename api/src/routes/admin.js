import express from 'express';
import { z } from 'zod';
import { filter, find, findById, findBy, ilike, insert, remove, update } from '../store/index.js';
import { asyncRoute, badRequest, conflict, notFound } from '../utils/errors.js';
import { objectId, parseBody } from '../utils/validate.js';
import { requireStaff } from '../middleware/auth.js';
import { slugify } from '../utils/money.js';

const router = express.Router();

router.use(requireStaff);

/* ------------------------------------------------------------ overview */

router.get(
  '/overview',
  asyncRoute(async (_req, res) => {
    const allProducts = filter('products', () => true);
    const allOrders = filter('orders', () => true);
    const allPrescriptions = filter('prescriptions', () => true);
    const live = allOrders.filter((order) => order.status !== 'cancelled');

    res.json({
      products: {
        total: allProducts.length,
        active: allProducts.filter((row) => row.is_active).length,
        rx: allProducts.filter((row) => row.rx_required).length,
      },
      orders: {
        total: allOrders.length,
        open: allOrders.filter((row) => !['delivered', 'cancelled'].includes(row.status)).length,
        delivered: allOrders.filter((row) => row.status === 'delivered').length,
        cancelled: allOrders.filter((row) => row.status === 'cancelled').length,
      },
      prescriptions: {
        pending: allPrescriptions.filter((row) => row.status === 'pending').length,
        approved: allPrescriptions.filter((row) => row.status === 'approved').length,
        rejected: allPrescriptions.filter((row) => row.status === 'rejected').length,
      },
      revenue: {
        gross: live.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
        collected: live
          .filter((order) => order.payment_status === 'paid')
          .reduce((sum, order) => sum + Number(order.total ?? 0), 0),
        discount_given: live.reduce((sum, order) => sum + Number(order.discount ?? 0), 0),
      },
      lowStock: allProducts
        .filter((row) => row.is_active && row.stock <= 10)
        .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
        .slice(0, 12)
        .map((row) => ({ id: row.id, slug: row.slug, name: row.name, stock: row.stock, unit: row.unit })),
      recentOrders: [...allOrders]
        .sort((a, b) => b.placed_at.localeCompare(a.placed_at))
        .slice(0, 10)
        .map((order) => {
          const user = order.user_id ? findById('users', order.user_id) : null;
          return {
            id: order.id,
            order_no: order.order_no,
            status: order.status,
            payment_status: order.payment_status,
            total: order.total,
            placed_at: order.placed_at,
            customer_name: user?.name ?? null,
            customer_phone: user?.phone ?? null,
            item_count: filter('order_items', (row) => row.order_id === order.id).length,
          };
        }),
    });
  }),
);

/* ------------------------------------------------------------ products */

/** Full product row including category and brand, for the admin screens. */
function adminProduct(row) {
  const category = row.category_id ? findById('categories', row.category_id) : null;
  const brand = row.brand_id ? findById('brands', row.brand_id) : null;
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    salt_composition: row.salt_composition,
    description: row.description,
    pharmacist_note: row.pharmacist_note,
    price: row.price,
    mrp: row.mrp,
    rx_required: row.rx_required,
    schedule_note: row.schedule_note,
    stock: row.stock,
    unit: row.unit,
    pack_size: row.pack_size,
    image_url: row.image_url,
    gallery: row.gallery ?? [],
    is_featured: row.is_featured,
    is_active: row.is_active,
    condition_slug: row.condition_slug,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category_slug: category?.slug ?? null,
    category_name: category?.name ?? null,
    brand_slug: brand?.slug ?? null,
    brand_name: brand?.name ?? null,
  };
}

const productBodySchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(140),
  sku: z.string().trim().min(2, 'SKU is required').max(40),
  slug: z.string().trim().max(90).optional().nullable(),
  brand_id: objectId.optional().nullable(),
  category_id: objectId.optional().nullable(),
  condition_slug: z.string().trim().max(60).optional().nullable(),
  salt_composition: z.string().trim().max(240).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  pharmacist_note: z.string().trim().max(600).optional().nullable(),
  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0),
  rx_required: z.coerce.boolean().default(false),
  schedule_note: z.string().trim().max(80).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  unit: z.string().trim().max(40).optional().nullable(),
  pack_size: z.string().trim().max(40).optional().nullable(),
  image_url: z.string().trim().max(300).optional().nullable(),
  gallery: z.array(z.string().trim().max(300)).max(6).optional(),
  is_featured: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
});

function checkPricing(body) {
  if (body.price > body.mrp) {
    throw badRequest('Selling price cannot be higher than the MRP');
  }
}

router.get(
  '/products',
  asyncRoute(async (req, res) => {
    const term = String(req.query.q ?? '').trim();
    const includeInactive = req.query.includeInactive !== 'false';

    const products = filter('products', (row) => {
      if (!includeInactive && !row.is_active) return false;
      if (!term) return true;
      return ilike(row.name, term) || ilike(row.sku, term);
    })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id)
      .slice(0, 300)
      .map(adminProduct);

    res.json({ products });
  }),
);

router.get(
  '/products/:id',
  asyncRoute(async (req, res) => {
    const row = findById('products', Number(req.params.id));
    if (!row) throw notFound('Product not found');
    res.json({ product: adminProduct(row) });
  }),
);

const productValues = (body) => ({
  name: body.name,
  sku: body.sku,
  brand_id: body.brand_id ?? null,
  category_id: body.category_id ?? null,
  condition_slug: body.condition_slug ?? null,
  salt_composition: body.salt_composition ?? null,
  description: body.description ?? null,
  pharmacist_note: body.pharmacist_note ?? null,
  price: body.price,
  mrp: body.mrp,
  rx_required: body.rx_required,
  schedule_note: body.schedule_note ?? null,
  stock: body.stock,
  unit: body.unit ?? null,
  pack_size: body.pack_size ?? null,
  image_url: body.image_url ?? null,
  gallery: body.gallery ?? [],
  is_featured: body.is_featured,
  is_active: body.is_active,
});

/** Slugs and SKUs address products in URLs, so both must stay unique. */
function assertUniqueSku(sku, exceptId = null) {
  if (find('products', (row) => row.sku === sku && row.id !== exceptId)) {
    throw conflict(`A product with SKU ${sku} already exists`);
  }
}

function assertUniqueSlug(slug, exceptId = null) {
  if (find('products', (row) => row.slug === slug && row.id !== exceptId)) {
    throw conflict(`A product with the slug "${slug}" already exists`);
  }
}

router.post(
  '/products',
  asyncRoute(async (req, res) => {
    const body = parseBody(productBodySchema, req.body);
    checkPricing(body);

    let slug = body.slug ? slugify(body.slug) : slugify(`${body.name}-${body.sku}`);
    if (!slug) throw badRequest('Could not derive a URL slug — please set one explicitly');
    assertUniqueSku(body.sku);
    assertUniqueSlug(slug);

    const product = insert('products', { slug, ...productValues(body) });
    res.status(201).json({ product: { id: product.id, slug: product.slug } });
  }),
);

router.put(
  '/products/:id',
  asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    const body = parseBody(productBodySchema, req.body);
    checkPricing(body);

    const existing = findById('products', id);
    if (!existing) throw notFound('Product not found');

    // Editing a product keeps its slug stable so existing links still work.
    assertUniqueSku(body.sku, id);
    if (body.slug) assertUniqueSlug(slugify(body.slug), id);

    const product = update('products', id, {
      ...(body.slug ? { slug: slugify(body.slug) } : {}),
      ...productValues(body),
    });
    res.json({ product: { id: product.id, slug: product.slug } });
  }),
);

const stockSchema = z.object({ stock: z.coerce.number().int().min(0) });

router.patch(
  '/products/:id/stock',
  asyncRoute(async (req, res) => {
    const { stock } = parseBody(stockSchema, req.body);
    const product = update('products', Number(req.params.id), { stock });
    if (!product) throw notFound('Product not found');
    res.json({ product: { id: product.id, name: product.name, stock: product.stock } });
  }),
);

router.delete(
  '/products/:id',
  asyncRoute(async (req, res) => {
    const removed = remove('products', Number(req.params.id));
    if (!removed) throw notFound('Product not found');
    res.json({ deleted: removed.id });
  }),
);

/* -------------------------------------------------------------- orders */

router.get(
  '/orders',
  asyncRoute(async (req, res) => {
    const status = String(req.query.status ?? '').trim();
    const term = String(req.query.q ?? '').trim();

    const orders = filter('orders', (order) => {
      if (status && order.status !== status) return false;
      if (!term) return true;
      const user = order.user_id ? findById('users', order.user_id) : null;
      return [order.order_no, user?.name, user?.phone].some((value) => ilike(value, term));
    })
      .sort((a, b) => b.placed_at.localeCompare(a.placed_at))
      .slice(0, 200)
      .map((order) => {
        const user = order.user_id ? findById('users', order.user_id) : null;
        const items = filter('order_items', (row) => row.order_id === order.id);
        return {
          id: order.id,
          order_no: order.order_no,
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          total: order.total,
          placed_at: order.placed_at,
          delivered_at: order.delivered_at,
          prescription_id: order.prescription_id,
          customer_name: user?.name ?? null,
          customer_phone: user?.phone ?? null,
          item_count: items.length,
          items: items.map((row) => ({
            name: row.name,
            quantity: row.quantity,
            rx_required: row.rx_required,
            image_url: row.image_url,
          })),
        };
      });

    res.json({ orders });
  }),
);

router.get(
  '/orders/:id',
  asyncRoute(async (req, res) => {
    const order = findById('orders', Number(req.params.id));
    if (!order) throw notFound('Order not found');

    const user = order.user_id ? findById('users', order.user_id) : null;
    const prescription = order.prescription_id
      ? findById('prescriptions', order.prescription_id)
      : null;

    res.json({
      order: {
        id: order.id,
        order_no: order.order_no,
        user_id: order.user_id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        subtotal: order.subtotal,
        discount: order.discount,
        delivery_fee: order.delivery_fee,
        tax: order.tax,
        total: order.total,
        address: order.address,
        delivery_slot: order.delivery_slot,
        notes: order.notes,
        prescription_id: order.prescription_id,
        placed_at: order.placed_at,
        delivered_at: order.delivered_at,
        cancel_reason: order.cancel_reason,
        customer_name: user?.name ?? null,
        customer_phone: user?.phone ?? null,
        customer_email: user?.email ?? null,
        prescription_status: prescription?.status ?? null,
        prescription_file: prescription?.file_name ?? null,
        items: filter('order_items', (row) => row.order_id === order.id).map((row) => ({
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
        })),
      },
    });
  }),
);

/* -------------------------------------------------------------- coupons */

router.get(
  '/coupons',
  asyncRoute(async (_req, res) => {
    const coupons = filter('coupons', () => true).sort(
      (a, b) => Number(b.is_active) - Number(a.is_active) || a.code.localeCompare(b.code),
    );
    res.json({ coupons });
  }),
);

const couponSchema = z.object({
  code: z.string().trim().min(3).max(24),
  description: z.string().trim().max(160).optional().nullable(),
  kind: z.enum(['percent', 'flat']),
  value: z.coerce.number().positive(),
  min_order: z.coerce.number().min(0).default(0),
  max_discount: z.coerce.number().min(0).optional().nullable(),
  applies_to_rx: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
});

router.post(
  '/coupons',
  asyncRoute(async (req, res) => {
    const body = parseBody(couponSchema, req.body);
    const code = body.code.toUpperCase();
    if (findBy('coupons', 'code', code)) throw conflict(`Coupon ${code} already exists`);

    const coupon = insert('coupons', {
      code,
      description: body.description ?? null,
      kind: body.kind,
      value: body.value,
      min_order: body.min_order,
      max_discount: body.max_discount ?? null,
      applies_to_rx: body.applies_to_rx,
      is_active: body.is_active,
      starts_at: null,
      ends_at: null,
    });
    res.status(201).json({ coupon });
  }),
);

router.patch(
  '/coupons/:id',
  asyncRoute(async (req, res) => {
    const body = parseBody(couponSchema.partial(), req.body);
    const id = Number(req.params.id);

    // Only the fields present in the request are changed.
    const patch = {};
    if (body.description !== undefined) patch.description = body.description ?? null;
    if (body.value !== undefined) patch.value = body.value;
    if (body.min_order !== undefined) patch.min_order = body.min_order;
    if (body.max_discount !== undefined) patch.max_discount = body.max_discount ?? null;
    if (body.is_active !== undefined) patch.is_active = body.is_active;
    if (body.applies_to_rx !== undefined) patch.applies_to_rx = body.applies_to_rx;

    const coupon = update('coupons', id, patch);
    if (!coupon) throw notFound('Coupon not found');
    res.json({ coupon });
  }),
);

router.delete(
  '/coupons/:id',
  asyncRoute(async (req, res) => {
    const removed = remove('coupons', Number(req.params.id));
    if (!removed) throw notFound('Coupon not found');
    res.json({ deleted: removed.id });
  }),
);

/* -------------------------------------------------------------- banners */

router.get(
  '/banners',
  asyncRoute(async (_req, res) => {
    const banners = filter('banners', () => true).sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id,
    );
    res.json({ banners });
  }),
);

const bannerSchema = z.object({
  badge: z.string().trim().max(24).optional().nullable(),
  title: z.string().trim().min(2).max(90),
  subtitle: z.string().trim().max(200).optional().nullable(),
  cta_label: z.string().trim().max(40).optional().nullable(),
  cta_href: z.string().trim().max(200).optional().nullable(),
  image_url: z.string().trim().max(300).optional().nullable(),
  theme: z.enum(['primary', 'gold', 'cream', 'dark']).default('primary'),
  placement: z.string().trim().max(40).default('home_promo'),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.boolean().default(true),
});

const bannerValues = (body) => ({
  badge: body.badge ?? null,
  title: body.title,
  subtitle: body.subtitle ?? null,
  cta_label: body.cta_label ?? null,
  cta_href: body.cta_href ?? null,
  image_url: body.image_url ?? null,
  theme: body.theme,
  placement: body.placement,
  sort_order: body.sort_order,
  is_active: body.is_active,
});

router.post(
  '/banners',
  asyncRoute(async (req, res) => {
    const body = parseBody(bannerSchema, req.body);
    if (findBy('banners', 'title', body.title)) {
      throw conflict('A banner with that title already exists');
    }
    res.status(201).json({ banner: insert('banners', bannerValues(body)) });
  }),
);

router.put(
  '/banners/:id',
  asyncRoute(async (req, res) => {
    const body = parseBody(bannerSchema, req.body);
    const id = Number(req.params.id);
    const clash = find('banners', (row) => row.title === body.title && row.id !== id);
    if (clash) throw conflict('A banner with that title already exists');

    const banner = update('banners', id, bannerValues(body));
    if (!banner) throw notFound('Banner not found');
    res.json({ banner });
  }),
);

router.delete(
  '/banners/:id',
  asyncRoute(async (req, res) => {
    const removed = remove('banners', Number(req.params.id));
    if (!removed) throw notFound('Banner not found');
    res.json({ deleted: removed.id });
  }),
);

export default router;
