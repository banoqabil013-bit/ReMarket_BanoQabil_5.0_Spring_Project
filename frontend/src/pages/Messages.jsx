import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  MessageSquare,
  Send,
  User,
  Check,
  CheckCheck,
  Package,
  ExternalLink,
  Search,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import useApiQuery from "../hooks/useApiQuery";
import { ENDPOINTS } from "../api/endpoints";
import api from "../api/axios";

const QUICK_CHIPS = [
  "Is this still available?",
  "What is your final price?",
  "Where can we meet?",
  "Can you share more pictures?",
];

const Messages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get("conversationId");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id || currentUser?._id;

  // Fetch all user conversations (auto-polls every 4 seconds)
  const {
    data: convData,
    isLoading: convLoading,
    refetch: refetchConversations,
  } = useApiQuery(["conversations"], ENDPOINTS.CHAT.GET_CONVERSATIONS, {
    refetchInterval: 4000,
  });

  const conversations = convData?.conversations || [];

  // Auto-select first conversation if none is selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setSearchParams({ conversationId: conversations[0]._id });
    }
  }, [activeConvId, conversations, setSearchParams]);

  // Fetch messages for active conversation (auto-polls every 2.5 seconds)
  const {
    data: msgData,
    isLoading: msgLoading,
    refetch: refetchMessages,
  } = useApiQuery(
    ["messages", activeConvId],
    ENDPOINTS.CHAT.GET_MESSAGES(activeConvId),
    {
      enabled: Boolean(activeConvId),
      refetchInterval: 2500,
    }
  );

  const messages = msgData?.messages || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const activeConversation = conversations.find(
    (c) => c._id === activeConvId
  );

  // Identify counterpart (other user in conversation)
  const getCounterpart = (conv) => {
    if (!conv) return null;
    const isBuyer = String(conv.buyer?._id || conv.buyer) === String(currentUserId);
    return isBuyer ? conv.seller : conv.buyer;
  };

  const counterpart = getCounterpart(activeConversation);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !activeConvId || isSending) return;

    const textToSend = messageText.trim();
    setMessageText("");
    setIsSending(true);

    try {
      await api.post(ENDPOINTS.CHAT.SEND_MESSAGE(activeConvId), {
        text: textToSend,
      });
      await refetchMessages();
      await refetchConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessageText(textToSend); // Restore on error
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickChip = (chip) => {
    setMessageText(chip);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const other = getCounterpart(c);
    const q = searchQuery.toLowerCase();
    return (
      (other?.name || "").toLowerCase().includes(q) ||
      (c.ad?.title || "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-2rem)] p-4 md:p-6">
        <div className="flex h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* ─── LEFT: Conversation List ─── */}
          <div
            className={`w-full flex-col border-r border-slate-200 sm:w-80 md:w-96 ${
              activeConvId ? "hidden sm:flex" : "flex"
            }`}
          >
            {/* Header */}
            <div className="border-b border-slate-100 p-4">
              <h1 className="text-xl font-bold text-slate-900">Inbox / Chats</h1>
              {/* Search in conversations */}
              <div className="relative mt-3">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats or listings..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {convLoading && conversations.length === 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-slate-600">No conversations</p>
                  <p className="mt-1 text-xs text-slate-400">
                    When you chat with a seller or buyer, messages appear here.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getCounterpart(conv);
                  const isSelected = conv._id === activeConvId;
                  const adImg = conv.ad?.images?.[0]?.url;

                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSearchParams({ conversationId: conv._id })}
                      className={`flex w-full items-start gap-3 p-4 text-left transition ${
                        isSelected
                          ? "bg-violet-50/80 border-l-4 border-violet-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                        {other?.name?.charAt(0)?.toUpperCase() || "U"}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="truncate text-sm font-bold text-slate-900">
                            {other?.name || "User"}
                          </h4>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {conv.lastMessageAt
                              ? new Date(conv.lastMessageAt).toLocaleDateString("en-PK", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        {/* Ad title reference */}
                        {conv.ad && (
                          <p className="truncate text-[11px] font-semibold text-violet-700">
                            📦 {conv.ad.title}
                          </p>
                        )}

                        <p className="truncate text-xs text-slate-500">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── RIGHT: Active Chat Window ─── */}
          <div
            className={`flex-1 flex-col ${
              activeConvId ? "flex" : "hidden sm:flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Banner (Counterpart & Linked Ad) */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 shadow-sm">
                  {/* Counterpart info + Back button for mobile */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSearchParams({})}
                      className="mr-1 text-slate-500 hover:text-slate-800 sm:hidden"
                    >
                      ← Back
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
                      {counterpart?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900">
                          {counterpart?.name || "User"}
                        </h3>
                        {counterpart?.isVerified && (
                          <ShieldCheck size={14} className="text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {counterpart?.city || "Active on ReMarket"}
                      </p>
                    </div>
                  </div>

                  {/* Linked Ad Capsule */}
                  {activeConversation.ad && (
                    <Link
                      to={`/ads/${activeConversation.ad._id}`}
                      target="_blank"
                      className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-3 transition hover:border-violet-300 hover:bg-violet-50/50"
                    >
                      {activeConversation.ad.images?.[0]?.url && (
                        <img
                          src={activeConversation.ad.images[0].url}
                          alt={activeConversation.ad.title}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      )}
                      <div className="text-left">
                        <p className="max-w-[140px] truncate text-xs font-bold text-slate-800 group-hover:text-violet-700 sm:max-w-[200px]">
                          {activeConversation.ad.title}
                        </p>
                        <p className="text-[11px] font-extrabold text-violet-600">
                          Rs. {Number(activeConversation.ad.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <ExternalLink size={13} className="text-slate-400" />
                    </Link>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 md:p-6">
                  {msgLoading && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                      <Sparkles size={32} className="mb-2 text-violet-400" />
                      <p className="text-sm font-semibold text-slate-600">
                        Start the conversation!
                      </p>
                      <p className="max-w-xs text-xs text-slate-400">
                        Send a message to inquire about pricing, condition, or pick-up location.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        String(msg.sender?._id || msg.sender) ===
                        String(currentUserId);

                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[65%] ${
                              isMe
                                ? "bg-violet-600 text-white rounded-br-xs"
                                : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {msg.text}
                            </p>
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                isMe ? "text-violet-200" : "text-slate-400"
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMe &&
                                (msg.isRead ? (
                                  <CheckCheck size={12} className="text-emerald-300" />
                                ) : (
                                  <Check size={12} />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick chip suggestions */}
                <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 py-2">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickChip(chip)}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <MessageSquare size={32} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  Select a chat to view messages
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Choose an existing conversation from the left or contact a seller on any active ad.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
