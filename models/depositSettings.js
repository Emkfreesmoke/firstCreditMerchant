const mongoose = require("mongoose");


const cryptoSettingSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: false,
      },

      walletAddress: {
        type: String,
        trim: true,
        default: "",
      },

      network: {
        type: String,
        trim: true,
        default: "",
      },

      instructions: {
        type: String,
        trim: true,
        default: "",
      },
    },
    {
      _id: false,
    },
  );


const traditionalSettingSchema =
  new mongoose.Schema(
    {
      enabled: {
        type: Boolean,
        default: false,
      },

      instructions: {
        type: String,
        trim: true,
        default: "",
      },
    },
    {
      _id: false,
    },
  );


const depositSettingsSchema =
  new mongoose.Schema(
    {
      /*
       * We only need one global deposit
       * configuration document.
       */

      settingsKey: {
        type: String,
        default: "main",
        unique: true,
        immutable: true,
      },


      /* =========================================
         CRYPTOCURRENCY
      ========================================== */

      bitcoin: {
        type: cryptoSettingSchema,

        default: () => ({
          enabled: false,
          walletAddress: "",
          network: "Bitcoin",
          instructions: "",
        }),
      },


      usdt: {
        type: cryptoSettingSchema,

        default: () => ({
          enabled: false,
          walletAddress: "",
          network: "",
          instructions: "",
        }),
      },


      ethereum: {
        type: cryptoSettingSchema,

        default: () => ({
          enabled: false,
          walletAddress: "",
          network: "Ethereum",
          instructions: "",
        }),
      },


      /* =========================================
         TRADITIONAL DEPOSITS
      ========================================== */

      bankTransfer: {
        type: traditionalSettingSchema,

        default: () => ({
          enabled: false,
          instructions: "",
        }),
      },


      wireTransfer: {
        type: traditionalSettingSchema,

        default: () => ({
          enabled: false,
          instructions: "",
        }),
      },


      cashDeposit: {
        type: traditionalSettingSchema,

        default: () => ({
          enabled: false,
          instructions: "",
        }),
      },


      check: {
        type: traditionalSettingSchema,

        default: () => ({
          enabled: false,
          instructions: "",
        }),
      },


      other: {
        type: traditionalSettingSchema,

        default: () => ({
          enabled: false,
          instructions: "",
        }),
      },
    },
    {
      timestamps: true,
    },
  );


module.exports =
  mongoose.model(
    "DepositSettings",
    depositSettingsSchema,
  );