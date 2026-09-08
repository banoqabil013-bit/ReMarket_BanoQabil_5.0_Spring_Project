const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ad",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A buyer and seller have at most one conversation per ad
conversationSchema.index({ ad: 1, buyer: 1 }, { unique: true });
conversationSchema.index({ buyer: 1 });
conversationSchema.index({ seller: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
