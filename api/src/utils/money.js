import crypto from 'node:crypto';
import config from '../config/env.js';

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/** All monetary maths lives here so rounding is applied exactly once. */
export function roundMoney(value) {
  return round2(Number(value) || 0);
}

export function computeDiscountPercent(price, mrp) {
  const p = Number(price) || 0;
  const m = Number(mrp) || 0;
  if (m <= 0 || p >= m) return 0;
  return Math.round(((m - p) / m) * 100);
}

/**
 * Builds the cart/order summary. Every figure is derived here from database
 * prices, never from the client.
 *
 * Indian retail law requires the displayed MRP to already include all taxes,
 * so the listed price is what the customer pays and no tax is added on top.
 * `taxRate` remains configurable for shops that need a separate tax line.
 *
 * `discount` is the headline saving shown to the customer: the gap between
 * MRP and selling price, plus any coupon. It is display-only and is never
 * subtracted from the amount already charged at the listed price.
 */
export function priceCart(lines, options = {}) {
  const {
    taxRate = config.commerce.taxRate,
    deliveryFee = config.commerce.deliveryFee,
    freeDeliveryAbove = config.commerce.freeDeliveryAbove,
    coupon = null,
  } = options;

  const items = lines.map((line) => {
    const mrp = roundMoney(line.mrp);
    const price = roundMoney(line.price);
    const quantity = Math.max(1, Number(line.quantity) || 1);
    return {
      ...line,
      mrp,
      price,
      quantity,
      lineTotal: roundMoney(price * quantity),
      lineMrpTotal: roundMoney(mrp * quantity),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const mrpTotal = roundMoney(items.reduce((sum, item) => sum + item.lineMrpTotal, 0));
  const savingsOnMrp = roundMoney(Math.max(0, mrpTotal - subtotal));

  // Coupons reduce what is actually payable; savings on MRP already are.
  let couponDiscount = 0;
  if (coupon) {
    const eligibleTotal = roundMoney(
      items
        .filter((item) => coupon.applies_to_rx || !item.rxRequired)
        .reduce((sum, item) => sum + item.lineTotal, 0),
    );
    const raw = coupon.kind === 'percent'
      ? roundMoney((eligibleTotal * Number(coupon.value)) / 100)
      : roundMoney(Number(coupon.value));
    const capped = coupon.max_discount == null ? raw : Math.min(raw, roundMoney(Number(coupon.max_discount)));
    couponDiscount = roundMoney(Math.min(Math.max(0, capped), eligibleTotal));
  }

  const discount = roundMoney(savingsOnMrp + couponDiscount);
  const payableForItems = roundMoney(Math.max(0, subtotal - couponDiscount));
  const tax = roundMoney(payableForItems * taxRate);
  const afterTax = roundMoney(payableForItems + tax);
  const shipping = afterTax === 0 || afterTax >= freeDeliveryAbove ? 0 : roundMoney(deliveryFee);
  const total = roundMoney(afterTax + shipping);

  return {
    items,
    mrpTotal,
    subtotal,
    savingsOnMrp,
    couponDiscount,
    discount,
    tax,
    deliveryFee: shipping,
    total,
    freeDeliveryAbove,
    amountToFreeDelivery: roundMoney(Math.max(0, freeDeliveryAbove - afterTax)),
    hasRx: items.some((item) => item.rxRequired),
  };
}

const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function randomFrom(alphabet, length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Human-friendly, collision-resistant order number, e.g. DP-4F2K9A7. */
export function generateOrderNo() {
  return `DP-${randomFrom(ALPHABET, 8)}`;
}

export function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Indian mobile numbers, normalised to 10 digits. */
export function normalisePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidIndianPhone(input) {
  return /^[6-9]\d{9}$/.test(normalisePhone(input));
}

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
