const mongoose = require("mongoose");

const dashboardValueSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,
    },

    currency: {
      type: String,

      trim: true,

      uppercase: true,
    },

    displayedBalance: {
      type: Number,

      default: 0,

      min: 0,
    },

    monthlyIncome: {
      type: Number,

      default: 0,

      min: 0,
    },

    monthlyOutgoing: {
      type: Number,

      default: 0,

      min: 0,
    },

    transactionLimit: {
      type: Number,

      default: 0,

      min: 0,
    },

    pendingTransactions: {
      type: Number,

      default: 0,

      min: 0,
    },

    transactionVolume: {
      type: Number,

      default: 0,

      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DashboardValue", dashboardValueSchema);
