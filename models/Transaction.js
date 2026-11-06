const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,

      enum: [
        "Deposit",
        "Credit",
        "Debit",
        "Transfer",
        "Withdrawal",
        "Refund",
        "Interest",
        "Fee",
        "Adjustment",
      ],

      required: true,
    },

    direction: {
      type: String,

      enum: ["Incoming", "Outgoing"],

      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,

      enum: [
        "Pending",
        "Completed",
        "Failed",
        "Rejected",
        "Cancelled",
        "Reversed",
      ],

      default: "Pending",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    counterparty: {
      type: String,
      trim: true,
      default: "",
    },

    /* =========================================================
       TRANSACTION DATE
    ========================================================= */

    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Transaction", transactionSchema);
