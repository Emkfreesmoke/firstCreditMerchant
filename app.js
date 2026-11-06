"use strict";
require("dotenv").config();

const path = require("node:path");
const express = require("express");
const connectDatabase = require("./config/database");

const indexRouter = require("./routes/index");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const session = require("express-session");

const { MongoStore } = require("connect-mongo");

const authRoutes = require("./routes/auth");

const { verifyMailer } = require("./utils/mailer");

const app = express();

// TRUST PROXY: Required for secure cookies and sessions behind Vercel's load balancer
app.set("trust proxy", 1);

app.locals.currentYear = new Date().getFullYear();

// Initialize database connection once on startup for serverless optimization
connectDatabase().catch((error) => {
  console.error("Initial database connection failed:", error.message);
});

/* =========================================================
   MAILER
========================================================= */

if (
  process.env.NODE_ENV !== "production" &&
  process.env.VERIFY_SMTP_ON_START === "true"
) {
  verifyMailer()
    .then(function () {
      console.log("Email service connected");
    })
    .catch(function (error) {
      console.error("SMTP verification failed:", error.message);
    });
}

/* =========================================================
   BODY PARSERS
========================================================= */

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

/* =========================================================
   SESSION
========================================================= */

app.use(
  session({
    name: "first_merchant_session",

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,

      collectionName: "sessions",

      ttl: 60 * 60 * 12,
    }),

    cookie: {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge: 1000 * 60 * 60 * 12,
    },
  }),
);

/* =========================================================
   LOGIN PAGE MESSAGES
========================================================= */

app.use((req, res, next) => {
  res.locals.error = null;

  if (req.query.accountStatus === "pending") {
    res.locals.error =
      "Your account has been registered and verified. It is currently awaiting activation.";
  }

  next();
});

/* =========================================================
   VIEW ENGINE & STATIC ASSETS
========================================================= */

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,
    maxAge: app.get("env") === "production" ? "1d" : 0,
  }),
);

/* =========================================================
   ROUTES
========================================================= */

app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminRoutes);
app.use("/", authRoutes);
app.use("/", indexRouter);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).render("errors/404", {
    title: "Page Not Found",
    description: "The requested page could not be found.",
    currentPath: req.originalUrl,
  });
});

/* =========================================================
   APPLICATION ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
      ? error.statusCode
      : 500;

  return res.status(statusCode).render("errors/500", {
    title: "Server Error",
    description:
      statusCode === 500
        ? "An unexpected error occurred. Please try again later."
        : error.message,
    error: app.get("env") === "development" ? error : null,
  });
});

/* =========================================================
   SERVER STARTUP / VERCEL EXPORT
========================================================= */

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
  });
}

module.exports = app;
