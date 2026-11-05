const mongoose = require("mongoose");
const crypto = require("crypto");

const depositSchema = new mongoose.Schema(
  {
    /* =========================================
         CUSTOMER
      ========================================== */

    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    /* =========================================
         DEPOSIT REFERENCE
      ========================================== */

    reference: {
      type: String,

      required: true,

      unique: true,

      trim: true,

      index: true,
    },

    /* =========================================
         AMOUNT
      ========================================== */

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

    /* =========================================
         METHOD
      ========================================== */

    method: {
      type: String,

      enum: [
        "Bank Transfer",
        "Cash Deposit",
        "Wire Transfer",
        "Check",
        "Cryptocurrency",
        "Other",
      ],

      required: true,
    },

    /* =========================================
         STATUS
      ========================================== */

    status: {
      type: String,

      enum: ["Pending", "Completed", "Rejected"],

      default: "Pending",

      index: true,
    },

    description: {
      type: String,

      trim: true,

      default: "",
    },

    /* =========================================
         CUSTOMER PAYMENT REFERENCE
      ========================================== */

    paymentReference: {
      type: String,

      trim: true,

      default: "",
    },

    /* =========================================
         CRYPTO DEPOSIT
      ========================================== */

    cryptoAsset: {
      type: String,

      enum: ["", "BTC", "USDT", "ETH"],

      default: "",
    },

    cryptoAmount: {
      type: Number,

      min: 0,

      default: null,
    },

    cryptoNetwork: {
      type: String,

      trim: true,

      default: "",
    },

    /*
     * Snapshot the receiving address shown to
     * the customer when the request is made.
     *
     * This means changing the global Admin wallet
     * later does not rewrite old deposit records.
     */

    cryptoWalletAddress: {
      type: String,

      trim: true,

      default: "",
    },

    /*
     * Transaction hash supplied by customer.
     */

    transactionHash: {
      type: String,

      trim: true,

      default: "",
    },

    /* =========================================
         ADMIN REVIEW
      ========================================== */

    adminNote: {
      type: String,

      trim: true,

      default: "",
    },

    reviewedAt: {
      type: Date,

      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    /* =========================================
         BALANCE CREDIT PROTECTION
      ========================================== */

    /*
     * This is deliberately separate from status.
     *
     * Later, when Admin approves a deposit,
     * the balance-credit logic will check this
     * value before adding money.
     */

    balanceCredited: {
      type: Boolean,

      default: false,

      index: true,
    },

    creditedAt: {
      type: Date,

      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   GENERATE DEPOSIT REFERENCE
========================================================= */

depositSchema.statics.generateReference = async function () {
  const Deposit = this;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

    const reference = `DEP-${randomPart}`;

    const exists = await Deposit.exists({
      reference,
    });

    if (!exists) {
      return reference;
    }
  }

  throw new Error("Unable to generate a unique deposit reference.");
};
depositSchema.index(
  {
    customer: 1,
    transactionHash: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      method: "Cryptocurrency",

      transactionHash: {
        $type: "string",
        $ne: "",
      },
    },
  },
);

depositSchema.index(
  {
    customer: 1,
    method: 1,
    paymentReference: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      method: {
        $ne: "Cryptocurrency",
      },

      paymentReference: {
        $type: "string",
        $ne: "",
      },
    },
  },
);

module.exports = mongoose.model("Deposit", depositSchema);
