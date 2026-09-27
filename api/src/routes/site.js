import express from 'express';
import config from '../config/env.js';
import { filter } from '../store/index.js';
import { asyncRoute } from '../utils/errors.js';
import { publicPaymentConfig } from '../services/payments.js';

const router = express.Router();

/**
 * Single source of truth for store identity, delivery rules and payment mode.
 * The storefront reads this on boot so the phone number, address and delivery
 * promise are never hard-coded in more than one place.
 */
router.get(
  '/',
  asyncRoute(async (_req, res) => {
    res.json({
      store: {
        ...config.store,
        address_line_1: config.store.addressLine1,
        address_line_2: config.store.addressLine2,
        address_full: `${config.store.addressLine1}, ${config.store.addressLine2}, ${config.store.district}, ${config.store.state} - ${config.store.pincode}`,
        whatsapp_link: `https://wa.me/${config.store.whatsapp}`,
        phone_link: `tel:+91${config.store.phone}`,
        map_query: encodeURIComponent(
          `${config.store.name}, ${config.store.addressLine1}, ${config.store.addressLine2}`,
        ),
        map_embed: `https://www.google.com/maps?q=${encodeURIComponent(
          `${config.store.name} ${config.store.addressLine2} ${config.store.district}`,
        )}&output=embed`,
        directions_link: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${config.store.name}, ${config.store.addressLine1}, ${config.store.addressLine2}`,
        )}`,
      },
      commerce: {
        currency: config.commerce.currency,
        freeDeliveryAbove: config.commerce.freeDeliveryAbove,
        deliveryFee: config.commerce.deliveryFee,
        taxRate: config.commerce.taxRate,
        deliverySlots: config.commerce.deliverySlots,
        maxUploadMb: config.commerce.maxUploadMb,
      },
      payments: publicPaymentConfig(),
      otp: { provider: config.otp.provider },
    });
  }),
);

router.get(
  '/banners',
  asyncRoute(async (req, res) => {
    const placement = String(req.query.placement ?? 'home_promo').slice(0, 40);
    const banners = filter(
      'banners',
      (row) => row.is_active && row.placement === placement,
    ).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    res.json({ banners });
  }),
);

export default router;
