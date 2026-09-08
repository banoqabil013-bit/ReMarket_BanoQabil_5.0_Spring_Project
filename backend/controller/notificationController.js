const Notification = require("../models/Notification");

// ========================================
// GET USER NOTIFICATIONS
// ========================================
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// ========================================
// GET UNREAD COUNT
// ========================================
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get Unread Notification Count Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

// ========================================
// MARK AS READ
// ========================================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// ========================================
// MARK ALL AS READ
// ========================================
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
