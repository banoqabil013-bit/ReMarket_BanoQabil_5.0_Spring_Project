/**
 * WhatsApp Client Stub — Vercel/Production Safe
 *
 * whatsapp-web.js requires Puppeteer + Chromium, which cannot run on
 * Vercel serverless functions. This stub disables WhatsApp OTP delivery
 * so the fallback providers (SendPK, Twilio, Console) handle OTPs instead.
 *
 * For LOCAL development with WhatsApp OTP:
 *   Install whatsapp-web.js and qrcode-terminal locally, run npm run dev,
 *   and replace this file with the full implementation.
 */

const initWhatsApp = () => {
  // No-op: WhatsApp not supported in serverless environment
};

const sendWhatsAppMessage = async (_phone, _message) => {
  throw new Error("WhatsApp OTP not available in this environment");
};

const isWhatsAppReady = () => false;

module.exports = { initWhatsApp, sendWhatsAppMessage, isWhatsAppReady };
