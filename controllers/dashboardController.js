const User = require("../models/User");

const Account = require("../models/account");

const DashboardValue = require("../models/dashboardValue");
const Notification = require("../models/notification");
const SupportTicket = require("../models/SupportTicket");

const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

const Deposit = require("../models/deposit");

const Card = require("../models/Cards");

const Loan = require("../models/loan");
const Investment = require("../models/investment");

const DepositSettings = require("../models/depositSettings");

const fs = require("fs");

const path = require("path");

const KYC = require("../models/kyc");
const bcrypt = require("bcryptjs");

const CustomerSettings = require("../models/customerSettings");

const { kycUploadDirectory } = require("../middleware/kycUpload");

const Transfer = require("../models/transfer");

/* =========================================================
   PROFILE AND SETTINGS HELPERS
========================================================= */

function cleanProfileText(value) {
  return String(value || "").trim();
}

function cleanLowercaseProfileText(value) {
  return cleanProfileText(value).toLowerCase();
}

function checkboxValue(value) {
  return value === true || value === "true" || value === "1" || value === "on";
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function validTransactionPin(pin) {
  return /^\d{4,6}$/.test(String(pin || ""));
}

async function loadCustomerProfileData(customerId) {
  const [customerDocument, account, dashboardValues, kyc] = await Promise.all([
    User.findById(customerId),

    Account.findOne({
      customer: customerId,
    }),

    DashboardValue.findOne({
      customer: customerId,
    }),

    KYC.findOne({
      customer: customerId,
    }),
  ]);

  if (!customerDocument) {
    return null;
  }

  const customer = buildCustomerView(customerDocument, account);

  return {
    customerDocument,
    customer,
    account,
    dashboardValues,
    kyc,
  };
}

async function loadCustomerSettings(customerId) {
  return CustomerSettings.findOneAndUpdate(
    {
      customer: customerId,
    },
    {
      $setOnInsert: {
        customer: customerId,

        language: "en",

        displayCurrency: "",

        timezone: "",

        compactMode: false,

        emailNotifications: false,

        accountNotifications: false,

        transactionNotifications: false,

        securityNotifications: false,

        announcementNotifications: false,
      },
    },
    {
      new: true,

      upsert: true,

      runValidators: true,

      setDefaultsOnInsert: true,
    },
  );
}
/* =========================================================
   SHARED CUSTOMER DASHBOARD DATA
========================================================= */

/*
 * This function supplies a consistent data structure
 * to every customer dashboard page.
 *
 * During database integration, replace these empty values
 * with records belonging to the authenticated customer.
 */

/* =========================================================
   KYC HELPERS
========================================================= */

function cleanKycText(value) {
  return String(value || "").trim();
}

function parseOptionalKycDate(value) {
  const text = cleanKycText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function buildKycDocument(file, field, label) {
  if (!file) {
    return null;
  }

  return {
    label,

    field,

    originalName: file.originalname,

    storedName: file.filename,

    mimetype: file.mimetype,

    kind: file.mimetype === "application/pdf" ? "pdf" : "image",

    size: file.size,

    /*
     * This is an authenticated route,
     * not a public file-system URL.
     */

    url: `/dashboard/kyc/documents/${field}`,

    path: file.path,
  };
}

function removeStoredKycDocument(document) {
  if (!document || !document.path) {
    return;
  }

  fs.unlink(document.path, function () {
    /*
     * Ignore missing/old file errors.
     * The database update should not fail
     * just because an old file is absent.
     */
  });
}

function getUploadedKycFile(req, fieldName) {
  if (
    !req.files ||
    !Array.isArray(req.files[fieldName]) ||
    !req.files[fieldName][0]
  ) {
    return null;
  }

  return req.files[fieldName][0];
}

function getDashboardData() {
  return {
    customer: null,
    account: null,
    dashboardValues: null,
    kyc: null,

    transactions: [],
    deposits: [],
    transfers: [],
    cards: [],
    loans: [],
    investments: [],
    notifications: [],
    supportTickets: [],
  };
}

/*
 * Creates the complete data object passed to an EJS view.
 */

function createViewData(title, additionalData = {}) {
  return {
    title,
    ...getDashboardData(),
    ...additionalData,
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

exports.index = async (req, res, next) => {
  try {
    /* =========================================
       GET AUTHENTICATED CUSTOMER ID
    ========================================== */

    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    /* =========================================
       LOAD CUSTOMER ACCOUNT DATA
    ========================================== */

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    /* =========================================
       CUSTOMER MUST EXIST
    ========================================== */

    if (!customerDocument) {
      return req.session.destroy((error) => {
        if (error) {
          return next(error);
        }

        return res.redirect("/login");
      });
    }

    /* =========================================
       BUILD CUSTOMER VIEW DATA
    ========================================== */

    const customerObject = customerDocument.toObject({
      virtuals: true,
    });

    /*
     * Guarantee that fullName exists,
     * even if the User model does not
     * currently define a fullName virtual.
     */

    const fullName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const customer = {
      ...customerObject,

      id: String(customerDocument._id),

      fullName: customerObject.fullName || fullName,

      customerId:
        customerDocument.customerId || (account ? account.accountNumber : ""),
    };

    /* =========================================
       RENDER CUSTOMER DASHBOARD
    ========================================== */

    return res.render("dashboard/index", {
      ...createViewData("Dashboard - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      /*
       * These remain empty until their
       * models are connected to this
       * controller.
       */

      transactions: [],

      cards: [],

      notifications: [],

      kyc: null,

      activePath: "/dashboard",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   TRANSACTIONS
========================================================= */

exports.transactions = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, transactions] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Transaction.find({
          customer: customerId,
        }).sort({
          transactionDate: -1,
          createdAt: -1,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/transactions", {
      ...createViewData("Transactions - First Credit Merchant"),

      customer,
      account,
      dashboardValues,
      transactions,
      notifications: [],
      kyc: null,
      activePath: "/dashboard/transactions",
    });
  } catch (error) {
    next(error);
  }
};

exports.transactionDetails = (req, res) => {
  res.render(
    "dashboard/transaction-details",
    createViewData("Transaction Details - First Credit Merchant", {
      transaction: null,
    }),
  );
};

/* =========================================================
   DEPOSITS
========================================================= */
/* =========================================================
   DEPOSIT HELPERS
========================================================= */

function cleanDepositText(value) {
  return String(value || "").trim();
}

function buildCustomerView(customerDocument, account) {
  const customerObject = customerDocument.toObject({
    virtuals: true,
  });

  const generatedFullName = [
    customerDocument.firstName,
    customerDocument.middleName,
    customerDocument.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    ...customerObject,

    id: String(customerDocument._id),

    fullName: customerObject.fullName || generatedFullName,

    customerId:
      customerDocument.customerId || (account ? account.accountNumber : ""),
  };
}

async function loadCustomerDepositPageData(customerId) {
  const [
    customerDocument,
    account,
    dashboardValues,
    depositSettings,
    deposits,
  ] = await Promise.all([
    User.findById(customerId),

    Account.findOne({
      customer: customerId,
    }),

    DashboardValue.findOne({
      customer: customerId,
    }),

    DepositSettings.findOne({
      settingsKey: "main",
    }),

    Deposit.find({
      customer: customerId,
    }).sort({
      createdAt: -1,
    }),
  ]);

  return {
    customerDocument,
    account,
    dashboardValues,
    depositSettings,
    deposits,
  };
}

function getCryptoConfiguration(depositSettings, cryptoAsset) {
  if (!depositSettings) {
    return null;
  }

  const cryptoMap = {
    BTC: depositSettings.bitcoin,

    USDT: depositSettings.usdt,

    ETH: depositSettings.ethereum,
  };

  return cryptoMap[cryptoAsset] || null;
}

function getTraditionalConfiguration(depositSettings, method) {
  if (!depositSettings) {
    return null;
  }

  const methodMap = {
    "Bank Transfer": depositSettings.bankTransfer,

    "Wire Transfer": depositSettings.wireTransfer,

    "Cash Deposit": depositSettings.cashDeposit,

    Check: depositSettings.check,

    Other: depositSettings.other,
  };

  return methodMap[method] || null;
}
/* =========================================================
   CUSTOMER DEPOSITS PAGE
========================================================= */

exports.deposits = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const pageData = await loadCustomerDepositPageData(customerId);

    if (!pageData.customerDocument) {
      return req.session.destroy((error) => {
        if (error) {
          return next(error);
        }

        return res.redirect("/login");
      });
    }

    const customer = buildCustomerView(
      pageData.customerDocument,
      pageData.account,
    );

    return res.render("dashboard/deposits", {
      ...createViewData("Deposits - First Credit Merchant"),

      customer,

      account: pageData.account,

      dashboardValues: pageData.dashboardValues,

      depositSettings: pageData.depositSettings,

      deposits: pageData.deposits,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/deposits",

      submitted: req.query.submitted === "1",

      error: null,

      formData: {},
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SUBMIT CUSTOMER DEPOSIT
========================================================= */
function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
exports.submitDeposit = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const pageData = await loadCustomerDepositPageData(customerId);

    if (!pageData.customerDocument || !pageData.account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(
      pageData.customerDocument,
      pageData.account,
    );

    /* =====================================================
       RENDER VALIDATION ERROR
    ====================================================== */

    const renderDepositError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/deposits", {
        ...createViewData("Deposits - First Credit Merchant"),

        customer,

        account: pageData.account,

        dashboardValues: pageData.dashboardValues,

        depositSettings: pageData.depositSettings,

        deposits: pageData.deposits,

        notifications: [],

        kyc: null,

        activePath: "/dashboard/deposits",

        submitted: false,

        error: message,

        formData: req.body || {},
      });
    };

    /* =====================================================
       DEPOSIT SETTINGS
    ====================================================== */

    if (!pageData.depositSettings) {
      return renderDepositError(
        "Deposit methods have not been configured by the administrator.",
      );
    }

    /* =====================================================
       AMOUNT
    ====================================================== */

    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return renderDepositError(
        "Enter a valid deposit amount greater than zero.",
      );
    }

    /* =====================================================
       METHOD
    ====================================================== */

    const method = cleanDepositText(req.body.method);

    const allowedMethods = [
      "Bank Transfer",
      "Cash Deposit",
      "Wire Transfer",
      "Check",
      "Cryptocurrency",
      "Other",
    ];

    if (!allowedMethods.includes(method)) {
      return renderDepositError("Select a valid deposit method.");
    }

    const currency = cleanDepositText(pageData.account.currency).toUpperCase();

    const paymentReference = cleanDepositText(req.body.paymentReference);

    const description = cleanDepositText(req.body.description);

    let cryptoAsset = "";
    let cryptoNetwork = "";
    let cryptoWalletAddress = "";
    let transactionHash = "";
    let cryptoAmount = null;

    /* =====================================================
       CRYPTOCURRENCY VALIDATION
    ====================================================== */

    if (method === "Cryptocurrency") {
      cryptoAsset = cleanDepositText(req.body.cryptoAsset).toUpperCase();

      const allowedCryptoAssets = ["BTC", "USDT", "ETH"];

      if (!allowedCryptoAssets.includes(cryptoAsset)) {
        return renderDepositError("Select Bitcoin, USDT or Ethereum.");
      }

      const cryptoConfiguration = getCryptoConfiguration(
        pageData.depositSettings,
        cryptoAsset,
      );

      if (!cryptoConfiguration || cryptoConfiguration.enabled !== true) {
        return renderDepositError(
          "The selected cryptocurrency deposit method is currently unavailable.",
        );
      }

      cryptoWalletAddress = cleanDepositText(cryptoConfiguration.walletAddress);

      cryptoNetwork = cleanDepositText(cryptoConfiguration.network);

      if (!cryptoWalletAddress || !cryptoNetwork) {
        return renderDepositError(
          "The selected cryptocurrency method has not been completely configured.",
        );
      }

      transactionHash = cleanDepositText(req.body.transactionHash);

      if (!transactionHash) {
        return renderDepositError("Enter the cryptocurrency transaction hash.");
      }

      /*
       * Prevent the same crypto transaction
       * hash from being submitted more than once
       * by the same customer.
       */

      const existingCryptoDeposit = await Deposit.findOne({
        customer: customerId,

        method: "Cryptocurrency",

        transactionHash: {
          $regex: `^${escapeRegExp(transactionHash)}$`,

          $options: "i",
        },
      });

      if (existingCryptoDeposit) {
        return renderDepositError(
          "A deposit request already exists for this transaction hash.",
          409,
        );
      }

      const submittedCryptoAmount = cleanDepositText(req.body.cryptoAmount);

      if (submittedCryptoAmount) {
        cryptoAmount = Number(submittedCryptoAmount);

        if (!Number.isFinite(cryptoAmount) || cryptoAmount <= 0) {
          return renderDepositError("Enter a valid cryptocurrency amount.");
        }
      }
    }

    /* =====================================================
       TRADITIONAL METHOD VALIDATION
    ====================================================== */

    if (method !== "Cryptocurrency") {
      const traditionalConfiguration = getTraditionalConfiguration(
        pageData.depositSettings,
        method,
      );

      if (
        !traditionalConfiguration ||
        traditionalConfiguration.enabled !== true
      ) {
        return renderDepositError(
          "The selected deposit method is currently unavailable.",
        );
      }

      /*
       * Traditional deposits must supply a
       * payment or receipt reference.
       */

      if (!paymentReference) {
        return renderDepositError("Enter the payment or receipt reference.");
      }

      /*
       * Prevent the same traditional payment
       * reference from being submitted twice
       * by the same customer.
       */

      const existingTraditionalDeposit = await Deposit.findOne({
        customer: customerId,

        method,

        paymentReference: {
          $regex: `^${escapeRegExp(paymentReference)}$`,

          $options: "i",
        },
      });

      if (existingTraditionalDeposit) {
        return renderDepositError(
          "A deposit request already exists for this payment reference.",
          409,
        );
      }
    }

    /* =====================================================
       GENERATE DEPOSIT REFERENCE
    ====================================================== */

    const reference = await Deposit.generateReference();

    /* =====================================================
       CREATE EXACTLY ONE PENDING DEPOSIT
    ====================================================== */

    await Deposit.create({
      customer: customerId,

      reference,

      amount,
      currency,

      method,

      status: "Pending",

      description,

      paymentReference,

      cryptoAsset,

      cryptoAmount,

      cryptoNetwork,

      cryptoWalletAddress,

      transactionHash,

      balanceCredited: false,
    });

    /*
     * Redirect immediately after creation.
     * This follows Post/Redirect/Get and prevents
     * browser refresh from repeating the POST.
     */

    return res.redirect(
      `/dashboard/deposits?submitted=1&reference=${encodeURIComponent(
        reference,
      )}`,
    );
  } catch (error) {
    /*
     * Handle a database duplicate-key race
     * without creating another record.
     */

    if (error && error.code === 11000) {
      return res.redirect("/dashboard/deposits?duplicate=1");
    }

    next(error);
  }
};

/* =========================================================
   CUSTOMER DEPOSIT DETAILS
========================================================= */

exports.depositDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, deposit] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Deposit.findOne({
          _id: req.params.id,

          customer: customerId,
        }),
      ]);

    if (!customerDocument || !deposit) {
      return res.status(404).send("Deposit record not found.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/deposit-details", {
      ...createViewData("Deposit Details - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      deposit,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/deposits",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   TRANSFERS
========================================================= */

exports.transfers = (req, res) => {
  res.render(
    "dashboard/transfers",
    createViewData("Transfer History - First Credit Merchant"),
  );
};

/* =========================================================
   LOCAL / INTERNAL TRANSFER PAGE
========================================================= */

exports.localTransfer = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const pinAccount = await Account.findById(account._id).select(
      "+transactionPinHash",
    );

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/local-transfer", {
      ...createViewData("Local Transfer - First Credit Merchant"),

      customer,
      account,
      dashboardValues,

      notifications: [],
      kyc: null,

      activePath: "/dashboard/local-transfer",

      error: null,

      success: req.query.success === "1",

      transferReference: req.query.reference || "",

      pinConfigured: Boolean(pinAccount && pinAccount.transactionPinHash),

      formData: {},
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   LOOK UP INTERNAL RECIPIENT
========================================================= */

exports.lookupInternalAccount = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const accountNumber = String(req.params.accountNumber || "").trim();

    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit account number.",
      });
    }

    const recipientAccount = await Account.findOne({
      accountNumber,
      status: "Active",
    }).populate("customer", "firstName middleName lastName");

    if (!recipientAccount || !recipientAccount.customer) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (String(recipientAccount.customer._id) === String(customerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot transfer to your own account.",
      });
    }

    const recipientName = [
      recipientAccount.customer.firstName,

      recipientAccount.customer.middleName,

      recipientAccount.customer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return res.json({
      success: true,

      account: {
        accountNumber: recipientAccount.accountNumber,

        accountName: recipientName,

        accountType: recipientAccount.accountType,

        currency: recipientAccount.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   SUBMIT LOCAL / INTERNAL TRANSFER
========================================================= */

exports.submitLocalTransfer = async (req, res, next) => {
  let databaseSession = null;

  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, sourceAccount, sourceDashboardValues] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
          status: "Active",
        }).select("+transactionPinHash"),

        DashboardValue.findOne({
          customer: customerId,
        }),
      ]);

    if (!customerDocument || !sourceAccount || !sourceDashboardValues) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, sourceAccount);

    const renderTransferError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/local-transfer", {
        ...createViewData("Local Transfer - First Credit Merchant"),

        customer,

        account: sourceAccount,

        dashboardValues: sourceDashboardValues,

        notifications: [],
        kyc: null,

        activePath: "/dashboard/local-transfer",

        error: message,

        success: false,

        transferReference: "",

        pinConfigured: Boolean(sourceAccount.transactionPinHash),

        formData: req.body || {},
      });
    };

    const recipientAccountNumber = String(
      req.body.recipientAccount || "",
    ).trim();

    const amount = Number(req.body.amount);

    const routingNumber = String(req.body.routingNumber || "").trim();

    const description = String(req.body.description || "").trim();

    const transactionPin = String(req.body.transactionPin || "").trim();

    if (!/^\d{10}$/.test(recipientAccountNumber)) {
      return renderTransferError(
        "Enter a valid 10-digit recipient account number.",
      );
    }

    if (recipientAccountNumber === String(sourceAccount.accountNumber)) {
      return renderTransferError("You cannot transfer to your own account.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return renderTransferError(
        "Enter a valid transfer amount greater than zero.",
      );
    }

    if (!sourceAccount.transactionPinHash) {
      return renderTransferError(
        "Set up your transaction PIN in Settings before making a transfer.",
        400,
      );
    }

    if (!validTransactionPin(transactionPin)) {
      return renderTransferError(
        "Enter your valid 4 to 6 digit transaction PIN.",
      );
    }

    const pinMatches = await bcrypt.compare(
      transactionPin,
      sourceAccount.transactionPinHash,
    );

    if (!pinMatches) {
      return renderTransferError("The transaction PIN is incorrect.", 403);
    }

    const recipientAccount = await Account.findOne({
      accountNumber: recipientAccountNumber,

      status: "Active",
    }).populate("customer", "firstName middleName lastName status");

    if (!recipientAccount || !recipientAccount.customer) {
      return renderTransferError(
        "The recipient account could not be found.",
        404,
      );
    }

    if (String(recipientAccount.customer._id) === String(customerId)) {
      return renderTransferError("You cannot transfer to your own account.");
    }

    if (recipientAccount.customer.status !== "Active") {
      return renderTransferError(
        "The recipient customer account is not active.",
      );
    }

    const sourceCurrency = String(sourceAccount.currency || "")
      .trim()
      .toUpperCase();

    const recipientCurrency = String(recipientAccount.currency || "")
      .trim()
      .toUpperCase();

    if (!sourceCurrency || sourceCurrency !== recipientCurrency) {
      return renderTransferError(
        "Local transfers require both accounts to use the same currency.",
      );
    }

    const currentBalance = Number(sourceDashboardValues.displayedBalance || 0);

    if (currentBalance < amount) {
      return renderTransferError(
        "Your available balance is insufficient for this transfer.",
      );
    }

    const recipientDashboardValues = await DashboardValue.findOne({
      customer: recipientAccount.customer._id,
    });

    if (!recipientDashboardValues) {
      return renderTransferError(
        "The recipient financial account is unavailable.",
        400,
      );
    }

    if (
      String(recipientDashboardValues.currency || recipientCurrency)
        .trim()
        .toUpperCase() !== sourceCurrency
    ) {
      return renderTransferError(
        "The recipient financial currency does not match the sender currency.",
      );
    }

    const recipientName = [
      recipientAccount.customer.firstName,
      recipientAccount.customer.middleName,
      recipientAccount.customer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const senderName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    databaseSession = await sourceAccount.constructor.startSession();

    let completedTransfer = null;

    await databaseSession.withTransaction(async () => {
      /*
       * Reload financial records inside the
       * transaction to avoid using an old balance.
       */

      const lockedSourceValues = await DashboardValue.findOne({
        customer: customerId,
      }).session(databaseSession);

      const lockedRecipientValues = await DashboardValue.findOne({
        customer: recipientAccount.customer._id,
      }).session(databaseSession);

      if (!lockedSourceValues || !lockedRecipientValues) {
        throw new Error("TRANSFER_FINANCIAL_VALUES_UNAVAILABLE");
      }

      if (Number(lockedSourceValues.displayedBalance || 0) < amount) {
        throw new Error("TRANSFER_INSUFFICIENT_BALANCE");
      }

      const transferReference = await Transfer.generateReference();

      const senderTransactionReference =
        await generateTransferTransactionReference();

      const recipientTransactionReference =
        await generateTransferTransactionReference();

      const createdTransfers = await Transfer.create(
        [
          {
            customer: customerId,

            reference: transferReference,

            type: "Local",

            transferChannel: "Internal",

            recipientCustomer: recipientAccount.customer._id,

            recipientAccountId: recipientAccount._id,

            recipientName,

            recipientAccount: recipientAccount.accountNumber,

            recipientBank: "First Credit Merchant",

            routingNumber,

            amount,

            currency: sourceCurrency,

            fee: 0,

            purpose: description,

            description,

            status: "Processing",

            balanceDebited: false,
          },
        ],
        {
          session: databaseSession,
        },
      );

      const transfer = createdTransfers[0];

      lockedSourceValues.displayedBalance =
        Number(lockedSourceValues.displayedBalance || 0) - amount;

      lockedSourceValues.monthlyOutgoing =
        Number(lockedSourceValues.monthlyOutgoing || 0) + amount;

      lockedSourceValues.transactionVolume =
        Number(lockedSourceValues.transactionVolume || 0) + amount;

      lockedRecipientValues.displayedBalance =
        Number(lockedRecipientValues.displayedBalance || 0) + amount;

      lockedRecipientValues.monthlyIncome =
        Number(lockedRecipientValues.monthlyIncome || 0) + amount;

      lockedRecipientValues.transactionVolume =
        Number(lockedRecipientValues.transactionVolume || 0) + amount;

      await lockedSourceValues.save({
        session: databaseSession,
      });

      await lockedRecipientValues.save({
        session: databaseSession,
      });

      const senderTransactions = await Transaction.create(
        [
          {
            customer: customerId,

            reference: senderTransactionReference,

            type: "Transfer",

            direction: "Outgoing",

            amount,

            currency: sourceCurrency,

            status: "Completed",

            description: description || `Local transfer ${transfer.reference}`,

            counterparty: recipientName,
          },
        ],
        {
          session: databaseSession,
        },
      );

      const recipientTransactions = await Transaction.create(
        [
          {
            customer: recipientAccount.customer._id,

            reference: recipientTransactionReference,

            type: "Transfer",

            direction: "Incoming",

            amount,

            currency: sourceCurrency,

            status: "Completed",

            description: description || `Local transfer ${transfer.reference}`,

            counterparty: senderName || sourceAccount.accountNumber,
          },
        ],
        {
          session: databaseSession,
        },
      );

      transfer.senderTransaction = senderTransactions[0]._id;

      transfer.recipientTransaction = recipientTransactions[0]._id;

      transfer.status = "Completed";

      transfer.balanceDebited = true;

      transfer.debitedAt = new Date();

      transfer.completedAt = new Date();

      await transfer.save({
        session: databaseSession,
      });

      completedTransfer = transfer;
    });

    if (!completedTransfer) {
      throw new Error("TRANSFER_NOT_COMPLETED");
    }

    return res.redirect(
      `/dashboard/transfers/${completedTransfer._id}?success=1`,
    );
  } catch (error) {
    if (error && error.message === "TRANSFER_INSUFFICIENT_BALANCE") {
      return res
        .status(422)
        .send("Your available balance is insufficient for this transfer.");
    }

    if (error && error.message === "TRANSFER_FINANCIAL_VALUES_UNAVAILABLE") {
      return res
        .status(400)
        .send("The sender or recipient financial account is unavailable.");
    }

    if (error && error.code === 11000) {
      return res
        .status(409)
        .send(
          "This transfer could not be completed because a duplicate reference was detected. Please try again.",
        );
    }

    next(error);
  } finally {
    if (databaseSession) {
      await databaseSession.endSession();
    }
  }
};

