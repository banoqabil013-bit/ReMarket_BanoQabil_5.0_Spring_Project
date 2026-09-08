import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import AuthLayout from "../layouts/AuthLayout";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";
import GoogleOtpModal from "../components/GoogleOtpModal";

const Login = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials"); // 'credentials' | 'otp'

  // Email auth state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Google auth state
  const [googleEmail, setGoogleEmail] = useState(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleAuthSuccess = (data) => {
    const token = data?.token || data?.data?.token || data?.accessToken;
    if (token) localStorage.setItem("token", token);
    if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

    if (data?.user?.role === "admin") {
      navigate("/admin/ads");
    } else {
      navigate("/dashboard");
    }
  };

  // ── Email Login — Step 1: Verify credentials → send OTP
  const loginMutation = useApiMutation(ENDPOINTS.AUTH.LOGIN, "POST", {
    onSuccess: (data) => {
      if (data?.requireOtp) {
        setStep("otp");
        setResendCooldown(60);
        setFeedbackMessage(data?.message || "Verification code sent to your email.");
        return;
      }
      handleAuthSuccess(data);
    },
  });

  // ── Email Login — Step 2: Verify OTP → issue JWT
  const verifyOtpMutation = useApiMutation(ENDPOINTS.AUTH.LOGIN_VERIFY_OTP, "POST", {
    onSuccess: (data) => handleAuthSuccess(data),
  });

  // ── Resend OTP
  const resendMutation = useApiMutation(ENDPOINTS.AUTH.RESEND_OTP, "POST", {
    onSuccess: (data) => {
      setResendCooldown(60);
      setFeedbackMessage(data?.message || "A new verification code has been sent.");
    },
  });

  // ── Google Auth
  const googleAuthMutation = useApiMutation(ENDPOINTS.AUTH.GOOGLE_AUTH, "POST", {
    onSuccess: (data) => {
      if (data?.requireOtp) {
        setGoogleEmail(data.email);
      } else {
        handleAuthSuccess(data);
      }
    },
  });

  const handleGoogleCredential = ({ credential }) => {
    googleAuthMutation.mutate({ credential });
  };

  const handleEmailChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage("");
    loginMutation.mutate(formData);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage("");
    verifyOtpMutation.mutate({ email: formData.email, otp: otp.trim() });
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return;
    setFeedbackMessage("");
    resendMutation.mutate({ email: formData.email, type: "login" });
  };

  return (
    <AuthLayout>
      {step === "credentials" ? (
        <>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-slate-400">
              Enter your email and password to receive a verification OTP.
            </p>
          </div>

          {/* ── Email Login Form ── */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-violet-400 transition hover:text-violet-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleEmailChange}
                  placeholder="••••••••"
                  required
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

            {/* Error */}
            {loginMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {loginMutation.error?.response?.data?.message ||
                  "Login failed. Please check your credentials."}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue to Verification"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              Create account
            </Link>
          </p>

          {/* ── OR divider ── */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs font-medium text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* ── Google Login ── */}
          {googleAuthMutation.isError && (
            <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {googleAuthMutation.error?.response?.data?.message ||
                "Google sign-in failed. Please try again."}
            </div>
          )}
          <div
            className={`flex justify-center ${
              googleAuthMutation.isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() => {}}
              text="continue_with"
              shape="rectangular"
              theme="filled_black"
              size="large"
              width="400"
            />
          </div>
          {googleAuthMutation.isPending && (
            <p className="mt-2 text-center text-sm text-slate-400">
              <Loader2 size={14} className="mr-1 inline animate-spin" />
              Signing in with Google...
            </p>
          )}
        </>
      ) : (
        /* ── OTP Verification Step ── */
        <>
          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setOtp("");
              setFeedbackMessage("");
            }}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            <ArrowLeft size={16} />
            Back to credentials
          </button>

          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Mail size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">Check your email</h2>
            <p className="mt-2 text-slate-400">
              We sent a 6-digit verification code to{" "}
              <span className="font-semibold text-white">{formData.email}</span>.
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
                "Verify & Login"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5 text-sm">
            <span className="text-slate-400">Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resendMutation.isPending}
              className="flex items-center gap-1.5 font-semibold text-violet-400 transition hover:text-violet-300 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              <RefreshCw
                size={14}
                className={resendMutation.isPending ? "animate-spin" : ""}
              />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resendMutation.isPending
                  ? "Sending..."
                  : "Resend Code"}
            </button>
          </div>
        </>
      )}

      {/* ── Google OTP Modal ── */}
      {googleEmail && (
        <GoogleOtpModal
          email={googleEmail}
          onSuccess={(data) => {
            setGoogleEmail(null);
            handleAuthSuccess(data);
          }}
          onClose={() => setGoogleEmail(null)}
        />
      )}
    </AuthLayout>
  );
};

export default Login;
