const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["signup", "login", "reset-password", "google-auth"],
      required: true,
    },
    userData: {
      type: Object,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // MongoDB TTL: document will automatically expire after 5 minutes (300s)
    },
  },
  {
    timestamps: true,
  },
);

otpSchema.index({ email: 1, type: 1 });

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
