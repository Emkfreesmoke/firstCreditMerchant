const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboardController");

const { requireCustomer } = require("../middleware/auth");
const { handleKycUpload } = require("../middleware/kycUpload");

/* =========================================================
   PROTECT CUSTOMER DASHBOARD
========================================================= */

router.use(requireCustomer);

/* =========================================================
   DASHBOARD ROUTES
========================================================= */

router.get("/", dashboardController.index);

/* =========================================================
   TRANSACTIONS
========================================================= */

router.get("/transactions", dashboardController.transactions);

/* =========================================================
   DEPOSITS
========================================================= */

router.get("/deposits", dashboardController.deposits);

router.post("/deposits", dashboardController.submitDeposit);

router.get("/deposits/:id", dashboardController.depositDetails);
/* =========================================================
   TRANSFERS
========================================================= */

/* =========================================================
   TRANSFER HISTORY
========================================================= */

router.get("/transfers", dashboardController.transfers);

/* =========================================================
   LOCAL TRANSFER
========================================================= */

router.get("/local-transfer", dashboardController.localTransfer);

/* =========================================================
   INTERNAL ACCOUNT LOOKUP
========================================================= */

router.get(
  "/transfers/lookup/:accountNumber",
  dashboardController.lookupInternalAccount,
);

/* =========================================================
   SUBMIT LOCAL TRANSFER
========================================================= */

router.post("/local-transfer", dashboardController.submitLocalTransfer);

/* =========================================================
   INTERNATIONAL TRANSFER
========================================================= */

router.get(
  "/international-transfer",
  dashboardController.internationalTransfer,
);

/* =========================================================
   TRANSFER DETAILS
========================================================= */

router.get("/transfers/:id", dashboardController.transferDetails);

/* =========================================================
   CARDS
========================================================= */

router.get("/cards", dashboardController.cards);

router.get("/cards/:id", dashboardController.cardDetails);

/* =========================================================
   LOANS
========================================================= */

router.get("/loans", dashboardController.loans);

router.get("/loans/request", dashboardController.loanRequest);

router.post("/loans/request", dashboardController.submitLoanRequest);

router.get("/loans/history", dashboardController.loanHistory);

router.get("/loans/:id", dashboardController.loanDetails);

/* =========================================================
   INVESTMENTS
========================================================= */
/* =========================================================
   INVESTMENTS
========================================================= */

router.get("/investments", dashboardController.investments);

router.get("/investments/request", dashboardController.investmentRequest);

router.post(
  "/investments/request",
  dashboardController.submitInvestmentRequest,
);

router.get("/investments/history", dashboardController.investmentHistory);

router.get("/investments/:id", dashboardController.investmentDetails);

/* =========================================================
   KYC
========================================================= */
/* =========================================================
   KYC
========================================================= */

router.get("/kyc", dashboardController.kyc);

router.get("/kyc/submit", dashboardController.kycSubmit);

router.post("/kyc/submit", handleKycUpload, dashboardController.submitKyc);

router.get("/kyc/documents", dashboardController.kycDocuments);

router.get("/kyc/documents/:field", dashboardController.openKycDocument);

/* =========================================================
   NOTIFICATIONS
========================================================= */
/* =========================================================
   NOTIFICATIONS
========================================================= */

router.get("/notifications", dashboardController.notifications);

router.post(
  "/notifications/read-all",
  dashboardController.markAllNotificationsRead,
);

router.get(
  "/notifications/unread-count",
  dashboardController.notificationUnreadCount,
);

router.post(
  "/notifications/:id/read",
  dashboardController.markNotificationRead,
);

router.get("/notifications/:id", dashboardController.notificationDetails);

/* =========================================================
   SUPPORT
========================================================= */
/* =========================================================
   SUPPORT
========================================================= */

router.get("/support", dashboardController.support);

router.get("/support/create", dashboardController.createSupportTicket);

router.post("/support/create", dashboardController.submitSupportTicket);

router.post("/support/:id/reply", dashboardController.replySupportTicket);

router.get("/support/:id", dashboardController.supportDetails);

/* =========================================================
   PROFILE
========================================================= */

router.get("/profile", dashboardController.profile);

router.get("/profile/edit", dashboardController.editProfile);

router.post("/profile/edit", dashboardController.updateProfile);

/* =========================================================
   SETTINGS
========================================================= */

router.get("/settings", dashboardController.settings);

router.post("/settings/preferences", dashboardController.updatePreferences);

router.post(
  "/settings/notifications",
  dashboardController.updateNotificationSettings,
);

router.post("/settings/password", dashboardController.changePassword);

router.post(
  "/settings/transaction-pin",
  dashboardController.changeTransactionPin,
);

module.exports = router;
