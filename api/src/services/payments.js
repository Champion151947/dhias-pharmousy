import config from '../config/env.js';

export const paymentMode = 'cod';
export const isMockPayments = false;

export function publicPaymentConfig() {
  return {
    mode: 'cod',
    currency: config.commerce.currency,
  };
}

export async function createGatewayOrder({ amount }) {
  return {
    gatewayOrderId: null,
    amount: Math.round(Number(amount) * 100),
    currency: config.commerce.currency,
    mock: false,
  };
}

export function verifyPaymentSignature() {
  return { verified: true, mock: false, method: 'cod' };
}

export function verifyWebhookSignature() {
  return false;
}