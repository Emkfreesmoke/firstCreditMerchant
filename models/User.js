const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,

      enum: ["customer", "admin"],

      default: "customer",
    },

    customerId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    requestedAccountType: {
      type: String,

      trim: true,

      default: "",
    },

    transactionPinHash: {
      type: String,

      select: false,

      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    region: {
      type: String,
      trim: true,
      default: "",
    },

    postalCode: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,

      enum: ["Pending", "Active", "Suspended", "Closed"],

      default: "Pending",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   FULL NAME
========================================================= */

userSchema.virtual("fullName").get(function () {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(" ");
});

userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("User", userSchema);
