const mongoose = require("mongoose");
const crypto = require("crypto");

const transferSchema = new mongoose.Schema(
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
         TRANSFER TYPE
      ====================================================== */

    type: {
      type: String,

      enum: ["Local", "International"],

      required: true,
    },

    /* =====================================================
   TRANSFER CHANNEL
===================================================== */

    transferChannel: {
      type: String,

      enum: ["Internal", "External"],

      required: true,

      default: "External",

      index: true,
    },

    /* =====================================================
   INTERNAL RECIPIENT
===================================================== */

    recipientCustomer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    recipientAccountId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Account",

      default: null,
    },

    /* =====================================================
         RECIPIENT
      ====================================================== */

    recipientName: {
      type: String,

      required: true,

      trim: true,
    },

    recipientAccount: {
      type: String,

      required: true,

      trim: true,
    },

    recipientBank: {
      type: String,

      required: true,

      trim: true,
    },

    recipientCountry: {
      type: String,

      trim: true,

      default: "",
    },

    recipientAddress: {
      type: String,

      trim: true,

      default: "",
    },

    /* =====================================================
         BANK INFORMATION
      ====================================================== */

    bankCountry: {
      type: String,

      trim: true,

      default: "",
    },

    bankAddress: {
      type: String,

      trim: true,

      default: "",
    },

    routingNumber: {
      type: String,

      trim: true,

      default: "",
    },

    swiftCode: {
      type: String,

      trim: true,

      uppercase: true,

      default: "",
    },

    iban: {
      type: String,

      trim: true,

      uppercase: true,

      default: "",
    },

    /* =====================================================
         FINANCIAL VALUES
      ====================================================== */

    amount: {
      type: Number,

      required: true,

      min: 0.01,
    },

    currency: {
      type: String,

      required: true,

      trim: true,

      uppercase: true,
    },

    fee: {
      type: Number,

      min: 0,

      default: 0,
    },

    /* =====================================================
         INFORMATION
      ====================================================== */

    purpose: {
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
        "Processing",
        "Completed",
        "Failed",
        "Rejected",
        "Cancelled",
      ],

      default: "Pending",

      index: true,
    },

    /* =====================================================
         ADMIN REVIEW
      ====================================================== */

    adminNote: {
      type: String,

      trim: true,

      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    reviewedAt: {
      type: Date,

      default: null,
    },

    /* =====================================================
         PROCESSING PROTECTION
      ====================================================== */

    /*
     * Prevents the balance from being
     * debited more than once if a transfer
     * approval action is repeated.
     */

    balanceDebited: {
      type: Boolean,

      default: false,

      index: true,
    },

    debitedAt: {
      type: Date,

      default: null,
    },

    /* =====================================================
         LINKED TRANSACTION
      ====================================================== */

    senderTransaction: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Transaction",

      default: null,
    },

    recipientTransaction: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Transaction",

      default: null,
    },

    completedAt: {
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
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   GENERATE UNIQUE TRANSFER REFERENCE
========================================================= */

transferSchema.statics.generateReference = async function () {
  const Transfer = this;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

    const reference = `TRF-${randomPart}`;

    const exists = await Transfer.exists({
      reference,
    });

    if (!exists) {
      return reference;
    }
  }

  throw new Error("Unable to generate a unique transfer reference.");
};

/* =========================================================
   CUSTOMER / STATUS INDEX
========================================================= */

transferSchema.index({
  customer: 1,
  status: 1,
  createdAt: -1,
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("Transfer", transferSchema);