exports.internationalTransfer = (req, res) => {
  res.render(
    "dashboard/international-transfer",
    createViewData("International Transfer - First Credit Merchant"),
  );
};
/* =========================================================
   TRANSFERS
========================================================= */

/* =========================================================
   TRANSFER HELPERS
========================================================= */

async function generateTransferTransactionReference(session = null) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const randomPart = randomBytes(5).toString("hex").toUpperCase();

    const reference = `TXN-${randomPart}`;

    let query = Transaction.exists({
      reference,
    });

    if (session) {
      query = query.session(session);
    }

    const exists = await query;

    if (!exists) {
      return reference;
    }
  }

  throw new Error("Unable to generate a unique transaction reference.");
}

/* =========================================================
   CUSTOMER TRANSFER HISTORY
========================================================= */

exports.transfers = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, transfers] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Transfer.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/transfers", {
      ...createViewData("Transfer History - First Credit Merchant"),

      customer,
      account,
      dashboardValues,
      transfers,

      notifications: [],
      kyc: null,

      activePath: "/dashboard/transfers",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   LOCAL / INTERNAL TRANSFER PAGE
========================================================= */

exports.localTransfer = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const pinAccount = await Account.findById(account._id).select(
      "+transactionPinHash",
    );

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/local-transfer", {
      ...createViewData("Local Transfer - First Credit Merchant"),

      customer,
      account,
      dashboardValues,

      notifications: [],
      kyc: null,

      activePath: "/dashboard/local-transfer",

      error: null,

      success: req.query.success === "1",

      transferReference: req.query.reference || "",

      pinConfigured: Boolean(pinAccount && pinAccount.transactionPinHash),

      formData: {},
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   LOOK UP INTERNAL RECIPIENT
========================================================= */

