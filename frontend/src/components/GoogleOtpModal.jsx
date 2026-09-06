import { useEffect, useState } from "react";
import { Loader2, RefreshCw, X, ShieldCheck } from "lucide-react";
import useApiMutation from "../hooks/useApiMutation";
import { ENDPOINTS } from "../api/endpoints";

/**
 * GoogleOtpModal
 * ─────────────────────────────────────────────────────────────────
 * Shared OTP verification overlay shown after a successful Google
 * sign-in. Verifies the 6-digit code sent to the user's Gmail and
 * calls onSuccess(data) with the JWT payload on completion.
 *
 * Props:
 *   email      – string  – email address the OTP was sent to
 *   onSuccess  – fn(data) – called with the JWT response on success
 *   onClose    – fn()    – called when the user cancels / closes
 */
const GoogleOtpModal = ({ email, onSuccess, onClose }) => {
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [feedbackMessage, setFeedbackMessage] = useState(
    `A 6-digit verification code has been sent to ${email}`,
  );

  // ── Countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Verify OTP mutation ───────────────────────────────────────
  const verifyMutation = useApiMutation(
    ENDPOINTS.AUTH.GOOGLE_AUTH_VERIFY_OTP,
    "POST",
    {
      onSuccess: (data) => {
        onSuccess(data);
      },
    },
  );

  // ── Resend OTP mutation ───────────────────────────────────────
  const resendMutation = useApiMutation(ENDPOINTS.AUTH.RESEND_OTP, "POST", {
    onSuccess: (data) => {
      setResendCooldown(60);
      setOtp("");
      setFeedbackMessage(
        data?.message || "A new verification code has been sent.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyMutation.mutate({ email, otp: otp.trim() });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return;
    setFeedbackMessage("");
    resendMutation.mutate({ email, type: "google-auth" });
  };

  return (
    /* ── Backdrop ── */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      {/* ── Modal card ── */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
          <ShieldCheck size={28} />
        </div>

        {/* Heading */}
        <h3 className="mb-1 text-2xl font-bold text-white">
          Verify it's you
        </h3>
        <p className="mb-6 text-sm text-slate-400">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-white">{email}</span>. Enter it
          below to complete Google sign-in.
        </p>

        {/* Feedback message */}
        {feedbackMessage && (
          <div className="mb-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-300">
            {feedbackMessage}
          </div>
        )}

        {/* OTP form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-center font-mono text-2xl tracking-[8px] text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* API error */}
          {verifyMutation.isError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {verifyMutation.error?.response?.data?.message ||
                "Invalid verification code. Please try again."}
            </div>
          )}
          {resendMutation.isError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {resendMutation.error?.response?.data?.message ||
                "Failed to resend code. Please try again."}
            </div>
          )}

          {/* Verify button */}
          <button
            type="submit"
            disabled={otp.length !== 6 || verifyMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </button>
        </form>

        {/* Resend row */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-sm">
          <span className="text-slate-400">Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
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
      </div>
    </div>
  );
};

export default GoogleOtpModal;
