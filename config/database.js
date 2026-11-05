"use strict";

const mongoose = require("mongoose");

let connectionPromise = null;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from the environment.");
  }

  connectionPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
    })
    .then(function () {
      console.log("MongoDB Atlas connected");

      return mongoose.connection;
    })
    .catch(function (error) {
      connectionPromise = null;

      throw error;
    });

  return connectionPromise;
}

mongoose.connection.on("error", function (error) {
  console.error("MongoDB connection error:", error.message);
});

module.exports = connectDatabase;
