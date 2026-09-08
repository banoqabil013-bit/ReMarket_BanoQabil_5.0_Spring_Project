/**
 * WhatsApp Client Singleton — ReMarket
 *
 * Uses whatsapp-web.js to send OTP messages via WhatsApp.
 * Uses LocalAuth to save session — no QR rescan after first setup.
 *
 * HOW TO SETUP (one time only):
 *   1. Start the backend: npm run dev
 *   2. A QR code will appear in the terminal
 *   3. Open WhatsApp on your phone
 *   4. Go to: Settings → Linked Devices → Link a Device
 *   5. Scan the QR code
 *   6. Done! Now your backend can send WhatsApp messages as you
 */

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let client = null;
let clientReady = false;
let clientError = null;

const initWhatsApp = () => {
  if (client) return; // already initialized

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./.whatsapp-session", // saves session here
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  const border = "═".repeat(60);

  client.on("qr", (qr) => {
    console.log(`\n╔${border}╗`);
    console.log(`║  📱 WhatsApp OTP Setup — Scan QR Code`);
    console.log(`║`);
    console.log(`║  Steps:`);
    console.log(`║  1. Open WhatsApp on your phone`);
    console.log(`║  2. Settings → Linked Devices → Link a Device`);
    console.log(`║  3. Scan the QR code below`);
    console.log(`╚${border}╝\n`);
    qrcode.generate(qr, { small: true });
    console.log("\n⏳ Waiting for QR scan...\n");
  });

  client.on("ready", () => {
    clientReady = true;
    clientError = null;
    console.log("\n╔" + border + "╗");
    console.log("║  ✅ WhatsApp client is READY! OTP messages will now");
    console.log("║     be sent via WhatsApp to Pakistani numbers.");
    console.log("╚" + border + "╝\n");
  });

  client.on("authenticated", () => {
    console.log("[WhatsApp] Session authenticated. Session saved locally.");
  });

  client.on("auth_failure", (msg) => {
    clientReady = false;
    clientError = msg;
    console.error("[WhatsApp] Authentication failed:", msg);
    console.error("[WhatsApp] Delete .whatsapp-session folder and restart.");
  });

  client.on("disconnected", (reason) => {
    clientReady = false;
    clientError = reason;
    console.warn("[WhatsApp] Client disconnected:", reason);
    console.warn("[WhatsApp] Restart backend to reconnect.");
    client = null;
  });

  client.initialize();
};

/**
 * Send a WhatsApp message to a Pakistani phone number.
 * @param {string} phone - Phone in any format (03001234567, +923001234567, etc.)
 * @param {string} message - Message text to send
 * @returns {Promise<{success: boolean, provider: string, messageId?: string}>}
 */
const sendWhatsAppMessage = async (phone, message) => {
  if (!client || !clientReady) {
    throw new Error("WhatsApp client not ready");
  }

  // Convert to WhatsApp chat ID format: 923001234567@c.us
  // Remove + and any dashes/spaces, ensure starts with 92
  let chatId = phone.replace(/^\+/, "").replace(/[\s\-]/g, "");
  if (!chatId.startsWith("92")) {
    // If starts with 03, convert to 923
    if (chatId.startsWith("0")) {
      chatId = "92" + chatId.slice(1);
    }
  }
  chatId = chatId + "@c.us";

  const result = await client.sendMessage(chatId, message);
  return {
    success: true,
    provider: "whatsapp",
    messageId: result.id._serialized,
  };
};

const isWhatsAppReady = () => clientReady;

module.exports = { initWhatsApp, sendWhatsAppMessage, isWhatsAppReady };
