const mongoose = require("mongoose");
const crypto = require("crypto");

const investmentSchema = new mongoose.Schema(
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
       REFERENCE
    ====================================================== */

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    /* =====================================================
       INVESTMENT INFORMATION
    ====================================================== */

    name: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,

      enum: [
        "Fixed Investment",
        "Savings Investment",
        "Growth Fund",
        "Business Investment",
        "Retirement Investment",
        "Custom Investment",
      ],

      required: true,
    },

    /* =====================================================
       FINANCIAL VALUES
    ====================================================== */

    principal: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currentValue: {
      type: Number,
      min: 0,
      default: null,
    },

    returnAmount: {
      type: Number,
      default: null,
    },

    returnPercentage: {
      type: Number,
      default: null,
    },

    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    duration: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       STATUS
    ====================================================== */

    status: {
      type: String,

      enum: [
        "Pending",
        "Under Review",
        "Approved",
        "Active",
        "Matured",
        "Closed",
        "Rejected",
        "Cancelled",
      ],

      default: "Pending",

      index: true,
    },

    /* =====================================================
       INVESTMENT DATES
    ====================================================== */

    startDate: {
      type: Date,
      default: null,
    },

    maturityDate: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    maturedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       ADMIN REVIEW
    ====================================================== */

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       FUNDING PROTECTION
    ====================================================== */

    /*
     * If activating the investment debits
     * funds from the customer's balance,
     * this prevents processing it twice.
     */

    principalDebited: {
      type: Boolean,
      default: false,
      index: true,
    },

    debitedAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       PAYOUT PROTECTION
    ====================================================== */

    /*
     * When a matured/closed investment is paid
     * back, this helps prevent the same payout
     * being credited twice.
     */

    payoutCredited: {
      type: Boolean,
      default: false,
      index: true,
    },

    paidOutAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       LINKED TRANSACTIONS
    ====================================================== */

    fundingTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    payoutTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   GENERATE UNIQUE INVESTMENT REFERENCE
========================================================= */

investmentSchema.statics.generateReference = async function () {
  const Investment = this;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

    const reference = `INV-${randomPart}`;

    const exists = await Investment.exists({
      reference,
    });

    if (!exists) {
      return reference;
    }
  }

  throw new Error("Unable to generate a unique investment reference.");
};

/* =========================================================
   CUSTOMER / STATUS INDEX
========================================================= */

investmentSchema.index({
  customer: 1,
  status: 1,
  createdAt: -1,
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("Investment", investmentSchema);
