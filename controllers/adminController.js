const User = require("../models/User");

const mongoose = require("mongoose");

const Account = require("../models/account");

const DashboardValue = require("../models/dashboardValue");

const CustomerSettings = require("../models/customerSettings");

const Deposit = require("../models/deposit");
const Card = require("../models/Cards");
const Loan = require("../models/loan");
const Investment = require("../models/investment");
const Notification = require("../models/notification");
const createNotification = require("../utils/createNotification");

const DepositSettings = require("../models/depositSettings");
const Transfer = require("../models/transfer");
const Transaction = require("../models/Transaction");
const { randomBytes } = require("node:crypto");
const SupportTicket = require("../models/SupportTicket");

const fs = require("fs");

const path = require("path");

const KYC = require("../models/kyc");
const IrsRefund = require("../models/irsRefund");

const { kycUploadDirectory } = require("../middleware/kycUpload");
/* =========================================================
   ADMIN TRANSFER HELPERS
========================================================= */

async function loadAdminTransferCustomers() {
  const users = await User.find({
    role: "customer",
    status: "Active",
  })
    .sort({
      firstName: 1,
      lastName: 1,
    })
    .lean();

  const customerIds = users.map((user) => user._id);

  const accounts = await Account.find({
    customer: {
      $in: customerIds,
    },
  }).lean();

  const accountMap = new Map(
    accounts.map((account) => [String(account.customer), account]),
  );

  return users.map((user) => {
    const account = accountMap.get(String(user._id)) || null;

    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...user,
      id: String(user._id),
      fullName,
      customerId: user.customerId || (account ? account.accountNumber : ""),
      account,
    };
  });
}
/* =========================================================
   ADMIN NOTIFICATION HELPERS
========================================================= */

function cleanNotificationText(value) {
  return String(value || "").trim();
}

async function loadNotificationCustomers() {
  const users = await User.find({
    role: "customer",
    status: "Active",
  })
    .sort({
      firstName: 1,
      lastName: 1,
    })
    .lean();

  const customerIds = users.map((user) => user._id);

  const accounts = await Account.find({
    customer: {
      $in: customerIds,
    },
  }).lean();

  const accountMap = new Map(
    accounts.map((account) => [String(account.customer), account]),
  );

  return users.map((user) => {
    const account = accountMap.get(String(user._id)) || null;

    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...user,

      id: String(user._id),

      fullName,

      customerId: user.customerId || (account ? account.accountNumber : ""),

      account,
    };
  });
}
/* =========================================================
   ADMIN KYC HELPERS
========================================================= */

function cleanAdminKycText(value) {
  return String(value || "").trim();
}

/* =========================================================
   INVESTMENT HELPERS
========================================================= */

function cleanInvestmentText(value) {
  return String(value || "").trim();
}

function parseOptionalInvestmentNumber(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInvestmentDate(value) {
  const text = cleanInvestmentText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

async function loadAdminInvestmentCustomers() {
  const users = await User.find({
    role: "customer",
    status: "Active",
  })
    .sort({
      firstName: 1,
      lastName: 1,
    })
    .lean();

  const customerIds = users.map((user) => user._id);

  const accounts = await Account.find({
    customer: {
      $in: customerIds,
    },
  }).lean();

  const accountMap = new Map(
    accounts.map((account) => [String(account.customer), account]),
  );

  return users.map((user) => {
    const account = accountMap.get(String(user._id)) || null;

    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...user,

      id: String(user._id),

      fullName,

      customerId: user.customerId || (account ? account.accountNumber : ""),

      account,
    };
  });
}
/* =========================================================
   CARD HELPERS
========================================================= */

function cleanCardText(value) {
  return String(value || "").trim();
}

async function loadAdminCardCustomers() {
  const users = await User.find({
    role: "customer",

    status: "Active",
  })
    .sort({
      firstName: 1,
      lastName: 1,
    })
    .lean();

  const customerIds = users.map((user) => user._id);

  const accounts = await Account.find({
    customer: {
      $in: customerIds,
    },
  }).lean();

  const accountMap = new Map(
    accounts.map((account) => [String(account.customer), account]),
  );

  return users.map((user) => {
    const account = accountMap.get(String(user._id)) || null;

    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...user,

      id: String(user._id),

      fullName,

      customerId: user.customerId || (account ? account.accountNumber : ""),

      account,
    };
  });
}

/* =========================================================
   LOAN HELPERS
========================================================= */

function cleanLoanText(value) {
  return String(value || "").trim();
}

function parseOptionalLoanNumber(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalLoanDate(value) {
  const text = cleanLoanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

async function loadAdminLoanCustomers() {
  const users = await User.find({
    role: "customer",

    status: "Active",
  })
    .sort({
      firstName: 1,
      lastName: 1,
    })
    .lean();

  const customerIds = users.map((user) => user._id);

  const accounts = await Account.find({
    customer: {
      $in: customerIds,
    },
  }).lean();

  const accountMap = new Map(
    accounts.map((account) => [String(account.customer), account]),
  );

  return users.map((user) => {
    const account = accountMap.get(String(user._id)) || null;

    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...user,

      id: String(user._id),

      fullName,

      customerId: user.customerId || (account ? account.accountNumber : ""),

      account,
    };
  });
}

/* =========================================================
   GENERATE UNIQUE TRANSACTION REFERENCE
========================================================= */

async function generateTransactionReference() {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const randomPart = randomBytes(5).toString("hex").toUpperCase();

    const reference = `TXN-${randomPart}`;

    const exists = await Transaction.exists({
      reference,
    });

    if (!exists) {
      return reference;
    }
  }

  throw new Error("Unable to generate a unique transaction reference.");
}
/* =========================================================
   DEPOSIT SETTINGS HELPERS
========================================================= */

function checkboxEnabled(value) {
  return value === "on" || value === "true" || value === "1" || value === true;
}

function cleanText(value) {
  return String(value || "").trim();
}

async function getDepositSettings() {
  let depositSettings = await DepositSettings.findOne({
    settingsKey: "main",
  });

  if (!depositSettings) {
    depositSettings = await DepositSettings.create({
      settingsKey: "main",
    });
  }

  return depositSettings;
}
/* =========================================================
   CREATE CUSTOMER ACCOUNT
========================================================= */

