import { filter, find, findBy, insert, remove, removeWhere, tx, update } from '../store/index.js';

/**
 * Carts belong to a user when signed in, otherwise to an anonymous session
 * key issued in an httpOnly cookie. Merging on sign-in keeps nothing lost.
 */
export function getOrCreateCart({ userId = null, sessionKey = null }) {
  const owner = userId
    ? { user_id: Number(userId) }
    : sessionKey
      ? { session_key: sessionKey }
      : null;
  if (!owner) throw new Error('A cart needs either a user or a session key');

  const existing = find('carts', (row) =>
    owner.user_id ? row.user_id === owner.user_id : row.session_key === owner.session_key,
  );
  if (existing) {
    update('carts', existing.id, { updated_at: new Date().toISOString() });
    return existing.id;
  }
  return insert('carts', { ...owner, updated_at: new Date().toISOString() }).id;
}

const findLine = (cartId, productId) =>
  find('cart_items', (row) => row.cart_id === cartId && row.product_id === Number(productId));

/** The cart lines the storefront and checkout both need, joined to products. */
export function readCart(cartId) {
  return filter('cart_items', (item) => item.cart_id === cartId)
    .map((item) => {
      const product = find('products', (row) => row.id === item.product_id);
      if (!product) return null;
      const category = product.category_id
        ? find('categories', (row) => row.id === product.category_id)
        : null;
      const brand = product.brand_id ? find('brands', (row) => row.id === product.brand_id) : null;
      return {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        image_url: product.image_url,
        unit: product.unit,
        pack_size: product.pack_size,
        mrp: product.mrp,
        price: product.price,
        rx_required: product.rx_required,
        stock: product.stock,
        is_active: product.is_active,
        category_slug: category?.slug ?? null,
        category_name: category?.name ?? null,
        brand_name: brand?.name ?? null,
        quantity: item.quantity,
      };
    })
    .filter(Boolean);
}

/** Moves an anonymous cart onto the user's cart after login / signup. */
export function mergeCarts({ sessionKey, userId }) {
  if (!sessionKey || !userId) return 0;

  return tx(() => {
    const guestCart = findBy('carts', 'session_key', sessionKey);
    if (!guestCart) return 0;

    const userCartId = getOrCreateCart({ userId });
    if (guestCart.id === userCartId) return 0;

    const guestItems = filter('cart_items', (item) => item.cart_id === guestCart.id);

    for (const guestItem of guestItems) {
      const product = find('products', (row) => row.id === guestItem.product_id);
      // A product deleted since the guest browsed is simply dropped.
      if (!product?.is_active) continue;

      const existing = findLine(userCartId, product.id);
      const quantity = existing
        ? Math.min(99, existing.quantity + guestItem.quantity)
        : guestItem.quantity;

      // Clamp to available stock so a merge can never oversell.
      const clamped = Math.min(quantity, product.stock);
      if (clamped <= 0) continue;

      if (existing) update('cart_items', existing.id, { quantity: clamped });
      else insert('cart_items', { cart_id: userCartId, product_id: product.id, quantity: clamped });
    }

    remove('carts', guestCart.id);
    return guestItems.length;
  });
}

export function setItemQuantity(cartId, productId, quantity) {
  const existing = findLine(cartId, productId);
  if (!existing) throw new Error('That item is no longer in your cart');

  if (quantity <= 0) {
    remove('cart_items', existing.id);
    return;
  }
  update('cart_items', existing.id, { quantity });
}

export function removeItem(cartId, productId) {
  const existing = findLine(cartId, productId);
  if (existing) remove('cart_items', existing.id);
}

export function clearCart(cartId) {
  removeWhere('cart_items', (row) => row.cart_id === cartId);
}

/** Adds a product, topping up an existing line and never exceeding stock. */
export function addToCart(cartId, productId, quantity) {
  const product = find('products', (row) => row.id === Number(productId));
  if (!product || !product.is_active) return { added: false, product: null };

  const existing = findLine(cartId, product.id);
  if (existing) {
    update('cart_items', existing.id, {
      quantity: Math.min(existing.quantity + quantity, product.stock),
    });
  } else {
    insert('cart_items', {
      cart_id: cartId,
      product_id: product.id,
      quantity: Math.min(quantity, product.stock),
    });
  }
  return { added: true, product };
}

/** Re-adds a past product, but only if it is still active and in stock. */
export function addIfAvailable(cartId, productId, quantity) {
  const product = find('products', (row) => row.id === Number(productId));
  if (!product?.is_active || product.stock <= 0) return false;
  if (findLine(cartId, product.id)) return true;
  insert('cart_items', {
    cart_id: cartId,
    product_id: product.id,
    quantity: Math.min(quantity, product.stock),
  });
  return true;
}
