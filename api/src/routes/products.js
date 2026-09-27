import express from 'express';
import { z } from 'zod';
import { filter, find, ilike } from '../store/index.js';
import { asyncRoute, notFound } from '../utils/errors.js';
import { parseQuery } from '../utils/validate.js';

const router = express.Router();

/** Joins a product row to its category and brand, matching the old SELECT. */
function decorateProduct(product) {
  const category = product.category_id
    ? find('categories', (row) => row.id === product.category_id)
    : null;
  const brand = product.brand_id ? find('brands', (row) => row.id === product.brand_id) : null;

  const discount =
    product.mrp > 0 && product.price < product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    salt_composition: product.salt_composition,
    description: product.description,
    price: product.price,
    mrp: product.mrp,
    rx_required: product.rx_required,
    schedule_note: product.schedule_note,
    stock: product.stock,
    unit: product.unit,
    pack_size: product.pack_size,
    image_url: product.image_url,
    gallery: product.gallery ?? [],
    is_featured: product.is_featured,
    condition_slug: product.condition_slug,
    category_id: product.category_id,
    category_slug: category?.slug ?? null,
    category_name: category?.name ?? null,
    category_icon: category?.icon ?? null,
    brand_id: brand?.id ?? null,
    brand_slug: brand?.slug ?? null,
    brand_name: brand?.name ?? null,
    discount_percent: discount,
    in_stock: product.stock > 0,
  };
}

const SORTS = {
  relevance: (a, b) => Number(b.is_featured) - Number(a.is_featured) || a.id - b.id,
  newest: (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id,
  'price-asc': (a, b) => a.price - b.price || a.id - b.id,
  'price-desc': (a, b) => b.price - a.price || b.id - a.id,
  'discount-desc': (a, b) => {
    const rate = (row) => (row.mrp > 0 ? (row.mrp - row.price) / row.mrp : 0);
    return rate(b) - rate(a) || a.id - b.id;
  },
  'name-asc': (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  popular: (a, b) =>
    Number(b.is_featured) - Number(a.is_featured) || b.stock - a.stock || a.id - b.id,
};

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  condition: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minDiscount: z.coerce.number().min(0).max(95).optional(),
  rx: z.enum(['all', 'required', 'otc']).optional().default('all'),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(Object.keys(SORTS)).optional().default('relevance'),
  page: z.coerce.number().int().min(1).optional().default(1),
  // The storefront asks for `limit`; `pageSize` is kept as the explicit alias.
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  featured: z.coerce.boolean().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

/** Applies the query string filters in JS, mirroring the old WHERE clause. */
function matches(product, input, { includeInactive }) {
  if (!includeInactive && !product.is_active) return false;

  if (input.q) {
    const category = product.category_id
      ? find('categories', (row) => row.id === product.category_id)
      : null;
    const brand = product.brand_id ? find('brands', (row) => row.id === product.brand_id) : null;
    const haystack = [
      product.name,
      product.salt_composition,
      product.description,
      product.sku,
      brand?.name,
      category?.name,
    ];
    if (!haystack.some((value) => ilike(value, input.q))) return false;
  }

  if (input.category) {
    const category = product.category_id
      ? find('categories', (row) => row.id === product.category_id)
      : null;
    if (category?.slug !== input.category) return false;
    // A filter on a hidden category must not leak its products.
    if (!category.is_active) return false;
  }

  if (input.brand) {
    const brand = product.brand_id ? find('brands', (row) => row.id === product.brand_id) : null;
    if (brand?.slug !== input.brand) return false;
  }

  if (input.condition && product.condition_slug !== input.condition) return false;
  if (input.minPrice != null && product.price < input.minPrice) return false;
  if (input.maxPrice != null && product.price > input.maxPrice) return false;
  if (input.minDiscount != null) {
    if (product.mrp <= 0) return false;
    if (((product.mrp - product.price) / product.mrp) * 100 < input.minDiscount) return false;
  }
  if (input.rx === 'required' && !product.rx_required) return false;
  if (input.rx === 'otc' && product.rx_required) return false;
  if (input.inStock && product.stock <= 0) return false;
  if (input.featured && !product.is_featured) return false;

  return true;
}

/** Facets power the filter sidebar, so counts reflect real inventory. */
function loadFacets() {
  const active = filter('products', (row) => row.is_active);
  // sort_order only exists on the stored rows, so order before projecting.
  const bySortOrder = (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name);

  const categories = filter('categories', (row) => row.is_active)
    .sort(bySortOrder)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      icon: row.icon,
      tagline: row.tagline,
      accent: row.accent,
      count: active.filter((product) => product.category_id === row.id).length,
    }));

  const brands = filter('brands', (row) => row.is_active)
    .sort(bySortOrder)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      monogram: row.monogram,
      accent: row.accent,
      count: active.filter((product) => product.brand_id === row.id).length,
    }))
    .slice(0, 40);

  // Conditions with no stock yet still show on the grid.
  const conditions = filter('conditions', (row) => row.is_active)
    .sort(bySortOrder)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      icon: row.icon,
      accent: row.accent,
      count: active.filter((product) => product.condition_slug === row.slug).length,
    }));

  const prices = active.map((row) => row.price);
  const priceRange = {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
  };

  return { categories, brands, conditions, priceRange };
}

