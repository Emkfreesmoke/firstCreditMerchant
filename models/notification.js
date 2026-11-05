const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    /* =====================================================
         CUSTOMER
      ====================================================== */

    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    /* =====================================================
         CONTENT
      ====================================================== */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
         TYPE / CATEGORY
      ====================================================== */

    type: {
      type: String,

      enum: [
        "Account",
        "Deposit",
        "Transfer",
        "Card",
        "Loan",
        "Investment",
        "KYC",
        "Security",
        "Support",
        "General",
      ],

      default: "General",

      index: true,
    },

    /* =====================================================
         PRIORITY
      ====================================================== */

    priority: {
      type: String,

      enum: ["Normal", "Important", "Urgent"],

      default: "Normal",

      index: true,
    },

    /* =====================================================
         READ STATUS
      ====================================================== */

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
         OPTIONAL ACTION
      ====================================================== */

    actionUrl: {
      type: String,
      trim: true,
      default: "",
    },

    actionLabel: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
         RELATED RECORD
      ====================================================== */

    relatedModel: {
      type: String,

      enum: [
        "",
        "Deposit",
        "Transfer",
        "Card",
        "Loan",
        "Investment",
        "KYC",
        "Support",
      ],

      default: "",
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,

      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   CUSTOMER NOTIFICATION INDEX
========================================================= */

notificationSchema.index({
  customer: 1,
  read: 1,
  createdAt: -1,
});

notificationSchema.index({
  customer: 1,
  type: 1,
  createdAt: -1,
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("Notification", notificationSchema);
