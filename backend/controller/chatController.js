const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Ad = require("../models/Ads");
const Notification = require("../models/Notification");

// ========================================
// START OR GET CONVERSATION
// ========================================
const startOrGetConversation = async (req, res) => {
  try {
    const { adId } = req.body;
    const userId = req.user._id;

    if (!adId) {
      return res.status(400).json({ success: false, message: "adId is required" });
    }

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    // Prevent chatting with oneself
    if (ad.user.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a chat conversation on your own ad",
      });
    }

    let conversation = await Conversation.findOne({
      ad: adId,
      buyer: userId,
    })
      .populate("ad", "title price images status city")
      .populate("buyer", "name email profileImage isVerified phone")
      .populate("seller", "name email profileImage isVerified phone");

    if (!conversation) {
      const newConv = await Conversation.create({
        ad: adId,
        buyer: userId,
        seller: ad.user,
        lastMessage: "Started chat inquiry",
        lastMessageAt: new Date(),
      });

      conversation = await Conversation.findById(newConv._id)
        .populate("ad", "title price images status city")
        .populate("buyer", "name email profileImage isVerified phone")
        .populate("seller", "name email profileImage isVerified phone");
    }

    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error("Start Conversation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate conversation",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL USER CONVERSATIONS
// ========================================
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [{ buyer: userId }, { seller: userId }],
    })
      .populate("ad", "title price images status city")
      .populate("buyer", "name email profileImage isVerified phone")
      .populate("seller", "name email profileImage isVerified phone")
      .sort({ lastMessageAt: -1 });

    // Attach unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          isRead: false,
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    return res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

// ========================================
// GET MESSAGES FOR A CONVERSATION
// ========================================
const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Verify user is a participant
    const isBuyer = conversation.buyer.toString() === userId.toString();
    const isSeller = conversation.seller.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Mark messages sent by the other participant as read
    await Message.updateMany(
      {
        conversation: id,
        sender: { $ne: userId },
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name profileImage")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// ========================================
// SEND MESSAGE
// ========================================
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Verify user is a participant
    const isBuyer = conversation.buyer.toString() === userId.toString();
    const isSeller = conversation.seller.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Create message
    const message = await Message.create({
      conversation: id,
      sender: userId,
      text: text.trim(),
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name profileImage"
    );

    // Update conversation lastMessage & lastMessageAt
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Determine recipient
    const recipientId = isBuyer ? conversation.seller : conversation.buyer;

    // Send in-app notification to recipient
    try {
      await Notification.create({
        recipient: recipientId,
        sender: userId,
        type: "message",
        title: `Message from ${req.user.name || "User"}`,
        message: text.trim().length > 60 ? text.trim().substring(0, 57) + "..." : text.trim(),
        link: `/messages?conversationId=${conversation._id}`,
      });
    } catch (notifErr) {
      console.error("Notification creation error:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

module.exports = {
  startOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
};
