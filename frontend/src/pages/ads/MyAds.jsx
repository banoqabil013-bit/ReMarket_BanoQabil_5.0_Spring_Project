import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Edit3, Eye, Package, CheckCircle2, ShoppingBag } from "lucide-react";
import AdCard from "../../components/ads/AdCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ENDPOINTS } from "../../api/endpoints";
import useApiQuery from "../../hooks/useApiQuery";
import adService from "../../services/adService";

const MyAds = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useApiQuery(
    ["my-ads"],
    ENDPOINTS.ADS.MY_ADS,
  );

  const deleteMutation = useMutation({
    mutationFn: adService.deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-ads"] });
    },
  });

  const handleDelete = (adId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This will also remove all photos permanently.`)) {
      deleteMutation.mutate(adId);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="p-8 text-red-500">Failed to load your advertisements.</div>
      </DashboardLayout>
    );
  }

  const ads = data?.ads || data?.data || data || [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Ads</h1>
            <p className="mt-2 text-slate-500">Manage and track your published advertisements.</p>
          </div>

          <Link
            to="/ads/create"
            className="rounded-xl bg-violet-600 px-5 py-3 text-center font-semibold text-white shadow-md transition hover:bg-violet-700"
          >
            + Post New Ad
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Ads</p>
              <p className="text-2xl font-bold text-slate-900">{ads.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Ads</p>
              <p className="text-2xl font-bold text-emerald-600">
                {ads.filter((ad) => ad.status === "active").length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-600">
                {ads.filter((ad) => ad.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        {/* Ads Grid */}
        {ads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="text-5xl">📦</div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              You haven't posted any ads yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Start selling today by posting your first item.
            </p>
            <Link
              to="/ads/create"
              className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
            >
              Create Your First Ad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ads.map((ad) => (
              <div key={ad._id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <AdCard ad={ad} />

                {/* Status Badge Overlay */}
                <div className="absolute right-3 top-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      ad.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : ad.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : ad.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {ad.status}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="flex border-t border-slate-100 bg-slate-50/50 p-2.5 gap-2">
                  <Link
                    to={`/ads/${ad._id}/edit`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-600"
                  >
                    <Edit3 size={14} /> Edit
                  </Link>

                  <Link
                    to={`/ads/${ad._id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-600"
                  >
                    <Eye size={14} /> View
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(ad._id, ad.title)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                    title="Delete Ad and Photos"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAds;
