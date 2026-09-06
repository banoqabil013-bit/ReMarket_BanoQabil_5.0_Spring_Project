import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const loginUser = async (userData) => {
  const response = await api.post(ENDPOINTS.AUTH.LOGIN, userData);

  return response.data;
};

export const signupUser = async (userData) => {
  const response = await api.post(ENDPOINTS.AUTH.SIGNUP, userData);

  return response.data;
};

export const getProfile = async () => {
  const response = await api.get(ENDPOINTS.USER.PROFILE);

  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put(ENDPOINTS.USER.PROFILE, userData);

  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.put(ENDPOINTS.USER.CHANGE_PASSWORD, passwordData);

  return response.data;
};
