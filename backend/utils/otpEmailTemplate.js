const getOtpEmailTemplate = (otp, type = "login", userName = "") => {
  let title = "Login Verification Code";
  let subtitle = "You requested to log in to your ReMarket account. Use the code below to complete your login.";

  if (type === "signup") {
    title = "Verify Your Email Address";
    subtitle = "Thank you for signing up with ReMarket. Please use the verification code below to activate your account.";
  } else if (type === "reset-password") {
    title = "Reset Your Password";
    subtitle = "You requested to reset your password. Please use the verification code below to proceed with resetting your password.";
  } else if (type === "google-auth") {
    title = "Google Sign-In Verification";
    subtitle = "You signed in with Google. Use the verification code below to complete your sign-in to ReMarket.";
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ReMarket</h1>
        <p style="color: rgba(255, 255, 255, 0.85); margin: 6px 0 0 0; font-size: 14px;">Secure Authentication</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px; font-weight: 700; text-align: center;">${title}</h2>
        ${userName ? `<p style="color: #475569; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${userName}</strong>,</p>` : ""}
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
          ${subtitle}
        </p>

        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #7c3aed; display: inline-block;">
            ${otp}
          </span>
        </div>

        <p style="color: #ef4444; font-size: 13px; text-align: center; font-weight: 600; margin: 16px 0 0 0;">
          ⏱ This code will expire in 5 minutes.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
          If you did not request this verification code, please ignore this email or contact support immediately. Never share this code with anyone.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          © ${new Date().getFullYear()} ReMarket Inc. All rights reserved.
        </p>
      </div>
    </div>
  `;
};

module.exports = { getOtpEmailTemplate };
