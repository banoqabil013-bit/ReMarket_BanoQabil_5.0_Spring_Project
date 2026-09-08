import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, ArrowRight, ChevronDown, ShieldCheck, Zap, Users,
  TrendingUp, Star, Plus,
} from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import AdCard from "../components/ads/AdCard";
import useApiQuery from "../hooks/useApiQuery";
import { ENDPOINTS } from "../api/endpoints";
import { isTokenValid } from "../utils/auth";

/* ─── Category data ─────────────────────────────────────────────── */
const CATEGORIES = [
  { icon: "📱", label: "Mobiles",                  bg: "from-rose-50 to-pink-100",     border: "border-pink-200",    text: "text-rose-600" },
  { icon: "🚗", label: "Vehicles",                 bg: "from-blue-50 to-sky-100",      border: "border-sky-200",     text: "text-sky-600" },
  { icon: "🏢", label: "Property for Sale",        bg: "from-amber-50 to-orange-100",  border: "border-orange-200",  text: "text-amber-700" },
  { icon: "🏠", label: "Property for Rent",        bg: "from-yellow-50 to-amber-100",  border: "border-yellow-200",  text: "text-yellow-700" },
  { icon: "💻", label: "Electronics & Appliances", bg: "from-violet-50 to-indigo-100", border: "border-indigo-200",  text: "text-indigo-600" },
  { icon: "🏍️", label: "Bikes & Motorcycles",      bg: "from-red-50 to-rose-100",      border: "border-red-200",     text: "text-red-600" },
  { icon: "🚜", label: "Business & Agriculture",   bg: "from-emerald-50 to-teal-100",  border: "border-emerald-200", text: "text-emerald-700" },
  { icon: "🛠️", label: "Services",                 bg: "from-cyan-50 to-blue-100",     border: "border-cyan-200",    text: "text-cyan-700" },
  { icon: "💼", label: "Jobs",                     bg: "from-purple-50 to-fuchsia-100",border: "border-purple-200",  text: "text-purple-700" },
  { icon: "🐾", label: "Animals & Pets",           bg: "from-lime-50 to-green-100",    border: "border-lime-200",    text: "text-lime-700" },
  { icon: "🛋️", label: "Furniture & Decor",        bg: "from-stone-50 to-amber-100",   border: "border-stone-200",   text: "text-stone-700" },
  { icon: "👗", label: "Fashion & Beauty",         bg: "from-fuchsia-50 to-pink-100",  border: "border-pink-200",    text: "text-fuchsia-600" },
  { icon: "📚", label: "Books & Sports",           bg: "from-teal-50 to-emerald-100",  border: "border-teal-200",    text: "text-teal-700" },
  { icon: "🧸", label: "Kids & Baby",              bg: "from-sky-50 to-cyan-100",      border: "border-sky-200",     text: "text-sky-700" },
];

import { POPULAR_CITIES, PROVINCE_CITIES } from "../utils/cities";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <Plus size={28} className="text-violet-600" />,
    title: "Post Your Ad",
    desc: "Create a free listing in minutes. Add photos, set your price, and go live instantly.",
  },
  {
    step: "02",
    icon: <Users size={28} className="text-violet-600" />,
    title: "Connect with Buyers",
    desc: "Thousands of buyers browse ReMarket daily. Get messages and calls right away.",
  },
  {
    step: "03",
    icon: <ShieldCheck size={28} className="text-violet-600" />,
    title: "Sell Safely",
    desc: "Meet in a safe public spot, verify the buyer, exchange goods and payment securely.",
  },
];

