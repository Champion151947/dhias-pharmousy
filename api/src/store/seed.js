import bcrypt from 'bcryptjs';
import config from '../config/env.js';
import { banners, brands, categories, conditions, coupons, products } from './seed-data.js';
import { bannerImagePath, productImagePath } from '../../scripts/generate-images.js';
import { slugify } from '../utils/money.js';

/**
 * Builds a complete, ready-to-demo dataset in memory. This is what
 * `data/db.json` contains, so the file can be hand-edited and the app can be
 * reset back to a known-good state at any time.
 */

const bannerSlug = (banner, index) => `${slugify(banner.title)}-${index + 1}`;

/** `created_at` values are spread backwards so "newest" sorting looks real. */
function stamped(offsetMinutes) {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString();
}

export async function buildSeedData() {
  const categoriesRows = categories.map((row) => ({
    id: categories.indexOf(row) + 1,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? null,
    icon: row.icon,
    accent: row.accent,
    sort_order: row.sort_order,
    is_active: true,
  }));

  const brandsRows = brands.map((row, index) => ({
    id: index + 1,
    slug: row.slug,
    name: row.name,
    monogram: row.monogram,
    accent: row.accent,
    sort_order: row.sort_order,
    is_active: true,
  }));

  const conditionsRows = conditions.map((row, index) => ({
    id: index + 1,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    accent: row.accent,
    sort_order: row.sort_order,
    is_active: true,
  }));

  const brandId = new Map(brandsRows.map((row) => [row.slug, row.id]));
  const categoryId = new Map(categoriesRows.map((row) => [row.slug, row.id]));

  const productsRows = products.map((row, index) => ({
    id: index + 1,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    // A brand missing from the list above leaves the product unbranded rather
    // than dropping it from the catalogue.
    brand_id: brandId.get(slugify(row.brand)) ?? null,
    category_id: categoryId.get(row.category) ?? null,
    condition_slug: row.condition ?? null,
    salt_composition: row.salt ?? null,
    description: row.description ?? null,
    pharmacist_note: row.pharmacistNote ?? null,
    price: row.price,
    mrp: row.mrp,
    rx_required: Boolean(row.rx),
    schedule_note: row.schedule ?? null,
    stock: row.stock,
    unit: row.unit ?? null,
    pack_size: row.pack ?? null,
    image_url: productImagePath(row.slug),
    gallery: [productImagePath(row.slug)],
    is_featured: Boolean(row.featured),
    is_active: true,
    created_at: stamped(products.length - index),
    updated_at: stamped(products.length - index),
  }));

  const bannersRows = banners.map((row, index) => ({
    id: index + 1,
    badge: row.badge ?? null,
    title: row.title,
    subtitle: row.subtitle ?? null,
    cta_label: row.cta_label ?? null,
    cta_href: row.cta_href ?? null,
    image_url: bannerImagePath(bannerSlug(row, index)),
    theme: row.theme,
    placement: row.placement,
    sort_order: row.sort_order,
    is_active: row.is_active,
    created_at: stamped(30 - index),
    updated_at: stamped(30 - index),
  }));

  const couponsRows = coupons.map((row, index) => ({
    id: index + 1,
    code: row.code,
    description: row.description ?? null,
    kind: row.kind,
    value: row.value,
    min_order: row.min_order,
    max_discount: row.max_discount ?? null,
    applies_to_rx: row.applies_to_rx,
    is_active: row.is_active,
    starts_at: null,
    ends_at: null,
    created_at: stamped(index + 1),
  }));

  const admin = config.auth.admin;

  // The demo customer's password is a constant in this file, so seeding it in
  // production would publish a working login for anyone who clones the repo.
  // It only ever exists in development. The admin is always created, and in
  // production `config` has already refused to boot unless ADMIN_PASSWORD was a
  // strong value from the environment.
  const seedDemoCustomer = config.isDev;

  const usersRows = [
    {
      id: 1,
      name: "Dhiya's Pharmacy Admin",
      email: admin.email,
      phone: admin.phone,
      password_hash: await bcrypt.hash(admin.password, config.auth.bcryptRounds),
      role: 'admin',
      phone_verified: true,
      is_active: true,
      last_login_at: null,
      created_at: stamped(60 * 24 * 30),
      updated_at: stamped(60 * 24 * 30),
    },
    ...(seedDemoCustomer
      ? [
          {
            id: 2,
            name: 'Demo Customer',
            email: 'customer@example.com',
            phone: '9000000001',
            password_hash: await bcrypt.hash('Customer@123', config.auth.bcryptRounds),
            role: 'customer',
            phone_verified: true,
            is_active: true,
            last_login_at: null,
            created_at: stamped(60 * 24 * 20),
            updated_at: stamped(60 * 24 * 20),
          },
        ]
      : []),
  ];

  const addressesRows = seedDemoCustomer
    ? [
        {
          id: 1,
          user_id: 2,
          label: 'Home',
          full_name: 'Demo Customer',
          phone: '9000000001',
          line1: '12, West Street',
          line2: null,
          landmark: 'Near Bus Stand',
          city: 'Thisuur',
          district: 'Ollur',
          state: 'Tamil Nadu',
          pincode: '682310',
          is_default: true,
          created_at: stamped(60 * 24 * 20),
        },
      ]
    : [];

  const counters = Object.fromEntries(
    [
      'users',
      'addresses',
      'categories',
      'brands',
      'conditions',
      'products',
      'carts',
      'cart_items',
      'prescriptions',
      'orders',
      'order_items',
      'banners',
      'coupons',
      'otp_codes',
    ].map((name) => [
      name,
      Math.max(
        0,
        ...{
          users: usersRows,
          addresses: addressesRows,
          categories: categoriesRows,
          brands: brandsRows,
          conditions: conditionsRows,
          products: productsRows,
          banners: bannersRows,
          coupons: couponsRows,
        }[name]?.map((row) => row.id) ?? [0],
      ),
    ]),
  );

  return {
    meta: { version: 1, counters },
    users: usersRows,
    addresses: addressesRows,
    categories: categoriesRows,
    brands: brandsRows,
    conditions: conditionsRows,
    products: productsRows,
    carts: [],
    cart_items: [],
    prescriptions: [],
    orders: [],
    order_items: [],
    banners: bannersRows,
    coupons: couponsRows,
    otp_codes: [],
  };
}

export default buildSeedData;
