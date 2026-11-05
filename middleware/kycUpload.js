const fs = require("fs");
const path = require("path");
const crypto = require("node:crypto");
const multer = require("multer");

/* =========================================================
   PRIVATE KYC UPLOAD DIRECTORY
========================================================= */

const kycUploadDirectory = path.join(__dirname, "..", "uploads", "kyc");

fs.mkdirSync(kycUploadDirectory, {
  recursive: true,
});

/* =========================================================
   STORAGE
========================================================= */

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, kycUploadDirectory);
  },

  filename: function (req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    const randomName = crypto.randomBytes(16).toString("hex");

    callback(null, `${Date.now()}-${randomName}${extension}`);
  },
});

/* =========================================================
   ALLOWED FILE TYPES
========================================================= */

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

function fileFilter(req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    !allowedMimeTypes.has(file.mimetype) ||
    !allowedExtensions.has(extension)
  ) {
    const error = new Error(
      "Only JPG, PNG, WEBP, and PDF documents are allowed.",
    );

    error.code = "INVALID_KYC_FILE_TYPE";

    return callback(error, false);
  }

  callback(null, true);
}

/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const kycUpload = multer({
  storage,

  fileFilter,

  limits: {
    /*
     * Ten megabytes per individual file.
     */

    fileSize: 10 * 1024 * 1024,

    /*
     * Front, back, and one optional
     * supporting document.
     */

    files: 3,

    fields: 20,
  },
});

/* =========================================================
   EXPECTED KYC FIELDS
========================================================= */

const uploadKycDocuments = kycUpload.fields([
  {
    name: "documentFront",

    maxCount: 1,
  },

  {
    name: "documentBack",

    maxCount: 1,
  },

  {
    name: "supportingDocument",

    maxCount: 1,
  },
]);

/* =========================================================
   FRIENDLY ERROR WRAPPER
========================================================= */

function handleKycUpload(req, res, next) {
  uploadKycDocuments(req, res, function (error) {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(422)
          .send("Each KYC document must be 10 MB or smaller.");
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return res
          .status(422)
          .send("A maximum of three KYC documents may be uploaded.");
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res
          .status(422)
          .send("An unexpected KYC document field was submitted.");
      }

      return res
        .status(422)
        .send(error.message || "The KYC documents could not be uploaded.");
    }

    if (error.code === "INVALID_KYC_FILE_TYPE") {
      return res.status(422).send(error.message);
    }

    return next(error);
  });
}

module.exports = {
  handleKycUpload,
  kycUploadDirectory,
};