exports.lookupInternalAccount = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const accountNumber = String(req.params.accountNumber || "").trim();

    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit account number.",
      });
    }

    const recipientAccount = await Account.findOne({
      accountNumber,
      status: "Active",
    }).populate("customer", "firstName middleName lastName status");

    if (!recipientAccount || !recipientAccount.customer) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (String(recipientAccount.customer._id) === String(customerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot transfer to your own account.",
      });
    }

    if (recipientAccount.customer.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "The recipient customer account is not active.",
      });
    }

    const recipientName = [
      recipientAccount.customer.firstName,
      recipientAccount.customer.middleName,
      recipientAccount.customer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return res.json({
      success: true,

      account: {
        accountNumber: recipientAccount.accountNumber,

        accountName: recipientName,

        accountType: recipientAccount.accountType,

        currency: recipientAccount.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SUBMIT LOCAL / INTERNAL TRANSFER
========================================================= */

exports.submitLocalTransfer = async (req, res, next) => {
  let dbSession = null;

  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, sourceAccount, sourceDashboardValues] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
          status: "Active",
        }).select("+transactionPinHash"),

        DashboardValue.findOne({
          customer: customerId,
        }),
      ]);

    if (!customerDocument || !sourceAccount || !sourceDashboardValues) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, sourceAccount);

    const renderTransferError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/local-transfer", {
        ...createViewData("Local Transfer - First Credit Merchant"),

        customer,

        account: sourceAccount,

        dashboardValues: sourceDashboardValues,

        notifications: [],
        kyc: null,

        activePath: "/dashboard/local-transfer",

        error: message,

        success: false,

        transferReference: "",

        pinConfigured: Boolean(sourceAccount.transactionPinHash),

        formData: req.body || {},
      });
    };

    /* =====================================================
       FORM DATA
    ===================================================== */

    const recipientAccountNumber = String(
      req.body.recipientAccount || "",
    ).trim();

    const amount = Number(req.body.amount);

    const routingNumber = String(req.body.routingNumber || "").trim();

    const purpose = String(req.body.purpose || "").trim();

    const description = String(req.body.description || "").trim();

    const transactionPin = String(req.body.transactionPin || "").trim();

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!/^\d{10}$/.test(recipientAccountNumber)) {
      return renderTransferError(
        "Enter a valid 10-digit recipient account number.",
      );
    }

    if (recipientAccountNumber === String(sourceAccount.accountNumber)) {
      return renderTransferError("You cannot transfer to your own account.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return renderTransferError(
        "Enter a valid transfer amount greater than zero.",
      );
    }

    /* =====================================================
       TRANSACTION PIN
    ===================================================== */

    if (!sourceAccount.transactionPinHash) {
      return renderTransferError(
        "Set up your transaction PIN in Settings before making a transfer.",
        400,
      );
    }

    if (!validTransactionPin(transactionPin)) {
      return renderTransferError(
        "Enter your valid 4 to 6 digit transaction PIN.",
      );
    }

    const pinMatches = await bcrypt.compare(
      transactionPin,
      sourceAccount.transactionPinHash,
    );

    if (!pinMatches) {
      return renderTransferError("The transaction PIN is incorrect.", 403);
    }

    /* =====================================================
       VERIFY RECIPIENT AGAIN ON SERVER
    ===================================================== */

    const recipientAccount = await Account.findOne({
      accountNumber: recipientAccountNumber,

      status: "Active",
    }).populate("customer", "firstName middleName lastName status");

    if (!recipientAccount || !recipientAccount.customer) {
      return renderTransferError(
        "The recipient account could not be found.",
        404,
      );
    }

    if (String(recipientAccount.customer._id) === String(customerId)) {
      return renderTransferError("You cannot transfer to your own account.");
    }

    if (recipientAccount.customer.status !== "Active") {
      return renderTransferError(
        "The recipient customer account is not active.",
      );
    }

    /* =====================================================
       CURRENCY VALIDATION
    ===================================================== */

    const sourceCurrency = String(sourceAccount.currency || "")
      .trim()
      .toUpperCase();

    const recipientCurrency = String(recipientAccount.currency || "")
      .trim()
      .toUpperCase();

    if (!sourceCurrency || sourceCurrency !== recipientCurrency) {
      return renderTransferError(
        "Local transfers require both accounts to use the same currency.",
      );
    }

    /* =====================================================
       RECIPIENT FINANCIAL VALUES
    ===================================================== */

    const recipientDashboardValues = await DashboardValue.findOne({
      customer: recipientAccount.customer._id,
    });

    if (!recipientDashboardValues) {
      return renderTransferError(
        "The recipient financial account is unavailable.",
        400,
      );
    }

    /* =====================================================
       AVAILABLE BALANCE
    ===================================================== */

    if (Number(sourceDashboardValues.displayedBalance || 0) < amount) {
      return renderTransferError(
        "Your available balance is insufficient for this transfer.",
      );
    }

    /* =====================================================
       NAMES
    ===================================================== */

    const recipientName = [
      recipientAccount.customer.firstName,
      recipientAccount.customer.middleName,
      recipientAccount.customer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const senderName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    /* =====================================================
       DATABASE TRANSACTION
    ===================================================== */

    dbSession = await mongoose.startSession();

    let completedTransfer = null;

    await dbSession.withTransaction(async () => {
      /*
       * Reload financial values inside
       * the transaction.
       */

      const lockedSourceValues = await DashboardValue.findOne({
        customer: customerId,
      }).session(dbSession);

      const lockedRecipientValues = await DashboardValue.findOne({
        customer: recipientAccount.customer._id,
      }).session(dbSession);

      if (!lockedSourceValues || !lockedRecipientValues) {
        throw new Error("TRANSFER_FINANCIAL_VALUES_UNAVAILABLE");
      }

      /*
       * Check the sender balance again
       * before debiting.
       */

      if (Number(lockedSourceValues.displayedBalance || 0) < amount) {
        throw new Error("TRANSFER_INSUFFICIENT_BALANCE");
      }

      /* ===============================================
           REFERENCES
        =============================================== */

      const transferReference = await Transfer.generateReference();

      const senderTransactionReference =
        await generateTransferTransactionReference(dbSession);

      const recipientTransactionReference =
        await generateTransferTransactionReference(dbSession);

      /* ===============================================
           CREATE TRANSFER
        =============================================== */

      const [transfer] = await Transfer.create(
        [
          {
            customer: customerId,

            reference: transferReference,

            type: "Local",

            transferChannel: "Internal",

            recipientCustomer: recipientAccount.customer._id,

            recipientAccountId: recipientAccount._id,

            recipientName,

            recipientAccount: recipientAccount.accountNumber,

            recipientBank: "First Credit Merchant",

            routingNumber,

            amount,

            currency: sourceCurrency,

            fee: 0,

            purpose,

            description,

            status: "Processing",

            balanceDebited: false,
          },
        ],
        {
          session: dbSession,
        },
      );

      /* ===============================================
           DEBIT SENDER
        =============================================== */

      lockedSourceValues.displayedBalance =
        Number(lockedSourceValues.displayedBalance || 0) - amount;

      lockedSourceValues.monthlyOutgoing =
        Number(lockedSourceValues.monthlyOutgoing || 0) + amount;

      lockedSourceValues.transactionVolume =
        Number(lockedSourceValues.transactionVolume || 0) + amount;

      /* ===============================================
           CREDIT RECIPIENT
        =============================================== */

      lockedRecipientValues.displayedBalance =
        Number(lockedRecipientValues.displayedBalance || 0) + amount;

      lockedRecipientValues.monthlyIncome =
        Number(lockedRecipientValues.monthlyIncome || 0) + amount;

      lockedRecipientValues.transactionVolume =
        Number(lockedRecipientValues.transactionVolume || 0) + amount;

      await lockedSourceValues.save({
        session: dbSession,
      });

      await lockedRecipientValues.save({
        session: dbSession,
      });

      /* ===============================================
           SENDER TRANSACTION
        =============================================== */

      const [senderTransaction] = await Transaction.create(
        [
          {
            customer: customerId,

            reference: senderTransactionReference,

            type: "Transfer",

            direction: "Outgoing",

            amount,

            currency: sourceCurrency,

            status: "Completed",

            description: description || `Local transfer ${transfer.reference}`,

            counterparty: recipientName,
          },
        ],
        {
          session: dbSession,
        },
      );

      /* ===============================================
           RECIPIENT TRANSACTION
        =============================================== */

      const [recipientTransaction] = await Transaction.create(
        [
          {
            customer: recipientAccount.customer._id,

            reference: recipientTransactionReference,

            type: "Transfer",

            direction: "Incoming",

            amount,

            currency: sourceCurrency,

            status: "Completed",

            description: description || `Local transfer ${transfer.reference}`,

            counterparty: senderName || sourceAccount.accountNumber,
          },
        ],
        {
          session: dbSession,
        },
      );

      /* ===============================================
           COMPLETE TRANSFER
        =============================================== */

      transfer.senderTransaction = senderTransaction._id;

      transfer.recipientTransaction = recipientTransaction._id;

      transfer.status = "Completed";

      transfer.balanceDebited = true;

      transfer.debitedAt = new Date();

      transfer.completedAt = new Date();

      await transfer.save({
        session: dbSession,
      });

      completedTransfer = transfer;
    });

    if (!completedTransfer) {
      throw new Error("TRANSFER_NOT_COMPLETED");
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.redirect(
      `/dashboard/transfers/${completedTransfer._id}?success=1`,
    );
  } catch (error) {
    if (error && error.message === "TRANSFER_INSUFFICIENT_BALANCE") {
      return res
        .status(422)
        .send("Your available balance is insufficient for this transfer.");
    }

    if (error && error.message === "TRANSFER_FINANCIAL_VALUES_UNAVAILABLE") {
      return res
        .status(400)
        .send("The sender or recipient financial account is unavailable.");
    }

    if (error && error.code === 11000) {
      return res
        .status(409)
        .send("A duplicate transfer reference was detected. Please try again.");
    }

    next(error);
  } finally {
    if (dbSession) {
      await dbSession.endSession();
    }
  }
};

