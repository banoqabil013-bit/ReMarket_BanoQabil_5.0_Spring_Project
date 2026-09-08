const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    // User who created the ad
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Ad Details
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    condition: {
      type: String,
      enum: ["New", "Like New", "Used"],
      required: true,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],

    city: {
      type: String,
      required: true,
    },

    // Contact phone number for this ad (optional override for seller's profile phone)
    phone: {
      type: String,
      default: null,
      trim: true,
    },

    // View counter (incremented on each ad detail page load)
    views: {
      type: Number,
      default: 0,
    },

    // Ad Status
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "disabled", "sold"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Ad", adSchema);