async function createCustomerAccount(user) {
  const existingAccount = await Account.findOne({
    customer: user._id,
  });

  if (existingAccount) {
    return existingAccount;
  }

  const currency = process.env.DEFAULT_ACCOUNT_CURRENCY || "USD";

  /*
   * Retry if two account numbers somehow
   * collide at the database level.
   */

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const accountNumber = await Account.generateAccountNumber();

      return await Account.create({
        customer: user._id,

        accountNumber,

        accountType: user.requestedAccountType || "Checking Account",

        transactionPinHash: user.transactionPinHash || "",

        currency,

        status: "Active",
      });
    } catch (error) {
      /*
       * MongoDB duplicate-key error.
       */

      if (error.code === 11000 && attempt < 5) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique account number.");
}
exports.login = (req, res) => {
  res.render("admin/login", {
    title: "Admin Login - First Credit Merchant",
  });
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

exports.dashboard = async (req, res, next) => {
  try {
    /*
     * Load actual customer users.
     * Admin accounts are excluded.
     */

    const users = await User.find({
      role: "customer",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const customerIds = users.map((user) => user._id);

    /*
     * Load related customer account
     * and dashboard financial values.
     */

    const [accounts, dashboardValues] = await Promise.all([
      Account.find({
        customer: {
          $in: customerIds,
        },
      }).lean(),

      DashboardValue.find({
        customer: {
          $in: customerIds,
        },
      }).lean(),
    ]);

    /*
     * Fast lookup maps.
     */

    const accountMap = new Map(
      accounts.map((account) => [String(account.customer), account]),
    );

    const valuesMap = new Map(
      dashboardValues.map((values) => [String(values.customer), values]),
    );

    /*
     * Build the exact customer structure
     * expected by admin/dashboard.ejs.
     */

    const customers = users.map((user) => {
      const account = accountMap.get(String(user._id)) || null;

      const values = valuesMap.get(String(user._id)) || null;

      const fullName = [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        ...user,

        id: String(user._id),

        fullName,

        customerId: user.customerId || (account ? account.accountNumber : ""),

        account,

        dashboardValues: values,

        displayedBalance:
          values && values.displayedBalance !== undefined
            ? values.displayedBalance
            : null,

        currency:
          values && values.currency
            ? values.currency
            : account && account.currency
              ? account.currency
              : "",

        /*
         * KYC will be connected to
         * MongoDB separately.
         */

        kyc: null,
      };
    });

    return res.render("admin/dashboard", {
      title: "Admin Dashboard - First Credit Merchant",

      customers,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CUSTOMERS
========================================================= */
/* =========================================================
   CUSTOMER MANAGEMENT
========================================================= */

/*
 * Temporary empty data structure.
 *
 * During database integration, these values will be replaced
 * with records loaded from the database.
 */

function createAdminCustomerData(additionalData = {}) {
  return {
    customers: [],

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

    ...additionalData,
  };
}

/* =========================================================
   CUSTOMER LIST
========================================================= */

exports.customers = async (req, res, next) => {
  try {
    const users = await User.find({
      role: "customer",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const customerIds = users.map((user) => user._id);

    const [accounts, dashboardValues] = await Promise.all([
      Account.find({
        customer: {
          $in: customerIds,
        },
      }).lean(),

      DashboardValue.find({
        customer: {
          $in: customerIds,
        },
      }).lean(),
    ]);

    const accountMap = new Map(
      accounts.map((account) => [String(account.customer), account]),
    );

    const valuesMap = new Map(
      dashboardValues.map((values) => [String(values.customer), values]),
    );

    const customers = users.map((user) => {
      const account = accountMap.get(String(user._id)) || null;

      const values = valuesMap.get(String(user._id)) || null;

      const fullName = [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        ...user,

        id: String(user._id),

        fullName,

        customerId: user.customerId || (account ? account.accountNumber : ""),

        account,

        dashboardValues: values,

        displayedBalance:
          values && values.displayedBalance !== undefined
            ? values.displayedBalance
            : null,

        currency:
          values && values.currency
            ? values.currency
            : account && account.currency
              ? account.currency
              : "",

        kyc: null,
      };
    });

    return res.render("admin/customers/index", {
      title: "Customers - First Credit Merchant Admin",

      ...createAdminCustomerData({
        customers,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Compatibility alias.
 * Keep this because an existing route may use
 * adminController.customerList.
 */

exports.customerList = exports.customers;

/* =========================================================
   CUSTOMER DETAILS
========================================================= */

exports.customerDetails = async (req, res, next) => {
  try {
    const customerDocument = await User.findOne({
      _id: req.params.id,
      role: "customer",
    }).lean();

    if (!customerDocument) {
      return res.status(404).render("admin/customers/details", {
        title: "Customer Details - First Credit Merchant Admin",

        ...createAdminCustomerData({
          customer: null,
          account: null,
          dashboardValues: null,
          kyc: null,
        }),

        error: "The requested customer record is not available.",
      });
    }

    const [
      account,
      dashboardValues,
      kyc,
      transactions,
      deposits,
      transfers,
      cards,
      loans,
      investments,
      notifications,
      supportTickets,
    ] = await Promise.all([
      Account.findOne({
        customer: customerDocument._id,
      }),

      DashboardValue.findOne({
        customer: customerDocument._id,
      }),

      KYC.findOne({
        customer: customerDocument._id,
      }),

      Transaction.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Deposit.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Transfer.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Card.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Loan.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Investment.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Notification.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      SupportTicket.find({
        customer: customerDocument._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20),
    ]);

    const generatedFullName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const customer = {
      ...customerDocument,

      id: String(customerDocument._id),

      fullName: customerDocument.fullName || generatedFullName,

      customerId:
        customerDocument.customerId || (account ? account.accountNumber : ""),
    };

    return res.render("admin/customers/details", {
      title: "Customer Details - First Credit Merchant Admin",

      ...createAdminCustomerData({
        customer,
        account,
        dashboardValues,
        kyc,

        transactions,
        deposits,
        transfers,
        cards,
        loans,
        investments,
        notifications,
        supportTickets,
      }),

      error: null,

      approved: req.query.approved === "1",

      updated: req.query.updated === "1",
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   EDIT CUSTOMER
========================================================= */

exports.editCustomer = (req, res) => {
  res.render("admin/customers/edit", {
    title: "Edit Customer - First Credit Merchant Admin",

    ...createAdminCustomerData({
      customer: null,
      account: null,
    }),
  });
};
/* =========================================================
   CUSTOMER FINANCIAL VALUES
========================================================= */

exports.customerFinancialValues = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findOne({
        _id: customerId,
        role: "customer",
      }),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument) {
      return res.status(404).send("Customer record not found.");
    }

    if (!account) {
      return res.status(404).send("Customer account not found.");
    }

    const fullName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const customer = {
      ...customerDocument.toObject(),

      id: String(customerDocument._id),

      fullName,

      customerId: customerDocument.customerId || account.accountNumber,
    };

    return res.render("admin/customers/financial-values", {
      title: "Customer Financial Values - First Credit Merchant Admin",

      ...createAdminCustomerData({
        customer,
        account,
        dashboardValues,
      }),

      updated: req.query.updated === "1",

      error: null,

      formData: dashboardValues ? dashboardValues.toObject() : {},
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   UPDATE CUSTOMER FINANCIAL VALUES
========================================================= */

exports.updateCustomerFinancialValues = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const [customerDocument, account, dashboardValues] = await Promise.all([
      User.findOne({
        _id: customerId,
        role: "customer",
      }),

      Account.findOne({
        customer: customerId,
      }),

      DashboardValue.findOne({
        customer: customerId,
      }),
    ]);

    if (!customerDocument) {
      return res.status(404).send("Customer record not found.");
    }

    if (!account) {
      return res.status(404).send("Customer account not found.");
    }

    const fullName = [
      customerDocument.firstName,
      customerDocument.middleName,
      customerDocument.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const customer = {
      ...customerDocument.toObject(),

      id: String(customerDocument._id),

      fullName,

      customerId: customerDocument.customerId || account.accountNumber,
    };

    const renderFinancialError = (message, statusCode = 422) => {
      return res.status(statusCode).render("admin/customers/financial-values", {
        title: "Customer Financial Values - First Credit Merchant Admin",

        ...createAdminCustomerData({
          customer,
          account,
          dashboardValues,
        }),

        updated: false,

        error: message,

        formData: req.body || {},
      });
    };

    const parseFinancialNumber = (value, fieldName) => {
      const text = String(value ?? "").trim();

      if (!text) {
        return {
          valid: false,
          message: `${fieldName} is required.`,
        };
      }

      const number = Number(text);

      if (!Number.isFinite(number)) {
        return {
          valid: false,
          message: `${fieldName} must be a valid number.`,
        };
      }

      if (number < 0) {
        return {
          valid: false,
          message: `${fieldName} cannot be negative.`,
        };
      }

      return {
        valid: true,
        value: Math.round(number * 100) / 100,
      };
    };

    const displayedBalanceResult = parseFinancialNumber(
      req.body.displayedBalance,
      "Displayed balance",
    );

    const monthlyIncomeResult = parseFinancialNumber(
      req.body.monthlyIncome,
      "Monthly income",
    );

    const monthlyOutgoingResult = parseFinancialNumber(
      req.body.monthlyOutgoing,
      "Monthly outgoing",
    );

    const transactionLimitResult = parseFinancialNumber(
      req.body.transactionLimit,
      "Transaction limit",
    );

    const pendingTransactionsResult = parseFinancialNumber(
      req.body.pendingTransactions ?? 0,
      "Pending transactions",
    );

    const transactionVolumeResult = parseFinancialNumber(
      req.body.transactionVolume ?? 0,
      "Transaction volume",
    );

    const results = [
      displayedBalanceResult,
      monthlyIncomeResult,
      monthlyOutgoingResult,
      transactionLimitResult,
      pendingTransactionsResult,
      transactionVolumeResult,
    ];

    const invalidResult = results.find((result) => result.valid !== true);

    if (invalidResult) {
      return renderFinancialError(invalidResult.message);
    }

    const currency = String(account.currency || "")
      .trim()
      .toUpperCase();

    if (!currency) {
      return renderFinancialError(
        "The customer account does not have a valid currency.",
        400,
      );
    }

    const oldDisplayedBalance = dashboardValues
      ? Number(dashboardValues.displayedBalance || 0)
      : 0;

    const newDisplayedBalance = displayedBalanceResult.value;

    const balanceDifference =
      Math.round((newDisplayedBalance - oldDisplayedBalance) * 100) / 100;

    const adminNote = String(req.body.adminNote || "").trim();
    const transactionDateText = String(req.body.transactionDate || "").trim();

    const transactionDate = transactionDateText
      ? new Date(transactionDateText)
      : new Date();

    if (Number.isNaN(transactionDate.getTime())) {
      return renderFinancialError("Enter a valid transaction date.");
    }

    /*
     * Update or create the financial-values record.
     */

    const updatedValues = await DashboardValue.findOneAndUpdate(
      {
        customer: customerDocument._id,
      },
      {
        $set: {
          currency,

          displayedBalance: newDisplayedBalance,

          monthlyIncome: monthlyIncomeResult.value,

          monthlyOutgoing: monthlyOutgoingResult.value,

          transactionLimit: transactionLimitResult.value,

          pendingTransactions: pendingTransactionsResult.value,

          transactionVolume: transactionVolumeResult.value,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    /*
     * If the available balance changed,
     * record one administrative adjustment.
     */

    if (balanceDifference !== 0) {
      const transactionReference = await generateTransactionReference();

      const direction = balanceDifference > 0 ? "Incoming" : "Outgoing";

      const absoluteAmount = Math.abs(balanceDifference);

      await Transaction.create({
        customer: customerDocument._id,

        reference: transactionReference,

        type: balanceDifference > 0 ? "Deposit" : "Debit",

        direction: balanceDifference > 0 ? "Incoming" : "Outgoing",

        amount: absoluteAmount,

        currency,

        status: "Completed",

        description: adminNote || (balanceDifference > 0 ? "Credit" : "Debit"),

        counterparty: "",

        transactionDate,
      });
    }

    return res.redirect(
      `/admin/customers/${customerDocument._id}/financial-values?updated=1`,
    );
  } catch (error) {
    if (error && error.code === 11000) {
      return res
        .status(409)
        .send(
          "The financial update could not be recorded because a duplicate transaction reference was generated. Please try again.",
        );
    }

    next(error);
  }
};
/* =========================================================
   ADMIN FINANCE DATA
========================================================= */

function createAdminFinanceData(additionalData = {}) {
  return {
    customers: [],

    customer: null,
    account: null,

    balances: [],
    deposits: [],
    transactions: [],
    transfers: [],

    deposit: null,
    transaction: null,
    transfer: null,

    ...additionalData,
  };
}

/* =========================================================
   BALANCE MANAGEMENT
========================================================= */

exports.balances = async (req, res, next) => {
  try {
    const dashboardRecords = await DashboardValue.find({})
      .populate(
        "customer",
        [
          "firstName",
          "middleName",
          "lastName",
          "username",
          "email",
          "customerId",
          "status",
        ].join(" "),
      )
      .sort({
        updatedAt: -1,
      });

    const customerIds = dashboardRecords
      .filter((record) => record && record.customer)
      .map((record) => record.customer._id);

    const accounts = await Account.find({
      customer: {
        $in: customerIds,
      },
    }).lean();

    const accountMap = new Map(
      accounts.map((account) => [String(account.customer), account]),
    );

    const balances = dashboardRecords.map((dashboardRecord) => {
      const customer = dashboardRecord.customer;

      const account = customer
        ? accountMap.get(String(customer._id)) || null
        : null;

      const fullName = customer
        ? [customer.firstName, customer.middleName, customer.lastName]
            .filter(Boolean)
            .join(" ")
            .trim()
        : "";

      return {
        ...dashboardRecord.toObject(),

        customer: customer
          ? {
              ...customer.toObject(),

              id: String(customer._id),

              fullName,

              customerId:
                customer.customerId || (account ? account.accountNumber : ""),

              accountNumber: account ? account.accountNumber : "",

              accountType: account ? account.accountType : "",

              accountStatus: account ? account.status : "",
            }
          : null,

        currency: dashboardRecord.currency || (account ? account.currency : ""),
      };
    });

    return res.render("admin/finance/balances", {
      title: "Balance Management - First Credit Merchant Admin",

      ...createAdminFinanceData({
        balances,
      }),
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   DEPOSITS
========================================================= */
/* =========================================================
   ADMIN DEPOSITS
========================================================= */

exports.deposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({})
      .populate(
        "customer",
        "firstName middleName lastName username email customerId status",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/finance/deposits", {
      title: "Deposits - First Credit Merchant Admin",

      ...createAdminFinanceData({
        deposits,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN DEPOSIT DETAILS
========================================================= */

exports.depositDetails = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate(
      "customer",
      "firstName middleName lastName username email phone country customerId status",
    );

    if (!deposit) {
      return res.status(404).send("Deposit record not found.");
    }

    const account = await Account.findOne({
      customer: deposit.customer._id,
    });

    const dashboardValues = await DashboardValue.findOne({
      customer: deposit.customer._id,
    });

    return res.render("admin/finance/deposit-details", {
      title: "Deposit Details - First Credit Merchant Admin",

      deposit,

      customer: deposit.customer,

      account,

      dashboardValues,

      approved: req.query.approved === "1",

      rejected: req.query.rejected === "1",

      error: null,
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   APPROVE DEPOSIT
========================================================= */

/* =========================================================
   APPROVE DEPOSIT
========================================================= */

exports.approveDeposit = async (req, res, next) => {
  let dbSession = null;

  try {
    dbSession = await mongoose.startSession();

    let approvedDepositId = null;

    await dbSession.withTransaction(async () => {
      /* ===============================================
         LOAD DEPOSIT INSIDE TRANSACTION
      =============================================== */

      const deposit = await Deposit.findById(req.params.id).session(dbSession);

      if (!deposit) {
        throw new Error("DEPOSIT_NOT_FOUND");
      }

      /* ===============================================
         PREVENT DOUBLE CREDIT
      =============================================== */

      if (deposit.status === "Completed" || deposit.balanceCredited === true) {
        approvedDepositId = deposit._id;

        return;
      }

      if (deposit.status === "Rejected") {
        throw new Error("DEPOSIT_REJECTED");
      }

      /* ===============================================
         CUSTOMER FINANCIAL VALUES
      =============================================== */

      const dashboardValues = await DashboardValue.findOne({
        customer: deposit.customer,
      }).session(dbSession);

      if (!dashboardValues) {
        throw new Error("DEPOSIT_FINANCIAL_VALUES_NOT_FOUND");
      }

      /* ===============================================
         CURRENCY CHECK
      =============================================== */

      const accountCurrency = String(dashboardValues.currency || "")
        .trim()
        .toUpperCase();

      const depositCurrency = String(deposit.currency || "")
        .trim()
        .toUpperCase();

      if (!accountCurrency || accountCurrency !== depositCurrency) {
        throw new Error("DEPOSIT_CURRENCY_MISMATCH");
      }

      /* ===============================================
         VALIDATE AMOUNT
      =============================================== */

      const amount = Number(deposit.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("DEPOSIT_INVALID_AMOUNT");
      }

      /* ===============================================
         CHECK EXISTING TRANSACTION
      =============================================== */

      const transactionDescription = `Deposit ${deposit.reference}`;

      let transaction = await Transaction.findOne({
        customer: deposit.customer,

        type: "Deposit",

        description: transactionDescription,
      }).session(dbSession);

      /* ===============================================
         CREDIT ONLY IF TRANSACTION
         HAS NOT ALREADY BEEN CREATED
      =============================================== */

      if (!transaction) {
        /* =============================================
           CREDIT BALANCE
        ============================================= */

        dashboardValues.displayedBalance =
          Number(dashboardValues.displayedBalance || 0) + amount;

        dashboardValues.monthlyIncome =
          Number(dashboardValues.monthlyIncome || 0) + amount;

        dashboardValues.transactionVolume =
          Number(dashboardValues.transactionVolume || 0) + amount;

        await dashboardValues.save({
          session: dbSession,
        });

        /* =============================================
           CREATE TRANSACTION
        ============================================= */

        const transactionReference = await generateTransactionReference();

        const transactionDate = new Date();

        const createdTransactions = await Transaction.create(
          [
            {
              customer: deposit.customer,

              reference: transactionReference,

              type: "Deposit",

              direction: "Incoming",

              amount,

              currency: depositCurrency,

              status: "Completed",

              description: transactionDescription,

              counterparty: deposit.method,

              /*
               * Uses the transactionDate
               * field we added to
               * Transaction.js.
               */
              transactionDate,
            },
          ],
          {
            session: dbSession,
          },
        );

        transaction = createdTransactions[0];
      }

      /* ===============================================
         COMPLETE DEPOSIT
      =============================================== */

      const now = new Date();

      deposit.status = "Completed";

      deposit.balanceCredited = true;

      deposit.creditedAt = now;

      deposit.reviewedAt = now;

      deposit.reviewedBy =
        req.session && req.session.userId ? req.session.userId : null;

      deposit.adminNote = String(req.body.adminNote || "").trim();

      await deposit.save({
        session: dbSession,
      });

      approvedDepositId = deposit._id;
    });

    if (!approvedDepositId) {
      throw new Error("DEPOSIT_APPROVAL_FAILED");
    }

    return res.redirect(`/admin/deposits/${approvedDepositId}?approved=1`);
  } catch (error) {
    if (error && error.message === "DEPOSIT_NOT_FOUND") {
      return res.status(404).send("Deposit record not found.");
    }

    if (error && error.message === "DEPOSIT_REJECTED") {
      return res.status(400).send("A rejected deposit cannot be approved.");
    }

    if (error && error.message === "DEPOSIT_FINANCIAL_VALUES_NOT_FOUND") {
      return res
        .status(400)
        .send("Customer financial values could not be found.");
    }

    if (error && error.message === "DEPOSIT_CURRENCY_MISMATCH") {
      return res
        .status(400)
        .send(
          "Deposit currency does not match the customer's account currency.",
        );
    }

    if (error && error.message === "DEPOSIT_INVALID_AMOUNT") {
      return res.status(422).send("The deposit amount is invalid.");
    }

    if (error && error.code === 11000) {
      return res
        .status(409)
        .send(
          "The deposit could not be completed because a duplicate transaction reference was detected. Please try again.",
        );
    }

    return next(error);
  } finally {
    if (dbSession) {
      await dbSession.endSession();
    }
  }
};
/* =========================================================
   REJECT DEPOSIT
========================================================= */

exports.rejectDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).send("Deposit record not found.");
    }

    if (deposit.balanceCredited === true || deposit.status === "Completed") {
      return res.status(400).send("A completed deposit cannot be rejected.");
    }

    deposit.status = "Rejected";

    deposit.reviewedAt = new Date();

    deposit.reviewedBy = req.session.userId;

    deposit.adminNote = String(req.body.adminNote || "").trim();

    await deposit.save();

    return res.redirect(`/admin/deposits/${deposit._id}?rejected=1`);
  } catch (error) {
    next(error);
  }
};

exports.createDeposit = (req, res) => {
  res.render("admin/finance/deposit-create", {
    title: "Record Deposit - First Credit Merchant Admin",

    ...createAdminFinanceData({
      selectedCustomerId: req.query.customer || null,
    }),
  });
};

/* =========================================================
   ADMIN DEPOSIT SETTINGS PAGE
========================================================= */

exports.depositSettings = async (req, res, next) => {
  try {
    const depositSettings = await getDepositSettings();

    return res.render("admin/finance/deposit-settings", {
      title: "Deposit Settings - First Credit Merchant Admin",

      depositSettings,

      saved: req.query.saved === "1",

      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SAVE ADMIN DEPOSIT SETTINGS
========================================================= */

exports.updateDepositSettings = async (req, res, next) => {
  try {
    const depositSettings = await getDepositSettings();

    /* =========================================
       READ ENABLED STATES
    ========================================== */

    const bitcoinEnabled = checkboxEnabled(req.body.bitcoinEnabled);

    const usdtEnabled = checkboxEnabled(req.body.usdtEnabled);

    const ethereumEnabled = checkboxEnabled(req.body.ethereumEnabled);

    /* =========================================
       CLEAN CRYPTO VALUES
    ========================================== */

    const bitcoinWalletAddress = cleanText(req.body.bitcoinWalletAddress);

    const bitcoinNetwork = cleanText(req.body.bitcoinNetwork) || "Bitcoin";

    const usdtWalletAddress = cleanText(req.body.usdtWalletAddress);

    const usdtNetwork = cleanText(req.body.usdtNetwork);

    const ethereumWalletAddress = cleanText(req.body.ethereumWalletAddress);

    const ethereumNetwork = cleanText(req.body.ethereumNetwork) || "Ethereum";

    /* =========================================
       VALIDATE ENABLED CRYPTO METHODS
    ========================================== */

    if (bitcoinEnabled && !bitcoinWalletAddress) {
      return res.status(422).render("admin/finance/deposit-settings", {
        title: "Deposit Settings - First Credit Merchant Admin",

        depositSettings,

        saved: false,

        error:
          "Enter a Bitcoin wallet address before enabling Bitcoin deposits.",
      });
    }

    if (usdtEnabled && (!usdtWalletAddress || !usdtNetwork)) {
      return res.status(422).render("admin/finance/deposit-settings", {
        title: "Deposit Settings - First Credit Merchant Admin",

        depositSettings,

        saved: false,

        error:
          "Enter both a USDT wallet address and network before enabling USDT deposits.",
      });
    }

    if (ethereumEnabled && !ethereumWalletAddress) {
      return res.status(422).render("admin/finance/deposit-settings", {
        title: "Deposit Settings - First Credit Merchant Admin",

        depositSettings,

        saved: false,

        error:
          "Enter an Ethereum wallet address before enabling Ethereum deposits.",
      });
    }

    /* =========================================
       SAVE CRYPTOCURRENCY SETTINGS
    ========================================== */

    depositSettings.bitcoin = {
      enabled: bitcoinEnabled,

      walletAddress: bitcoinWalletAddress,

      network: bitcoinNetwork,

      instructions: cleanText(req.body.bitcoinInstructions),
    };

    depositSettings.usdt = {
      enabled: usdtEnabled,

      walletAddress: usdtWalletAddress,

      network: usdtNetwork,

      instructions: cleanText(req.body.usdtInstructions),
    };

    depositSettings.ethereum = {
      enabled: ethereumEnabled,

      walletAddress: ethereumWalletAddress,

      network: ethereumNetwork,

      instructions: cleanText(req.body.ethereumInstructions),
    };

    /* =========================================
       SAVE TRADITIONAL SETTINGS
    ========================================== */

    depositSettings.bankTransfer = {
      enabled: checkboxEnabled(req.body.bankTransferEnabled),

      instructions: cleanText(req.body.bankTransferInstructions),
    };

    depositSettings.wireTransfer = {
      enabled: checkboxEnabled(req.body.wireTransferEnabled),

      instructions: cleanText(req.body.wireTransferInstructions),
    };

    depositSettings.cashDeposit = {
      enabled: checkboxEnabled(req.body.cashDepositEnabled),

      instructions: cleanText(req.body.cashDepositInstructions),
    };

    depositSettings.check = {
      enabled: checkboxEnabled(req.body.checkEnabled),

      instructions: cleanText(req.body.checkInstructions),
    };

    depositSettings.other = {
      enabled: checkboxEnabled(req.body.otherEnabled),

      instructions: cleanText(req.body.otherInstructions),
    };

    await depositSettings.save();

    return res.redirect("/admin/deposit-settings?saved=1");
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   TRANSACTIONS
========================================================= */

/* =========================================================
   ADMIN TRANSACTIONS
========================================================= */

exports.transactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({})
      .populate(
        "customer",
        "firstName middleName lastName username email customerId",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/finance/transactions", {
      title: "Transactions - First Credit Merchant Admin",

      ...createAdminFinanceData({
        transactions,
      }),
    });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = (req, res) => {
  res.render("admin/finance/transaction-create", {
    title: "Create Transaction - First Credit Merchant Admin",

    ...createAdminFinanceData({
      selectedCustomerId: req.query.customer || null,
    }),
  });
};

/* =========================================================
   ADMIN TRANSACTION DETAILS
========================================================= */

exports.transactionDetails = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "customer",
      "firstName middleName lastName username email customerId",
    );

    if (!transaction) {
      return res.status(404).send("Transaction record not found.");
    }

    return res.render("admin/finance/transaction-details", {
      title: "Transaction Details - First Credit Merchant Admin",

      ...createAdminFinanceData({
        transaction,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   TRANSFERS
========================================================= */

/* =========================================================
   ADMIN TRANSFER LIST
========================================================= */

exports.transfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/finance/transfers", {
      title: "Transfers - First Credit Merchant Admin",

      ...createAdminFinanceData({
        transfers,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN CREATE TRANSFER PAGE
========================================================= */

exports.createTransfer = async (req, res, next) => {
  try {
    const customers = await loadAdminTransferCustomers();

    return res.render("admin/finance/transfer-create", {
      title: "Create Transfer - First Credit Merchant Admin",

      ...createAdminFinanceData({
        customers,

        selectedCustomerId: req.query.customer || null,

        error: null,

        formData: {},
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN TRANSFER DETAILS
========================================================= */

exports.transferDetails = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .populate(
        "recipientCustomer",
        "firstName middleName lastName email customerId",
      )
      .populate(
        "recipientAccountId",
        "accountNumber accountType currency status",
      )
      .populate("senderTransaction")
      .populate("recipientTransaction");

    if (!transfer) {
      return res.status(404).send("Transfer record not found.");
    }

    return res.render("admin/finance/transfer-details", {
      title: "Transfer Details - First Credit Merchant Admin",

      ...createAdminFinanceData({
        transfer,

        customer: transfer.customer,

        created: req.query.created === "1",

        processing: req.query.processing === "1",

        completed: req.query.completed === "1",

        rejected: req.query.rejected === "1",

        error: null,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CARDS
========================================================= */
/* =========================================================
   ADMIN SERVICES DATA
========================================================= */

function createAdminServicesData(additionalData = {}) {
  return {
    customers: [],

    cards: [],
    loans: [],
    investments: [],

    card: null,
    loan: null,
    investment: null,

    ...additionalData,
  };
}
/* =========================================================
   ADMIN CARD LIST
========================================================= */

exports.cards = async (req, res, next) => {
  try {
    const cards = await Card.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/services/cards", {
      title: "Cards - First Credit Merchant Admin",

      ...createAdminServicesData({
        cards,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN CREATE CARD PAGE
========================================================= */

exports.createCard = async (req, res, next) => {
  try {
    const customers = await loadAdminCardCustomers();

    return res.render("admin/services/card-create", {
      title: "Create Card - First Credit Merchant Admin",

      ...createAdminServicesData({
        customers,

        selectedCustomerId: req.query.customer || null,

        error: null,

        formData: {},
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN STORE CARD
========================================================= */

exports.storeCard = async (req, res, next) => {
  try {
    const customers = await loadAdminCardCustomers();

    const renderCardError = (message, statusCode = 422) => {
      return res.status(statusCode).render("admin/services/card-create", {
        title: "Create Card - First Credit Merchant Admin",

        ...createAdminServicesData({
          customers,

          selectedCustomerId: req.body.customerId || null,

          error: message,

          formData: req.body || {},
        }),
      });
    };

    const customerId = cleanCardText(req.body.customerId);

    const displayName = cleanCardText(req.body.displayName);

    const type = cleanCardText(req.body.type);

    const lastFour = cleanCardText(req.body.lastFour);

    const expiry = cleanCardText(req.body.expiry);

    const currency = cleanCardText(req.body.currency).toUpperCase();

    const status = cleanCardText(req.body.status);

    const holderNameInput = cleanCardText(req.body.holderName);

    const issuerName =
      cleanCardText(req.body.issuerName) || "First Credit Merchant";

    const spendingLimit = Number(req.body.spendingLimit || 0);

    const allowedTypes = [
      "Virtual Debit",
      "Physical Debit",
      "Virtual Credit",
      "Physical Credit",
    ];

    const allowedStatuses = [
      "Pending",
      "Active",
      "Frozen",
      "Inactive",
      "Expired",
    ];

    if (!customerId) {
      return renderCardError("Select a customer.");
    }

    if (!allowedTypes.includes(type)) {
      return renderCardError("Select a valid card type.");
    }

    if (!/^\d{4}$/.test(lastFour)) {
      return renderCardError("Enter exactly four numeric card digits.");
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return renderCardError("Enter the expiration date in MM/YY format.");
    }

    if (!currency) {
      return renderCardError("Select a card currency.");
    }

    if (!allowedStatuses.includes(status)) {
      return renderCardError("Select a valid card status.");
    }

    if (!Number.isFinite(spendingLimit) || spendingLimit < 0) {
      return renderCardError("Enter a valid spending limit.");
    }

    const customer = await User.findOne({
      _id: customerId,

      role: "customer",

      status: "Active",
    });

    if (!customer) {
      return renderCardError("The selected customer could not be found.", 404);
    }

    const account = await Account.findOne({
      customer: customer._id,
    });

    if (!account) {
      return renderCardError("The selected customer does not have an account.");
    }

    if (String(account.currency || "").toUpperCase() !== currency) {
      return renderCardError(
        "The card currency must match the customer's account currency.",
      );
    }

    const generatedHolderName = [
      customer.firstName,
      customer.middleName,
      customer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const card = await Card.create({
      customer: customer._id,

      displayName: displayName || type,

      holderName: holderNameInput || generatedHolderName,

      issuerName,

      type,

      lastFour,

      expiry,

      currency,

      spendingLimit,

      status,

      issuedBy: req.session.userId || null,

      issuedAt: new Date(),

      activatedAt: status === "Active" ? new Date() : null,
    });

    return res.redirect(`/admin/cards/${card._id}?created=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN CARD DETAILS
========================================================= */

exports.cardDetails = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id).populate(
      "customer",
      "firstName middleName lastName email username customerId status",
    );

    if (!card) {
      return res.status(404).send("Card record not found.");
    }

    const account = card.customer
      ? await Account.findOne({
          customer: card.customer._id,
        })
      : null;

    return res.render("admin/services/card-details", {
      title: "Card Details - First Credit Merchant Admin",

      ...createAdminServicesData({
        card,

        customer: card.customer,

        account,

        created: req.query.created === "1",

        updated: req.query.updated === "1",

        error: null,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN UPDATE CARD
========================================================= */

exports.updateCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).send("Card record not found.");
    }

    const displayName = cleanCardText(req.body.displayName);

    const holderName = cleanCardText(req.body.holderName);

    const issuerName = cleanCardText(req.body.issuerName);

    const type = cleanCardText(req.body.type);

    const lastFour = cleanCardText(req.body.lastFour);

    const expiry = cleanCardText(req.body.expiry);

    const currency = cleanCardText(req.body.currency).toUpperCase();

    const status = cleanCardText(req.body.status);

    const spendingLimit = Number(req.body.spendingLimit || 0);

    const allowedTypes = [
      "Virtual Debit",
      "Physical Debit",
      "Virtual Credit",
      "Physical Credit",
    ];

    const allowedStatuses = [
      "Pending",
      "Active",
      "Frozen",
      "Inactive",
      "Expired",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(422).send("Select a valid card type.");
    }

    if (!/^\d{4}$/.test(lastFour)) {
      return res.status(422).send("Enter exactly four numeric card digits.");
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return res.status(422).send("Enter the expiration date in MM/YY format.");
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(422).send("Select a valid card status.");
    }

    if (!Number.isFinite(spendingLimit) || spendingLimit < 0) {
      return res.status(422).send("Enter a valid spending limit.");
    }

    const previousStatus = card.status;

    card.displayName = displayName || card.displayName;

    card.holderName = holderName || card.holderName;

    card.issuerName = issuerName || card.issuerName;

    card.type = type;

    card.lastFour = lastFour;

    card.expiry = expiry;

    card.currency = currency;

    card.spendingLimit = spendingLimit;

    card.status = status;

    card.adminNote = cleanCardText(req.body.adminNote);

    if (status === "Active" && previousStatus !== "Active") {
      card.activatedAt = new Date();
    }

    if (status === "Frozen" && previousStatus !== "Frozen") {
      card.frozenAt = new Date();
    }

    if (status === "Inactive" && previousStatus !== "Inactive") {
      card.inactiveAt = new Date();
    }

    await card.save();

    return res.redirect(`/admin/cards/${card._id}?updated=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN LOAN LIST
========================================================= */

exports.loans = async (req, res, next) => {
  try {
    const loans = await Loan.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/services/loans", {
      title: "Loans - First Credit Merchant Admin",

      ...createAdminServicesData({
        loans,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN CREATE LOAN PAGE
========================================================= */

exports.createLoan = async (req, res, next) => {
  try {
    const customers = await loadAdminLoanCustomers();

    return res.render("admin/services/loan-create", {
      title: "Create Loan - First Credit Merchant Admin",

      ...createAdminServicesData({
        customers,

        selectedCustomerId: req.query.customer || null,

        error: null,

        formData: {},
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN STORE LOAN
========================================================= */

exports.storeLoan = async (req, res, next) => {
  try {
    const customers = await loadAdminLoanCustomers();

    const renderLoanError = (message, statusCode = 422) => {
      return res.status(statusCode).render("admin/services/loan-create", {
        title: "Create Loan - First Credit Merchant Admin",

        ...createAdminServicesData({
          customers,

          selectedCustomerId: req.body.customerId || null,

          error: message,

          formData: req.body || {},
        }),
      });
    };

    const customerId = cleanLoanText(req.body.customerId);

    const type = cleanLoanText(req.body.type);

    const requestedAmount = Number(req.body.requestedAmount);

    const approvedAmount = parseOptionalLoanNumber(req.body.approvedAmount);

    const interestRate = parseOptionalLoanNumber(req.body.interestRate);

    const monthlyPayment = parseOptionalLoanNumber(req.body.monthlyPayment);

    const outstandingAmount = parseOptionalLoanNumber(
      req.body.outstandingAmount,
    );

    const term = cleanLoanText(req.body.term);

    const purpose = cleanLoanText(req.body.purpose);

    const status = cleanLoanText(req.body.status) || "Pending";

    const allowedTypes = [
      "Personal Loan",
      "Business Loan",
      "Education Loan",
      "Auto Loan",
      "Emergency Loan",
      "Other Loan",
    ];

    const allowedStatuses = ["Pending", "Under Review", "Approved", "Rejected"];

    if (!customerId) {
      return renderLoanError("Select a customer.");
    }

    if (!allowedTypes.includes(type)) {
      return renderLoanError("Select a valid loan type.");
    }

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return renderLoanError("Enter a valid requested amount.");
    }

    if (!allowedStatuses.includes(status)) {
      return renderLoanError("Select a valid initial status.");
    }

    const customer = await User.findOne({
      _id: customerId,

      role: "customer",

      status: "Active",
    });

    if (!customer) {
      return renderLoanError("The selected customer could not be found.", 404);
    }

    const account = await Account.findOne({
      customer: customer._id,
    });

    if (!account) {
      return renderLoanError("The selected customer does not have an account.");
    }

    const reference = await Loan.generateReference();

    const loan = await Loan.create({
      customer: customer._id,

      reference,

      type,

      requestedAmount,

      approvedAmount,

      outstandingAmount:
        outstandingAmount !== null ? outstandingAmount : approvedAmount,

      monthlyPayment,

      interestRate,

      currency: account.currency,

      term,

      purpose,

      status,

      startDate: parseOptionalLoanDate(req.body.startDate),

      endDate: parseOptionalLoanDate(req.body.endDate),

      nextPaymentDate: parseOptionalLoanDate(req.body.nextPaymentDate),

      reviewedBy: req.session.userId || null,

      reviewedAt: status !== "Pending" ? new Date() : null,

      approvedAt: status === "Approved" ? new Date() : null,

      rejectedAt: status === "Rejected" ? new Date() : null,

      adminNote: cleanLoanText(req.body.adminNote),

      fundsCredited: false,
    });

    return res.redirect(`/admin/loans/${loan._id}?created=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN LOAN DETAILS
========================================================= */

exports.loanDetails = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate(
      "customer",
      "firstName middleName lastName email username customerId status",
    );

    if (!loan) {
      return res.status(404).send("Loan record not found.");
    }

    const account = loan.customer
      ? await Account.findOne({
          customer: loan.customer._id,
        })
      : null;

    const dashboardValues = loan.customer
      ? await DashboardValue.findOne({
          customer: loan.customer._id,
        })
      : null;

    return res.render("admin/services/loan-details", {
      title: "Loan Details - First Credit Merchant Admin",

      ...createAdminServicesData({
        loan,

        customer: loan.customer,

        account,

        dashboardValues,

        created: req.query.created === "1",

        approved: req.query.approved === "1",

        rejected: req.query.rejected === "1",

        activated: req.query.activated === "1",

        updated: req.query.updated === "1",

        error: null,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   APPROVE LOAN
========================================================= */

exports.approveLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).send("Loan record not found.");
    }

    if (loan.status === "Active" || loan.fundsCredited === true) {
      return res
        .status(400)
        .send("An active funded loan cannot be reviewed again.");
    }

    if (loan.status === "Rejected") {
      return res.status(400).send("A rejected loan cannot be approved.");
    }

    const approvedAmount = Number(req.body.approvedAmount);

    const interestRate = Number(req.body.interestRate);

    const monthlyPayment = Number(req.body.monthlyPayment);

    const term = cleanLoanText(req.body.term) || loan.term;

    if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
      return res.status(422).send("Enter a valid approved amount.");
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      return res.status(422).send("Enter a valid interest rate.");
    }

    if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
      return res.status(422).send("Enter a valid monthly payment.");
    }

    loan.approvedAmount = approvedAmount;

    loan.outstandingAmount = approvedAmount;

    loan.interestRate = interestRate;

    loan.monthlyPayment = monthlyPayment;

    loan.term = term;

    loan.startDate = parseOptionalLoanDate(req.body.startDate);

    loan.endDate = parseOptionalLoanDate(req.body.endDate);

    loan.nextPaymentDate = parseOptionalLoanDate(req.body.nextPaymentDate);

    loan.status = "Approved";

    loan.reviewedBy = req.session.userId || null;

    loan.reviewedAt = new Date();

    loan.approvedAt = new Date();

    loan.rejectedAt = null;

    loan.adminNote = cleanLoanText(req.body.adminNote);

    await loan.save();

    return res.redirect(`/admin/loans/${loan._id}?approved=1`);
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   REJECT LOAN
========================================================= */

exports.rejectLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).send("Loan record not found.");
    }

    if (loan.status === "Active" || loan.fundsCredited === true) {
      return res.status(400).send("An active funded loan cannot be rejected.");
    }

    loan.status = "Rejected";

    loan.reviewedBy = req.session.userId || null;

    loan.reviewedAt = new Date();

    loan.rejectedAt = new Date();

    loan.adminNote = cleanLoanText(req.body.adminNote);

    await loan.save();

    return res.redirect(`/admin/loans/${loan._id}?rejected=1`);
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   ACTIVATE AND FUND LOAN
========================================================= */

exports.activateLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).send("Loan record not found.");
    }

    if (loan.status === "Active" || loan.fundsCredited === true) {
      return res.redirect(`/admin/loans/${loan._id}?activated=1`);
    }

    if (loan.status !== "Approved") {
      return res.status(400).send("Only an approved loan can be activated.");
    }

    if (!loan.approvedAmount || loan.approvedAmount <= 0) {
      return res
        .status(400)
        .send("The loan does not have a valid approved amount.");
    }

    const dashboardValues = await DashboardValue.findOne({
      customer: loan.customer,
    });

    if (!dashboardValues) {
      return res
        .status(400)
        .send("Customer financial values could not be found.");
    }

    if (
      String(dashboardValues.currency || "").toUpperCase() !==
      String(loan.currency || "").toUpperCase()
    ) {
      return res
        .status(400)
        .send("Loan currency does not match the customer's account currency.");
    }

    const transactionDescription = `Loan funding ${loan.reference}`;

    let transaction = await Transaction.findOne({
      customer: loan.customer,

      type: "Credit",

      description: transactionDescription,
    });

    if (!transaction) {
      dashboardValues.displayedBalance =
        Number(dashboardValues.displayedBalance || 0) +
        Number(loan.approvedAmount);

      dashboardValues.monthlyIncome =
        Number(dashboardValues.monthlyIncome || 0) +
        Number(loan.approvedAmount);

      dashboardValues.transactionVolume =
        Number(dashboardValues.transactionVolume || 0) +
        Number(loan.approvedAmount);

      await dashboardValues.save();

      const transactionReference = await generateTransactionReference();

      transaction = await Transaction.create({
        customer: loan.customer,

        reference: transactionReference,

        type: "Credit",

        direction: "Incoming",

        amount: loan.approvedAmount,

        currency: loan.currency,

        status: "Completed",

        description: transactionDescription,

        counterparty: "First Credit Merchant Loan",
      });
    }

    loan.status = "Active";

    loan.outstandingAmount = loan.approvedAmount;

    loan.fundsCredited = true;

    loan.creditedAt = new Date();

    loan.activatedAt = new Date();

    loan.startDate = loan.startDate || new Date();

    loan.transaction = transaction._id;

    await loan.save();

    return res.redirect(`/admin/loans/${loan._id}?activated=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   INVESTMENTS
========================================================= */

/* =========================================================
   ADMIN INVESTMENT LIST
========================================================= */

exports.investments = async (req, res, next) => {
  try {
    const investments = await Investment.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/services/investments", {
      title: "Investments - First Credit Merchant Admin",

      ...createAdminServicesData({
        investments,
      }),
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   ADMIN CREATE INVESTMENT PAGE
========================================================= */

exports.createInvestment = async (req, res, next) => {
  try {
    const customers = await loadAdminInvestmentCustomers();

    return res.render("admin/services/investment-create", {
      title: "Create Investment - First Credit Merchant Admin",

      ...createAdminServicesData({
        customers,

        selectedCustomerId: req.query.customer || null,

        error: null,

        formData: {},
      }),
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   ADMIN STORE INVESTMENT
========================================================= */

exports.storeInvestment = async (req, res, next) => {
  try {
    const customers = await loadAdminInvestmentCustomers();

    const renderInvestmentError = (message, statusCode = 422) => {
      return res.status(statusCode).render("admin/services/investment-create", {
        title: "Create Investment - First Credit Merchant Admin",

        ...createAdminServicesData({
          customers,

          selectedCustomerId: req.body.customerId || null,

          error: message,

          formData: req.body || {},
        }),
      });
    };

    const customerId = cleanInvestmentText(req.body.customerId);

    const name = cleanInvestmentText(req.body.name);

    const type = cleanInvestmentText(req.body.type);

    const principal = Number(req.body.principal);

    const currentValue = parseOptionalInvestmentNumber(req.body.currentValue);

    const returnAmount = parseOptionalInvestmentNumber(req.body.returnAmount);

    const returnPercentage = parseOptionalInvestmentNumber(
      req.body.returnPercentage,
    );

    const duration = cleanInvestmentText(req.body.duration);

    const description = cleanInvestmentText(req.body.description);

    const adminNote = cleanInvestmentText(req.body.adminNote);

    const status = cleanInvestmentText(req.body.status) || "Pending";

    const allowedTypes = [
      "Fixed Investment",
      "Savings Investment",
      "Growth Fund",
      "Business Investment",
      "Retirement Investment",
      "Custom Investment",
    ];

    const allowedStatuses = ["Pending", "Under Review", "Approved", "Rejected"];

    if (!customerId) {
      return renderInvestmentError("Select a customer.");
    }

    if (!allowedTypes.includes(type)) {
      return renderInvestmentError("Select a valid investment type.");
    }

    if (!Number.isFinite(principal) || principal <= 0) {
      return renderInvestmentError("Enter a valid investment principal.");
    }

    if (!allowedStatuses.includes(status)) {
      return renderInvestmentError("Select a valid initial status.");
    }

    if (currentValue !== null && currentValue < 0) {
      return renderInvestmentError("Enter a valid current value.");
    }

    if (returnPercentage !== null && returnPercentage < 0) {
      return renderInvestmentError("Enter a valid return percentage.");
    }

    const customer = await User.findOne({
      _id: customerId,

      role: "customer",

      status: "Active",
    });

    if (!customer) {
      return renderInvestmentError(
        "The selected customer could not be found.",
        404,
      );
    }

    const account = await Account.findOne({
      customer: customer._id,
    });

    if (!account) {
      return renderInvestmentError(
        "The selected customer does not have an account.",
      );
    }

    const reference = await Investment.generateReference();

    const investment = await Investment.create({
      customer: customer._id,

      reference,

      name: name || type,

      type,

      principal,

      currentValue: currentValue !== null ? currentValue : principal,

      returnAmount,

      returnPercentage,

      currency: account.currency,

      duration,

      description,

      status,

      startDate: parseOptionalInvestmentDate(req.body.startDate),

      maturityDate: parseOptionalInvestmentDate(req.body.maturityDate),

      approvedAt: status === "Approved" ? new Date() : null,

      rejectedAt: status === "Rejected" ? new Date() : null,

      reviewedBy: req.session.userId || null,

      reviewedAt: status !== "Pending" ? new Date() : null,

      adminNote,

      principalDebited: false,

      payoutCredited: false,

      fundingTransaction: null,

      payoutTransaction: null,
    });

    return res.redirect(`/admin/investments/${investment._id}?created=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN INVESTMENT DETAILS
========================================================= */

exports.investmentDetails = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id).populate(
      "customer",
      "firstName middleName lastName email username customerId status",
    );

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    const account = investment.customer
      ? await Account.findOne({
          customer: investment.customer._id,
        })
      : null;

    const dashboardValues = investment.customer
      ? await DashboardValue.findOne({
          customer: investment.customer._id,
        })
      : null;

    return res.render("admin/services/investment-details", {
      title: "Investment Details - First Credit Merchant Admin",

      ...createAdminServicesData({
        investment,

        customer: investment.customer,

        account,

        dashboardValues,

        created: req.query.created === "1",

        approved: req.query.approved === "1",

        rejected: req.query.rejected === "1",

        activated: req.query.activated === "1",

        matured: req.query.matured === "1",

        closed: req.query.closed === "1",

        error: req.query.error || null,
      }),
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   APPROVE INVESTMENT
========================================================= */

exports.approveInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    if (
      investment.status === "Active" ||
      investment.principalDebited === true
    ) {
      return res
        .status(400)
        .send("An active investment cannot be reviewed again.");
    }

    if (investment.status === "Rejected") {
      return res.status(400).send("A rejected investment cannot be approved.");
    }

    const currentValue = parseOptionalInvestmentNumber(req.body.currentValue);

    const returnPercentage = parseOptionalInvestmentNumber(
      req.body.returnPercentage,
    );

    const returnAmount = parseOptionalInvestmentNumber(req.body.returnAmount);

    if (currentValue !== null && currentValue < 0) {
      return res.status(422).send("Enter a valid current value.");
    }

    if (returnPercentage !== null && returnPercentage < 0) {
      return res.status(422).send("Enter a valid return percentage.");
    }

    investment.name =
      cleanInvestmentText(req.body.name) || investment.name || investment.type;

    investment.duration =
      cleanInvestmentText(req.body.duration) || investment.duration;

    investment.currentValue =
      currentValue !== null ? currentValue : investment.principal;

    investment.returnPercentage = returnPercentage;

    investment.returnAmount = returnAmount;

    investment.startDate = parseOptionalInvestmentDate(req.body.startDate);

    investment.maturityDate = parseOptionalInvestmentDate(
      req.body.maturityDate,
    );

    investment.status = "Approved";

    investment.reviewedBy = req.session.userId || null;

    investment.reviewedAt = new Date();

    investment.approvedAt = new Date();

    investment.rejectedAt = null;

    investment.adminNote = cleanInvestmentText(req.body.adminNote);

    await investment.save();

    return res.redirect(`/admin/investments/${investment._id}?approved=1`);
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   REJECT INVESTMENT
========================================================= */

exports.rejectInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    if (
      investment.status === "Active" ||
      investment.principalDebited === true
    ) {
      return res
        .status(400)
        .send("An active funded investment cannot be rejected.");
    }

    investment.status = "Rejected";

    investment.reviewedBy = req.session.userId || null;

    investment.reviewedAt = new Date();

    investment.rejectedAt = new Date();

    investment.adminNote = cleanInvestmentText(req.body.adminNote);

    await investment.save();

    return res.redirect(`/admin/investments/${investment._id}?rejected=1`);
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   ACTIVATE INVESTMENT
========================================================= */

exports.activateInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    if (
      investment.status === "Active" ||
      investment.principalDebited === true
    ) {
      return res.redirect(`/admin/investments/${investment._id}?activated=1`);
    }

    if (investment.status !== "Approved") {
      return res
        .status(400)
        .send("Only an approved investment can be activated.");
    }

    if (!investment.principal || investment.principal <= 0) {
      return res
        .status(400)
        .send("The investment does not have a valid principal.");
    }

    const dashboardValues = await DashboardValue.findOne({
      customer: investment.customer,
    });

    if (!dashboardValues) {
      return res
        .status(400)
        .send("Customer financial values could not be found.");
    }

    if (
      String(dashboardValues.currency || "").toUpperCase() !==
      String(investment.currency || "").toUpperCase()
    ) {
      return res
        .status(400)
        .send(
          "Investment currency does not match the customer's account currency.",
        );
    }

    if (
      Number(dashboardValues.displayedBalance || 0) <
      Number(investment.principal)
    ) {
      return res
        .status(400)
        .send(
          "The customer does not have enough available balance to activate this investment.",
        );
    }

    const transactionDescription = `Investment funding ${investment.reference}`;

    let transaction = await Transaction.findOne({
      customer: investment.customer,

      type: "Debit",

      description: transactionDescription,
    });

    if (!transaction) {
      dashboardValues.displayedBalance =
        Number(dashboardValues.displayedBalance || 0) -
        Number(investment.principal);

      dashboardValues.transactionVolume =
        Number(dashboardValues.transactionVolume || 0) +
        Number(investment.principal);

      await dashboardValues.save();

      const transactionReference = await generateTransactionReference();

      transaction = await Transaction.create({
        customer: investment.customer,

        reference: transactionReference,

        type: "Debit",

        direction: "Outgoing",

        amount: investment.principal,

        currency: investment.currency,

        status: "Completed",

        description: transactionDescription,

        counterparty: investment.name || investment.type || "Investment",
      });
    }

    investment.status = "Active";

    investment.principalDebited = true;

    investment.debitedAt = new Date();

    investment.activatedAt = new Date();

    investment.startDate = investment.startDate || new Date();

    investment.currentValue =
      investment.currentValue !== null && investment.currentValue !== undefined
        ? investment.currentValue
        : investment.principal;

    investment.fundingTransaction = transaction._id;

    await investment.save();

    return res.redirect(`/admin/investments/${investment._id}?activated=1`);
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   MATURE AND PAY OUT INVESTMENT
========================================================= */

exports.matureInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    if (investment.status === "Matured" || investment.payoutCredited === true) {
      return res.redirect(`/admin/investments/${investment._id}?matured=1`);
    }

    if (investment.status !== "Active") {
      return res.status(400).send("Only an active investment can be matured.");
    }

    const submittedCurrentValue = parseOptionalInvestmentNumber(
      req.body.currentValue,
    );

    const submittedReturnAmount = parseOptionalInvestmentNumber(
      req.body.returnAmount,
    );

    const submittedReturnPercentage = parseOptionalInvestmentNumber(
      req.body.returnPercentage,
    );

    let payoutAmount = submittedCurrentValue;

    if (payoutAmount === null || payoutAmount <= 0) {
      if (submittedReturnAmount !== null) {
        payoutAmount =
          Number(investment.principal) + Number(submittedReturnAmount);
      } else if (submittedReturnPercentage !== null) {
        payoutAmount =
          Number(investment.principal) +
          (Number(investment.principal) * Number(submittedReturnPercentage)) /
            100;
      } else if (
        investment.currentValue !== null &&
        investment.currentValue !== undefined
      ) {
        payoutAmount = Number(investment.currentValue);
      }
    }

    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      return res
        .status(422)
        .send("Enter a valid final investment value or return.");
    }

    const dashboardValues = await DashboardValue.findOne({
      customer: investment.customer,
    });

    if (!dashboardValues) {
      return res
        .status(400)
        .send("Customer financial values could not be found.");
    }

    if (
      String(dashboardValues.currency || "").toUpperCase() !==
      String(investment.currency || "").toUpperCase()
    ) {
      return res
        .status(400)
        .send(
          "Investment currency does not match the customer's account currency.",
        );
    }

    const transactionDescription = `Investment payout ${investment.reference}`;

    let transaction = await Transaction.findOne({
      customer: investment.customer,

      type: "Credit",

      description: transactionDescription,
    });

    if (!transaction) {
      dashboardValues.displayedBalance =
        Number(dashboardValues.displayedBalance || 0) + Number(payoutAmount);

      dashboardValues.monthlyIncome =
        Number(dashboardValues.monthlyIncome || 0) + Number(payoutAmount);

      dashboardValues.transactionVolume =
        Number(dashboardValues.transactionVolume || 0) + Number(payoutAmount);

      await dashboardValues.save();

      const transactionReference = await generateTransactionReference();

      transaction = await Transaction.create({
        customer: investment.customer,

        reference: transactionReference,

        type: "Credit",

        direction: "Incoming",

        amount: payoutAmount,

        currency: investment.currency,

        status: "Completed",

        description: transactionDescription,

        counterparty: investment.name || investment.type || "Investment",
      });
    }

    investment.currentValue = payoutAmount;

    investment.returnAmount =
      Number(payoutAmount) - Number(investment.principal);

    investment.returnPercentage =
      Number(investment.principal) > 0
        ? ((Number(payoutAmount) - Number(investment.principal)) /
            Number(investment.principal)) *
          100
        : 0;

    investment.status = "Matured";

    investment.payoutCredited = true;

    investment.paidOutAt = new Date();

    investment.maturedAt = new Date();

    investment.maturityDate = investment.maturityDate || new Date();

    investment.payoutTransaction = transaction._id;

    investment.adminNote =
      cleanInvestmentText(req.body.adminNote) || investment.adminNote;

    await investment.save();

    return res.redirect(`/admin/investments/${investment._id}?matured=1`);
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   CLOSE INVESTMENT
========================================================= */

exports.closeInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).send("Investment record not found.");
    }

    if (investment.status === "Closed") {
      return res.redirect(`/admin/investments/${investment._id}?closed=1`);
    }

    if (investment.status !== "Matured" || investment.payoutCredited !== true) {
      return res
        .status(400)
        .send("Only a matured and paid-out investment can be closed.");
    }

    investment.status = "Closed";

    investment.closedAt = new Date();

    investment.adminNote =
      cleanInvestmentText(req.body.adminNote) || investment.adminNote;

    await investment.save();

    return res.redirect(`/admin/investments/${investment._id}?closed=1`);
  } catch (error) {
    next(error);
  }
};

function createAdminVerificationData(additionalData = {}) {
  return {
    customers: [],

    registrations: [],
    registration: null,

    kycSubmissions: [],
    kycSubmission: null,

    ...additionalData,
  };
}
/* =========================================================
   REGISTRATIONS
========================================================= */

/* =========================================================
   REGISTRATIONS
========================================================= */

exports.registrations = async (req, res, next) => {
  try {
    const registrations = await User.find({
      role: "customer",

      status: {
        $in: ["Pending", "Active", "Suspended"],
      },
    }).sort({
      createdAt: -1,
    });

    return res.render("admin/verification/registrations", {
      title: "Registrations - First Credit Merchant Admin",

      registrations,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   REGISTRATION DETAILS
========================================================= */

exports.registrationDetails = async (req, res, next) => {
  try {
    const registration = await User.findOne({
      _id: req.params.id,

      role: "customer",
    });

    if (!registration) {
      return res.status(404).render("admin/verification/registration-details", {
        title: "Registration Details - First Credit Merchant Admin",

        registration: null,

        approved: false,
      });
    }

    return res.render("admin/verification/registration-details", {
      title: "Registration Details - First Credit Merchant Admin",

      registration,

      approved: req.query.approved === "1",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   APPROVE REGISTRATION
========================================================= */

exports.approveRegistration = async (req, res, next) => {
  try {
    /*
     * transactionPinHash has select:false,
     * so it must be explicitly selected.
     */

    const user = await User.findOne({
      _id: req.params.id,

      role: "customer",
    }).select("+transactionPinHash");

    if (!user) {
      return res.status(404).send("Registration not found.");
    }

    if (!user.emailVerified) {
      return res
        .status(400)
        .send("The customer's email has not been verified.");
    }

    /*
     * This makes repeated approval requests safe.
     */

    const account = await createCustomerAccount(user);

    /*
     * Create the dashboard financial record
     * if it does not already exist.
     */

    await DashboardValue.findOneAndUpdate(
      {
        customer: user._id,
      },

      {
        $setOnInsert: {
          customer: user._id,

          currency: account.currency,

          displayedBalance: 0,

          monthlyIncome: 0,

          monthlyOutgoing: 0,

          transactionLimit: 0,

          pendingTransactions: 0,

          transactionVolume: 0,
        },
      },

      {
        upsert: true,

        new: true,

        runValidators: true,

        setDefaultsOnInsert: true,
      },
    );

    /*
     * Create customer settings if they
     * do not already exist.
     */

    await CustomerSettings.findOneAndUpdate(
      {
        customer: user._id,
      },

      {
        $setOnInsert: {
          customer: user._id,

          displayCurrency: account.currency,
        },
      },

      {
        upsert: true,

        new: true,

        runValidators: true,

        setDefaultsOnInsert: true,
      },
    );

    /*
     * Activate only after all related
     * records have been created.
     */

    user.status = "Active";

    if (!user.customerId) {
      user.customerId = account.accountNumber;
    }

    await user.save();

    return res.redirect(`/admin/registrations/${user._id}?approved=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN IRS TAX REFUND REQUESTS
========================================================= */

exports.irsRefunds = async (req, res, next) => {
  try {
    /*
     * The encrypted SSN fields remain excluded
     * from the general request list.
     */

    const refundRequests = await IrsRefund.find({})
      .populate(
        "customer",
        [
          "firstName",
          "middleName",
          "lastName",
          "email",
          "username",
          "customerId",
          "status",
        ].join(" "),
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/verification/irs-refunds", {
      title: "IRS Tax Refund Requests - First Credit Merchant Admin",

      refundRequests,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   ADMIN IRS TAX REFUND DETAILS
========================================================= */

exports.irsRefundDetails = async (req, res, next) => {
  try {
    /*
     * Full encrypted SSN data is selected only
     * for this protected Admin detail route.
     */

    const refundRequest = await IrsRefund.findById(req.params.id)
      .select(["+ssnEncrypted", "+ssnIv", "+ssnAuthTag"].join(" "))
      .populate(
        "customer",
        [
          "firstName",
          "middleName",
          "lastName",
          "email",
          "username",
          "customerId",
          "status",
        ].join(" "),
      );

    if (!refundRequest) {
      return res.status(404).send("IRS tax refund request not found.");
    }

    let fullSsn = "";

    try {
      fullSsn = refundRequest.getSsn();
    } catch (error) {
      console.error("IRS refund SSN decryption failed.");

      return res
        .status(500)
        .send("The protected Social Security Number could not be opened.");
    }

    const account = refundRequest.customer
      ? await Account.findOne({
          customer: refundRequest.customer._id,
        })
      : null;

    return res.render("admin/verification/irs-refund-details", {
      title: "IRS Tax Refund Request - First Credit Merchant Admin",

      refundRequest,

      customer: refundRequest.customer,

      account,

      fullSsn,

      updated: req.query.updated === "1",

      error: null,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   UPDATE IRS TAX REFUND STATUS
========================================================= */

exports.updateIrsRefundStatus = async (req, res, next) => {
  try {
    const refundRequest = await IrsRefund.findById(req.params.id);

    if (!refundRequest) {
      return res.status(404).send("IRS tax refund request not found.");
    }

    const status = String(req.body.status || "").trim();

    const allowedStatuses = ["Pending", "Under Review", "Approved", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(422).send("Select a valid IRS refund request status.");
    }

    refundRequest.status = status;

    await refundRequest.save();

    return res.redirect(`/admin/irs-refunds/${refundRequest._id}?updated=1`);
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   KYC
========================================================= */
/* =========================================================
   ADMIN KYC LIST
========================================================= */

exports.kyc = async (req, res, next) => {
  try {
    const kycSubmissions = await KYC.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .sort({
        submittedAt: -1,
        createdAt: -1,
      });

    return res.render("admin/verification/kyc", {
      title: "KYC Verification - First Credit Merchant Admin",

      ...createAdminVerificationData({
        kycSubmissions,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN KYC DETAILS
========================================================= */

exports.kycDetails = async (req, res, next) => {
  try {
    const kycSubmission = await KYC.findById(req.params.id).populate(
      "customer",
      "firstName middleName lastName email username customerId status",
    );

    if (!kycSubmission) {
      return res.status(404).send("KYC submission not found.");
    }

    const account = kycSubmission.customer
      ? await Account.findOne({
          customer: kycSubmission.customer._id,
        })
      : null;

    return res.render("admin/verification/kyc-details", {
      title: "KYC Review - First Credit Merchant Admin",

      ...createAdminVerificationData({
        kycSubmission,

        customer: kycSubmission.customer,

        account,

        verified: req.query.verified === "1",

        rejected: req.query.rejected === "1",

        needsUpdate: req.query.needsUpdate === "1",

        underReview: req.query.underReview === "1",

        error: null,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   MARK KYC UNDER REVIEW
========================================================= */

exports.markKycUnderReview = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);

    if (!kyc) {
      return res.status(404).send("KYC submission not found.");
    }

    if (kyc.status === "Verified") {
      return res
        .status(400)
        .send("A verified KYC submission cannot be moved back to review.");
    }

    kyc.status = "Under Review";

    kyc.reviewedBy = req.session.userId || null;

    kyc.reviewedAt = new Date();

    kyc.reviewMessage =
      cleanAdminKycText(req.body.reviewMessage) || kyc.reviewMessage;

    await kyc.save();

    return res.redirect(`/admin/kyc/${kyc._id}?underReview=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   VERIFY KYC
========================================================= */

exports.verifyKyc = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);

    if (!kyc) {
      return res.status(404).send("KYC submission not found.");
    }

    /*
     * Repeated verification should not
     * create another record or cause
     * another financial operation.
     */

    if (kyc.status === "Verified") {
      return res.redirect(`/admin/kyc/${kyc._id}?verified=1`);
    }

    kyc.status = "Verified";

    kyc.reviewedBy = req.session.userId || null;

    kyc.reviewedAt = new Date();

    kyc.verifiedAt = new Date();

    kyc.rejectedAt = null;

    kyc.needsUpdateAt = null;

    kyc.reviewMessage =
      cleanAdminKycText(req.body.reviewMessage) ||
      "Identity verification completed successfully.";

    await kyc.save();

    return res.redirect(`/admin/kyc/${kyc._id}?verified=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   REJECT KYC
========================================================= */

exports.rejectKyc = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);

    if (!kyc) {
      return res.status(404).send("KYC submission not found.");
    }

    const reviewMessage = cleanAdminKycText(req.body.reviewMessage);

    if (!reviewMessage) {
      return res
        .status(422)
        .send("Enter a reason for rejecting the verification.");
    }

    if (kyc.status === "Verified") {
      return res
        .status(400)
        .send("A verified KYC submission cannot be rejected.");
    }

    kyc.status = "Rejected";

    kyc.reviewedBy = req.session.userId || null;

    kyc.reviewedAt = new Date();

    kyc.rejectedAt = new Date();

    kyc.verifiedAt = null;

    kyc.needsUpdateAt = null;

    kyc.reviewMessage = reviewMessage;

    await kyc.save();

    return res.redirect(`/admin/kyc/${kyc._id}?rejected=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   REQUEST KYC UPDATE
========================================================= */

exports.requestKycUpdate = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);

    if (!kyc) {
      return res.status(404).send("KYC submission not found.");
    }

    const reviewMessage = cleanAdminKycText(req.body.reviewMessage);

    if (!reviewMessage) {
      return res
        .status(422)
        .send("Explain what information or document needs to be updated.");
    }

    if (kyc.status === "Verified") {
      return res
        .status(400)
        .send("A verified KYC submission cannot request an update.");
    }

    kyc.status = "Needs Update";

    kyc.reviewedBy = req.session.userId || null;

    kyc.reviewedAt = new Date();

    kyc.needsUpdateAt = new Date();

    kyc.verifiedAt = null;

    kyc.rejectedAt = null;

    kyc.reviewMessage = reviewMessage;

    await kyc.save();

    return res.redirect(`/admin/kyc/${kyc._id}?needsUpdate=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN OPEN KYC DOCUMENT
========================================================= */

exports.openKycDocument = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);

    if (!kyc) {
      return res.status(404).send("KYC submission not found.");
    }

    const field = cleanAdminKycText(req.params.field);

    if (!["front", "back", "additional"].includes(field)) {
      return res.status(404).send("Document not found.");
    }

    const document = kyc.documents.find((item) => item.field === field);

    if (!document || !document.storedName) {
      return res.status(404).send("Document not found.");
    }

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
   ADMIN COMMUNICATION / SYSTEM DATA
========================================================= */

function createAdminSystemData(additionalData = {}) {
  return {
    customers: [],

    notifications: [],
    notification: null,

    supportTickets: [],
    ticket: null,

    activities: [],

    systemSettings: null,
    cryptoWallets: [],

    ...additionalData,
  };
}

/* =========================================================
   ADMIN NOTIFICATIONS
========================================================= */

exports.notifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .sort({
        createdAt: -1,
      });

    return res.render("admin/communication/notifications", {
      title: "Notifications - First Credit Merchant Admin",

      ...createAdminSystemData({
        notifications,

        created: req.query.created === "1",
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN CREATE NOTIFICATION PAGE
========================================================= */

exports.createNotification = async (req, res, next) => {
  try {
    const customers = await loadNotificationCustomers();

    return res.render("admin/communication/notification-create", {
      title: "Create Notification - First Credit Merchant Admin",

      ...createAdminSystemData({
        customers,

        selectedCustomerId: req.query.customer || null,

        error: null,

        formData: {},
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN STORE NOTIFICATION
========================================================= */

exports.storeNotification = async (req, res, next) => {
  try {
    const customers = await loadNotificationCustomers();

    const renderNotificationError = (message, statusCode = 422) => {
      return res
        .status(statusCode)
        .render("admin/communication/notification-create", {
          title: "Create Notification - First Credit Merchant Admin",

          ...createAdminSystemData({
            customers,

            selectedCustomerId: req.body.customerId || null,

            error: message,

            formData: req.body || {},
          }),
        });
    };

    const customerId = cleanNotificationText(req.body.customerId);

    const type = cleanNotificationText(req.body.type);

    const priority = cleanNotificationText(req.body.priority) || "Normal";

    const title = cleanNotificationText(req.body.title);

    const message = cleanNotificationText(req.body.message);

    const actionUrl = cleanNotificationText(req.body.actionUrl);

    const actionLabel = cleanNotificationText(req.body.actionLabel);

    const allowedTypes = [
      "Account",
      "Deposit",
      "Transfer",
      "Card",
      "Loan",
      "Investment",
      "KYC",
      "Security",
      "Support",
      "General",
    ];

    const allowedPriorities = ["Normal", "Important", "Urgent"];

    if (!customerId) {
      return renderNotificationError("Select a customer.");
    }

    if (!allowedTypes.includes(type)) {
      return renderNotificationError("Select a valid notification type.");
    }

    if (!allowedPriorities.includes(priority)) {
      return renderNotificationError("Select a valid notification priority.");
    }

    if (!title) {
      return renderNotificationError("Enter a notification title.");
    }

    if (!message) {
      return renderNotificationError("Enter a notification message.");
    }

    if (title.length > 160) {
      return renderNotificationError(
        "The notification title must not exceed 160 characters.",
      );
    }

    if (message.length > 5000) {
      return renderNotificationError(
        "The notification message must not exceed 5,000 characters.",
      );
    }

    /*
     * Restrict action URLs to internal
     * dashboard paths.
     */

    if (actionUrl && !actionUrl.startsWith("/dashboard/")) {
      return renderNotificationError(
        "The action URL must be an internal dashboard path beginning with /dashboard/.",
      );
    }

    const customer = await User.findOne({
      _id: customerId,

      role: "customer",

      status: "Active",
    });

    if (!customer) {
      return renderNotificationError(
        "The selected customer could not be found.",
        404,
      );
    }

    await Notification.create({
      customer: customer._id,

      title,

      message,

      type,

      priority,

      actionUrl,

      actionLabel: actionUrl ? actionLabel || "View Details" : "",

      relatedModel: "",

      relatedId: null,

      read: false,

      readAt: null,
    });

    return res.redirect("/admin/notifications?created=1");
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   ADMIN SUPPORT TICKETS
========================================================= */

exports.support = async (req, res, next) => {
  try {
    const supportTickets = await SupportTicket.find({})
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .populate("assignedTo", "firstName middleName lastName email")
      .sort({
        lastMessageAt: -1,
        createdAt: -1,
      });

    return res.render("admin/communication/support", {
      title: "Support Tickets - First Credit Merchant Admin",

      ...createAdminSystemData({
        supportTickets,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN SUPPORT TICKET DETAILS
========================================================= */

exports.supportDetails = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate(
        "customer",
        "firstName middleName lastName email username customerId status",
      )
      .populate("assignedTo", "firstName middleName lastName email");

    if (!ticket) {
      return res.status(404).send("Support ticket not found.");
    }

    ticket.adminLastReadAt = new Date();

    await ticket.save();

    const account = ticket.customer
      ? await Account.findOne({
          customer: ticket.customer._id,
        })
      : null;

    return res.render("admin/communication/support-details", {
      title: "Support Ticket - First Credit Merchant Admin",

      ...createAdminSystemData({
        ticket,

        customer: ticket.customer,

        account,

        replied: req.query.replied === "1",

        updated: req.query.updated === "1",

        error: null,
      }),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN REPLY TO SUPPORT TICKET
========================================================= */

exports.replySupportTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

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

    const adminId =
      req.session && req.session.userId ? req.session.userId : null;

    const admin = adminId ? await User.findById(adminId) : null;

    const adminName = admin
      ? [admin.firstName, admin.middleName, admin.lastName]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

    await ticket.addMessage({
      senderType: "Admin",

      sender: adminId,

      authorLabel: adminName ? `${adminName} · Support Team` : "Support Team",

      body,
    });

    if (!ticket.assignedTo) {
      ticket.assignedTo = adminId;
    }

    ticket.adminLastReadAt = new Date();

    await ticket.save();

    try {
      await createNotification({
        customer: ticket.customer,

        title: "Support Ticket Updated",

        message: `A new reply was added to support ticket ${ticket.reference}.`,

        type: "Support",

        priority:
          ticket.priority === "Urgent"
            ? "Urgent"
            : ticket.priority === "High"
              ? "Important"
              : "Normal",

        actionUrl: `/dashboard/support/${ticket._id}`,

        actionLabel: "View Ticket",

        relatedModel: "Support",

        relatedId: ticket._id,
      });
    } catch (notificationError) {
      console.error("Support notification error:", notificationError);
    }

    return res.redirect(`/admin/support/${ticket._id}?replied=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADMIN UPDATE SUPPORT TICKET STATUS
========================================================= */

exports.updateSupportTicketStatus = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).send("Support ticket not found.");
    }

    const status = String(req.body.status || "").trim();

    const resolutionNote = String(req.body.resolutionNote || "").trim();

    const allowedStatuses = ["Open", "In Progress", "Resolved", "Closed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(422).send("Select a valid support ticket status.");
    }

    const previousStatus = ticket.status;

    const adminId =
      req.session && req.session.userId ? req.session.userId : null;

    if (previousStatus === "Closed" && status !== "Closed") {
      return res
        .status(400)
        .send("A closed support ticket cannot be reopened from this action.");
    }

    if (
      (status === "Resolved" || status === "Closed") &&
      !resolutionNote &&
      !ticket.resolutionNote
    ) {
      return res
        .status(422)
        .send(
          "Enter a resolution note before resolving or closing the ticket.",
        );
    }

    ticket.status = status;

    if (!ticket.assignedTo) {
      ticket.assignedTo = adminId;
    }

    if (resolutionNote) {
      ticket.resolutionNote = resolutionNote;
    }

    if (status === "Resolved") {
      ticket.resolvedAt = new Date();

      ticket.resolvedBy = adminId;

      ticket.closedAt = null;

      ticket.closedBy = null;
    }

    if (status === "Closed") {
      ticket.closedAt = new Date();

      ticket.closedBy = adminId;

      if (!ticket.resolvedAt) {
        ticket.resolvedAt = new Date();

        ticket.resolvedBy = adminId;
      }
    }

    if (status === "Open" || status === "In Progress") {
      ticket.resolvedAt = null;

      ticket.resolvedBy = null;

      ticket.closedAt = null;

      ticket.closedBy = null;
    }

    await ticket.save();

    if (previousStatus !== status) {
      try {
        await createNotification({
          customer: ticket.customer,

          title: "Support Ticket Status Updated",

          message: `Support ticket ${ticket.reference} is now ${status}.`,

          type: "Support",

          priority:
            status === "Resolved" || status === "Closed"
              ? "Important"
              : "Normal",

          actionUrl: `/dashboard/support/${ticket._id}`,

          actionLabel: "View Ticket",

          relatedModel: "Support",

          relatedId: ticket._id,
        });
      } catch (notificationError) {
        console.error("Support status notification error:", notificationError);
      }
    }

    return res.redirect(`/admin/support/${ticket._id}?updated=1`);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ACTIVITY LOG
========================================================= */

exports.activity = (req, res) => {
  res.render("admin/system/activity", {
    title: "Activity Log - First Credit Merchant Admin",

    ...createAdminSystemData(),
  });
};

/* =========================================================
   SYSTEM SETTINGS
========================================================= */

exports.settings = (req, res) => {
  res.render("admin/system/settings", {
    title: "Settings - First Credit Merchant Admin",

    ...createAdminSystemData({
      systemSettings: null,
      cryptoWallets: [],
    }),
  });
};
