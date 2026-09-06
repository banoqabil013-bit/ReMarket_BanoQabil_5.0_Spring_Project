const User = require("../models/Users.js");
const Otp = require("../models/Otp.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const generateToken = require("../utils/generateToken.js");
const { sendEmail } = require("../utils/sendEmail.js");
const { getOtpEmailTemplate } = require("../utils/otpEmailTemplate.js");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "banoqabil013@gmail.com"
).toLowerCase();

// ========================================
// SIGNUP: SEND OTP
// ========================================
const sendSignupOtp = async (req, res) => {
  try {
    const { name, email, phone, password, city } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!name || !normalizedEmail || !normalizedPhone || !password || !city) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({
        message: "An account with this email already exists",
      });
    }

    const phoneExists = await User.findOne({ phone: normalizedPhone });
    if (phoneExists) {
      return res.status(400).json({
        message: "An account with this phone number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdminUser = normalizedEmail === ADMIN_EMAIL;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous signup OTP for this email
    await Otp.deleteMany({ email: normalizedEmail, type: "signup" });

    // Store pending user registration data with the OTP (expires in 5 minutes via TTL)
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: "signup",
      userData: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        city: String(city).trim(),
        role: isAdminUser ? "admin" : "user",
      },
    });

    // Send email with OTP
    const html = getOtpEmailTemplate(otp, "signup", String(name).trim());
    await sendEmail({
      to: normalizedEmail,
      subject: `Your ReMarket Verification Code: ${otp}`,
      html,
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("sendSignupOtp error:", error);
    return res.status(500).json({
      message: error.message || "Failed to send verification code",
    });
  }
};

// ========================================
// SIGNUP: VERIFY OTP AND CREATE USER
// ========================================
const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const submittedOtp = String(otp || "").trim();

    if (!normalizedEmail || !submittedOtp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "signup",
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Verification code expired or not found. Please request a new one.",
      });
    }

    if (otpRecord.otp !== submittedOtp) {
      return res.status(400).json({
        message: "Incorrect verification code. Please try again.",
      });
    }

    // Check once again that email or phone was not registered in the meantime
    const alreadyRegistered = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: otpRecord.userData?.phone },
      ],
    });

    if (alreadyRegistered) {
      await Otp.deleteMany({ email: normalizedEmail, type: "signup" });
      return res.status(400).json({
        message: "Account already exists. Please log in instead.",
      });
    }

    // Create the verified user
    const user = await User.create({
      ...otpRecord.userData,
      isVerified: true,
    });

    // Clean up used OTP
    await Otp.deleteMany({ email: normalizedEmail, type: "signup" });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created and verified successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("verifySignupOtp error:", error);
    return res.status(500).json({
      message: error.message || "Verification failed",
    });
  }
};

// ========================================
// LOGIN: VERIFY PASSWORD & DISPATCH OTP
// ========================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });
    }

    // Credentials are valid. Generate 6-digit login OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear previous login OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, type: "login" });

    // Store OTP in database (valid for 5 minutes)
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: "login",
    });

    // Dispatch email
    const html = getOtpEmailTemplate(otp, "login", user.name);
    await sendEmail({
      to: normalizedEmail,
      subject: `Your ReMarket Login Code: ${otp}`,
      html,
    });

    return res.status(200).json({
      success: true,
      requireOtp: true,
      email: user.email,
      message: `A 6-digit verification code has been sent to ${user.email}. Enter it to complete login.`,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: error.message || "Login request failed",
    });
  }
};

// ========================================
// LOGIN: VERIFY OTP AND ISSUE TOKEN
// ========================================
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const submittedOtp = String(otp || "").trim();

    if (!normalizedEmail || !submittedOtp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "login",
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Verification code expired or not found. Please request a new one.",
      });
    }

    if (otpRecord.otp !== submittedOtp) {
      return res.status(400).json({
        message: "Incorrect verification code. Please try again.",
      });
    }

    // Clean up OTP record
    await Otp.deleteMany({ email: normalizedEmail, type: "login" });

    // Ensure isVerified is true and sync admin role if applicable
    if (!user.isVerified) {
      user.isVerified = true;
    }

    if (normalizedEmail === ADMIN_EMAIL && user.role !== "admin") {
      user.role = "admin";
    }

    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("verifyLoginOtp error:", error);
    return res.status(500).json({
      message: error.message || "Login verification failed",
    });
  }
};

// ========================================
// RESEND OTP (SIGNUP, LOGIN, OR RESET-PASSWORD)
// ========================================
const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !["signup", "login", "reset-password"].includes(type)) {
      return res.status(400).json({
        message: "Email and valid type ('signup', 'login', or 'reset-password') are required",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (type === "signup") {
      const existingRecord = await Otp.findOne({
        email: normalizedEmail,
        type: "signup",
      });

      if (!existingRecord || !existingRecord.userData) {
        return res.status(400).json({
          message: "Signup session expired. Please fill out the signup form again.",
        });
      }

      await Otp.deleteMany({ email: normalizedEmail, type: "signup" });
      await Otp.create({
        email: normalizedEmail,
        otp,
        type: "signup",
        userData: existingRecord.userData,
      });

      const html = getOtpEmailTemplate(
        otp,
        "signup",
        existingRecord.userData.name || "",
      );

      await sendEmail({
        to: normalizedEmail,
        subject: `Your ReMarket Verification Code: ${otp}`,
        html,
      });
    } else if (type === "reset-password") {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          message: "No account found with this email address",
        });
      }

      await Otp.deleteMany({ email: normalizedEmail, type: "reset-password" });
      await Otp.create({
        email: normalizedEmail,
        otp,
        type: "reset-password",
      });

      const html = getOtpEmailTemplate(otp, "reset-password", user.name || "");
      await sendEmail({
        to: normalizedEmail,
        subject: `Your ReMarket Password Reset Code: ${otp}`,
        html,
      });
    } else {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      await Otp.deleteMany({ email: normalizedEmail, type: "login" });
      await Otp.create({
        email: normalizedEmail,
        otp,
        type: "login",
      });

      const html = getOtpEmailTemplate(otp, "login", user.name || "");
      await sendEmail({
        to: normalizedEmail,
        subject: `Your ReMarket Login Code: ${otp}`,
        html,
      });
    }

    return res.status(200).json({
      success: true,
      message: `A new verification code has been sent to ${normalizedEmail}`,
    });
  } catch (error) {
    console.error("resendOtp error:", error);
    return res.status(500).json({
      message: error.message || "Failed to resend verification code",
    });
  }
};

