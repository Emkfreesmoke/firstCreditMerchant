const mongoose = require("mongoose");

/* =========================================================
   SUPPORT MESSAGE SCHEMA
========================================================= */

const supportMessageSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,

      enum: ["Customer", "Admin"],

      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    authorLabel: {
      type: String,

      trim: true,

      default: "",
    },

    body: {
      type: String,

      required: true,

      trim: true,

      maxlength: 5000,
    },

    /* =====================================================
         OPTIONAL MESSAGE ATTACHMENT
      ====================================================== */

    attachment: {
      originalName: {
        type: String,

        trim: true,

        default: "",
      },

      storedName: {
        type: String,

        trim: true,

        default: "",
      },

      mimetype: {
        type: String,

        trim: true,

        default: "",
      },

      size: {
        type: Number,

        min: 0,

        default: 0,
      },

      path: {
        type: String,

        trim: true,

        default: "",
      },
    },

    createdAt: {
      type: Date,

      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

/* =========================================================
   SUPPORT TICKET SCHEMA
========================================================= */

const supportTicketSchema = new mongoose.Schema(
  {
    /* =====================================================
         CUSTOMER
      ====================================================== */

    customer: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    /* =====================================================
         REFERENCE
      ====================================================== */

    reference: {
      type: String,

      required: true,

      unique: true,

      index: true,

      uppercase: true,

      trim: true,
    },

    /* =====================================================
         TICKET INFORMATION
      ====================================================== */

    subject: {
      type: String,

      required: true,

      trim: true,

      maxlength: 200,
    },

    category: {
      type: String,

      enum: [
        "Account",
        "Transaction",
        "Transfer",
        "Deposit",
        "Card",
        "Loan",
        "Investment",
        "Verification",
        "Other",
      ],

      required: true,

      index: true,
    },

    priority: {
      type: String,

      enum: ["Low", "Normal", "High", "Urgent"],

      default: "Normal",

      index: true,
    },

    /* =====================================================
         STATUS
      ====================================================== */

    status: {
      type: String,

      enum: ["Open", "In Progress", "Resolved", "Closed"],

      default: "Open",

      index: true,
    },

    /* =====================================================
         CONVERSATION
      ====================================================== */

    messages: {
      type: [supportMessageSchema],

      default: [],
    },

    /* =====================================================
         ADMIN ASSIGNMENT
      ====================================================== */

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    /* =====================================================
         ACTIVITY TRACKING
      ====================================================== */

    lastMessageAt: {
      type: Date,

      default: Date.now,

      index: true,
    },

    lastMessageBy: {
      type: String,

      enum: ["Customer", "Admin", ""],

      default: "",
    },

    customerLastReadAt: {
      type: Date,

      default: null,
    },

    adminLastReadAt: {
      type: Date,

      default: null,
    },

    /* =====================================================
         RESOLUTION
      ====================================================== */

    resolvedAt: {
      type: Date,

      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    closedAt: {
      type: Date,

      default: null,
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    resolutionNote: {
      type: String,

      trim: true,

      maxlength: 5000,

      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   INDEXES
========================================================= */

supportTicketSchema.index({
  customer: 1,
  createdAt: -1,
});

supportTicketSchema.index({
  status: 1,
  priority: 1,
  lastMessageAt: -1,
});

supportTicketSchema.index({
  assignedTo: 1,
  status: 1,
});

/* =========================================================
   GENERATE SUPPORT REFERENCE
========================================================= */

supportTicketSchema.statics.generateReference = async function () {
  let reference;
  let exists = true;

  while (exists) {
    const timestamp = Date.now().toString().slice(-8);

    const random = Math.floor(1000 + Math.random() * 9000).toString();

    reference = `SUP-${timestamp}-${random}`;

    exists = await this.exists({
      reference,
    });
  }

  return reference;
};

/* =========================================================
   INSTANCE METHOD: ADD MESSAGE
========================================================= */

supportTicketSchema.methods.addMessage = async function ({
  senderType,
  sender = null,
  authorLabel = "",
  body,
  attachment = null,
}) {
  const cleanBody = String(body || "").trim();

  if (!cleanBody) {
    throw new Error("Support message cannot be empty.");
  }

  const message = {
    senderType,

    sender,

    authorLabel: String(authorLabel || "").trim(),

    body: cleanBody,

    createdAt: new Date(),
  };

  if (attachment && attachment.storedName) {
    message.attachment = attachment;
  }

  this.messages.push(message);

  this.lastMessageAt = new Date();

  this.lastMessageBy = senderType;

  /*
   * A customer reply reopens a resolved
   * ticket so the response is not missed.
   *
   * A closed ticket remains closed.
   */

  if (senderType === "Customer" && this.status === "Resolved") {
    this.status = "Open";

    this.resolvedAt = null;

    this.resolvedBy = null;
  }

  /*
   * The first Admin reply moves an open
   * ticket into active handling.
   */

  if (senderType === "Admin" && this.status === "Open") {
    this.status = "In Progress";
  }

  return this.save();
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
