import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, User as UserIcon } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import useApiQuery from "../../hooks/useApiQuery";
import { ENDPOINTS } from "../../api/endpoints";
import adminService from "../../services/adminService";

const AdminAds = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useApiQuery(
    ["admin-pending-ads"],
    ENDPOINTS.ADMIN.PENDING_ADS,
  );

  const approveMutation = useMutation({
    mutationFn: adminService.approveAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-ads"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminService.rejectAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-ads"] });
    },
  });

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
        <div className="p-8 text-red-500">Failed to load pending ads.</div>
      </DashboardLayout>
    );
  }

  const ads = data?.ads || [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="mt-2 text-slate-500">
            Review and approve ads before they go live.
          </p>
        </div>

        {ads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Clock size={48} className="mx-auto text-slate-400" />
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              No pending ads
            </h2>
            <p className="mt-2 text-slate-500">
              New ads submitted by users will appear here for approval.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
                  <div className="h-48 overflow-hidden rounded-xl bg-slate-100 lg:h-full">
                    {ad.images?.[0]?.url ? (
                      <img
                        src={ad.images[0].url}
                        alt={ad.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        📦
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pending Approval
                        </span>
                        <h2 className="mt-3 text-2xl font-bold text-slate-900">
                          {ad.title}
                        </h2>
                        <p className="mt-2 text-xl font-bold text-violet-600">
                          Rs. {Number(ad.price || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(ad._id)}
                          disabled={
                            approveMutation.isPending || rejectMutation.isPending
                          }
                          className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          <Check size={18} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectMutation.mutate(ad._id)}
                          disabled={
                            approveMutation.isPending || rejectMutation.isPending
                          }
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          <X size={18} />
                          Reject
                        </button>
                      </div>
                    </div>

                    <p className="mt-4 text-slate-600">{ad.description}</p>

                    <div className="mt-5 grid gap-3 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                      <p>
                        <strong>Category:</strong>{" "}
                        {ad.category?.name || "N/A"}
                      </p>
                      <p>
                        <strong>City:</strong> {ad.city}
                      </p>
                      <p>
                        <strong>Condition:</strong> {ad.condition}
                      </p>
                      <p>
                        <strong>Posted:</strong>{" "}
                        {new Date(ad.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                        <UserIcon size={18} className="text-violet-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {ad.user?.name || "Unknown user"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {ad.user?.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAds;
