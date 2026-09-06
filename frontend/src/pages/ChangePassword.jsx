import { useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const mutation = useApiMutation(ENDPOINTS.USER.CHANGE_PASSWORD, "PUT");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    mutation.mutate({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl p-6 md:p-8">
        <h1 className="text-3xl font-bold">Change Password</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-6"
        >
          <div className="space-y-5">
            <input
              type="password"
              name="oldPassword"
              placeholder="Current password"
              value={formData.oldPassword}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
              required
            />

            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
              required
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
              required
            />
          </div>

          {mutation.isSuccess && (
            <p className="mt-4 text-sm text-green-600">
              Password changed successfully.
            </p>
          )}

          {mutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              {mutation.error?.response?.data?.message ||
                "Unable to change password."}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {mutation.isPending ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
