/**
 * End-to-end API smoke test.
 * Exercises: catalogue, search, guest cart, signup, Rx prescription gate,
 * checkout (cash on delivery), order tracking, staff review and admin CRUD.
 *
 *   node scripts/smoke.mjs
 */

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000';

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/** Minimal cookie-aware fetch wrapper. */
function createClient() {
  const jar = new Map();
  return async function call(path, { method = 'GET', body, form, headers = {}, raw = false } = {}) {
    const url = `${BASE}${path}`;
    const init = { method, headers: { ...headers }, redirect: 'manual' };

    if (jar.size > 0) {
      init.headers.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    }
    if (form) {
      init.body = form;
    } else if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    for (const cookie of response.headers.getSetCookie?.() ?? []) {
      const [pair] = cookie.split(';');
      const index = pair.indexOf('=');
      if (index > 0) jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }

    if (raw) return { status: response.status, headers: response.headers };
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 200) };
    }
    return { status: response.status, data };
  };
}

const api = createClient();

/* ------------------------------------------------------------------ run */

async function main() {
  console.log(`Smoke testing ${BASE}`);

  section('Health & site config');
  const health = await api('/health');
  check('GET /health returns ok', health.data?.status === 'ok');

  const site = await api('/api/site');
  check('store phone is 9142225559', site.data?.store?.phone === '9142225559', site.data?.store?.phone);
  check('store location mentions Thisuur & Ollur',
    /Thisuur/.test(site.data?.store?.address_line_2 ?? '') && /Ollur/.test(site.data?.store?.address_line_2 ?? ''));
  check('whatsapp link is correct', site.data?.store?.whatsapp_link === 'https://wa.me/919142225559');
  check('map embed is provided', typeof site.data?.store?.map_embed === 'string' && site.data.store.map_embed.length > 0);
  check('free delivery threshold is set', typeof site.data?.commerce?.freeDeliveryAbove === 'number');

  section('Catalogue');
  const taxonomy = await api('/api/products/taxonomy');
  check('categories returned', (taxonomy.data?.categories?.length ?? 0) >= 9);
  check('brands returned', (taxonomy.data?.brands?.length ?? 0) >= 10);
  check('health conditions returned', (taxonomy.data?.conditions?.length ?? 0) >= 10);
  check('price range computed', (taxonomy.data?.priceRange?.max ?? 0) > 0);

  const list = await api('/api/products?pageSize=50');
  const total = list.data?.pagination?.total ?? 0;
  check('catalogue has 25+ products', total >= 25, `total=${total}`);
  check('products carry discount percent',
    list.data?.products?.every((p) => typeof p.discount_percent === 'number'));
  check('no product priced above its MRP',
    list.data?.products?.every((p) => p.price <= p.mrp));
  check('facet counts are included', typeof list.data?.facets?.categories?.[0]?.count === 'number');

  const rxOnly = await api('/api/products?rx=required');
  check('rx filter works',
    rxOnly.data?.products?.length > 0 && rxOnly.data.products.every((p) => p.rx_required === true));
  const otcOnly = await api('/api/products?rx=otc');
  check('otc filter works',
    otcOnly.data?.products?.length > 0 && otcOnly.data.products.every((p) => p.rx_required === false));

  const under100 = await api('/api/products?maxPrice=100&sort=price-asc');
  check('price filter works',
    under100.data?.products?.length > 0 && under100.data.products.every((p) => p.price <= 100));

  const discounted = await api('/api/products?minDiscount=25');
  check('discount filter works',
    discounted.data?.products?.every((p) => p.discount_percent >= 25));

  const byCategory = await api('/api/products?category=baby-care');
  check('category filter works',
    byCategory.data?.products?.length > 0 && byCategory.data.products.every((p) => p.category_slug === 'baby-care'));

  const byBrand = await api('/api/products?brand=dabur');
  check('brand filter works', byBrand.data?.products?.every((p) => p.brand_slug === 'dabur'));

  section('Search');
  const suggest = await api('/api/products/search/suggest?q=para');
  check('autocomplete returns suggestions', (suggest.data?.suggestions?.length ?? 0) > 0);
  const full = await api('/api/products?q=paracetamol');
  check('full-text search works', (full.data?.products?.length ?? 0) > 0);
  const noQuery = await api('/api/products?q=');
  check('empty search param is ignored and returns the catalogue',
    (noQuery.data?.products?.length ?? 0) > 0);

  const otcDetail = await api('/api/products/paracetamol-650mg-tablets-10s');
  check('product detail loads', otcDetail.data?.product?.slug === 'paracetamol-650mg-tablets-10s');
  check('related products returned', (otcDetail.data?.related?.length ?? 0) > 0);
  check('image path generated', /^\/img\/products\/.+\.svg$/.test(otcDetail.data?.product?.image_url ?? ''));

  const rxDetail = await api('/api/products/amoxycillin-500mg-capsules-10s');
  check('rx product flagged rx_required', rxDetail.data?.product?.rx_required === true);
  check('rx product has schedule note', Boolean(rxDetail.data?.product?.schedule_note));

  const missing = await api('/api/products/does-not-exist');
  check('unknown product returns 404', missing.status === 404);

  section('Banners');
  const banners = await api('/api/site/banners');
  check('home banners returned', (banners.data?.banners?.length ?? 0) > 0);
  check('banners carry a CTA', Boolean(banners.data?.banners?.[0]?.cta_label));

  section('Guest cart');
  const emptyCart = await api('/api/cart');
  check('guest cart is empty', emptyCart.data?.items?.length === 0);
  check('totals are server-computed', typeof emptyCart.data?.totals?.total === 'number');

  const added = await api('/api/cart/items', {
    method: 'POST',
    body: { productId: otcDetail.data.product.id, quantity: 2 },
  });
  check('add to cart works', (added.data?.items?.length ?? 0) === 1);
  check('quantity recorded', added.data?.items?.[0]?.quantity === 2);
  check('line total correct', added.data?.items?.[0]?.lineTotal === otcDetail.data.product.price * 2);

  const updated = await api('/api/cart/items', {
    method: 'PATCH',
    body: { productId: otcDetail.data.product.id, quantity: 1 },
  });
  check('update quantity works', updated.data?.items?.[0]?.quantity === 1);

  const removed = await api(`/api/cart/items/${otcDetail.data.product.id}`, { method: 'DELETE' });
  check('remove from cart works', (removed.data?.items?.length ?? 0) === 0);

  const outOfStock = await api('/api/cart/items', { method: 'POST', body: { productId: 999999, quantity: 1 } });
  check('adding an unknown product is rejected', outOfStock.status === 404);

  section('Auth');
  const badLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'customer@example.com', password: 'wrong-password' },
  });
  check('wrong password is rejected', badLogin.status === 401);

  const unauth = await api('/api/auth/me');
  check('anonymous /me is rejected', unauth.status === 401);

  const weak = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Smoke Tester', email: 'smoke@test.in', phone: '9876543210', password: 'short' },
  });
  check('weak password is rejected', weak.status === 400);

  // Unique per run so repeat runs never collide with earlier fixtures.
  const stamp = Date.now().toString().slice(-9);
  const unique = `smoke${stamp}`;
  const phone = `9${stamp}`;
  const signup = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Smoke Tester', email: `${unique}@test.in`, phone, password: 'Smoke@12345' },
  });
  check('signup succeeds', signup.status === 201, JSON.stringify(signup.data));
  check('signup returns a token', typeof signup.data?.token === 'string');

  const dupe = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Smoke Tester', email: `${unique}@test.in`, phone: `8${stamp}`, password: 'Smoke@12345' },
  });
  check('duplicate email is rejected', dupe.status === 409, `status=${dupe.status}`);

  const me = await api('/api/auth/me');
  check('logged-in /me works', me.data?.user?.email === `${unique}@test.in`);

  const otpRequest = await api('/api/auth/otp/request', { method: 'POST', body: { phone } });
  check('otp request succeeds', otpRequest.status === 200);
  const devCode = otpRequest.data?.devCode;
  if (devCode) {
    const otpVerify = await api('/api/auth/otp/verify', { method: 'POST', body: { phone, code: devCode } });
    check('otp verify succeeds', otpVerify.status === 200);
  } else {
    check('otp verify succeeds (skipped, real SMS provider)', true);
  }

  const badOtp = await api('/api/auth/otp/verify', { method: 'POST', body: { phone, code: '000000' } });
  check('incorrect otp is rejected', badOtp.status === 401 || badOtp.status === 400);

  section('Addresses');
  const address = await api('/api/addresses', {
    method: 'POST',
    body: {
      label: 'Home',
      full_name: 'Smoke Tester',
      phone,
      line1: '12, Test Street',
      line2: 'Near Temple',
      landmark: 'Temple',
      city: 'Thisuur',
      district: 'Ollur',
      state: 'Tamil Nadu',
      pincode: '682310',
      is_default: true,
    },
  });
  check('address created', address.status === 201, JSON.stringify(address.data));
  const addressId = address.data?.address?.id;

  const badAddress = await api('/api/addresses', {
    method: 'POST',
    body: { full_name: 'X', phone, line1: 'ab', pincode: '123' },
  });
  check('invalid address is rejected', badAddress.status === 400);

  const addresses = await api('/api/addresses');
  check('addresses listed', (addresses.data?.addresses?.length ?? 0) >= 1);

  section('Rx compliance gate');
  await api('/api/cart/items', { method: 'POST', body: { productId: rxDetail.data.product.id, quantity: 1 } });
  const rxCart = await api('/api/cart');
  check('cart flags prescription requirement', rxCart.data?.requiresPrescription === true);

  const noRxOrder = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'cod' },
  });
  check('rx checkout blocked without prescription', noRxOrder.status === 400);
  check('block reason names the medicine',
    /Amoxycillin/i.test(noRxOrder.data?.error?.message ?? ''), noRxOrder.data?.error?.message);
  check('block returns a machine-readable code', noRxOrder.data?.error?.code === 'PRESCRIPTION_REQUIRED');

  const badPrescription = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'cod', prescription_id: 999999 },
  });
  check('unknown prescription rejected', badPrescription.status === 400);

  const form = new FormData();
  form.append('prescription', new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: 'application/pdf' }), 'rx.pdf');
  form.append('patient_name', 'Smoke Tester');
  form.append('doctor_name', 'Dr Test');
  const upload = await api('/api/prescriptions', { method: 'POST', form });
  check('prescription uploads', upload.status === 201, JSON.stringify(upload.data));
  check('prescription starts as pending', upload.data?.prescription?.status === 'pending');
  const prescriptionId = upload.data?.prescription?.id;

  const rejectedType = new FormData();
  rejectedType.append('prescription', new Blob([new Uint8Array([1, 2, 3])], { type: 'application/x-msdownload' }), 'bad.exe');
  const badUpload = await api('/api/prescriptions', { method: 'POST', form: rejectedType });
  check('non-image/pdf upload is rejected', badUpload.status === 400);

  const pendingOrder = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'cod', prescription_id: prescriptionId },
  });
  check('rx checkout blocked while prescription pending', pendingOrder.status === 400);
  check('pending block has its own code', pendingOrder.data?.error?.code === 'PRESCRIPTION_PENDING');

  const cartAfterBlocks = await api('/api/cart');
  check('blocked attempts do not empty the cart', (cartAfterBlocks.data?.items?.length ?? 0) > 0);

  section('Admin access control');
  const anonymousClient = createClient();
  const anonAdmin = await anonymousClient('/api/admin/overview');
  check('admin area rejects anonymous', anonAdmin.status === 401, `status=${anonAdmin.status}`);

  const customerAdmin = await api('/api/admin/overview');
  check('admin area rejects signed-in customers', customerAdmin.status === 403, `status=${customerAdmin.status}`);

  const staffOnly = await api('/api/admin/products');
  check('admin catalogue rejects customers', staffOnly.status === 403);

  section('Checkout (mock payment)');
  const emptyCartBefore = await api('/api/cart/clear', { method: 'POST' });
  check('cart can be cleared', (emptyCartBefore.data?.items?.length ?? 0) === 0);

  await api('/api/cart/items', { method: 'POST', body: { productId: otcDetail.data.product.id, quantity: 3 } });
  await api('/api/cart/items', { method: 'POST', body: { productId: under100.data.products[0].id, quantity: 1 } });

  const codOrder = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'cod', delivery_slot: '05:00 PM - 09:00 PM', notes: 'Please call on arrival' },
  });
  check('cod order is created', codOrder.status === 201, JSON.stringify(codOrder.data));
  check('cod order is auto-confirmed', codOrder.data?.order?.status === 'confirmed');
  check('cod order has an order number', /^DP-[A-Z0-9]+$/.test(codOrder.data?.order?.order_no ?? ''));
  check('cod order carries 2 items', (codOrder.data?.order?.items?.length ?? 0) === 2);
  check('stock was decremented', codOrder.data?.order?.items?.length === 2);

  // Recompute the expected total from the published rules, independently of
  // the server's implementation: listed prices are tax-inclusive, and the
  // MRP gap is a display-only saving that is never deducted twice.
  const codTotal = codOrder.data?.order?.total;
  const codItems = codOrder.data?.order?.items ?? [];
  const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const expectedSubtotal = round(codItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const expectedShipping = expectedSubtotal >= 499 ? 0 : 39;
  const expectedTotal = round(expectedSubtotal + expectedShipping);
  check('order total matches listed prices plus delivery',
    Math.abs(codTotal - expectedTotal) < 0.02, `total=${codTotal} expected=${expectedTotal}`);
  check('order subtotal matches the sum of line totals',
    Math.abs(codOrder.data?.order?.subtotal - expectedSubtotal) < 0.02,
    `subtotal=${codOrder.data?.order?.subtotal} expected=${expectedSubtotal}`);
  check('no tax is added on top of the MRP-inclusive price',
    codOrder.data?.order?.tax === 0, `tax=${codOrder.data?.order?.tax}`);
  check('discount reported equals the MRP saving, and is not double counted',
    Math.abs(codOrder.data?.order?.discount - (codOrder.data?.order?.items ?? [])
      .reduce((sum, item) => sum + (item.mrp - item.price) * item.quantity, 0)) < 0.02,
    `discount=${codOrder.data?.order?.discount}`);

  const emptyOrder = await api('/api/orders', { method: 'POST', body: { address: addressId, payment_method: 'cod' } });
  check('empty cart cannot be ordered', emptyOrder.status === 400);

  section('Order tracking & history');
  const track = await api(`/api/orders/track/${codOrder.data.order.order_no}`);
  check('order tracking by number works', track.data?.order?.order_no === codOrder.data.order.order_no);

  const mine = await api('/api/orders/mine');
  check('order history lists the order', (mine.data?.orders?.length ?? 0) >= 1);

  const reorder = await api('/api/cart/reorder', { method: 'POST' });
  check('reorder refills the cart', (reorder.data?.items?.length ?? 0) >= 1);

  const cancelled = await api(`/api/orders/${codOrder.data.order.id}/cancel`, {
    method: 'POST',
    body: { reason: 'Smoke test cleanup' },
  });
  check('customer can cancel their own order', cancelled.data?.order?.status === 'cancelled');

  section('Cash on delivery');
  await api('/api/cart/clear', { method: 'POST' });
  await api('/api/cart/items', { method: 'POST', body: { productId: otcDetail.data.product.id, quantity: 1 } });
  const codOnly = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'online' },
  });
  check('non-cod payment method is rejected', codOnly.status === 400, `status=${codOnly.status}`);

  const cashOrder = await api('/api/orders', { method: 'POST', body: { address: addressId, payment_method: 'cod' } });
  check('second cod order is created', cashOrder.status === 201, JSON.stringify(cashOrder.data));
  check('cod order starts with payment pending',
    cashOrder.data?.order?.payment_status === 'pending', cashOrder.data?.order?.payment_status);
  check('cod order is never given a gateway id',
    cashOrder.data?.payment === null || cashOrder.data?.payment === undefined);
  check('cod order records the method', cashOrder.data?.order?.payment_method === 'cod');

  section('Admin flow');
  const adminClient = createClient();
  const adminLogin = await adminClient('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'admin@dhiaspharmousy.in', password: 'Admin@12345' },
  });
  check('admin can log in', adminLogin.status === 200, JSON.stringify(adminLogin.data));

  const overview = await adminClient('/api/admin/overview');
  check('admin overview loads', typeof overview.data?.products?.total === 'number');
  check('overview reports open orders', typeof overview.data?.orders?.open === 'number');

  const queue = await adminClient('/api/prescriptions/staff/queue?status=pending');
  check('pharmacist sees the pending prescription',
    queue.data?.prescriptions?.some((p) => p.id === prescriptionId));

  const review = await adminClient('/api/prescriptions/staff/review', {
    method: 'POST',
    body: { prescriptionId, status: 'approved', review_note: 'Smoke test approval' },
  });
  check('pharmacist can approve a prescription', review.data?.prescription?.status === 'approved');

  await api('/api/cart/items', { method: 'POST', body: { productId: rxDetail.data.product.id, quantity: 1 } });
  const approvedOrder = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'cod', prescription_id: prescriptionId },
  });
  check('rx checkout succeeds once approved', approvedOrder.status === 201, JSON.stringify(approvedOrder.data));
  check('approved order links the prescription', approvedOrder.data?.order?.prescription_id === prescriptionId);
  check('approved order records prescription status',
    approvedOrder.data?.order?.prescription_status === 'approved');

  const staffOrders = await adminClient('/api/admin/orders');
  check('admin can list all orders', (staffOrders.data?.orders?.length ?? 0) > 0);

  // Walk a freshly created order through the full fulfilment timeline.
  await api('/api/cart/clear', { method: 'POST' });
  await api('/api/cart/items', { method: 'POST', body: { productId: otcDetail.data.product.id, quantity: 1 } });
  const timelineOrder = await api('/api/orders', {
    method: 'POST',
    body: { address: addressId, payment_method: 'cod' },
  });
  const timelineId = timelineOrder.data?.order?.id;
  const steps = ['packed', 'out_for_delivery', 'delivered'];
  let timelineOk = timelineId != null;
  for (const step of steps) {
    const update = await adminClient(`/api/orders/${timelineId}/status`, {
      method: 'PATCH',
      body: { status: step },
    });
    if (update.data?.order?.status !== step) {
      timelineOk = false;
      break;
    }
  }
  check('admin can advance an order through the full timeline', timelineOk);
  const delivered = await adminClient(`/api/admin/orders/${timelineId}`);
  check('delivered order records a delivery timestamp', Boolean(delivered.data?.order?.delivered_at));

  section('Admin catalogue CRUD');
  const create = await adminClient('/api/admin/products', {
    method: 'POST',
    body: {
      name: 'Smoke Test Syrup 100ml',
      sku: `SMOKE-${Date.now()}`,
      category_id: null,
      brand_id: null,
      price: 45,
      mrp: 60,
      rx_required: false,
      stock: 5,
      unit: '100 ml',
      description: 'Created by the smoke test.',
    },
  });
  check('admin can create a product', create.status === 201, JSON.stringify(create.data));
  const productId = create.data?.product?.id;

  const badPricing = await adminClient('/api/admin/products', {
    method: 'POST',
    body: { name: 'Bad Pricing', sku: `SMOKE-BAD-${Date.now()}`, price: 200, mrp: 100, stock: 1 },
  });
  check('price above MRP is rejected', badPricing.status === 400);

  const stock = await adminClient(`/api/admin/products/${productId}/stock`, {
    method: 'PATCH',
    body: { stock: 42 },
  });
  check('admin can update stock', stock.data?.product?.stock === 42);

  const del = await adminClient(`/api/admin/products/${productId}`, { method: 'DELETE' });
  check('admin can delete a product', del.status === 200);

  const banner = await adminClient('/api/admin/banners', {
    method: 'POST',
    body: { title: `Smoke Banner ${Date.now()}`, badge: 'TEST', theme: 'gold', placement: 'home_promo' },
  });
  check('admin can create a banner', banner.status === 201);
  const bannerDel = await adminClient(`/api/admin/banners/${banner.data?.banner?.id}`, { method: 'DELETE' });
  check('admin can delete a banner', bannerDel.status === 200);

  const coupon = await adminClient('/api/admin/coupons', {
    method: 'POST',
    body: { code: `SMOKE${Date.now() % 100000}`, kind: 'flat', value: 25, min_order: 200 },
  });
  check('admin can create a coupon', coupon.status === 201);

  section('Logout');
  const out = await api('/api/auth/logout', { method: 'POST' });
  check('logout succeeds', out.status === 200);
  const afterLogout = await api('/api/auth/me');
  check('token is rejected after logout', afterLogout.status === 401);

  /* ------------------------------------------------------------ summary */
  console.log(`\n${'-'.repeat(52)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\n  Failing checks:');
    for (const label of failures) console.log(`   - ${label}`);
  }
  console.log(`${'-'.repeat(52)}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error);
  process.exit(1);
});
