export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/users/login",
    LOGIN_VERIFY_OTP: "/users/login/verify-otp",
    SIGNUP: "/users/signup",
    SIGNUP_SEND_OTP: "/users/signup/send-otp",
    SIGNUP_VERIFY_OTP: "/users/signup/verify-otp",
    RESEND_OTP: "/users/resend-otp",
    FORGOT_PASSWORD: "/users/forgot-password",
    RESET_PASSWORD_VERIFY_OTP: "/users/reset-password/verify-otp",
    RESET_PASSWORD: "/users/reset-password",
    GOOGLE_AUTH: "/users/google-auth",
    GOOGLE_AUTH_VERIFY_OTP: "/users/google-auth/verify-otp",
  },

  USER: {
    PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
  },

  ADS: {
    GET_ALL: "/ads",
    CREATE: "/ads",
    GET_BY_ID: (id) => `/ads/${id}`,
    UPDATE: (id) => `/ads/${id}`,
    DELETE: (id) => `/ads/${id}`,
    MY_ADS: "/ads/my-ads",
  },

  CATEGORY: {
    GET_ALL: "/category",
  },

  ADMIN: {
    PENDING_ADS: "/ads/admin/pending",
    APPROVE_AD: (id) => `/ads/admin/${id}/approve`,
    REJECT_AD: (id) => `/ads/admin/${id}/reject`,
    ALL_USERS: "/users/admin/all",
    UPDATE_USER_ROLE: (id) => `/users/admin/${id}/role`,
  },
};
