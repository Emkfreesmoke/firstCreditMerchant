const bcrypt = require("bcryptjs");

const { validationResult } = require("express-validator");

const User = require("../models/User");

const { issueOtp, verifyOtpCode } = require("../utils/otp");

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/* =========================================================
   CUSTOMER REGISTRATION
========================================================= */

exports.register = async (req, res, next) => {
  try {
    /* -----------------------------------------
           Validate submitted form
        ------------------------------------------ */

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      /*
       * We'll improve frontend error rendering
       * after the authentication flow works.
       */

      return res.status(422).send({
        success: false,
        errors: errors.array(),
      });
    }

    const email = normalize(req.body.email);

    const username = normalize(req.body.username);

    /* -----------------------------------------
           Check existing account
        ------------------------------------------ */

    const existingUser = await User.findOne({
      $or: [
        {
          email,
        },

        {
          username,
        },
      ],
    });

    if (existingUser) {
      return res
        .status(409)
        .send("An account already exists with that email or username.");
    }

    /* -----------------------------------------
           Hash password
        ------------------------------------------ */

    const passwordHash = await bcrypt.hash(req.body.password, 12);

    /* -----------------------------------------
           Hash transaction PIN
        ------------------------------------------ */

    const transactionPinHash = await bcrypt.hash(req.body.pin, 12);

    /* -----------------------------------------
           Create pending customer
        ------------------------------------------ */

    const user = await User.create({
      firstName: req.body.name,

      middleName: req.body.middlename || "",

      lastName: req.body.lastname,

      username,

      email,

      phone: req.body.phone,

      country: req.body.country,

      password: passwordHash,

      requestedAccountType: req.body.accounttype,

      transactionPinHash,

      role: "customer",

      status: "Pending",

      emailVerified: false,
    });

    /* -----------------------------------------
           Send registration OTP
        ------------------------------------------ */

    try {
      await issueOtp({
        user,

        purpose: "registration",

        enforceCooldown: false,
      });
    } catch (error) {
      /*
       * If OTP email fails during initial
       * registration, remove the incomplete
       * user so registration can be retried.
       */

      await User.deleteOne({
        _id: user._id,
      });

      throw error;
    }

    /* -----------------------------------------
           Remember which registration is being
           verified
        ------------------------------------------ */

    req.session.pendingRegistration = {
      userId: String(user._id),
    };

    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      return res.redirect("/verify-otp");
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   REGISTRATION OTP PAGE
========================================================= */

exports.showRegistrationOtp = (req, res) => {
  const pending = req.session && req.session.pendingRegistration;

  if (!pending) {
    return res.redirect("/register");
  }

  return res.render("dashboard/verify-otp", {
    title: "Verify Email",

    error: null,

    resent: req.query.resent === "1",
  });
};
/* =========================================================
   VERIFY REGISTRATION OTP
========================================================= */

exports.verifyRegistrationOtp = async (req, res, next) => {
  try {
    const pending = req.session && req.session.pendingRegistration;

    if (!pending) {
      return res.redirect("/register");
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("dashboard/verify-otp", {
        title: "Verify Email",

        error: "Enter a valid 6-digit verification code.",

        resent: false,
      });
    }
    const result = await verifyOtpCode({
      userId: pending.userId,

      purpose: "registration",

      code: req.body.code,
    });

    if (!result.valid) {
      return res.status(400).render("dashboard/verify-otp", {
        title: "Verify Email",

        error: "The verification code is invalid or expired.",

        resent: false,
      });
    }
    const user = await User.findById(pending.userId);

    if (!user) {
      delete req.session.pendingRegistration;

      return res.redirect("/register");
    }

    user.emailVerified = true;

    await user.save();

    delete req.session.pendingRegistration;

    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      return res.redirect("/login?verified=1");
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   RESEND REGISTRATION OTP
========================================================= */

exports.resendRegistrationOtp = async (req, res, next) => {
  try {
    const pending = req.session && req.session.pendingRegistration;

    if (!pending) {
      return res.redirect("/register");
    }

    const user = await User.findById(pending.userId);

    if (!user) {
      delete req.session.pendingRegistration;

      return res.redirect("/register");
    }

    if (user.emailVerified) {
      delete req.session.pendingRegistration;

      return res.redirect("/login");
    }

    await issueOtp({
      user,

      purpose: "registration",
    });

    return res.redirect("/verify-otp?resent=1");
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER LOGIN
========================================================= */

/* =========================================================
   CUSTOMER LOGIN
========================================================= */

exports.customerLogin = async (req, res, next) => {
  try {
    const identifier = normalize(req.body.email);

    const user = await User.findOne({
      $or: [
        {
          username: identifier,
        },
        {
          email: identifier,
        },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).send("Invalid login details.");
    }

    const passwordValid = await bcrypt.compare(
      req.body.password || "",
      user.password,
    );

    if (!passwordValid) {
      return res.status(401).send("Invalid login details.");
    }

    if (user.role !== "customer") {
      return res.status(403).send("Please use the administrator login.");
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .send("Please verify your email before signing in.");
    }

    if (user.status !== "Active") {
      return res.redirect("/login?accountStatus=pending");
    }

    const pendingUserId = String(user._id);

    const rememberLogin = req.body.remember_me === "1";

    req.session.regenerate(function (error) {
      if (error) {
        return next(error);
      }

      /*
       * Do not authenticate the customer yet.
       * The existing 4-digit PIN must be verified first.
       */

      req.session.pendingPinUserId = pendingUserId;

      req.session.pendingPinRemember = rememberLogin;

      req.session.authenticated = false;

      req.session.save(function (saveError) {
        if (saveError) {
          return next(saveError);
        }

        return res.redirect("/verify-pin");
      });
    });
  } catch (error) {
    return next(error);
  }
};
// exports.customerLogin = async (req, res, next) => {
//   try {
//     /*
//      * The customer login form uses the field
//      * name "email", but customers can log in
//      * with either username or email.
//      */

//     const identifier = normalize(req.body.email);

//     /* =========================================
//        FIND CUSTOMER
//     ========================================== */

//     const user = await User.findOne({
//       $or: [
//         {
//           username: identifier,
//         },
//         {
//           email: identifier,
//         },
//       ],
//     }).select("+password");

//     /*
//      * Keep login errors generic.
//      */

//     if (!user) {
//       return res.status(401).send("Invalid login details.");
//     }

//     /* =========================================
//        CHECK PASSWORD
//     ========================================== */

//     const passwordValid = await bcrypt.compare(
//       req.body.password || "",
//       user.password,
//     );

//     if (!passwordValid) {
//       return res.status(401).send("Invalid login details.");
//     }

//     /* =========================================
//        CUSTOMER LOGIN ONLY
//     ========================================== */

//     if (user.role !== "customer") {
//       return res.status(403).send("Please use the administrator login.");
//     }

//     /* =========================================
//        EMAIL MUST BE VERIFIED
//     ========================================== */

//     if (!user.emailVerified) {
//       return res
//         .status(403)
//         .send("Please verify your email before signing in.");
//     }

//     /* =========================================
//        ACCOUNT MUST BE APPROVED
//     ========================================== */

//     if (user.status !== "Active") {
//       return res.redirect("/login?accountStatus=pending");
//     }

//     /* =========================================
//        SAVE USER ID BEFORE SESSION REGENERATION
//     ========================================== */

//     const userId = String(user._id);

//     /* =========================================
//        REGENERATE SESSION
//     ========================================== */

//     req.session.regenerate((error) => {
//       if (error) {
//         return next(error);
//       }

//       /*
//        * Create authenticated
//        * customer session.
//        */

//       req.session.userId = userId;

//       req.session.role = "customer";

//       req.session.authenticated = true;

//       /* =====================================
//            REMEMBER ME
//         ====================================== */

//       if (req.body.remember_me === "1") {
//         req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
//       }

//       /* =====================================
//            SAVE SESSION
//         ====================================== */

//       req.session.save((saveError) => {
//         if (saveError) {
//           return next(saveError);
//         }

//         return res.redirect("/dashboard");
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

/* =========================================================
   SHOW LOGIN PIN PAGE
========================================================= */

exports.showLoginPin = (req, res) => {
  const pendingUserId = req.session && req.session.pendingPinUserId;

  if (!pendingUserId) {
    return res.redirect("/login");
  }

  return res.render("verify-pin", {
    title: "Security Verification - First Credit Merchant",

    error: null,
  });
};

/* =========================================================
   VERIFY EXISTING LOGIN PIN
========================================================= */

exports.verifyLoginPin = async (req, res, next) => {
  try {
    const pendingUserId = req.session && req.session.pendingPinUserId;

    if (!pendingUserId) {
      return res.redirect("/login");
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("verify-pin", {
        title: "Security Verification - First Credit Merchant",

        error: "Enter your 4-digit transaction PIN.",
      });
    }

    const user = await User.findById(pendingUserId).select(
      "+transactionPinHash",
    );

    if (!user || user.role !== "customer" || user.status !== "Active") {
      delete req.session.pendingPinUserId;
      delete req.session.pendingPinRemember;

      return res.redirect("/login");
    }

    if (!user.transactionPinHash) {
      return res.status(403).render("verify-pin", {
        title: "Security Verification - First Credit Merchant",

        error: "A transaction PIN has not been configured for this account.",
      });
    }

    const pinValid = await bcrypt.compare(
      String(req.body.pin || ""),
      user.transactionPinHash,
    );

    if (!pinValid) {
      return res.status(401).render("verify-pin", {
        title: "Security Verification - First Credit Merchant",

        error: "The transaction PIN is incorrect.",
      });
    }

    const userId = String(user._id);

    const rememberLogin = req.session.pendingPinRemember === true;

    req.session.regenerate(function (error) {
      if (error) {
        return next(error);
      }

      req.session.userId = userId;

      req.session.role = "customer";

      req.session.authenticated = true;

      req.session.pinVerified = true;

      if (rememberLogin) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
      }

      req.session.save(function (saveError) {
        if (saveError) {
          return next(saveError);
        }

        return res.redirect("/dashboard");
      });
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   ADMIN LOGIN
========================================================= */

exports.adminLogin = async (req, res, next) => {
  try {
    const email = normalize(req.body.email);

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(401).render("admin/login", {
        title: "Admin Login",

        error: "Invalid administrator login details.",
      });
    }

    const passwordValid = await bcrypt.compare(
      req.body.password || "",

      user.password,
    );

    if (!passwordValid) {
      return res.status(401).render("admin/login", {
        title: "Admin Login",

        error: "Invalid administrator login details.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).render("admin/login", {
        title: "Admin Login",

        error: "Administrator access is required.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).render("admin/login", {
        title: "Admin Login",

        error: "This administrator account is not active.",
      });
    }

    const userId = String(user._id);

    req.session.regenerate((error) => {
      if (error) {
        return next(error);
      }

      req.session.userId = userId;

      req.session.role = "admin";

      req.session.authenticated = true;

      req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }

        return res.redirect("/admin/dashboard");
      });
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   LOGOUT
========================================================= */

exports.logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("first_merchant_session");

    return res.redirect("/login");
  });
};
