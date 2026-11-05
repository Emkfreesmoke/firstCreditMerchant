/* =========================================================
   REQUIRE AUTHENTICATION
========================================================= */

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId || req.session.otpVerified !== true) {
    return res.redirect("/login");
  }

  next();
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

  next();
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

  next();
}

/* =========================================================
   REDIRECT AUTHENTICATED USERS
========================================================= */

function redirectAuthenticated(req, res, next) {
  if (!req.session || !req.session.userId || req.session.otpVerified !== true) {
    return next();
  }

  if (req.session.role === "admin") {
    return res.redirect("/admin");
  }

  return res.redirect("/dashboard");
}

module.exports = {
  requireAuth,
  requireCustomer,
  requireAdmin,
  redirectAuthenticated,
};
