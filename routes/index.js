"use strict";

const express = require("express");

const router = express.Router();

const homeController = require("../controllers/homecontroller");

/*
|--------------------------------------------------------------------------
| Public Website Routes
|--------------------------------------------------------------------------
*/

router.get("/", homeController.index);
router.get("/personal", homeController.personal);
router.get("/cooperate", homeController.cooperate);
router.get("/insurance", homeController.insurance);
router.get("/terms", homeController.terms);
router.get("/cards", homeController.cards);
router.get("/about", homeController.about);
router.get("/contact", homeController.contact);
router.get("/register", homeController.register);
router.get("/login", homeController.login);

/*
|--------------------------------------------------------------------------
| Future Pages
|--------------------------------------------------------------------------
*/

// router.get("/about", homeController.about);
// router.get("/services", homeController.services);
// router.get("/contact", homeController.contact);
// router.get("/pricing", homeController.pricing);
// router.get("/blog", homeController.blog);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
