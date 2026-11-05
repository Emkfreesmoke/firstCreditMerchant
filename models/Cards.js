const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
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
       CARD INFORMATION
    ====================================================== */

    displayName: {
      type: String,
      trim: true,
      default: "",
    },

    holderName: {
      type: String,
      trim: true,
      default: "",
    },

    issuerName: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,

      enum: [
        "Virtual Debit",
        "Physical Debit",
        "Virtual Credit",
        "Physical Credit",
      ],

      required: true,
    },

    /*
     * Only the display-safe last four digits.
     */

    lastFour: {
      type: String,

      required: true,

      trim: true,

      match: /^\d{4}$/,
    },

    expiry: {
      type: String,

      required: true,

      trim: true,

      match: /^(0[1-9]|1[0-2])\/\d{2}$/,
    },

    currency: {
      type: String,

      required: true,

      trim: true,

      uppercase: true,
    },

    /* =====================================================
       LIMITS
    ====================================================== */

    spendingLimit: {
      type: Number,

      min: 0,

      default: 0,
    },

    /* =====================================================
       STATUS
    ====================================================== */

    status: {
      type: String,

      enum: ["Pending", "Active", "Frozen", "Inactive", "Expired"],

      default: "Pending",

      index: true,
    },

    /* =====================================================
       ADMIN MANAGEMENT
    ====================================================== */

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    issuedAt: {
      type: Date,

      default: null,
    },

    activatedAt: {
      type: Date,

      default: null,
    },

    frozenAt: {
      type: Date,

      default: null,
    },

    inactiveAt: {
      type: Date,

      default: null,
    },

    adminNote: {
      type: String,

      trim: true,

      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   CUSTOMER / STATUS INDEX
========================================================= */

cardSchema.index({
  customer: 1,
  status: 1,
  createdAt: -1,
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("Card", cardSchema);