/* ------------------------------------------------------------- taxonomy */

router.get(
  '/taxonomy',
  asyncRoute(async (_req, res) => {
    res.json(loadFacets());
  }),
);

/**
 * Convenience alias for the storefront, which asks for just the category list
 * when building the filter sidebar.
 */
router.get(
  '/categories/list',
  asyncRoute(async (_req, res) => {
    res.json({ categories: loadFacets().categories });
  }),
);

/* ---------------------------------------------------------------- search */

router.get(
  '/search/suggest',
  asyncRoute(async (req, res) => {
    const term = String(req.query.q ?? '').trim();
    if (term.length < 1) return res.json({ suggestions: [] });

    const termLower = term.toLowerCase();
    const matches = filter('products', (product) => {
      if (!product.is_active) return false;
      const brand = product.brand_id ? find('brands', (row) => row.id === product.brand_id) : null;
      return [product.name, product.salt_composition, brand?.name].some((value) =>
        ilike(value, term),
      );
    });

    // Exact name first, then prefix matches, then anything else.
    const rank = (product) => {
      const name = product.name.toLowerCase();
      if (name === termLower) return 0;
      if (name.startsWith(termLower)) return 1;
      if (name.includes(termLower)) return 2;
      return 3;
    };

    const suggestions = matches
      .sort((a, b) => rank(a) - rank(b) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      .slice(0, 8)
      .map((product) => {
        const brand = product.brand_id ? find('brands', (row) => row.id === product.brand_id) : null;
        const category = product.category_id
          ? find('categories', (row) => row.id === product.category_id)
          : null;
        return {
          type: 'product',
          id: product.id,
          slug: product.slug,
          label: product.name,
          sublabel: brand?.name ?? category?.name ?? null,
          image_url: product.image_url,
          price: product.price,
          mrp: product.mrp,
          discount_percent:
            product.mrp > 0 && product.price < product.mrp
              ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
              : 0,
          rx_required: product.rx_required,
          in_stock: product.stock > 0,
        };
      });

    return res.json({ suggestions });
  }),
);

/* ------------------------------------------------------------------ list */

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const input = parseQuery(listQuerySchema, req.query);
    const includeInactive = Boolean(input.includeInactive);
    const size = input.limit ?? input.pageSize ?? 24;

    const matched = filter('products', (product) => matches(product, input, { includeInactive }));
    matched.sort(SORTS[input.sort] ?? SORTS.relevance);

    const offset = (input.page - 1) * size;
    const page = matched.slice(offset, offset + size);

    res.json({
      products: page.map(decorateProduct),
      pagination: {
        page: input.page,
        pageSize: size,
        total: matched.length,
        totalPages: Math.max(1, Math.ceil(matched.length / size)),
      },
      sort: input.sort,
      facets: loadFacets(),
    });
  }),
);

/* ---------------------------------------------------------------- detail */

router.get(
  '/:slug',
  asyncRoute(async (req, res) => {
    const key = String(req.params.slug);
    // Product cards link by id, while share links and category pages use the
    // slug, so both spellings resolve to the same product.
    const byId = Number.isInteger(Number(key)) && Number(key) > 0;
    const product = find(
      'products',
      (row) => row.is_active && (row.slug === key || (byId && row.id === Number(key))),
    );
    if (!product) throw notFound('We could not find that product');

    // Same category or same condition, nearest price first.
    const related = filter(
      'products',
      (row) =>
        row.is_active &&
        row.id !== product.id &&
        (row.category_id === product.category_id ||
          (row.condition_slug != null && row.condition_slug === product.condition_slug)),
    )
      .sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured) ||
          Math.abs(a.price - product.price) - Math.abs(b.price - product.price),
      )
      .slice(0, 8);

    res.json({
      product: decorateProduct(product),
      related: related.map(decorateProduct),
    });
  }),
);

export default router;
