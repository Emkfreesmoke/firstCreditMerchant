"use strict";

/* =========================================================
   REQUIRE AUTHENTICATION
========================================================= */

function requireAuth(req, res, next) {
  if (
    !req.session ||
    !req.session.userId ||
    req.session.authenticated !== true
  ) {
    return res.redirect("/login");
  }

  return next();
}

/* =========================================================
   REQUIRE CUSTOMER
========================================================= */

function requireCustomer(req, res, next) {
  if (
    !req.session ||
    !req.session.userId ||
    req.session.authenticated !== true
  ) {
    return res.redirect("/login");
  }

  if (req.session.role !== "customer") {
    return res.status(403).send("Access denied");
  }

  return next();
}

/* =========================================================
   REQUIRE ADMIN
========================================================= */

function requireAdmin(req, res, next) {
  if (
    !req.session ||
    !req.session.userId ||
    req.session.authenticated !== true
  ) {
    return res.redirect("/admin/login");
  }

  if (req.session.role !== "admin") {
    return res.status(403).send("Access denied");
  }

  return next();
}

/* =========================================================
   REDIRECT AUTHENTICATED USERS
========================================================= */

function redirectAuthenticated(req, res, next) {
  if (!req.session) {
    return next();
  }

  if (req.session.pendingPinUserId && req.session.authenticated !== true) {
    return res.redirect("/verify-pin");
  }

  if (!req.session.userId || req.session.authenticated !== true) {
    return next();
  }

  if (req.session.role === "admin") {
    return res.redirect("/admin/dashboard");
  }

  return res.redirect("/dashboard");
}

module.exports = {
  requireAuth,
  requireCustomer,
  requireAdmin,
  redirectAuthenticated,
};
