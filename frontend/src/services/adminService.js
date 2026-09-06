import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

const adminService = {
  getPendingAds: async () => {
    const response = await api.get(ENDPOINTS.ADMIN.PENDING_ADS);
    return response.data;
  },

  approveAd: async (id) => {
    const response = await api.put(ENDPOINTS.ADMIN.APPROVE_AD(id));
    return response.data;
  },

  rejectAd: async (id) => {
    const response = await api.put(ENDPOINTS.ADMIN.REJECT_AD(id));
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get(ENDPOINTS.ADMIN.ALL_USERS);
    return response.data;
  },

  updateUserRole: async ({ id, role }) => {
    const response = await api.put(ENDPOINTS.ADMIN.UPDATE_USER_ROLE(id), {
      role,
    });
    return response.data;
  },
};

export default adminService;
