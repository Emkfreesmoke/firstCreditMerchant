const mongoose = require("mongoose");
const crypto = require("crypto");

const accountSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      length: 10,
    },

    accountType: {
      type: String,
      required: true,
      trim: true,
    },

    transactionPinHash: {
      type: String,
      select: false,
      default: "",
    },

    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,

      enum: ["Pending", "Active", "Suspended", "Closed"],

      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   GENERATE UNIQUE 10-DIGIT ACCOUNT NUMBER
========================================================= */

accountSchema.statics.generateAccountNumber = async function () {
  const Account = this;

  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = crypto.randomInt(1000000000, 10000000000).toString();

    exists = await Account.exists({
      accountNumber,
    });
  }

  return accountNumber;
};

module.exports = mongoose.model("Account", accountSchema);
