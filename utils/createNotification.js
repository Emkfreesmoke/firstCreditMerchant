const Notification = require("../models/notification");

/* =========================================================
   CREATE CUSTOMER NOTIFICATION
========================================================= */

async function createNotification({
  customer,
  title,
  message,
  type = "General",
  priority = "Normal",
  actionUrl = "",
  actionLabel = "",
  relatedModel = "",
  relatedId = null,
}) {
  if (!customer || !title || !message) {
    throw new Error(
      "Customer, title, and message are required to create a notification.",
    );
  }

  return Notification.create({
    customer,

    title: String(title).trim(),

    message: String(message).trim(),

    type,

    priority,

    actionUrl: String(actionUrl || "").trim(),

    actionLabel: String(actionLabel || "").trim(),

    relatedModel,

    relatedId,

    read: false,

    readAt: null,
  });
}

module.exports = createNotification;
