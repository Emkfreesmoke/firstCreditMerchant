const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");

const authController = require("../controllers/authController");

const { requireAdmin } = require("../middleware/auth");

/* =========================================================
   ADMIN LOGIN
========================================================= */

/* =========================================================
   ADMIN LOGIN - PUBLIC
========================================================= */

router.get("/login", adminController.login);

router.post("/login", authController.adminLogin);

/* =========================================================
   PROTECT ADMIN ROUTES
========================================================= */

router.use(requireAdmin);

/* =========================================================
   REGISTRATIONS
========================================================= */

router.get("/registrations", adminController.registrations);

router.get("/registrations/:id", adminController.registrationDetails);

router.post("/registrations/:id/approve", adminController.approveRegistration);

/* =========================================================
   DASHBOARD
========================================================= */

router.get("/dashboard", adminController.dashboard);

/* =========================================================
   BALANCE MANAGEMENT
========================================================= */

router.get("/balances", adminController.balances);

router.get(
  "/customers/:id/financial-values",
  adminController.customerFinancialValues,
);

router.post(
  "/customers/:id/financial-values",
  adminController.updateCustomerFinancialValues,
);

/* =========================================================
   CUSTOMER MANAGEMENT
========================================================= */

router.get("/customers", adminController.customers);

router.get("/customers/:id", adminController.customerDetails);

router.get("/customers/:id/edit", adminController.editCustomer);

router.get(
  "/customers/:id/financial-values",
  adminController.customerFinancialValues,
);

/* =========================================================
   DEPOSIT SETTINGS
========================================================= */

router.get("/deposit-settings", adminController.depositSettings);

router.post("/deposit-settings", adminController.updateDepositSettings);

/* =========================================================
   DEPOSITS
========================================================= */

router.get("/deposits", adminController.deposits);

router.get("/deposits/create", adminController.createDeposit);

router.get("/deposits/:id", adminController.depositDetails);

router.post("/deposits/:id/approve", adminController.approveDeposit);

router.post("/deposits/:id/reject", adminController.rejectDeposit);
/* =========================================================
   TRANSACTIONS
========================================================= */

router.get("/transactions", adminController.transactions);

router.get("/transactions/create", adminController.createTransaction);

router.get("/transactions/:id", adminController.transactionDetails);
/* =========================================================
   TRANSFERS
========================================================= */

router.get("/transfers", adminController.transfers);

router.get("/transfers/create", adminController.createTransfer);

router.get("/transfers/:id", adminController.transferDetails);

/* =========================================================
   CARDS
========================================================= */

router.get("/cards", adminController.cards);

router.get("/cards/create", adminController.createCard);

router.post("/cards/create", adminController.storeCard);

router.get("/cards/:id", adminController.cardDetails);

router.post("/cards/:id/update", adminController.updateCard);

/* =========================================================
   LOANS
========================================================= */

router.get("/loans", adminController.loans);

router.get("/loans/create", adminController.createLoan);

router.post("/loans/create", adminController.storeLoan);

router.get("/loans/:id", adminController.loanDetails);

router.post("/loans/:id/approve", adminController.approveLoan);

router.post("/loans/:id/reject", adminController.rejectLoan);

router.post("/loans/:id/activate", adminController.activateLoan);
/* =========================================================
   INVESTMENTS
========================================================= */

router.get("/investments", adminController.investments);

router.get("/investments/create", adminController.createInvestment);

router.post("/investments/create", adminController.storeInvestment);

router.get("/investments/:id", adminController.investmentDetails);

router.post("/investments/:id/approve", adminController.approveInvestment);

router.post("/investments/:id/reject", adminController.rejectInvestment);

router.post("/investments/:id/activate", adminController.activateInvestment);

router.post("/investments/:id/mature", adminController.matureInvestment);

router.post("/investments/:id/close", adminController.closeInvestment);

/* =========================================================
   REGISTRATIONS
========================================================= */

router.get("/registrations", adminController.registrations);

router.get("/registrations/:id", adminController.registrationDetails);

/* =========================================================
   KYC VERIFICATION
========================================================= */
/* =========================================================
   KYC VERIFICATION
========================================================= */

router.get("/kyc", adminController.kyc);

router.get("/kyc/:id", adminController.kycDetails);

router.post("/kyc/:id/review", adminController.markKycUnderReview);

router.post("/kyc/:id/verify", adminController.verifyKyc);

router.post("/kyc/:id/reject", adminController.rejectKyc);

router.post("/kyc/:id/needs-update", adminController.requestKycUpdate);

router.get("/kyc/:id/documents/:field", adminController.openKycDocument);
/* =========================================================
   NOTIFICATIONS
========================================================= */

router.get("/notifications", adminController.notifications);

router.get("/notifications/create", adminController.createNotification);

router.post("/notifications/create", adminController.storeNotification);

/* =========================================================
   SUPPORT
========================================================= */

router.get("/support", adminController.support);

router.post("/support/:id/reply", adminController.replySupportTicket);

router.post("/support/:id/status", adminController.updateSupportTicketStatus);

router.get("/support/:id", adminController.supportDetails);

/* =========================================================
   ACTIVITY
========================================================= */

router.get("/activity", adminController.activity);

/* =========================================================
   SETTINGS
========================================================= */

router.get("/settings", adminController.settings);

module.exports = router;
