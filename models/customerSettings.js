const mongoose = require("mongoose");

const customerSettingsSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,
    },

    language: {
      type: String,

      default: "en",
    },

    displayCurrency: {
      type: String,

      trim: true,

      uppercase: true,

      default: "",
    },

    timezone: {
      type: String,

      trim: true,

      default: "",
    },

    compactMode: {
      type: Boolean,

      default: false,
    },

    emailNotifications: {
      type: Boolean,

      default: false,
    },

    accountNotifications: {
      type: Boolean,

      default: false,
    },

    transactionNotifications: {
      type: Boolean,

      default: false,
    },

    securityNotifications: {
      type: Boolean,

      default: false,
    },

    announcementNotifications: {
      type: Boolean,

      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CustomerSettings", customerSettingsSchema);
