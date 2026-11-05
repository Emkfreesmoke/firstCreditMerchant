"use strict";

exports.index = async (req, res) => {
  try {
    return res.render("index", {
      title: "First Credit Merchant",
      page: "home",
      currentYear: new Date().getFullYear(),
    });
  } catch (error) {
    return res.status(500).render("errors/500", {
      title: "Server Error",
      description: error.message,
    });
  }
};

exports.personal = (req, res) => {
  res.render("personal", {
    title: "Personal Banking | First Merchant",
  });
};
exports.cooperate = (req, res) => {
  res.render("cooperate", {
    title: "Business Banking | First Merchant",
  });
};
exports.insurance = (req, res) => {
  res.render("insurance", {
    title: "insurance | First Merchant",
  });
};
exports.terms = (req, res) => {
  res.render("terms", {
    title: "Terms of Service | First Merchant",
  });
};
exports.about = (req, res) => {
  res.render("about", {
    title: "about us | First Merchant",
  });
};

exports.contact = (req, res) => {
  res.render("contact", {
    title: "contact us | First Merchant",
  });
};
exports.savings = (req, res) => {
  res.render("personal", {
    title: "personal banking | First Merchant",
  });
};
exports.cards = (req, res) => {
  res.render("cards", {
    title: "cards | First Merchant",
  });
};
exports.register = (req, res) => {
  res.render("register", {
    title: "create account | First Merchant",
  });
};
exports.login = (req, res) => {
  res.render("login", {
    title: "Account Login | First Merchant",
  });
};