// ========================================
// FORGOT PASSWORD: SEND OTP
// ========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email address is required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear previous reset OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, type: "reset-password" });

    // Store in Otp collection (expires in 5 minutes via TTL)
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: "reset-password",
    });

    // Send email with OTP
    const html = getOtpEmailTemplate(otp, "reset-password", user.name);
    await sendEmail({
      to: normalizedEmail,
      subject: `Your ReMarket Password Reset Code: ${otp}`,
      html,
    });

    return res.status(200).json({
      success: true,
      email: user.email,
      message: `A 6-digit verification code has been sent to ${user.email}`,
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      message: error.message || "Failed to send reset verification code",
    });
  }
};

// ========================================
// FORGOT PASSWORD: VERIFY OTP
// ========================================
const verifyResetPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const submittedOtp = String(otp || "").trim();

    if (!normalizedEmail || !submittedOtp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "reset-password",
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Verification code expired or not found. Please request a new code.",
      });
    }

    if (otpRecord.otp !== submittedOtp) {
      return res.status(400).json({
        message: "Incorrect verification code. Please try again.",
      });
    }

    // Clean up used OTP
    await Otp.deleteMany({ email: normalizedEmail, type: "reset-password" });

    // Generate signed reset authorization token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: "reset-password" },
      process.env.JWT_SECRET || "your_jwt_secret_here",
      { expiresIn: "15m" },
    );

    return res.status(200).json({
      success: true,
      resetToken,
      message: "Code verified. You can now choose a new password.",
    });
  } catch (error) {
    console.error("verifyResetPasswordOtp error:", error);
    return res.status(500).json({
      message: error.message || "Verification failed",
    });
  }
};

// ========================================
// FORGOT PASSWORD: RESET PASSWORD
// ========================================
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET || "your_jwt_secret_here",
      );
    } catch (jwtErr) {
      return res.status(400).json({
        message: "Password reset session expired or is invalid. Please request a new code.",
      });
    }

    if (decoded.purpose !== "reset-password") {
      return res.status(400).json({
        message: "Invalid reset session token",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      message: error.message || "Failed to reset password",
    });
  }
};

// ========================================
// GOOGLE AUTH: VERIFY ID TOKEN & SEND OTP
// ========================================
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential token is required" });
    }

    // Verify the ID token with Google
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Invalid or expired Google token. Please try again." });
    }

    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user && user.isBlocked) {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
      });
    }

    if (!user) {
      // New user — create without phone/password (Google-only account)
      const isAdminUser = normalizedEmail === ADMIN_EMAIL;
      user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        googleId,
        authProvider: "google",
        profileImage: picture || "",
        city: "Not Set",
        role: isAdminUser ? "admin" : "user",
        isVerified: false,
      });
    } else {
      // Existing user — attach googleId if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.profileImage && picture) user.profileImage = picture;
        await user.save();
      }
    }

    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: normalizedEmail, type: "google-auth" });
    await Otp.create({ email: normalizedEmail, otp, type: "google-auth" });

    // Send OTP email
    const html = getOtpEmailTemplate(otp, "google-auth", user.name);
    await sendEmail({
      to: normalizedEmail,
      subject: `Your ReMarket Google Sign-In Code: ${otp}`,
      html,
    });

    return res.status(200).json({
      success: true,
      requireOtp: true,
      email: normalizedEmail,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
    });
  } catch (error) {
    console.error("googleAuth error:", error);
    return res.status(500).json({ message: error.message || "Google authentication failed" });
  }
};

// ========================================
// GOOGLE AUTH: VERIFY OTP & ISSUE JWT
// ========================================
const verifyGoogleOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const submittedOtp = String(otp || "").trim();

    if (!normalizedEmail || !submittedOtp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail, type: "google-auth" });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Verification code expired or not found. Please sign in with Google again.",
      });
    }

    if (otpRecord.otp !== submittedOtp) {
      return res.status(400).json({ message: "Incorrect verification code. Please try again." });
    }

    // Clean up OTP
    await Otp.deleteMany({ email: normalizedEmail, type: "google-auth" });

    // Mark verified
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google sign-in successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        profileImage: user.profileImage,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("verifyGoogleOtp error:", error);
    return res.status(500).json({ message: error.message || "Verification failed" });
  }
};

// ========================================
// USER PROFILE & ACCOUNT METHODS
// ========================================
const getProfile = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  const { name, phone, city, profileImage } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, city, profileImage },
    { new: true, runValidators: true },
  ).select("-password");

  res.json(user);
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    return res.status(400).json({
      message: "Old password is incorrect",
    });
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  res.json({
    message: "Password updated successfully",
  });
};

const deleteAccount = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);

  res.json({
    message: "Account deleted successfully",
  });
};

module.exports = {
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
  // Alias for backward compatibility:
  signup: sendSignupOtp,
};
