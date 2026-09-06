import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, ArrowLeft, RefreshCw, MapPin } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import AuthLayout from "../layouts/AuthLayout";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";
import { getLiveLocation, getCachedCity } from "../utils/location";
import GoogleOtpModal from "../components/GoogleOtpModal";

const Signup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: getCachedCity() || "Karachi",
  });
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  // Google auth state
  const [googleEmail, setGoogleEmail] = useState(null); // non-null = show OTP modal

  // Auto-detect location on mount
  useEffect(() => {
    setIsDetectingLocation(true);
    getLiveLocation()
      .then((res) => {
        if (res.success && res.city) {
          setFormData((prev) => ({ ...prev, city: res.city }));
          setLocationStatus(res.locality ? `${res.locality}, ${res.city}` : res.city);
        }
      })
      .finally(() => {
        setIsDetectingLocation(false);
      });
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Submit Registration Form -> Sends OTP
  const sendOtpMutation = useApiMutation(ENDPOINTS.AUTH.SIGNUP_SEND_OTP, "POST", {
    onSuccess: (data) => {
      setStep("otp");
      setResendCooldown(60);
      setFeedbackMessage(data?.message || "Verification code sent to your email.");
    },
  });

  // 2. Verify OTP -> Creates User & Logs In
  const verifyOtpMutation = useApiMutation(
    ENDPOINTS.AUTH.SIGNUP_VERIFY_OTP,
    "POST",
    {
      onSuccess: (data) => {
        const token = data?.token || data?.data?.token;
        if (token) {
          localStorage.setItem("token", token);
        }
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        if (data?.user?.role === "admin") {
          navigate("/admin/ads");
        } else {
          navigate("/dashboard");
        }
      },
    },
  );

  // 3. Resend OTP
  const resendMutation = useApiMutation(ENDPOINTS.AUTH.RESEND_OTP, "POST", {
    onSuccess: (data) => {
      setResendCooldown(60);
      setFeedbackMessage(data?.message || "A new verification code has been sent.");
    },
  });

  // 4. Google Auth — sends ID token to backend, gets OTP dispatched
  const googleAuthMutation = useApiMutation(ENDPOINTS.AUTH.GOOGLE_AUTH, "POST", {
    onSuccess: (data) => {
      if (data?.requireOtp) {
        setGoogleEmail(data.email);
      }
    },
  });

  // Called by <GoogleLogin> component with the credential (ID token)
  const handleGoogleCredential = ({ credential }) => {
    googleAuthMutation.mutate({ credential });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage("");
    sendOtpMutation.mutate(formData);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage("");
    verifyOtpMutation.mutate({
      email: formData.email,
      otp: otp.trim(),
    });
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return;
    setFeedbackMessage("");
    resendMutation.mutate({
      email: formData.email,
      type: "signup",
    });
  };

  const handleDetectCity = async () => {
    setIsDetectingLocation(true);
    setLocationStatus("");
    try {
      const res = await getLiveLocation();
      if (res.success && res.city) {
        setFormData((prev) => ({ ...prev, city: res.city }));
        setLocationStatus(res.locality ? `${res.locality}, ${res.city}` : res.city);
      }
    } catch (err) {
      console.error("Location detection error:", err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <AuthLayout>
      {step === "form" ? (
        <>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Create account</h2>
            <p className="mt-2 text-slate-400">
              Enter your details to receive an activation OTP on your Gmail.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92334317144"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  City
                </label>
                <button
                  type="button"
                  onClick={handleDetectCity}
                  disabled={isDetectingLocation}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 transition hover:text-violet-300 disabled:opacity-50"
                  title="Detect live location from GPS or network"
                >
                  <MapPin size={13} className={isDetectingLocation ? "animate-bounce" : ""} />
                  {isDetectingLocation ? "Detecting location..." : "📍 Detect Live Location"}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Karachi, Lahore, Islamabad"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-10 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <MapPin size={16} />
                </div>
              </div>
              {locationStatus && (
                <p className="mt-1.5 text-xs text-violet-400">
                  ✓ Location detected: {locationStatus}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {sendOtpMutation.isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {sendOtpMutation.error?.response?.data?.message || "Signup failed."}
              </div>
            )}

            <button
              type="submit"
              disabled={sendOtpMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendOtpMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sending Verification Code...
                </>
              ) : (
                "Continue to Verification"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              Login
            </Link>
          </p>

          {/* ── OR divider ── */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs font-medium text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* ── Google Sign-Up button ── */}
          {googleAuthMutation.isError && (
            <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {googleAuthMutation.error?.response?.data?.message ||
                "Google sign-in failed. Please try again."}
            </div>
          )}
          <div className={`flex justify-center ${googleAuthMutation.isPending ? "pointer-events-none opacity-60" : ""}`}>
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
        /* OTP Verification Step */
        <>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            <ArrowLeft size={16} /> Back to registration details
          </button>

          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Mail size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white">Verify your email</h2>
            <p className="mt-2 text-slate-400">
              We sent a 6-digit activation code to{" "}
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
                  Activating Account...
                </>
              ) : (
                "Verify & Create Account"
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
      {/* ── Google OTP Modal ── */}
      {googleEmail && (
        <GoogleOtpModal
          email={googleEmail}
          onSuccess={(data) => {
            setGoogleEmail(null);
            const token = data?.token || data?.data?.token;
            if (token) {
              localStorage.setItem("token", token);
            }
            if (data?.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
            }
            if (data?.user?.role === "admin") {
              navigate("/admin/ads");
            } else {
              navigate("/dashboard");
            }
          }}
          onClose={() => setGoogleEmail(null)}
        />
      )}
    </AuthLayout>
  );
};

export default Signup;
