const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    purpose: {
      type: String,

      enum: ["registration", "login", "password-reset"],

      required: true,
      index: true,
    },

    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },

    attempts: {
      type: Number,
      default: 0,
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

otpSchema.index({
  user: 1,
  purpose: 1,
});

module.exports = mongoose.model("OTP", otpSchema);
