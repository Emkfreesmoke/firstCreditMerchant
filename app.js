"use strict";

require("dotenv").config();

const path = require("node:path");

const express = require("express");

const session = require("express-session");

const { MongoStore } = require("connect-mongo");

const connectDatabase = require("./config/database");

const indexRouter = require("./routes/index");

const dashboardRoutes = require("./routes/dashboard");

const adminRoutes = require("./routes/admin");

const authRoutes = require("./routes/auth");

const { verifyMailer } = require("./utils/mailer");

const app = express();

/* =========================================================
   TRUST PROXY
========================================================= */

app.set("trust proxy", 1);

/* =========================================================
   GLOBAL LOCALS
========================================================= */

app.locals.currentYear = new Date().getFullYear();

/* =========================================================
   DATABASE-AWARE SESSION MIDDLEWARE
========================================================= */

let sessionMiddlewarePromise = null;

function getSessionMiddleware() {
  if (sessionMiddlewarePromise) {
    return sessionMiddlewarePromise;
  }

  sessionMiddlewarePromise = connectDatabase()
    .then(function (connection) {
      /*
       * Reuse the same MongoDB client
       * already opened by Mongoose.
       *
       * This prevents connect-mongo from
       * creating another connection pool.
       */

      const mongoClient = connection.getClient();

      const mongoStore = MongoStore.create({
        client: mongoClient,

        collectionName: "sessions",

        ttl: 60 * 60 * 12,
      });

      mongoStore.on("error", function (error) {
        console.error("MongoDB session store error:", error.message);
      });

      return session({
        name: "first_merchant_session",

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        store: mongoStore,

        cookie: {
          httpOnly: true,

          secure: process.env.NODE_ENV === "production",

          sameSite: "lax",

          maxAge: 1000 * 60 * 60 * 12,
        },
      });
    })
    .catch(function (error) {
      /*
       * Allow the next request to retry
       * if the initial connection fails.
       */

      sessionMiddlewarePromise = null;

      throw error;
    });

  return sessionMiddlewarePromise;
}

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
   VIEW ENGINE
========================================================= */

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

/* =========================================================
   STATIC ASSETS
========================================================= */

app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,

    maxAge: app.get("env") === "production" ? "1d" : 0,
  }),
);

/* =========================================================
   WAIT FOR DATABASE, THEN LOAD SESSION
========================================================= */

app.use(async function (req, res, next) {
  try {
    const sessionMiddleware = await getSessionMiddleware();

    return sessionMiddleware(req, res, next);
  } catch (error) {
    console.error("Request database initialization failed:", error.message);

    return next(error);
  }
});

/* =========================================================
   LOGIN PAGE MESSAGES
========================================================= */

app.use(function (req, res, next) {
  res.locals.error = null;

  if (req.query.accountStatus === "pending") {
    res.locals.error =
      "Your account has been registered and verified. It is currently awaiting activation.";
  }

  next();
});

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

app.use(function (req, res) {
  return res.status(404).render("errors/404", {
    title: "Page Not Found",

    description: "The requested page could not be found.",

    currentPath: req.originalUrl,
  });
});

/* =========================================================
   APPLICATION ERROR HANDLER
========================================================= */

app.use(function (error, req, res, next) {
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
   LOCAL SERVER
========================================================= */

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, function () {
    console.log(`Application running on port ${PORT}`);
  });
}

/* =========================================================
   VERCEL EXPORT
========================================================= */

module.exports = app;
