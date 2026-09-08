const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      default: function () {
        return this.email || this.phone || null;
      },
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "signup",
        "login",
        "reset-password",
        "google-auth",
        "phone-signup",
        "phone-login",
      ],
      required: true,
    },
    userData: {
      type: Object,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // TTL: expires after 5 minutes
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ identifier: 1, type: 1 });
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ phone: 1, type: 1 });

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
