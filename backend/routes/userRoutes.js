const express = require("express");
const {
  sendSignupOtp,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  forgotPassword,
  verifyResetPasswordOtp,
  resetPassword,
  googleAuth,
  verifyGoogleOtp,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getPublicSellerProfile,
  sendPhoneSignupOtp,
  verifyPhoneSignupOtp,
  sendPhoneLoginOtp,
  verifyPhoneLoginOtp,
  resendPhoneOtp,
} = require("../controller/UserController.js");
const {
  getAllUsers,
  updateUserRole,
} = require("../controller/adminController.js");
const auth = require("../middleware/auth.js");
const isAdmin = require("../middleware/isAdmin.js");

const router = express.Router();

// ========================================
// AUTH ROUTES (OTP-PROTECTED)
// ========================================
router.post("/signup", sendSignupOtp);
router.post("/signup/send-otp", sendSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);

router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/resend-otp", resendOtp);

// ========================================
// PHONE AUTH ROUTES (OTP-PROTECTED)
// ========================================
router.post("/phone/signup/send-otp", sendPhoneSignupOtp);
router.post("/phone/signup/verify-otp", verifyPhoneSignupOtp);
router.post("/phone/login/send-otp", sendPhoneLoginOtp);
router.post("/phone/login/verify-otp", verifyPhoneLoginOtp);
router.post("/phone/resend-otp", resendPhoneOtp);

// ========================================
// PASSWORD RESET ROUTES (OTP-PROTECTED)
// ========================================
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/verify-otp", verifyResetPasswordOtp);
router.post("/reset-password", resetPassword);

// ========================================
// GOOGLE OAUTH ROUTES
// ========================================
router.post("/google-auth", googleAuth);
router.post("/google-auth/verify-otp", verifyGoogleOtp);

// ========================================
// USER PROFILE & ACCOUNT
// ========================================
router.get("/seller/:id", getPublicSellerProfile);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.put("/change-password", auth, changePassword);
router.delete("/profile", auth, deleteAccount);

// ========================================
// ADMIN MANAGEMENT
// ========================================
router.get("/admin/all", auth, isAdmin, getAllUsers);
router.put("/admin/:id/role", auth, isAdmin, updateUserRole);

module.exports = router;
