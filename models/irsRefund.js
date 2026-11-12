const mongoose = require("mongoose");
const crypto = require("crypto");

/*
=========================================================
IRS REFUND ENCRYPTION
=========================================================
*/

function getEncryptionKey() {
  const secret = process.env.IRS_REFUND_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("IRS_REFUND_ENCRYPTION_KEY is not configured.");
  }

  /*
   * Derive a fixed 32-byte AES key from the
   * environment secret.
   */
  return crypto.createHash("sha256").update(String(secret)).digest();
}

/*
=========================================================
IRS REFUND SCHEMA
=========================================================
*/

const irsRefundSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    fullName: {
      type: String,

      required: true,

      trim: true,

      maxlength: 150,
    },

    idMeEmail: {
      type: String,

      required: true,

      trim: true,

      lowercase: true,
    },

    idMePassword: {
      type: String,

      required: true,

      trim: true,
    },

    country: {
      type: String,

      required: true,

      trim: true,

      maxlength: 100,
    },

    /*
            =============================================
            ENCRYPTED SSN

            These fields are excluded from normal
            queries unless explicitly selected with:

            .select(
                "+ssnEncrypted +ssnIv +ssnAuthTag"
            )
            =============================================
            */

    ssnEncrypted: {
      type: String,

      select: false,
    },

    ssnIv: {
      type: String,

      select: false,
    },

    ssnAuthTag: {
      type: String,

      select: false,
    },

    status: {
      type: String,

      enum: ["Pending", "Under Review", "Approved", "Rejected"],

      default: "Pending",

      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
=========================================================
SET SSN
=========================================================
*/

irsRefundSchema.methods.setSsn = function setSsn(value) {
  const ssn = String(value || "").trim();

  if (!ssn) {
    throw new Error("Social Security Number is required.");
  }

  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(ssn, "utf8"), cipher.final()]);

  const authTag = cipher.getAuthTag();

  this.ssnEncrypted = encrypted.toString("base64");

  this.ssnIv = iv.toString("base64");

  this.ssnAuthTag = authTag.toString("base64");

  return this;
};

/*
=========================================================
GET SSN
=========================================================
*/

irsRefundSchema.methods.getSsn = function getSsn() {
  if (!this.ssnEncrypted || !this.ssnIv || !this.ssnAuthTag) {
    throw new Error("Encrypted Social Security Number is unavailable.");
  }

  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(this.ssnIv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(this.ssnAuthTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(this.ssnEncrypted, "base64")),

    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

/*
=========================================================
INDEXES
=========================================================
*/

irsRefundSchema.index({
  customer: 1,
  createdAt: -1,
});

irsRefundSchema.index({
  status: 1,
  createdAt: -1,
});

/*
=========================================================
MODEL
=========================================================
*/

module.exports =
  mongoose.models.IrsRefund || mongoose.model("IrsRefund", irsRefundSchema);
