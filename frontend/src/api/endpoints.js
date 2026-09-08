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
    PHONE_SIGNUP_SEND_OTP: "/users/phone/signup/send-otp",
    PHONE_SIGNUP_VERIFY_OTP: "/users/phone/signup/verify-otp",
    PHONE_LOGIN_SEND_OTP: "/users/phone/login/send-otp",
    PHONE_LOGIN_VERIFY_OTP: "/users/phone/login/verify-otp",
    PHONE_RESEND_OTP: "/users/phone/resend-otp",
  },

  USER: {
    PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    DELETE_ACCOUNT: "/users/profile",
  },

  ADS: {
    GET_ALL: "/ads",
    CREATE: "/ads",
    GET_BY_ID: (id) => `/ads/${id}`,
    UPDATE: (id) => `/ads/${id}`,
    DELETE: (id) => `/ads/${id}`,
    MY_ADS: "/ads/my-ads",
    CONTACT_SELLER: (id) => `/ads/${id}/contact`,
    MARK_SOLD: (id) => `/ads/${id}/mark-sold`,
  },

  FAVORITES: {
    TOGGLE: (adId) => `/favorites/${adId}`,
    GET_ALL: "/favorites",
    GET_IDS: "/favorites/ids",
  },

  CATEGORY: {
    GET_ALL: "/category",
  },

  CHAT: {
    START: "/chat",
    GET_CONVERSATIONS: "/chat",
    GET_MESSAGES: (convId) => `/chat/${convId}/messages`,
    SEND_MESSAGE: (convId) => `/chat/${convId}/messages`,
  },

  NOTIFICATIONS: {
    GET_ALL: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
  },

  SELLER: {
    GET_PROFILE: (id) => `/users/seller/${id}`,
  },

  ADMIN: {
    PENDING_ADS: "/ads/admin/pending",
    APPROVE_AD: (id) => `/ads/admin/${id}/approve`,
    REJECT_AD: (id) => `/ads/admin/${id}/reject`,
    ALL_USERS: "/users/admin/all",
    UPDATE_USER_ROLE: (id) => `/users/admin/${id}/role`,
  },
};
