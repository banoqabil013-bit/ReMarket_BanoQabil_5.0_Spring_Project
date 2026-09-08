import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  MapPin,
  Phone,
  PhoneCall,
  MessageSquare,
  Package,
  Tag,
  Check,
  Copy,
} from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import AdCard from "../components/ads/AdCard";
import useApiQuery from "../hooks/useApiQuery";
import { ENDPOINTS } from "../api/endpoints";
import { isTokenValid } from "../utils/auth";
import api from "../api/axios";

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = isTokenValid();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id || currentUser?._id;

  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const { data, isLoading, isError } = useApiQuery(
    ["seller", id],
    ENDPOINTS.SELLER.GET_PROFILE(id)
  );

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      </PublicLayout>
    );
  }

  if (isError || !data?.seller) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-4xl">👤</p>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Seller Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This seller profile is either unavailable or has been removed.
          </p>
          <Link
            to="/ads"
            className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            ← Browse All Ads
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const { seller, ads = [] } = data;
  const isMe = String(seller._id) === String(currentUserId);

  const cleanPhone = seller.phone || "";
  const cleanDialPhone = cleanPhone
    ? cleanPhone.trim().startsWith("+")
      ? "+" + cleanPhone.trim().replace(/[^0-9]/g, "")
      : cleanPhone.trim().startsWith("0")
      ? "+92" + cleanPhone.trim().replace(/[^0-9]/g, "").slice(1)
      : "+92" + cleanPhone.trim().replace(/[^0-9]/g, "")
    : "";

  const handleCopyPhone = () => {
    if (cleanPhone) {
      navigator.clipboard.writeText(cleanPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStartChat = async (adId) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!adId) {
      // Pick first ad if available
      if (ads.length > 0) {
        adId = ads[0]._id;
      } else {
        alert("This seller currently has no active listings to chat about.");
        return;
      }
    }

    setIsStartingChat(true);
    try {
      const res = await api.post(ENDPOINTS.CHAT.START, { adId });
      const conv = res.data?.conversation;
      if (conv?._id) {
        navigate(`/messages?conversationId=${conv._id}`);
      }
    } catch (err) {
      console.error("Start chat error:", err);
      alert(err.response?.data?.message || "Failed to initiate chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const memberSince = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* ─── Seller Card Banner ─── */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Profile Details */}
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-3xl font-extrabold text-white shadow-lg shadow-violet-200">
                  {seller.name?.charAt(0)?.toUpperCase() || "S"}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                      {seller.name}
                    </h1>
                    {seller.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        <ShieldCheck size={13} /> Verified Seller
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {memberSince && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-violet-500" />
                        Member since {memberSince}
                      </span>
                    )}
                    {seller.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-violet-500" />
                        {seller.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="flex gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Active Ads
                  </p>
                  <p className="text-2xl font-black text-violet-700">
                    {seller.totalAds || ads.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sold Items
                  </p>
                  <p className="text-2xl font-black text-sky-700">
                    {seller.totalSold || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Contact Strip */}
            {!isMe && (
              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                {cleanPhone && (
                  showPhone ? (
                    <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-2.5">
                      <a
                        href={`tel:${cleanDialPhone}`}
                        className="font-mono text-base font-bold text-slate-900 hover:text-violet-700 hover:underline"
                      >
                        {cleanPhone}
                      </a>
                      <a
                        href={`tel:${cleanDialPhone}`}
                        className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
                      >
                        <PhoneCall size={13} /> Call
                      </a>
                      <button
                        onClick={handleCopyPhone}
                        className="text-xs text-violet-600 hover:text-violet-800"
                      >
                        {copied ? (
                          <span className="font-semibold text-emerald-600">Copied!</span>
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPhone(true)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                    >
                      <Phone size={15} className="text-violet-600" />
                      Show Phone Number
                    </button>
                  )
                )}

                <button
                  onClick={() => handleStartChat()}
                  disabled={isStartingChat || ads.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  <MessageSquare size={15} />
                  {isStartingChat ? "Opening Chat..." : "Chat with Seller"}
                </button>
              </div>
            )}
          </div>

          {/* ─── Seller's Active Ads Grid ─── */}
          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Listings by {seller.name}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {ads.length} active item{ads.length !== 1 ? "s" : ""} available for purchase
                </p>
              </div>
            </div>

            {ads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
                <Package size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-base font-semibold text-slate-700">
                  No active listings currently
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  This seller doesn't have any items for sale at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ads.map((ad) => (
                  <AdCard key={ad._id} ad={ad} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default SellerProfile;
