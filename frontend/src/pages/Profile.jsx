import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import useApiQuery from "../hooks/useApiQuery";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";
import { ALL_PAKISTANI_CITIES } from "../utils/cities";

const Profile = () => {
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useApiQuery(["profile"], ENDPOINTS.USER.PROFILE);
  const updateProfileMutation = useApiMutation(ENDPOINTS.USER.PROFILE, "PUT", {
    onSuccess: () => refetch(),
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const deleteAccountMutation = useApiMutation(
    ENDPOINTS.USER.DELETE_ACCOUNT,
    "DELETE",
    {
      onSuccess: () => {
        // Clear auth state
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect to login with confirmation
        alert("Your account and all posted ads have been permanently deleted.");
        navigate("/login");
      },
      onError: (err) => {
        setDeleteError(
          err?.response?.data?.message || "Failed to delete account. Please try again."
        );
      },
    }
  );

  useEffect(() => {
    const user = data?.user || data?.data || data;

    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleDeleteAccount = () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleteError("");
    deleteAccountMutation.mutate({});
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="mt-1 text-slate-500">
            Manage your personal details and account preferences.
          </p>
        </div>

        {/* ── Profile Information Form ── */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Personal Information</h2>
              <p className="text-xs text-slate-400">Update your public name and contact info</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone Number <span className="text-xs text-slate-400">(Visible to buyers on your ads)</span>
              </label>
              <div className="relative">
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0300 1234567"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                City / Location
              </label>
              <div className="relative">
                <input
                  name="city"
                  list="profile-pak-cities"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Karachi, Lahore, Islamabad"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <datalist id="profile-pak-cities">
                  {ALL_PAKISTANI_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <MapPin
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          {updateProfileMutation.isSuccess && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-3.5 text-sm font-medium text-green-700">
              <CheckCircle2 size={16} />
              Profile updated successfully.
            </div>
          )}

          {updateProfileMutation.isError && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700">
              <AlertTriangle size={16} />
              {updateProfileMutation.error?.response?.data?.message || "Failed to update profile."}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        {/* ── Danger Zone: Delete Account ── */}
        <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-lg">
                <ShieldAlert size={20} />
                <h3>Delete Account</h3>
              </div>
              <p className="text-sm text-slate-600 max-w-xl">
                Permanently remove your account and all associated data from ReMarket.
                <strong className="text-rose-700 block mt-1">
                  ⚠️ All ads you have posted will also be permanently deleted.
                </strong>
                This action is irreversible.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmText("");
                setDeleteError("");
                setShowDeleteModal(true);
              }}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:ring-4 focus:ring-rose-200"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Interactive Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="relative border-b border-rose-100 bg-rose-50/80 p-6 text-center">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-rose-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle size={28} />
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                Delete Account &amp; All Ads?
              </h3>
              <p className="mt-1 text-xs text-rose-700 font-medium">
                This action CANNOT be undone
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900 space-y-2">
                <p className="font-semibold text-amber-950">
                  By deleting your account:
                </p>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li><strong>All your posted ads</strong> will be permanently removed.</li>
                  <li>All uploaded images will be wiped.</li>
                  <li>Your chats, messages, and saved favorites will be cleared.</li>
                  <li>You will not be able to recover this profile.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  To confirm, please type <span className="font-mono font-bold text-rose-600">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-sm uppercase text-slate-800 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                />
              </div>

              {deleteError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {deleteError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteAccountMutation.isPending}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    confirmText.trim().toUpperCase() !== "DELETE" ||
                    deleteAccountMutation.isPending
                  }
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteAccountMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting Account &amp; Ads...
                    </>
                  ) : (
                    "Permanently Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
