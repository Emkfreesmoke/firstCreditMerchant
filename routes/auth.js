const express = require("express");

const rateLimit = require("express-rate-limit");

const { body } = require("express-validator");

const authController = require("../controllers/authController");

const router = express.Router();

/* =========================================================
   RATE LIMITER
========================================================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",

  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",

  legacyHeaders: false,
});

/* =========================================================
   CUSTOMER REGISTRATION
========================================================= */

router.post(
  "/register",

  authLimiter,

  [
    body("name").trim().notEmpty().withMessage("First name is required."),

    body("lastname").trim().notEmpty().withMessage("Last name is required."),

    body("username")
      .trim()
      .isLength({
        min: 3,
        max: 40,
      })
      .withMessage("Username must be between 3 and 40 characters.")
      .matches(/^[A-Za-z0-9._-]+$/)
      .withMessage("Username contains unsupported characters."),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address.")
      .normalizeEmail(),

    body("phone").trim().notEmpty().withMessage("Phone number is required."),

    body("country").trim().notEmpty().withMessage("Country is required."),

    body("accounttype")
      .trim()
      .notEmpty()
      .withMessage("Account type is required."),

    body("pin")
      .matches(/^\d{4}$/)
      .withMessage("Transaction PIN must contain exactly 4 digits."),

    body("password")
      .isLength({
        min: 8,
      })
      .withMessage("Password must contain at least 8 characters.")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter.")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number.")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must contain a special character."),

    body("password_confirmation").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }

      return true;
    }),

    body("terms")
      .equals("on")
      .withMessage("You must accept the Terms of Service and Privacy Policy."),
  ],

  authController.register,
);

/* =========================================================
   CUSTOMER LOGIN
========================================================= */

router.post(
  "/login",

  authLimiter,

  [
    body("email").trim().notEmpty().withMessage("Username is required."),

    body("password").notEmpty().withMessage("Password is required."),
  ],

  authController.customerLogin,
);

/* =========================================================
   REGISTRATION OTP
========================================================= */
router.get("/verify-otp", authController.showRegistrationOtp);

router.post(
  "/verify-otp",

  otpLimiter,

  body("code")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Enter the 6-digit verification code."),

  authController.verifyRegistrationOtp,
);

router.post(
  "/resend-otp",

  otpLimiter,

  authController.resendRegistrationOtp,
);

/* =========================================================
   LOGOUT
========================================================= */

router.post(
  "/logout",

  authController.logout,
);

module.exports = router;
