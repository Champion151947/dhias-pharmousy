import config from '../config/env.js';

const { otp: otpConfig } = config;

/**
 * Sends the OTP over the configured provider.
 * `console` is the development default and prints the code to the server log.
 * No real SMS credentials are required to exercise the full flow locally.
 */
export async function sendOtpSms(phone, code) {
  const message = `${code} is your Dhiya's Pharmousy verification code. Valid for ${otpConfig.expiryMinutes} minutes. Do not share it with anyone.`;

  switch (otpConfig.provider) {
    case 'msg91':
      return sendViaMsg91(phone, code, message);
    case 'twilio':
      return sendViaTwilio(phone, code);
    case 'console':
    default:
      console.log(`\n[otp] ${phone} -> ${code}  (${otpConfig.expiryMinutes} min validity)\n`);
      return { provider: 'console', delivered: true };
  }
}

async function sendViaMsg91(phone, code, message) {
  const { authKey, flowId, templateId } = otpConfig.msg91;
  if (!authKey || (!flowId && !templateId)) {
    throw new Error('OTP_PROVIDER=msg91 requires MSG91_AUTH_KEY and MSG91_FLOW_ID/MSG91_TEMPLATE_ID');
  }
  const body = flowId
    ? { template_id: flowId, recipients: [{ phone: `91${phone}`, otp: code }] }
    : { template_id: templateId, short_url: '0', recipients: [{ phone: `91${phone}`, OTP: code, message }] };

  const response = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: authKey },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MSG91 rejected the request (${response.status}): ${detail.slice(0, 200)}`);
  }
  return { provider: 'msg91', delivered: true };
}

async function sendViaTwilio(phone, code) {
  const { accountSid, authToken, verifyServiceSid } = otpConfig.twilio;
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('OTP_PROVIDER=twilio requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID');
  }
  const form = new URLSearchParams({ To: `+91${phone}`, Code: code });
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Twilio Verify rejected the request (${response.status}): ${detail.slice(0, 200)}`);
  }
  return { provider: 'twilio', delivered: true };
}