/* =========================================================
   INTERNATIONAL TRANSFER PAGE
========================================================= */

exports.internationalTransfer = (req, res) => {
  res.render(
    "dashboard/international-transfer",
    createViewData("International Transfer - First Credit Merchant"),
  );
};

/* =========================================================
   CUSTOMER TRANSFER DETAILS
========================================================= */

exports.transferDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, transfer] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Transfer.findOne({
          _id: req.params.id,

          customer: customerId,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    if (!transfer) {
      return res.status(404).send("Transfer record not found.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/transfer-details", {
      ...createViewData("Transfer Details - First Credit Merchant"),

      customer,
      account,
      dashboardValues,
      transfer,

      notifications: [],
      kyc: null,

      activePath: "/dashboard/transfers",

      success: req.query.success === "1",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CARDS
========================================================= */

/* =========================================================
   CUSTOMER CARDS
========================================================= */

exports.cards = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, cards] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Card.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/cards", {
      ...createViewData("My Cards - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      cards,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/cards",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER CARD DETAILS
========================================================= */

exports.cardDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, card] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Card.findOne({
          _id: req.params.id,

          customer: customerId,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    if (!card) {
      return res.status(404).send("Card record not found.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/card-details", {
      ...createViewData("Card Details - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      card,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/cards",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER LOANS
========================================================= */

exports.loans = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, loans] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Loan.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/loans", {
      ...createViewData("Loans - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      loans,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/loans",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER LOAN REQUEST PAGE
========================================================= */

exports.loanRequest = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/loan-request", {
      ...createViewData("Request a Loan - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/loans",

      submitted: req.query.submitted === "1",

      loanReference: req.query.reference || "",

      error: null,

      formData: {},
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   SUBMIT CUSTOMER LOAN REQUEST
========================================================= */

exports.submitLoanRequest = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    const renderLoanError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/loan-request", {
        ...createViewData("Request a Loan - First Credit Merchant"),

        customer,

        account,

        dashboardValues,

        notifications: [],

        kyc: null,

        activePath: "/dashboard/loans",

        submitted: false,

        loanReference: "",

        error: message,

        formData: req.body || {},
      });
    };

    const type = String(req.body.type || "").trim();

    const requestedAmount = Number(req.body.requestedAmount);

    const term = String(req.body.term || "").trim();

    const purpose = String(req.body.purpose || "").trim();

    const currency = String(account.currency || "")
      .trim()
      .toUpperCase();

    const allowedTypes = [
      "Personal Loan",
      "Business Loan",
      "Education Loan",
      "Auto Loan",
      "Emergency Loan",
      "Other Loan",
    ];

    const allowedTerms = [
      "3 Months",
      "6 Months",
      "12 Months",
      "24 Months",
      "36 Months",
      "60 Months",
    ];

    if (!allowedTypes.includes(type)) {
      return renderLoanError("Select a valid loan type.");
    }

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return renderLoanError(
        "Enter a valid requested amount greater than zero.",
      );
    }

    if (!allowedTerms.includes(term)) {
      return renderLoanError("Select a valid preferred loan term.");
    }

    if (!purpose) {
      return renderLoanError("Enter the purpose of the loan.");
    }

    /*
     * Prevent repeated clicks from creating
     * several identical pending requests.
     */

    const recentDuplicate = await Loan.findOne({
      customer: customerId,

      type,

      requestedAmount,

      term,

      purpose,

      status: {
        $in: ["Pending", "Under Review"],
      },

      createdAt: {
        $gte: new Date(Date.now() - 60 * 1000),
      },
    });

    if (recentDuplicate) {
      return renderLoanError("This loan request was already submitted.", 409);
    }

    const reference = await Loan.generateReference();

    await Loan.create({
      customer: customerId,

      reference,

      type,

      requestedAmount,

      currency,

      term,

      purpose,

      status: "Pending",

      approvedAmount: null,

      outstandingAmount: null,

      monthlyPayment: null,

      interestRate: null,

      fundsCredited: false,
    });

    return res.redirect(
      `/dashboard/loans/request?submitted=1&reference=${encodeURIComponent(
        reference,
      )}`,
    );
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   CUSTOMER LOAN HISTORY
========================================================= */

exports.loanHistory = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, loans] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Loan.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/loan-history", {
      ...createViewData("Loan History - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      loans,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/loans",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER LOAN DETAILS
========================================================= */

exports.loanDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, loan] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Loan.findOne({
          _id: req.params.id,

          customer: customerId,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    if (!loan) {
      return res.status(404).send("Loan record not found.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/loan-details", {
      ...createViewData("Loan Details - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      loan,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/loans",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   INVESTMENTS
========================================================= */
/* =========================================================
   CUSTOMER INVESTMENTS
========================================================= */

exports.investments = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, investments] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Investment.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/investments", {
      ...createViewData("Save & Invest - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      investments,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/investments",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER INVESTMENT REQUEST PAGE
========================================================= */

exports.investmentRequest = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/investment-request", {
      ...createViewData("Start an Investment - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/investments",

      submitted: req.query.submitted === "1",

      investmentReference: req.query.reference || "",

      error: null,

      formData: {},
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   SUBMIT CUSTOMER INVESTMENT REQUEST
========================================================= */

exports.submitInvestmentRequest = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    const renderInvestmentError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/investment-request", {
        ...createViewData("Start an Investment - First Credit Merchant"),

        customer,

        account,

        dashboardValues,

        notifications: [],

        kyc: null,

        activePath: "/dashboard/investments",

        submitted: false,

        investmentReference: "",

        error: message,

        formData: req.body || {},
      });
    };

    const type = String(req.body.type || "").trim();

    const principal = Number(req.body.principal);

    const duration = String(req.body.duration || "").trim();

    const description = String(req.body.description || "").trim();

    const currency = String(account.currency || "")
      .trim()
      .toUpperCase();

    const allowedTypes = [
      "Fixed Investment",
      "Savings Investment",
      "Growth Fund",
      "Business Investment",
      "Retirement Investment",
      "Custom Investment",
    ];

    const allowedDurations = [
      "3 Months",
      "6 Months",
      "12 Months",
      "24 Months",
      "36 Months",
      "60 Months",
    ];

    if (!allowedTypes.includes(type)) {
      return renderInvestmentError("Select a valid investment type.");
    }

    if (!Number.isFinite(principal) || principal <= 0) {
      return renderInvestmentError(
        "Enter a valid investment amount greater than zero.",
      );
    }

    if (!allowedDurations.includes(duration)) {
      return renderInvestmentError("Select a valid investment duration.");
    }

    if (!description) {
      return renderInvestmentError("Enter your investment goal.");
    }

    /*
     * Do not debit the balance yet.
     *
     * The request must first be approved
     * and activated by an administrator.
     */

    const recentDuplicate = await Investment.findOne({
      customer: customerId,

      type,

      principal,

      duration,

      description,

      status: {
        $in: ["Pending", "Under Review"],
      },

      createdAt: {
        $gte: new Date(Date.now() - 60 * 1000),
      },
    });

    if (recentDuplicate) {
      return renderInvestmentError(
        "This investment request was already submitted.",
        409,
      );
    }

    const reference = await Investment.generateReference();

    await Investment.create({
      customer: customerId,

      reference,

      name: type,

      type,

      principal,

      currentValue: principal,

      returnAmount: null,

      returnPercentage: null,

      currency,

      duration,

      description,

      status: "Pending",

      startDate: null,

      maturityDate: null,

      principalDebited: false,

      payoutCredited: false,

      fundingTransaction: null,

      payoutTransaction: null,
    });

    return res.redirect(
      `/dashboard/investments/request?submitted=1&reference=${encodeURIComponent(
        reference,
      )}`,
    );
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER INVESTMENT HISTORY
========================================================= */

exports.investmentHistory = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, investments] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Investment.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/investment-history", {
      ...createViewData("Investment History - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      investments,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/investments",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER INVESTMENT DETAILS
========================================================= */

exports.investmentDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, investment] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Investment.findOne({
          _id: req.params.id,

          customer: customerId,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/investment-details", {
      ...createViewData("Investment Details - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      investment,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/investments",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   KYC VERIFICATION
========================================================= */

/* =========================================================
   CUSTOMER KYC STATUS
========================================================= */

exports.kyc = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, kyc] = await Promise.all(
      [
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        KYC.findOne({
          customer: customerId,
        }),
      ],
    );

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/kyc", {
      ...createViewData("Identity Verification - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      kyc,

      notifications: [],

      activePath: "/dashboard/kyc",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER KYC SUBMISSION PAGE
========================================================= */

exports.kycSubmit = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, kyc] = await Promise.all(
      [
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        KYC.findOne({
          customer: customerId,
        }),
      ],
    );

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    if (
      kyc &&
      (kyc.status === "Pending" ||
        kyc.status === "Under Review" ||
        kyc.status === "Verified")
    ) {
      return res.redirect("/dashboard/kyc");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/kyc-submit", {
      ...createViewData("Submit Verification - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      kyc,

      notifications: [],

      activePath: "/dashboard/kyc",

      submitted: req.query.submitted === "1",

      error: null,

      formData: kyc || {},
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   CUSTOMER KYC DOCUMENTS
========================================================= */

exports.kycDocuments = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, kyc] = await Promise.all(
      [
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        KYC.findOne({
          customer: customerId,
        }),
      ],
    );

    if (!customerDocument) {
      return res.redirect("/login");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/kyc-documents", {
      ...createViewData("Verification Documents - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      kyc,

      notifications: [],

      activePath: "/dashboard/kyc",
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   SUBMIT OR RESUBMIT CUSTOMER KYC
========================================================= */

exports.submitKyc = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const existingKyc = await KYC.findOne({
      customer: customerId,
    });

    if (
      existingKyc &&
      (existingKyc.status === "Pending" ||
        existingKyc.status === "Under Review" ||
        existingKyc.status === "Verified")
    ) {
      return res.redirect("/dashboard/kyc");
    }

    const legalName = cleanKycText(req.body.legalName);

    const dateOfBirth = parseOptionalKycDate(req.body.dateOfBirth);

    const nationality = cleanKycText(req.body.nationality);

    const country = cleanKycText(req.body.country);

    const address = cleanKycText(req.body.address);

    const city = cleanKycText(req.body.city);

    const region = cleanKycText(req.body.region);

    const postalCode = cleanKycText(req.body.postalCode);

    const documentType = cleanKycText(req.body.documentType);

    const documentNumber = cleanKycText(req.body.documentNumber);

    const issueDate = parseOptionalKycDate(req.body.issueDate);

    const expiryDate = parseOptionalKycDate(req.body.expiryDate);

    const allowedDocumentTypes = [
      "national-id",
      "passport",
      "drivers-license",
      "residence-permit",
      "other",
    ];

    if (!legalName) {
      return res.status(422).send("Enter your legal name.");
    }

    if (!dateOfBirth) {
      return res.status(422).send("Enter a valid date of birth.");
    }

    if (
      !nationality ||
      !country ||
      !address ||
      !city ||
      !region ||
      !postalCode
    ) {
      return res
        .status(422)
        .send("Complete all required personal and address information.");
    }

    if (!allowedDocumentTypes.includes(documentType)) {
      return res.status(422).send("Select a valid identity document type.");
    }

    if (!documentNumber) {
      return res.status(422).send("Enter the identity document number.");
    }

    const frontFile = getUploadedKycFile(req, "documentFront");

    const backFile = getUploadedKycFile(req, "documentBack");

    const additionalFile = getUploadedKycFile(req, "supportingDocument");

    const oldDocuments =
      existingKyc && Array.isArray(existingKyc.documents)
        ? existingKyc.documents
        : [];

    const oldFront = oldDocuments.find(
      (document) => document.field === "front",
    );

    const oldBack = oldDocuments.find((document) => document.field === "back");

    const oldAdditional = oldDocuments.find(
      (document) => document.field === "additional",
    );

    /*
     * Front document is always required.
     * On resubmission, an existing front
     * document may be retained.
     */

    if (!frontFile && !oldFront) {
      return res.status(422).send("Upload the front of the identity document.");
    }

    /*
     * Passports commonly have only one
     * identity page. Other document types
     * require a back document.
     */

    if (documentType !== "passport" && !backFile && !oldBack) {
      return res.status(422).send("Upload the back of the identity document.");
    }

    const documents = [];

    if (frontFile) {
      if (oldFront) {
        removeStoredKycDocument(oldFront);
      }

      documents.push(buildKycDocument(frontFile, "front", "Document Front"));
    } else if (oldFront) {
      documents.push(oldFront.toObject ? oldFront.toObject() : oldFront);
    }

    if (backFile) {
      if (oldBack) {
        removeStoredKycDocument(oldBack);
      }

      documents.push(buildKycDocument(backFile, "back", "Document Back"));
    } else if (oldBack) {
      documents.push(oldBack.toObject ? oldBack.toObject() : oldBack);
    }

    if (additionalFile) {
      if (oldAdditional) {
        removeStoredKycDocument(oldAdditional);
      }

      documents.push(
        buildKycDocument(additionalFile, "additional", "Supporting Document"),
      );
    } else if (oldAdditional) {
      documents.push(
        oldAdditional.toObject ? oldAdditional.toObject() : oldAdditional,
      );
    }

    const now = new Date();

    const kyc = await KYC.findOneAndUpdate(
      {
        customer: customerId,
      },
      {
        $set: {
          legalName,

          dateOfBirth,

          nationality,

          country,

          address,

          city,

          region,

          postalCode,

          documentType,

          documentNumber,

          issueDate,

          expiryDate,

          documents,

          status: "Pending",

          submittedAt: now,

          lastResubmittedAt: existingKyc ? now : null,

          reviewedBy: null,

          reviewedAt: null,

          reviewMessage: "",

          verifiedAt: null,

          rejectedAt: null,

          needsUpdateAt: null,
        },
      },
      {
        new: true,

        upsert: true,

        runValidators: true,

        setDefaultsOnInsert: true,
      },
    );

    return res.redirect(
      `/dashboard/kyc?submitted=1&id=${encodeURIComponent(kyc._id)}`,
    );
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SERVE CUSTOMER KYC DOCUMENT
========================================================= */

exports.openKycDocument = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.status(401).send("Authentication required.");
    }

    const field = cleanKycText(req.params.field);

    if (!["front", "back", "additional"].includes(field)) {
      return res.status(404).send("Document not found.");
    }

    const kyc = await KYC.findOne({
      customer: customerId,
    });

    if (!kyc) {
      return res.status(404).send("KYC submission not found.");
    }

    const document = kyc.documents.find((item) => item.field === field);

    if (!document || !document.storedName) {
      return res.status(404).send("Document not found.");
    }

    /*
     * Rebuild from the private upload
     * directory instead of trusting a
     * path received from the browser.
     */

    const filePath = path.join(
      kycUploadDirectory,
      path.basename(document.storedName),
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Stored document is unavailable.");
    }

    res.type(document.mimetype || "application/octet-stream");

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   NOTIFICATIONS
========================================================= */

/* =========================================================
   CUSTOMER NOTIFICATIONS
========================================================= */

exports.notifications = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, notifications] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        Notification.find({
          customer: customerId,
        }).sort({
          createdAt: -1,
        }),
      ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/notification", {
      ...createViewData("Notifications - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      notifications,

      kyc: null,

      activePath: "/dashboard/notifications",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER NOTIFICATION DETAILS
========================================================= */

exports.notificationDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const notification = await Notification.findOne({
      _id: req.params.id,

      customer: customerId,
    });

    if (!notification) {
      return res.status(404).send("Notification not found.");
    }

    /*
     * Opening the notification marks it
     * as read once.
     */

    if (notification.read !== true) {
      notification.read = true;

      notification.readAt = new Date();

      await notification.save();
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/notification-details", {
      ...createViewData("Notification - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      notification,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/notifications",
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   MARK NOTIFICATION READ
========================================================= */

exports.markNotificationRead = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const notification = await Notification.findOne({
      _id: req.params.id,

      customer: customerId,
    });

    if (!notification) {
      return res.status(404).send("Notification not found.");
    }

    if (notification.read !== true) {
      notification.read = true;

      notification.readAt = new Date();

      await notification.save();
    }

    return res.redirect("/dashboard/notifications");
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   MARK ALL CUSTOMER NOTIFICATIONS READ
========================================================= */

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const now = new Date();

    await Notification.updateMany(
      {
        customer: customerId,

        read: false,
      },
      {
        $set: {
          read: true,

          readAt: now,
        },
      },
    );

    return res.redirect("/dashboard/notifications");
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   GET UNREAD NOTIFICATION COUNT
========================================================= */

exports.notificationUnreadCount = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.json({
        count: 0,
      });
    }

    const count = await Notification.countDocuments({
      customer: customerId,

      read: false,
    });

    return res.json({
      count,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER SUPPORT TICKETS
========================================================= */

exports.support = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, supportTickets] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        SupportTicket.find({
          customer: customerId,
        }).sort({
          lastMessageAt: -1,
          createdAt: -1,
        }),
      ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/support", {
      ...createViewData("Support Tickets - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      supportTickets,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/support",

      created: req.query.created === "1",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER CREATE SUPPORT TICKET PAGE
========================================================= */

exports.createSupportTicket = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/support-create", {
      ...createViewData("Create Support Ticket - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/support",

      error: null,

      formData: {},
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER SUBMIT SUPPORT TICKET
========================================================= */

exports.submitSupportTicket = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findById(customerId),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument || !account) {
      return res
        .status(400)
        .send("Customer account information is unavailable.");
    }

    const customer = buildCustomerView(customerDocument, account);

    const renderSupportError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/support-create", {
        ...createViewData("Create Support Ticket - First Credit Merchant"),

        customer,

        account,

        dashboardValues,

        notifications: [],

        kyc: null,

        activePath: "/dashboard/support",

        error: message,

        formData: req.body || {},
      });
    };

    const subject = String(req.body.subject || "").trim();

    const category = String(req.body.category || "").trim();

    const priority = String(req.body.priority || "").trim() || "Normal";

    const message = String(req.body.message || "").trim();

    const allowedCategories = [
      "Account",
      "Transaction",
      "Transfer",
      "Deposit",
      "Card",
      "Loan",
      "Investment",
      "Verification",
      "Other",
    ];

    const allowedPriorities = ["Low", "Normal", "High", "Urgent"];

    if (!subject) {
      return renderSupportError("Enter a ticket subject.");
    }

    if (subject.length > 200) {
      return renderSupportError(
        "The ticket subject must not exceed 200 characters.",
      );
    }

    if (!allowedCategories.includes(category)) {
      return renderSupportError("Select a valid support category.");
    }

    if (!allowedPriorities.includes(priority)) {
      return renderSupportError("Select a valid ticket priority.");
    }

    if (!message) {
      return renderSupportError("Describe the issue requiring assistance.");
    }

    if (message.length > 5000) {
      return renderSupportError(
        "The support message must not exceed 5,000 characters.",
      );
    }

    /*
     * Prevent repeated button clicks from
     * creating identical tickets.
     */

    const recentDuplicate = await SupportTicket.findOne({
      customer: customerId,

      subject,

      category,

      status: {
        $in: ["Open", "In Progress"],
      },

      createdAt: {
        $gte: new Date(Date.now() - 60 * 1000),
      },
    });

    if (recentDuplicate) {
      return res.redirect(`/dashboard/support/${recentDuplicate._id}`);
    }

    const reference = await SupportTicket.generateReference();

    const fullName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const now = new Date();

    const ticket = await SupportTicket.create({
      customer: customerId,

      reference,

      subject,

      category,

      priority,

      status: "Open",

      messages: [
        {
          senderType: "Customer",

          sender: customerId,

          authorLabel: fullName || "Customer",

          body: message,

          createdAt: now,
        },
      ],

      lastMessageAt: now,

      lastMessageBy: "Customer",

      customerLastReadAt: now,

      adminLastReadAt: null,
    });

    return res.redirect(`/dashboard/support/${ticket._id}?created=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER SUPPORT TICKET DETAILS
========================================================= */

exports.supportDetails = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [customerDocument, account, dashboardValues, ticket] =
      await Promise.all([
        User.findById(customerId),

        Account.findOne({
          customer: customerId,
        }),

        DashboardValue.findOne({
          customer: customerId,
        }),

        SupportTicket.findOne({
          _id: req.params.id,

          customer: customerId,
        }),
      ]);

    if (!customerDocument) {
      return res.redirect("/login");
    }

    if (!ticket) {
      return res.status(404).send("Support ticket not found.");
    }

    ticket.customerLastReadAt = new Date();

    await ticket.save();

    const customer = buildCustomerView(customerDocument, account);

    return res.render("dashboard/support-details", {
      ...createViewData("Support Ticket - First Credit Merchant"),

      customer,

      account,

      dashboardValues,

      ticket,

      notifications: [],

      kyc: null,

      activePath: "/dashboard/support",

      created: req.query.created === "1",

      replied: req.query.replied === "1",

      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER REPLY TO SUPPORT TICKET
========================================================= */

exports.replySupportTicket = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,

      customer: customerId,
    });

    if (!ticket) {
      return res.status(404).send("Support ticket not found.");
    }

    if (ticket.status === "Closed") {
      return res
        .status(400)
        .send("A closed support ticket cannot receive new replies.");
    }

    const body = String(req.body.body || "").trim();

    if (!body) {
      return res.status(422).send("Enter a reply message.");
    }

    if (body.length > 5000) {
      return res
        .status(422)
        .send("The support reply must not exceed 5,000 characters.");
    }

    const customer = await User.findById(customerId);

    const fullName = customer
      ? [customer.firstName, customer.middleName, customer.lastName]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "Customer";

    await ticket.addMessage({
      senderType: "Customer",

      sender: customerId,

      authorLabel: fullName || "Customer",

      body,
    });

    ticket.customerLastReadAt = new Date();

    await ticket.save();

    return res.redirect(`/dashboard/support/${ticket._id}?replied=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMER PROFILE
========================================================= */

exports.profile = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const data = await loadCustomerProfileData(customerId);

    if (!data) {
      return res.redirect("/login");
    }

    return res.render("dashboard/profile", {
      ...createViewData("My Profile - First Credit Merchant"),

      customer: data.customer,

      account: data.account,

      dashboardValues: data.dashboardValues,

      kyc: data.kyc,

      notifications: [],

      activePath: "/dashboard/profile",

      updated: req.query.updated === "1",
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   EDIT CUSTOMER PROFILE PAGE
========================================================= */

exports.editProfile = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const data = await loadCustomerProfileData(customerId);

    if (!data) {
      return res.redirect("/login");
    }

    return res.render("dashboard/profile-edit", {
      ...createViewData("Edit Profile - First Credit Merchant"),

      customer: data.customer,

      account: data.account,

      dashboardValues: data.dashboardValues,

      kyc: data.kyc,

      notifications: [],

      activePath: "/dashboard/profile",

      error: null,

      formData: data.customer,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE CUSTOMER PROFILE
========================================================= */

exports.updateProfile = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const data = await loadCustomerProfileData(customerId);

    if (!data) {
      return res.redirect("/login");
    }

    const renderProfileError = (message, statusCode = 422) => {
      return res.status(statusCode).render("dashboard/profile-edit", {
        ...createViewData("Edit Profile - First Credit Merchant"),

        customer: {
          ...data.customer,
          ...req.body,
        },

        account: data.account,

        dashboardValues: data.dashboardValues,

        kyc: data.kyc,

        notifications: [],

        activePath: "/dashboard/profile",

        error: message,

        formData: req.body || {},
      });
    };

    const firstName = cleanProfileText(req.body.firstName);

    const middleName = cleanProfileText(req.body.middleName);

    const lastName = cleanProfileText(req.body.lastName);

    const username = cleanLowercaseProfileText(req.body.username);

    const email = cleanLowercaseProfileText(req.body.email);

    const phone = cleanProfileText(req.body.phone);

    const country = cleanProfileText(req.body.country);

    const address = cleanProfileText(req.body.address);

    const city = cleanProfileText(req.body.city);

    const region = cleanProfileText(req.body.region);

    const postalCode = cleanProfileText(req.body.postalCode);

    if (!firstName || !lastName) {
      return renderProfileError("First name and last name are required.");
    }

    if (!username) {
      return renderProfileError("Username is required.");
    }

    if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      return renderProfileError(
        "Username must be 3 to 40 characters and may contain letters, numbers, periods, underscores, and hyphens.",
      );
    }

    if (!email) {
      return renderProfileError("Email address is required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return renderProfileError("Enter a valid email address.");
    }

    const duplicateUser = await User.findOne({
      _id: {
        $ne: customerId,
      },

      $or: [
        {
          username,
        },

        {
          email,
        },
      ],
    });

    if (duplicateUser) {
      if (duplicateUser.username === username) {
        return renderProfileError("That username is already in use.", 409);
      }

      return renderProfileError("That email address is already in use.", 409);
    }

    const customer = data.customerDocument;

    customer.firstName = firstName;

    customer.middleName = middleName;

    customer.lastName = lastName;

    customer.username = username;

    customer.email = email;

    customer.phone = phone;

    customer.country = country;

    customer.address = address;

    customer.city = city;

    customer.region = region;

    customer.postalCode = postalCode;

    await customer.save();

    return res.redirect("/dashboard/profile?updated=1");
  } catch (error) {
    if (error && error.code === 11000) {
      return res
        .status(409)
        .send("The username or email address is already in use.");
    }

    next(error);
  }
};
/* =========================================================
   CUSTOMER SETTINGS
========================================================= */

exports.settings = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const [data, settings, pinAccount] = await Promise.all([
      loadCustomerProfileData(customerId),

      loadCustomerSettings(customerId),

      Account.findOne({
        customer: customerId,
      }).select("+transactionPinHash"),
    ]);

    if (!data) {
      return res.redirect("/login");
    }

    return res.render("dashboard/settings", {
      ...createViewData("Settings - First Credit Merchant"),

      customer: data.customer,

      account: data.account,

      dashboardValues: data.dashboardValues,

      kyc: data.kyc,

      settings,

      notifications: [],

      activePath: "/dashboard/settings",

      pinConfigured: Boolean(pinAccount && pinAccount.transactionPinHash),

      activeSection: req.query.section || "preferences",

      preferencesUpdated: req.query.preferencesUpdated === "1",

      notificationsUpdated: req.query.notificationsUpdated === "1",

      passwordUpdated: req.query.passwordUpdated === "1",

      pinUpdated: req.query.pinUpdated === "1",

      error: req.query.error || null,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE CUSTOMER PREFERENCES
========================================================= */

exports.updatePreferences = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const language = cleanProfileText(req.body.language);

    const displayCurrency = cleanProfileText(
      req.body.displayCurrency,
    ).toUpperCase();

    const timezone = cleanProfileText(req.body.timezone);

    const allowedLanguages = ["en"];

    const allowedCurrencies = ["", "USD", "GBP", "EUR"];

    if (!allowedLanguages.includes(language)) {
      return res.redirect(
        "/dashboard/settings?section=preferences&error=Select%20a%20valid%20language.",
      );
    }

    if (!allowedCurrencies.includes(displayCurrency)) {
      return res.redirect(
        "/dashboard/settings?section=preferences&error=Select%20a%20valid%20display%20currency.",
      );
    }

    if (timezone.length > 100) {
      return res.redirect(
        "/dashboard/settings?section=preferences&error=Enter%20a%20valid%20timezone.",
      );
    }

    await CustomerSettings.findOneAndUpdate(
      {
        customer: customerId,
      },
      {
        $set: {
          language,

          displayCurrency,

          timezone,

          compactMode: checkboxValue(req.body.compactMode),
        },
      },
      {
        new: true,

        upsert: true,

        runValidators: true,

        setDefaultsOnInsert: true,
      },
    );

    return res.redirect(
      "/dashboard/settings?section=preferences&preferencesUpdated=1",
    );
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   UPDATE NOTIFICATION PREFERENCES
========================================================= */

exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    await CustomerSettings.findOneAndUpdate(
      {
        customer: customerId,
      },
      {
        $set: {
          emailNotifications: checkboxValue(req.body.emailNotifications),

          accountNotifications: checkboxValue(req.body.accountNotifications),

          transactionNotifications: checkboxValue(
            req.body.transactionNotifications,
          ),

          securityNotifications: checkboxValue(req.body.securityNotifications),

          announcementNotifications: checkboxValue(
            req.body.announcementNotifications,
          ),
        },
      },
      {
        new: true,

        upsert: true,

        runValidators: true,

        setDefaultsOnInsert: true,
      },
    );

    return res.redirect(
      "/dashboard/settings?section=notifications&notificationsUpdated=1",
    );
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   CHANGE CUSTOMER PASSWORD
========================================================= */

exports.changePassword = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const currentPassword = String(req.body.currentPassword || "");

    const newPassword = String(req.body.newPassword || "");

    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.redirect(
        "/dashboard/settings?section=security&error=Complete%20all%20password%20fields.",
      );
    }

    if (newPassword !== confirmPassword) {
      return res.redirect(
        "/dashboard/settings?section=security&error=The%20new%20passwords%20do%20not%20match.",
      );
    }

    if (!validPassword(newPassword)) {
      return res.redirect(
        "/dashboard/settings?section=security&error=The%20new%20password%20must%20be%20at%20least%208%20characters%20and%20include%20uppercase%2C%20lowercase%2C%20and%20a%20number.",
      );
    }

    const customer = await User.findById(customerId).select("+password");

    if (!customer) {
      return res.redirect("/login");
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      customer.password,
    );

    if (!currentPasswordMatches) {
      return res.redirect(
        "/dashboard/settings?section=security&error=The%20current%20password%20is%20incorrect.",
      );
    }

    const samePassword = await bcrypt.compare(newPassword, customer.password);

    if (samePassword) {
      return res.redirect(
        "/dashboard/settings?section=security&error=Choose%20a%20new%20password%20that%20is%20different%20from%20the%20current%20password.",
      );
    }

    customer.password = await bcrypt.hash(newPassword, 12);

    await customer.save();

    return res.redirect(
      "/dashboard/settings?section=security&passwordUpdated=1",
    );
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   SET OR CHANGE TRANSACTION PIN
========================================================= */

exports.changeTransactionPin = async (req, res, next) => {
  try {
    const customerId = req.session && req.session.userId;

    if (!customerId) {
      return res.redirect("/login");
    }

    const currentPin = String(req.body.currentPin || "").trim();

    const newPin = String(req.body.newPin || "").trim();

    const confirmPin = String(req.body.confirmPin || "").trim();

    if (!validTransactionPin(newPin)) {
      return res.redirect(
        "/dashboard/settings?section=security&error=The%20transaction%20PIN%20must%20contain%204%20to%206%20digits.",
      );
    }

    if (newPin !== confirmPin) {
      return res.redirect(
        "/dashboard/settings?section=security&error=The%20new%20transaction%20PINs%20do%20not%20match.",
      );
    }

    const account = await Account.findOne({
      customer: customerId,
    }).select("+transactionPinHash");

    if (!account) {
      return res.redirect(
        "/dashboard/settings?section=security&error=Customer%20account%20information%20is%20unavailable.",
      );
    }

    const pinConfigured = Boolean(account.transactionPinHash);

    if (pinConfigured) {
      if (!currentPin) {
        return res.redirect(
          "/dashboard/settings?section=security&error=Enter%20the%20current%20transaction%20PIN.",
        );
      }

      const currentPinMatches = await bcrypt.compare(
        currentPin,
        account.transactionPinHash,
      );

      if (!currentPinMatches) {
        return res.redirect(
          "/dashboard/settings?section=security&error=The%20current%20transaction%20PIN%20is%20incorrect.",
        );
      }

      const samePin = await bcrypt.compare(newPin, account.transactionPinHash);

      if (samePin) {
        return res.redirect(
          "/dashboard/settings?section=security&error=Choose%20a%20transaction%20PIN%20that%20is%20different%20from%20the%20current%20PIN.",
        );
      }
    }

    account.transactionPinHash = await bcrypt.hash(newPin, 12);

    await account.save();

    return res.redirect("/dashboard/settings?section=security&pinUpdated=1");
  } catch (error) {
    next(error);
  }
};
