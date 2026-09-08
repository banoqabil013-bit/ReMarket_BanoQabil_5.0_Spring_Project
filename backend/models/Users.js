const mongoose = require("mongoose");
  const { Schema } = mongoose;

  const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        default: null,
        validate: {
          validator: function (v) {
            if (!v) return true;
            return /.+\@.+\..+/.test(v);
          },
          message: "Please fill a valid email address",
        },
      },

      phone: {
        type: String,
        unique: true,
        sparse: true, // allows null/sparse for Google or email-only users
        default: null,
        trim: true,
      },

      password: {
        type: String,
        minlength: 6,
        default: null,
      },

      googleId: {
        type: String,
        default: null,
        index: true,
      },

      authProvider: {
        type: String,
        enum: ["local", "google", "phone"],
        default: "local",
      },

      profileImage: {
        type: String,
        default: "",
      },

      role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
      },

      city: {
        type: String,
        default: "Karachi",
      },

      isVerified: {
        type: Boolean,
        default: false,
      },

      isBlocked: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    },
  );

  // 2. Compile the Schema into a Model
  const User = mongoose.model("User", userSchema);

  module.exports = User;
  