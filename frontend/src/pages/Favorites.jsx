import { Link } from "react-router-dom";
import { Heart, Search, Sparkles } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import AdCard from "../components/ads/AdCard";
import useApiQuery from "../hooks/useApiQuery";
import { ENDPOINTS } from "../api/endpoints";

const Favorites = () => {
  const { data, isLoading, isError } = useApiQuery(
    ["favorites"],
    ENDPOINTS.FAVORITES.GET_ALL,
  );

  const ads = data?.ads || data?.data || [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Heart size={22} className="fill-rose-500" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Saved Ads</h1>
            </div>
            <p className="mt-2 text-slate-500">
              Items you have marked as favorites for quick access.
            </p>
          </div>

          <Link
            to="/ads"
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-violet-700"
          >
            <Search size={16} />
            Explore More Ads
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            Failed to load saved ads. Please try refreshing the page.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && ads.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-inner">
              <Heart size={36} className="fill-rose-200 text-rose-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              You haven't saved any ads yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Click the heart icon on any listing to save it here for quick tracking and comparison.
            </p>
            <Link
              to="/ads"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-violet-700"
            >
              <Sparkles size={18} />
              Browse All Listings
            </Link>
          </div>
        )}

        {/* Ads Grid */}
        {!isLoading && !isError && ads.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{ads.length}</strong> saved {ads.length === 1 ? "ad" : "ads"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ads.map((ad) => (
                <AdCard key={ad._id} ad={ad} initialFavorited={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Favorites;
