import { useEffect, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import useApiQuery from "../hooks/useApiQuery";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";

const Profile = () => {
  const { data, isLoading } = useApiQuery(["profile"], ENDPOINTS.USER.PROFILE);

  const updateProfileMutation = useApiMutation(ENDPOINTS.USER.PROFILE, "PUT");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const user = data?.user || data?.data || data;

    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading profile...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <h1 className="text-3xl font-bold">Profile</h1>

        <p className="mt-2 text-slate-500">Manage your account information.</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Name</label>

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">Email</label>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">Phone</label>

            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          {updateProfileMutation.isSuccess && (
            <p className="mt-4 text-sm text-green-600">
              Profile updated successfully.
            </p>
          )}

          {updateProfileMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              Failed to update profile.
            </p>
          )}

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
