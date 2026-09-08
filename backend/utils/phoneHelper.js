/**
 * Utilities for normalizing and validating Pakistani phone numbers
 */

/**
 * Standardizes any Pakistani phone number format to international E.164: +923XXXXXXXXX
 * Handles:
 *   - 03001234567
 *   - 0300-1234567
 *   - +92 300 1234567
 *   - 923001234567
 *   - 3001234567
 */
const normalizePakistaniPhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== "string") return null;

  // Remove spaces, dashes, parentheses
  let cleaned = rawPhone.replace(/[\s\-\(\)]/g, "").trim();

  // If starts with +00 or 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Handle +923...
  if (cleaned.startsWith("+923")) {
    if (cleaned.length === 13 && /^\+923\d{9}$/.test(cleaned)) {
      return cleaned;
    }
  }

  // Handle 923...
  if (cleaned.startsWith("923") && cleaned.length === 12) {
    const formatted = "+" + cleaned;
    if (/^\+923\d{9}$/.test(formatted)) return formatted;
  }

  // Handle 03... (standard Pakistani local format)
  if (cleaned.startsWith("03") && cleaned.length === 11) {
    const formatted = "+92" + cleaned.slice(1);
    if (/^\+923\d{9}$/.test(formatted)) return formatted;
  }

  // Handle 3... (10 digits without leading 0)
  if (cleaned.startsWith("3") && cleaned.length === 10) {
    const formatted = "+92" + cleaned;
    if (/^\+923\d{9}$/.test(formatted)) return formatted;
  }

  return null;
};

/**
 * Validates if the phone number is a valid Pakistani mobile number
 */
const isValidPakistaniPhone = (phone) => {
  const normalized = normalizePakistaniPhone(phone);
  return Boolean(normalized && /^\+923\d{9}$/.test(normalized));
};

/**
 * Formats a normalized number (+923001234567) for friendly display (0300 1234567)
 */
const formatPhoneDisplay = (phone) => {
  const normalized = normalizePakistaniPhone(phone);
  if (!normalized) return phone || "";
  // +92 300 1234567 -> 0300 1234567
  const local = "0" + normalized.slice(3);
  return `${local.slice(0, 4)} ${local.slice(4)}`;
};

module.exports = {
  normalizePakistaniPhone,
  isValidPakistaniPhone,
  formatPhoneDisplay,
};
