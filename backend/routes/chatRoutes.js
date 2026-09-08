const express = require("express");
const {
  startOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
} = require("../controller/chatController");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.post("/", startOrGetConversation);
router.get("/", getUserConversations);
router.get("/:id/messages", getConversationMessages);
router.post("/:id/messages", sendMessage);

module.exports = router;
