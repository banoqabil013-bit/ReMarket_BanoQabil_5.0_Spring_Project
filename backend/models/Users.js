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
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, "Please fill a valid email address"],
      },

      phone: {
        type: String,
        unique: true,
        sparse: true, // allows multiple null values (Google users may not have a phone)
        default: null,
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
        enum: ["local", "google"],
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
        required: true,
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
  