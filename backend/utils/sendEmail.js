const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("Email not configured. Set EMAIL_USER and EMAIL_PASS in .env");
    return false;
  }

  await transporter.sendMail({
    from: `"ReMarket Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return true;
};

module.exports = { sendEmail };
