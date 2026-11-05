const mongoose = require("mongoose");
const crypto = require("crypto");

const loanSchema = new mongoose.Schema(
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
       LOAN TYPE
    ====================================================== */

    type: {
      type: String,

      enum: [
        "Personal Loan",
        "Business Loan",
        "Education Loan",
        "Auto Loan",
        "Emergency Loan",
        "Other Loan",
      ],

      required: true,
    },

    /* =====================================================
       REQUEST
    ====================================================== */

    requestedAmount: {
      type: Number,
      min: 0.01,
      required: true,
    },

    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    term: {
      type: String,
      trim: true,
      default: "",
    },

    purpose: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       APPROVED LOAN VALUES
    ====================================================== */

    approvedAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    outstandingAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    monthlyPayment: {
      type: Number,
      min: 0,
      default: null,
    },

    interestRate: {
      type: Number,
      min: 0,
      default: null,
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
        "Completed",
        "Rejected",
        "Defaulted",
        "Cancelled",
      ],

      default: "Pending",

      index: true,
    },

    /* =====================================================
       DATES
    ====================================================== */

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    nextPaymentDate: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
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
     * If approved loan funds are credited to
     * the customer's account, this prevents
     * repeatedly crediting the same loan.
     */

    fundsCredited: {
      type: Boolean,
      default: false,
      index: true,
    },

    creditedAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       LINKED TRANSACTION
    ====================================================== */

    transaction: {
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
   GENERATE UNIQUE LOAN REFERENCE
========================================================= */

loanSchema.statics.generateReference = async function () {
  const Loan = this;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

    const reference = `LOAN-${randomPart}`;

    const exists = await Loan.exists({
      reference,
    });

    if (!exists) {
      return reference;
    }
  }

  throw new Error("Unable to generate a unique loan reference.");
};

/* =========================================================
   CUSTOMER / STATUS INDEX
========================================================= */

loanSchema.index({
  customer: 1,
  status: 1,
  createdAt: -1,
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("Loan", loanSchema);
