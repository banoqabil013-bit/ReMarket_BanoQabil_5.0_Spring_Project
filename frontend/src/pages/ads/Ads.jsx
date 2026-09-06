import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { ENDPOINTS } from "../../api/endpoints";
import AdGrid from "../../components/ads/AdGrid";
import useApiQuery from "../../hooks/useApiQuery";
import PublicLayout from "../../layouts/PublicLayout";

const CATEGORIES = [
  "All", "Mobiles", "Vehicles", "Electronics",
  "Home & Living", "Fashion", "Sports", "Books", "Kids & Baby",
];

const CITIES = [
  "All Cities", "Karachi", "Lahore", "Islamabad", "Rawalpindi",
  "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot",
];

const CONDITIONS = ["All", "New", "Used", "Refurbished"];

const Ads = () => {
  const [searchParams] = useSearchParams();

  const qParam       = searchParams.get("q") || "";
  const cityParam    = searchParams.get("city") || "All Cities";
  const catParam     = searchParams.get("category") || "All";

  const [activeCategory, setActiveCategory] = useState(catParam);
  const [activeCity,     setActiveCity]     = useState(cityParam);
  const [activeCondition,setActiveCondition]= useState("All");
  const [showFilters,    setShowFilters]    = useState(false);

  useEffect(() => {
    setActiveCategory(catParam || "All");
    setActiveCity(cityParam || "All Cities");
  }, [catParam, cityParam]);

  const { data, isLoading, isError, error } = useApiQuery(["ads"], ENDPOINTS.ADS.GET_ALL);
  const allAds = data?.ads || data?.data || data || [];

  /* Client-side filtering */
  const filtered = allAds.filter((ad) => {
    const matchQ = qParam
      ? [ad.title, ad.description, ad.city].some((f) =>
          (f || "").toLowerCase().includes(qParam.toLowerCase()),
        )
      : true;

    const matchCat =
      activeCategory === "All"
        ? true
        : (ad.category?.name || ad.category || "")
            .toLowerCase()
            .includes(activeCategory.toLowerCase());

    const matchCity =
      activeCity === "All Cities"
        ? true
        : (ad.city || "").toLowerCase() === activeCity.toLowerCase();

    const matchCond =
      activeCondition === "All"
        ? true
        : (ad.condition || "").toLowerCase() === activeCondition.toLowerCase();

    return matchQ && matchCat && matchCity && matchCond;
  });

  return (
    <PublicLayout>
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {qParam ? `Results for "${qParam}"` : "All Listings"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {filtered.length} ad{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          {/* Category tabs */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  activeCategory === cat
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile filter modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="relative ml-auto flex h-full w-4/5 max-w-xs flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex-1 space-y-6 overflow-y-auto">
              {/* City */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">City</h3>
                <div className="relative">
                  <select
                    value={activeCity}
                    onChange={(e) => setActiveCity(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none"
                  >
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Condition */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Condition</h3>
                <div className="space-y-1.5">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setActiveCondition(cond)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        activeCondition === cond
                          ? "bg-violet-50 font-semibold text-violet-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              {(activeCategory !== "All" || activeCity !== "All Cities" || activeCondition !== "All") && (
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveCity("All Cities");
                    setActiveCondition("All");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                >
                  <X size={14} /> Clear All Filters
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="mt-4 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md hover:bg-violet-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* ─── Sidebar filters (desktop) ─── */}
          <aside className="hidden w-56 shrink-0 sm:block">
            <div className="sticky top-24 space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              {/* City */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">City</h3>
                <div className="relative">
                  <select
                    value={activeCity}
                    onChange={(e) => setActiveCity(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-violet-400"
                  >
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Condition */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Condition</h3>
                <div className="space-y-1.5">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setActiveCondition(cond)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        activeCondition === cond
                          ? "bg-violet-50 font-semibold text-violet-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              {(activeCategory !== "All" || activeCity !== "All Cities" || activeCondition !== "All") && (
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveCity("All Cities");
                    setActiveCondition("All");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                >
                  <X size={14} /> Clear Filters
                </button>
              )}
            </div>
          </aside>

          {/* ─── Ad grid ─── */}
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
              </div>
            ) : isError ? (
              <div className="rounded-2xl bg-red-50 p-6 text-red-600">
                {error?.response?.data?.message || "Failed to load advertisements."}
              </div>
            ) : (
              <AdGrid ads={filtered} />
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Ads;
