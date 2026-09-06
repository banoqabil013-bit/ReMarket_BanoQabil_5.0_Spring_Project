import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

import AuthLayout from "../layouts/AuthLayout";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // 'email' | 'otp' | 'password' | 'success'
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Request OTP Mutation
  const requestOtpMutation = useApiMutation(
    ENDPOINTS.AUTH.FORGOT_PASSWORD,
    "POST",
    {
      onSuccess: (data) => {
        setStep("otp");
        setResendCooldown(60);
        setFeedbackMessage(data?.message || "Verification code sent to your email.");
      },
    },
  );

  // 2. Verify OTP Mutation
  const verifyOtpMutation = useApiMutation(
    ENDPOINTS.AUTH.RESET_PASSWORD_VERIFY_OTP,
    "POST",
    {
      onSuccess: (data) => {
        setResetToken(data?.resetToken || "");
        setStep("password");
        setFeedbackMessage("");
      },
    },
  );

  // 3. Resend OTP Mutation
  const resendMutation = useApiMutation(ENDPOINTS.AUTH.RESEND_OTP, "POST", {
    onSuccess: (data) => {
      setResendCooldown(60);
      setFeedbackMessage(data?.message || "A new verification code has been sent.");
    },
  });

  // 4. Reset Password Mutation
  const resetPasswordMutation = useApiMutation(
    ENDPOINTS.AUTH.RESET_PASSWORD,
    "POST",
    {
      onSuccess: () => {
        setStep("success");
      },
    },
  );

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage("");
    setValidationError("");
    requestOtpMutation.mutate({ email: email.trim() });
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage("");
    setValidationError("");
    verifyOtpMutation.mutate({
      email: email.trim(),
      otp: otp.trim(),
    });
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return;
    setFeedbackMessage("");
    setValidationError("");
    resendMutation.mutate({
      email: email.trim(),
      type: "reset-password",
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (newPassword.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match. Please re-enter.");
      return;
    }

    resetPasswordMutation.mutate({
      resetToken,
      newPassword,
    });
  };

  return (
    <AuthLayout>
      {/* ── STEP 1: ENTER EMAIL ── */}
      {step === "email" && (
        <>
          <Link
            to="/login"
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Forgot Password?</h2>
            <p className="mt-2 text-slate-400">
              Enter your account email to receive a 6-digit verification code.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {requestOtpMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {requestOtpMutation.error?.response?.data?.message ||
                  "Failed to send reset code. Please verify your email."}
              </div>
            )}

            <button
              type="submit"
              disabled={requestOtpMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requestOtpMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        </>
      )}

      {/* ── STEP 2: VERIFY OTP ── */}
      {step === "otp" && (
        <>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            <ArrowLeft size={16} /> Back to email
          </button>

          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Mail size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">Check your email</h2>
            <p className="mt-2 text-slate-400">
              We sent a 6-digit reset code to{" "}
              <span className="font-semibold text-white">{email}</span>.
            </p>
          </div>

          {feedbackMessage && (
            <div className="mb-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3.5 text-sm text-violet-300">
              {feedbackMessage}
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-center font-mono text-2xl tracking-[8px] text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {verifyOtpMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {verifyOtpMutation.error?.response?.data?.message ||
                  "Invalid verification code. Please try again."}
              </div>
            )}

            {resendMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {resendMutation.error?.response?.data?.message ||
                  "Failed to resend code. Please try again."}
              </div>
            )}

            <button
              type="submit"
              disabled={otp.length !== 6 || verifyOtpMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verifying Code...
                </>
              ) : (
                "Verify Code & Continue"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5 text-sm">
            <span className="text-slate-400">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resendMutation.isPending}
              className="flex items-center gap-1.5 font-semibold text-violet-400 transition hover:text-violet-300 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              <RefreshCw size={14} className={resendMutation.isPending ? "animate-spin" : ""} />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resendMutation.isPending
                  ? "Sending..."
                  : "Resend Code"}
            </button>
          </div>
        </>
      )}

      {/* ── STEP 3: SET NEW PASSWORD ── */}
      {step === "password" && (
        <>
          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Lock size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">Create New Password</h2>
            <p className="mt-2 text-slate-400">
              Code verified! Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {validationError && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                {validationError}
              </div>
            )}

            {resetPasswordMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {resetPasswordMutation.error?.response?.data?.message ||
                  "Failed to reset password. Please try again."}
              </div>
            )}

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </>
      )}

      {/* ── STEP 4: SUCCESS CONFIRMATION ── */}
      {step === "success" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-3xl font-bold text-white">Password Reset!</h2>
          <p className="mt-3 text-slate-400">
            Your password has been reset successfully. You can now use your new password to log in.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3.5 font-semibold text-white transition hover:bg-violet-500"
          >
            Go to Login
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
