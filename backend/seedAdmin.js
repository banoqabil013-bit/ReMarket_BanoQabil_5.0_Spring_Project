const User = require("./models/Users");

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "banoqabil013@gmail.com"
).toLowerCase();

const seedAdmin = async () => {
  try {
    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.log(
        `Admin seed skipped: no user found with email ${ADMIN_EMAIL}. Sign up first, then restart the server.`,
      );
      return;
    }

    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
      console.log(`Admin role assigned to ${ADMIN_EMAIL}`);
      return;
    }

    console.log(`Admin already configured for ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
  }
};

module.exports = seedAdmin;
