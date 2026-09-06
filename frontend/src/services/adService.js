import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

const adService = {
  getAllAds: async () => {
    const response = await api.get(ENDPOINTS.ADS.GET_ALL);
    return response.data;
  },

  getAdById: async (id) => {
    const response = await api.get(ENDPOINTS.ADS.GET_BY_ID(id));
    return response.data;
  },

  getMyAds: async () => {
    const response = await api.get(ENDPOINTS.ADS.MY_ADS);
    return response.data;
  },

  createAd: async (data) => {
    const response = await api.post(ENDPOINTS.ADS.CREATE, data);

    return response.data;
  },

  updateAd: async ({ id, data }) => {
    const response = await api.put(ENDPOINTS.ADS.UPDATE(id), data);

    return response.data;
  },

  deleteAd: async (id) => {
    const response = await api.delete(ENDPOINTS.ADS.DELETE(id));

    return response.data;
  },
};

export default adService;
