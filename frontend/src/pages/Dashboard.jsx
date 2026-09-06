import { Plus, Search, Bell, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import useApiQuery from "../hooks/useApiQuery";
import { ENDPOINTS } from "../api/endpoints";
import AdCard from "../components/ads/AdCard";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useApiQuery(
    ["profile"],
    ENDPOINTS.USER.PROFILE,
  );

  const { data: adsData, isLoading: adsLoading } = useApiQuery(
    ["recommended-ads"],
    ENDPOINTS.ADS.GET_ALL,
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-8 text-red-500">Failed to load profile.</div>
      </DashboardLayout>
    );
  }

  const user = data?.user || data?.data || data;
  const ads = (adsData?.ads || adsData?.data || []).slice(0, 8);

  // Shimmer skeleton card
  const SkeletonCard = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
        <div className="h-5 w-1/4 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="relative hidden max-w-xl flex-1 md:block">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search products..."
              className="w-full rounded-xl bg-slate-100 py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-xl p-2 hover:bg-slate-100">
              <Bell size={22} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user?.name || "User"}</p>

                <p className="text-xs text-slate-500">Member</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white">
          <div className="relative z-10 max-w-xl">
            <p className="text-white/70">Welcome back</p>

            <h1 className="mt-2 text-4xl font-bold">
              {user?.name || "User"} 👋
            </h1>

            <p className="mt-4 text-white/80">
              Discover great products or turn your unused items into cash.
            </p>

            <button
              type="button"
              onClick={() => navigate("/ads/create")}
              className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-violet-700 shadow-lg transition hover:-translate-y-1"
            >
              <Plus size={20} />
              Sell Something
            </button>
          </div>

          {/* Decorative objects */}
          <div className="absolute -right-10 -top-10 h-48 w-48 rotate-12 rounded-[50px] bg-white/10 backdrop-blur-xl" />

          <div className="absolute -bottom-20 right-40 h-56 w-56 rounded-full bg-cyan-300/10 blur-2xl" />
        </section>

        {/* Categories */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Explore Categories</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["📱", "Mobiles"],
              ["🚗", "Vehicles"],
              ["💻", "Electronics"],
              ["🏠", "Home"],
              ["👕", "Fashion"],
              ["⚽", "Sports"],
            ].map(([icon, title]) => (
              <button
                key={title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
              >
                <div className="text-4xl transition group-hover:scale-110">
                  {icon}
                </div>

                <p className="mt-3 text-sm font-semibold">{title}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Recommended */}
        <section className="mt-12">
          {/* Section header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                <Sparkles size={18} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Recommended For You</h2>
                <p className="text-xs text-slate-400">Fresh picks based on what's available</p>
              </div>
            </div>
            <Link
              to="/ads"
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-100"
            >
              View All <ArrowRight size={15} />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {adsLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : ads.length > 0
                ? ads.map((ad) => <AdCard key={ad._id} ad={ad} />)
                : (
                  <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="mb-3 text-5xl">🛍️</div>
                    <p className="font-semibold text-slate-700">No listings yet</p>
                    <p className="mt-1 text-sm text-slate-400">Be the first to post something!</p>
                    <button
                      onClick={() => navigate("/ads/create")}
                      className="mt-5 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                    >
                      <Plus size={16} /> Post an Ad
                    </button>
                  </div>
                )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
