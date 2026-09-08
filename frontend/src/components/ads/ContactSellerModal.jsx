import { useState, useEffect } from "react";
import { X, Send, Loader2, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import useApiMutation from "../../hooks/useApiMutation";
import { ENDPOINTS } from "../../api/endpoints";

const QUICK_QUESTIONS = [
  "Hi, is this still available?",
  "What is your final price?",
  "Is the price negotiable?",
  "Where can I see/inspect this item?",
  "Can you share more pictures?",
  "Can you deliver or ship this?",
];

const ContactSellerModal = ({ ad, isOpen, onClose }) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "Hi, is this still available?",
  });
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSent(false);
      setFormData({
        name: currentUser?.name || "",
        phone: currentUser?.phone || "",
        email: currentUser?.email || "",
        message: "Hi, is this still available?",
      });
    }
  }, [isOpen, currentUser]);

  const contactMutation = useApiMutation(
    ENDPOINTS.ADS.CONTACT_SELLER(ad?._id),
    "POST",
    {
      onSuccess: () => {
        setIsSent(true);
      },
    },
  );

  if (!isOpen || !ad) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleChipClick = (question) => {
    setFormData((prev) => ({
      ...prev,
      message: question,
    }));
  };

  const sellerName = ad.user?.name || "Seller";
  const thumbnail = ad.images?.[0]?.url || "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Chat with {sellerName}</h3>
              <p className="text-xs text-slate-400">Send an instant inquiry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ad mini preview */}
        <div className="flex items-center gap-3.5 bg-slate-50/80 px-6 py-3 border-b border-slate-100">
          <img
            src={thumbnail}
            alt={ad.title}
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
          />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-slate-800">{ad.title}</h4>
            <p className="text-sm font-bold text-violet-600">
              Rs. {Number(ad.price || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {isSent ? (
          /* Success Screen */
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Message Sent!</h3>
            <p className="mt-2 text-sm text-slate-500">
              Your inquiry has been emailed directly to <strong className="text-slate-700">{sellerName}</strong>.
              They will contact you shortly using your provided details.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Quick chips (OLX style) */}
            <div>
              <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Sparkles size={12} className="text-amber-500" />
                Quick Questions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleChipClick(q)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      formData.message === q
                        ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-400"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Your Message *
              </label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your message here..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {/* Buyer Contact Info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ali Khan"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Your Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0334 1234567"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Your Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {contactMutation.isError && (
              <p className="text-xs text-red-600">
                {contactMutation.error?.response?.data?.message || "Failed to send message. Please try again."}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={contactMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-bold text-white shadow-md transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {contactMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message to Seller
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactSellerModal;
