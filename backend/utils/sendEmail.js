const nodemailer = require("nodemailer");

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

  if (!emailUser || !emailPass) {
    return null;
  }

  if (!/^[a-zA-Z0-9]{16}$/.test(emailPass)) {
    throw new Error(
      "EMAIL_PASS must be a 16-character Gmail App Password. Generate one at https://myaccount.google.com/apppasswords.",
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("Email not configured. Set EMAIL_USER and EMAIL_PASS in .env");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"ReMarket Admin" <${process.env.EMAIL_USER.trim()}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    if (error.responseCode === 534 || error.code === "EAUTH") {
      throw new Error(
        "Gmail rejected the SMTP login. Set EMAIL_PASS to a valid 16-character Gmail App Password.",
        { cause: error },
      );
    }

    throw error;
  }

  return true;
};

module.exports = { sendEmail };