/* ─── Home Page ─────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = isTokenValid();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [activeCategory, setActiveCategory] = useState(null);

  /* Fetch all active ads from backend */
  const { data, isLoading } = useApiQuery(["ads"], ENDPOINTS.ADS.GET_ALL);
  const allAds = data?.ads || data?.data || data || [];

  /* Client-side filter by selected category */
  const filteredAds = activeCategory
    ? allAds.filter(
        (ad) =>
          (ad.category?.name || ad.category || "")
            .toLowerCase()
            .includes(activeCategory.toLowerCase()),
      )
    : allAds;

  /* Latest 8 ads for the "Fresh Listings" section */
  const latestAds = filteredAds.slice(0, 8);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCity !== "All Cities") params.set("city", selectedCity);
    navigate(`/ads?${params.toString()}`);
  };

  const handleCategoryClick = (label) => {
    if (activeCategory === label) {
      setActiveCategory(null);
    } else {
      setActiveCategory(label);
      navigate(`/ads?category=${encodeURIComponent(label)}`);
    }
  };

  const handleSell = () => {
    navigate(isLoggedIn ? "/ads/create" : "/login");
  };

  return (
    <PublicLayout>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 pb-24 pt-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
            <Zap size={12} className="text-violet-400" />
            Pakistan's #1 Classifieds Platform
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Buy &amp; Sell{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Anything
            </span>
            ,<br className="hidden sm:block" /> Anywhere in Pakistan
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-slate-300">
            Discover thousands of fresh listings every day — from smartphones and cars to home decor and fashion. Completely free.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/10"
          >
            {/* City dropdown */}
            <div className="relative shrink-0 border-r border-slate-200">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-full max-w-[160px] appearance-none bg-transparent py-4 pl-8 pr-7 text-sm font-semibold text-slate-700 outline-none truncate cursor-pointer"
              >
                <option value="All Cities">🇵🇰 All Pakistan (All Cities)</option>
                <optgroup label="⭐ Popular Cities">
                  {POPULAR_CITIES.map((c) => (
                    <option key={`home-pop-${c}`} value={c}>{c}</option>
                  ))}
                </optgroup>
                {Object.entries(PROVINCE_CITIES).map(([province, cities]) => (
                  <optgroup key={`home-${province}`} label={`📍 ${province}`}>
                    {cities.map((c) => (
                      <option key={`home-${province}-${c}`} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Text input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for cars, mobiles, furniture..."
              className="flex-1 py-4 pl-4 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="m-2 flex items-center gap-2 rounded-xl bg-violet-600 px-6 font-semibold text-white transition hover:bg-violet-700"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { label: "Active Ads", value: `${allAds.length}+` },
              { label: "Happy Sellers", value: "10K+" },
              { label: "Cities", value: "50+" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Browse by Category</h2>
            <p className="mt-1 text-sm text-slate-500">Find exactly what you're looking for</p>
          </div>
          <button
            onClick={() => navigate("/ads")}
            className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            View All <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {CATEGORIES.map(({ icon, label, bg, border, text }) => (
            <button
              key={label}
              onClick={() => handleCategoryClick(label)}
              className={`group flex flex-col items-center justify-center gap-2.5 rounded-2xl border bg-gradient-to-b p-3.5 text-center transition-all hover:-translate-y-1 hover:shadow-lg ${bg} ${border} ${
                activeCategory === label ? "ring-2 ring-violet-500 ring-offset-2" : ""
              }`}
            >
              <div className="text-3xl transition-transform duration-200 group-hover:scale-110">{icon}</div>
              <span className={`text-xs font-bold leading-tight ${text}`}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Latest Ads ───────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-violet-600" />
                <h2 className="text-2xl font-bold text-slate-800">
                  {activeCategory ? `${activeCategory} Ads` : "Fresh Listings"}
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {activeCategory
                  ? `Showing ads in ${activeCategory}`
                  : "The latest ads posted by sellers near you"}
              </p>
            </div>
            <button
              onClick={() => navigate("/ads")}
              className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              See all <ArrowRight size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
            </div>
          ) : latestAds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
              <div className="text-4xl">📭</div>
              <p className="mt-3 font-semibold text-slate-600">No ads yet</p>
              <p className="mt-1 text-sm text-slate-400">
                {activeCategory
                  ? `No ads found in "${activeCategory}".`
                  : "Be the first to post an ad!"}
              </p>
              <button
                onClick={handleSell}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus size={16} /> Post Free Ad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestAds.map((ad, i) => (
                <AdCard key={ad._id || i} ad={ad} />
              ))}
            </div>
          )}

          {/* View more */}
          {latestAds.length > 0 && (
            <div className="mt-10 text-center">
              <button
                onClick={() => navigate("/ads")}
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-8 py-3 font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                View All Listings <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-50 to-violet-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
            <p className="mt-3 text-slate-500">Sell your stuff in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="relative rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
              >
                <div className="absolute -top-3 right-5 text-6xl font-black text-violet-50 select-none">
                  {step}
                </div>
                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                    {icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-800">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="bg-gradient-to-r from-violet-700 to-indigo-700 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Star size={32} className="mx-auto mb-4 text-yellow-300" />
          <h2 className="text-3xl font-extrabold text-white">
            Ready to sell something?
          </h2>
          <p className="mt-3 text-lg text-violet-200">
            Join thousands of sellers who make money every day on ReMarket. It's 100% free!
          </p>
          <button
            onClick={handleSell}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-violet-700 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <Plus size={20} />
            Post Your Free Ad Now
          </button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
