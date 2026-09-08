/**
 * SMS/WhatsApp Dispatcher Utility — ReMarket
 *
 * Priority order for OTP delivery:
 *   1. WhatsApp  (via whatsapp-web.js — FREE, no API key needed)
 *   2. SendPK    (Pakistani SMS Gateway — PTA approved)
 *   3. Twilio    (international SMS fallback)
 *   4. Console   (development simulation — no real delivery)
 *
 * WhatsApp Setup (one-time):
 *   Start backend → scan QR in terminal with your phone → done!
 */

const { normalizePakistaniPhone } = require("./phoneHelper");

const sendSms = async ({ to, message, otp }) => {
  const normalizedTo = normalizePakistaniPhone(to) || to;

  // ─────────────────────────────────────────────────────────────
  // 1. WhatsApp — FREE via whatsapp-web.js (primary)
  //    No API key needed. Just scan QR once on server start.
  // ─────────────────────────────────────────────────────────────
  try {
    const { isWhatsAppReady, sendWhatsAppMessage } = require("./whatsappClient");

    if (isWhatsAppReady()) {
      const result = await sendWhatsAppMessage(normalizedTo, message);
      console.log(`[OTP Delivered via WhatsApp] To: ${normalizedTo} | ID: ${result.messageId}`);
      return { success: true, provider: "whatsapp", messageId: result.messageId };
    } else {
      console.log("[WhatsApp] Client not ready yet — trying next provider...");
    }
  } catch (err) {
    console.warn("[WhatsApp] Send failed:", err.message, "— trying next provider...");
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SendPK — Pakistani SMS Gateway (PTA-approved)
  //    Jazz, Telenor, Zong, Ufone | Sign up: sendpk.com
  // ─────────────────────────────────────────────────────────────
  const sendpkKey = process.env.SENDPK_API_KEY;

  if (sendpkKey && sendpkKey !== "your_sendpk_api_key_here") {
    try {
      const senderId = process.env.SENDPK_SENDER_ID || "8584";
      const templateId = process.env.SENDPK_TEMPLATE_ID;
      const mobile = normalizedTo.replace(/^\+/, "");

      let payload;
      if (templateId && templateId !== "your_otp_template_id_here" && otp) {
        payload = {
          api_key: sendpkKey,
          sender: senderId,
          mobile,
          template_id: templateId,
          message: JSON.stringify({ pin: String(otp) }),
          format: "json",
        };
      } else {
        payload = {
          api_key: sendpkKey,
          sender: senderId,
          mobile,
          message,
          format: "json",
        };
      }

      const body = new URLSearchParams(payload);
      const response = await fetch("https://sendpk.com/api/sms.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const result = await response.json();
      if (result.status === "200" || result.status === 200 || response.ok) {
        console.log(`[OTP Delivered via SendPK] To: ${mobile} | MsgID: ${result.message_id || "N/A"}`);
        return { success: true, provider: "sendpk", messageId: result.message_id };
      } else {
        console.error(`[SendPK Error]: ${result.message || JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error("[SendPK Network Error]:", err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Twilio — International SMS fallback
  //    Sign up: twilio.com
  // ─────────────────────────────────────────────────────────────
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const body = new URLSearchParams({ To: normalizedTo, From: fromNumber, Body: message });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const result = await response.json();
      if (response.ok) {
        console.log(`[OTP Delivered via Twilio] SID: ${result.sid} to ${normalizedTo}`);
        return { success: true, provider: "twilio", sid: result.sid };
      } else {
        console.error(`[Twilio Error]: ${result.message || JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error("[Twilio Network Error]:", err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Console Simulation — Development fallback
  //    OTP printed in backend terminal ONLY (never in browser)
  // ─────────────────────────────────────────────────────────────
  const border = "═".repeat(64);
  console.log(`\n╔${border}╗`);
  console.log(`║  📱 ReMarket OTP — Console Simulation (No Gateway Active)`);
  console.log(`║  Recipient : ${normalizedTo}`);
  if (otp) {
    console.log(`║  OTP CODE  : ${otp}   ← (terminal only, never sent to browser)`);
  }
  console.log(`║  Message   : ${message}`);
  console.log(`║`);
  console.log(`║  ⚡ To enable FREE WhatsApp OTP delivery:`);
  console.log(`║     Just restart the backend → scan QR code in terminal`);
  console.log(`║     with your WhatsApp → OTPs will go via WhatsApp!`);
  console.log(`╚${border}╝\n`);

  return { success: true, simulated: true, to: normalizedTo, otp };
};

module.exports = { sendSms };
