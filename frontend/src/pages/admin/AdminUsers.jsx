import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, User as UserIcon } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import useApiQuery from "../../hooks/useApiQuery";
import { ENDPOINTS } from "../../api/endpoints";
import adminService from "../../services/adminService";
import { getUser } from "../../utils/auth";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const currentUser = getUser();

  const { data, isLoading, isError } = useApiQuery(
    ["admin-users"],
    ENDPOINTS.ADMIN.ALL_USERS,
  );

  const roleMutation = useMutation({
    mutationFn: adminService.updateUserRole,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });

      if (response?.user?.email === currentUser?.email) {
        const updatedUser = { ...currentUser, role: response.user.role };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
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
        <div className="p-8 text-red-500">Failed to load users.</div>
      </DashboardLayout>
    );
  }

  const users = data?.users || [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Manage Users</h1>
          <p className="mt-2 text-slate-500">
            Change user roles. Admins can approve and reject ads.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                          <UserIcon size={18} className="text-violet-600" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600">{user.city}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            roleMutation.mutate({
                              id: user._id,
                              role: e.target.value,
                            })
                          }
                          disabled={roleMutation.isPending}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-violet-400"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        {user.role === "admin" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            <Shield size={12} />
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
