import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Tag,
  Package,
  User as UserIcon,
  Trash2,
  Pencil,
  Phone,
  PhoneCall,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
  Mail,
} from "lucide-react";
import useApiQuery from "../../hooks/useApiQuery";
import useApiMutation from "../../hooks/useApiMutation";
import { ENDPOINTS } from "../../api/endpoints";
import PublicLayout from "../../layouts/PublicLayout";
import { isTokenValid } from "../../utils/auth";
import ContactSellerModal from "../../components/ads/ContactSellerModal";
import AdCard from "../../components/ads/AdCard";
import api from "../../api/axios";

const placeholderImage =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80";

const AdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = isTokenValid();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [selectedImage, setSelectedImage] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { data, isLoading, isError } = useApiQuery(
    ["ad", id],
    ENDPOINTS.ADS.GET_BY_ID(id),
  );

  const deleteMutation = useApiMutation(ENDPOINTS.ADS.DELETE(id), "DELETE", {
    onSuccess: () => navigate("/"),
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      </PublicLayout>
    );
  }

  if (isError) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="text-4xl">😕</p>
          <h1 className="mt-4 text-xl font-bold text-slate-700">Ad Not Found</h1>
          <Link to="/" className="mt-4 inline-block text-violet-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const ad = data?.ad || data?.data || data;
  const similarAds = data?.similarAds || [];
  const images = ad?.images?.length ? ad.images : [{ url: placeholderImage }];

  /* Does the logged-in user own this ad? */
  const currentUserId = currentUser?.id || currentUser?._id;
  const adUserId = typeof ad?.user === "object" ? ad.user?._id || ad.user?.id : ad?.user;
  const isOwner =
    isLoggedIn &&
    Boolean(currentUserId) &&
    Boolean(adUserId) &&
    String(currentUserId) === String(adUserId);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this ad?")) {
      deleteMutation.mutate();
    }
  };

  const sellerPhone = ad?.phone || ad?.user?.phone || null;
  const cleanWhatsAppNumber = sellerPhone
    ? sellerPhone.replace(/[^0-9]/g, "").replace(/^0/, "92")
    : "";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappText = encodeURIComponent(
    `Assalam-o-Alaikum! I saw your ad "${ad?.title}" on ReMarket (Rs. ${Number(
      ad?.price || 0
    ).toLocaleString()}). Is it still available?\n${currentUrl}`
  );
  const whatsappUrl = cleanWhatsAppNumber
    ? `https://wa.me/${cleanWhatsAppNumber}?text=${whatsappText}`
    : null;

  const cleanDialPhone = sellerPhone
    ? sellerPhone.trim().startsWith("+")
      ? "+" + sellerPhone.trim().replace(/[^0-9]/g, "")
      : sellerPhone.trim().startsWith("0")
      ? "+92" + sellerPhone.trim().replace(/[^0-9]/g, "").slice(1)
      : "+92" + sellerPhone.trim().replace(/[^0-9]/g, "")
    : "";

  const handleCallSeller = (e) => {
    if (!cleanDialPhone) return;
    // Launch native phone dialer immediately across all platforms
    window.location.href = `tel:${cleanDialPhone}`;
  };

  const handleCopyPhone = () => {
    if (sellerPhone) {
      navigator.clipboard.writeText(sellerPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStartInAppChat = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setIsStartingChat(true);
    try {
      const res = await api.post(ENDPOINTS.CHAT.START, { adId: id });
      const conv = res.data?.conversation;
      if (conv?._id) {
        navigate(`/messages?conversationId=${conv._id}`);
      }
    } catch (err) {
      console.error("Chat start error:", err);
      alert(err.response?.data?.message || "Failed to start chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleShareCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const maskedPhone = sellerPhone
    ? (() => {
        const cleaned = sellerPhone.trim();
        if (cleaned.startsWith("+92")) {
          const rest = cleaned.slice(3).trim().replace(/[^0-9]/g, "");
          return `+92 ${rest.slice(0, 3)} •••••••`;
        }
        const digits = cleaned.replace(/[^0-9]/g, "");
        if (digits.length >= 4) {
          return `${digits.slice(0, 4)} •••••••`;
        }
        return "••••••••••";
      })()
    : "Not provided";

  const memberSince = ad?.user?.createdAt
    ? new Date(ad.user.createdAt).toLocaleDateString("en-PK", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* ── Images ── */}
            <div className="lg:col-span-3">
              {/* SOLD Notification Banner */}
              {ad.status === "sold" && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 font-bold text-white shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-bold text-sky-950">This Ad Has Been Sold</h3>
                    <p className="text-xs text-sky-700">The seller has marked this item as sold. Contacting the seller is disabled.</p>
                  </div>
                </div>
              )}

              <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                <div className="aspect-[4/3] w-full bg-slate-100">
                  <img
                    src={images[selectedImage]?.url}
                    alt={ad.title}
                    className="h-full w-full object-cover transition-opacity duration-200"
                    onError={(e) => { e.target.src = placeholderImage; }}
                  />
                </div>

                {/* Left / Right Carousel Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-110 hover:bg-white active:scale-95 text-slate-700"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-110 hover:bg-white active:scale-95 text-slate-700"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                    {/* Image Counter Badge (1 / 5) */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {selectedImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                        selectedImage === idx
                          ? "border-violet-500 ring-2 ring-violet-200 scale-105"
                          : "border-transparent opacity-75 hover:opacity-100 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`thumb-${idx + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.src = placeholderImage; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="space-y-4 lg:col-span-2">
              {/* Status badges */}
              <div className="flex gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  ad.status === "active"
                    ? "bg-green-100 text-green-700"
                    : ad.status === "sold"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {ad.status}
                </span>
                {ad.condition && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {ad.condition}
                  </span>
                )}
              </div>

              {/* Title + Price */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h1 className="text-2xl font-bold text-slate-900">{ad.title}</h1>
                <p className="mt-3 text-3xl font-extrabold text-violet-700">
                  Rs. {Number(ad.price || 0).toLocaleString()}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-violet-500" />
                    {ad.city || "Location N/A"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag size={14} className="text-violet-500" />
                    {ad.category?.name || ad.category || "General"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package size={14} className="text-violet-500" />
                    {ad.condition || "Used"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>
                    Posted on {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "Recently"}
                  </span>
                  {typeof ad.views === "number" && (
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <Eye size={13} className="text-violet-500" />
                      {ad.views} {ad.views === 1 ? "view" : "views"}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Description</h2>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {ad.description || "No description provided."}
                </p>
              </div>

              {/* ── OLX Style Seller Profile Card ── */}
              {ad.user && (
                <Link
                  to={`/seller/${ad.user._id || ad.user}`}
                  className="group block overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:ring-violet-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-bold text-white shadow-md shadow-violet-200">
                      {ad.user.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-slate-900 group-hover:text-violet-700">
                          {ad.user.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                          <ShieldCheck size={11} /> Verified
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {memberSince && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Member since {memberSince}
                          </span>
                        )}
                        {(ad.user.city || ad.city) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {ad.user.city || ad.city}
                          </span>
                        )}
                      </div>
                      <span className="mt-2 block text-xs font-semibold text-violet-600 group-hover:underline">
                        View Seller Profile & All Listings →
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* ── Contact / Actions ── */}
              {isOwner ? (
                <div className="flex gap-3">
                  <Link
                    to={`/ads/${id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white transition hover:bg-violet-700"
                  >
                    <Pencil size={17} /> Edit Ad
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 py-3.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ) : ad.status === "sold" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-bold text-slate-700">This ad has been marked as SOLD</p>
                  <p className="mt-1 text-xs text-slate-500">Contacting the seller is disabled for sold items.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 1. Show Phone Number / Call Now (OLX Style) */}
                  {sellerPhone ? (
                    showPhone ? (
                      <div className="flex flex-col gap-2 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                            Seller Phone Number
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPhone}
                            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
                          >
                            {copied ? (
                              <>
                                <Check size={13} className="text-emerald-600" />
                                <span className="font-semibold text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <a
                          href={`tel:${cleanDialPhone}`}
                          onClick={handleCallSeller}
                          title="Click to call seller directly"
                          className="font-mono text-2xl font-extrabold tracking-wide text-slate-900 transition hover:text-violet-700 hover:underline"
                        >
                          {sellerPhone}
                        </a>
                        <a
                          href={`tel:${cleanDialPhone}`}
                          onClick={handleCallSeller}
                          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.99]"
                        >
                          <PhoneCall size={17} /> Call Now ({sellerPhone})
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPhone(true)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <Phone size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-medium text-slate-400">Phone Number</p>
                            <p className="text-base font-bold tracking-wider text-slate-800">
                              {maskedPhone}
                            </p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700">
                          <Eye size={14} /> Show Number
                        </span>
                      </button>
                    )
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
                      Phone number not provided by seller. Please use the messaging button below.
                    </div>
                  )}

                  {/* 2. Chat on WhatsApp (The #1 contact method in Pakistan) */}
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-4 font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-[#20bd5a] hover:shadow-lg active:scale-[0.99]"
                    >
                      <svg
                        className="h-5 w-5 fill-current"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.58c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.18-.3.2-.55.08-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43-.15-.01-.31-.01-.48-.01-.17 0-.45.06-.68.32-.24.25-.9.88-.9 2.15 0 1.26.92 2.49 1.05 2.66.13.17 1.81 2.76 4.38 3.87.61.26 1.09.42 1.46.54.61.19 1.17.17 1.61.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
                      </svg>
                      Chat on WhatsApp
                    </a>
                  ) : null}

                  {/* 3. In-App Chat (OLX Real-Time Messaging) */}
                  <button
                    type="button"
                    onClick={handleStartInAppChat}
                    disabled={isStartingChat}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-bold text-white shadow-md shadow-violet-500/20 transition hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
                  >
                    <MessageSquare size={18} />
                    {isStartingChat ? "Opening Chat..." : isLoggedIn ? "Chat with Seller" : "Login to Chat"}
                  </button>

                  {/* 4. Send Email Inquiry */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoggedIn) {
                        navigate("/login");
                      } else {
                        setIsContactModalOpen(true);
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Mail size={15} /> Send Email Inquiry
                  </button>
                </div>
              )}

              {/* ── OLX Social Share Card ── */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Share2 size={15} className="text-violet-600" /> Share This Ad
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShareCopy}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {shareCopied ? (
                        <span className="font-bold text-emerald-600">Copied!</span>
                      ) : (
                        <>
                          <Copy size={13} /> Copy Link
                        </>
                      )}
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Check out this ${ad.title} on ReMarket (Rs. ${Number(ad.price || 0).toLocaleString()}): ${typeof window !== "undefined" ? window.location.href : ""}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#20bd5a]"
                    >
                      WhatsApp
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        typeof window !== "undefined" ? window.location.href : ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-[#1877F2] px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600"
                    >
                      Facebook
                    </a>
                  </div>
                </div>
              </div>

              {/* ── OLX Safety Tips Card ── */}
              <div className="rounded-3xl border border-amber-200/80 bg-amber-50/60 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <ShieldAlert size={18} className="text-amber-600" />
                  Safety Tips for Buyers
                </div>
                <ul className="mt-3 space-y-2 text-xs text-amber-900/80">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Meet the seller in a safe and public location.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Check and test the item thoroughly before purchasing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span className="font-semibold text-amber-950">
                      Never transfer advance payments or online deposits beforehand.
                    </span>
                  </li>
                </ul>
              </div>

              {deleteMutation.isError && (
                <p className="text-sm text-red-500">Failed to delete. Try again.</p>
              )}
            </div>
          </div>

          {/* ── Similar Ads Section ── */}
          {similarAds.length > 0 && (
            <div className="mt-16 border-t border-slate-200 pt-10">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Similar Ads in {ad.category?.name || "this Category"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Explore other listings you might be interested in
                  </p>
                </div>
                {ad.category?.name && (
                  <Link
                    to={`/ads?category=${encodeURIComponent(ad.category.name)}`}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline"
                  >
                    View more →
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similarAds.map((simAd) => (
                  <AdCard key={simAd._id} ad={simAd} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Contact Seller Modal ── */}
      <ContactSellerModal
        ad={ad}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </PublicLayout>
  );
};

export default AdDetails;
