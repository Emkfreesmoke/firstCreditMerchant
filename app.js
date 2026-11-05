"use strict";
require("dotenv").config();

const path = require("node:path");
const express = require("express");
const mongoose = require("mongoose");

const indexRouter = require("./routes/index");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const session = require("express-session");

const { MongoStore } = require("connect-mongo");

const authRoutes = require("./routes/auth");

const { verifyMailer } = require("./utils/mailer");

const app = express();
app.locals.currentYear = new Date().getFullYear();
const PORT = Number(process.env.PORT) || 3000;

/* =========================================================
   DATABASE
========================================================= */

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from the environment.");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB Atlas connected: ${mongoose.connection.name}`);
}

mongoose.connection.on("error", function (error) {
  console.error("MongoDB runtime error:", error.message);
});

mongoose.connection.on("disconnected", function () {
  console.warn("MongoDB disconnected");
});
/* =========================================================
   MAILER
========================================================= */

// verifyMailer()
//   .then(() => {
//     console.log("Email service connected");
//   })
//   .catch((error) => {
//     console.error("SMTP verification failed:", error.message);
//   });

verifyMailer()
  .then(() => {
    console.log("Email service connected");
  })
  .catch((error) => {
    console.error("SMTP verification failed");

    console.error({
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
  });

/* =========================================================
   BODY PARSERS
========================================================= */

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.json());

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
   AUTHENTICATION ROUTES
========================================================= */

/*
|--------------------------------------------------------------------------
| View engine
|--------------------------------------------------------------------------
*/
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   REQUEST PARSING
========================================================= */

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/* =========================================================
   ROUTES
========================================================= */

app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminRoutes);
app.use("/", authRoutes);

/*
|--------------------------------------------------------------------------
| Static assets
|--------------------------------------------------------------------------
|
| Files inside public are available from the site root.
|
| Examples:
| public/css/style.css  -> /css/style.css
| public/js/main.js     -> /js/main.js
| public/images/logo.png -> /images/logo.png
|
*/

app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,
    maxAge: app.get("env") === "production" ? "1d" : 0,
  }),
);

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/", indexRouter);

/*
|--------------------------------------------------------------------------
| 404 handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).render("errors/404", {
    title: "Page Not Found",
    description: "The requested page could not be found.",
    currentPath: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Application error handler
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

let server;

async function startApplication() {
  try {
    await connectDatabase();

    server = app.listen(PORT, function () {
      console.log(`Application running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error.message);

    process.exit(1);
  }
}

startApplication();
/*
|--------------------------------------------------------------------------
| Graceful shutdown
|--------------------------------------------------------------------------
*/

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down.`);

  const closeDatabase = async function () {
    try {
      await mongoose.connection.close();

      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB:", error.message);
    }
  };

  if (!server) {
    await closeDatabase();
    process.exit(0);
  }

  server.close(async function (error) {
    if (error) {
      console.error("Error closing HTTP server:", error.message);
    }

    await closeDatabase();

    process.exit(error ? 1 : 0);
  });

  setTimeout(function () {
    console.error("Forcing shutdown after timeout");

    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", function () {
  shutdown("SIGINT");
});

process.on("SIGTERM", function () {
  shutdown("SIGTERM");
});

module.exports = app;
