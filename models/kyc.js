const mongoose = require("mongoose");

/* =========================================================
   KYC DOCUMENT
========================================================= */

const kycDocumentSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "",
    },

    field: {
      type: String,

      enum: ["front", "back", "additional"],

      required: true,
    },

    originalName: {
      type: String,
      trim: true,
      default: "",
    },

    storedName: {
      type: String,
      trim: true,
      default: "",
    },

    mimetype: {
      type: String,
      trim: true,
      default: "",
    },

    kind: {
      type: String,

      enum: ["image", "pdf"],

      required: true,
    },

    size: {
      type: Number,
      min: 0,
      default: 0,
    },

    url: {
      type: String,
      trim: true,
      default: "",
    },

    path: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

/* =========================================================
   KYC SCHEMA
========================================================= */

const kycSchema = new mongoose.Schema(
  {
    /* =====================================================
         CUSTOMER
      ====================================================== */

    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,

      index: true,
    },

    /* =====================================================
         PERSONAL INFORMATION
      ====================================================== */

    legalName: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    nationality: {
      type: String,
      trim: true,
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

    /* =====================================================
         IDENTITY DOCUMENT
      ====================================================== */

    documentType: {
      type: String,

      enum: [
        "national-id",
        "passport",
        "drivers-license",
        "residence-permit",
        "other",
      ],

      default: "national-id",
    },

    documentNumber: {
      type: String,
      trim: true,
      default: "",
    },

    issueDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    /* =====================================================
         UPLOADED DOCUMENTS
      ====================================================== */

    documents: {
      type: [kycDocumentSchema],

      default: [],
    },

    /* =====================================================
         VERIFICATION STATUS
      ====================================================== */

    status: {
      type: String,

      enum: ["Pending", "Under Review", "Verified", "Rejected", "Needs Update"],

      default: "Pending",

      index: true,
    },

    /* =====================================================
         SUBMISSION
      ====================================================== */

    submittedAt: {
      type: Date,
      default: null,
    },

    lastResubmittedAt: {
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

    reviewMessage: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
         VERIFICATION TIMESTAMPS
      ====================================================== */

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    needsUpdateAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   STATUS / DATE INDEX
========================================================= */

kycSchema.index({
  status: 1,
  submittedAt: -1,
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("KYC", kycSchema);
