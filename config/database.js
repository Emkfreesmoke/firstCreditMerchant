"use strict";

const mongoose = require("mongoose");

/* =========================================================
   CACHED CONNECTION PROMISE
========================================================= */

let connectionPromise = null;

/* =========================================================
   CONNECT DATABASE
========================================================= */

async function connectDatabase() {
  /*
   * Already connected.
   */

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  /*
   * A connection attempt is already running.
   *
   * Reuse that exact promise instead of
   * creating another MongoDB connection.
   */

  if (connectionPromise) {
    return connectionPromise;
  }

  /* =======================================================
     MONGODB URI
  ======================================================= */

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from the environment.");
  }

  /* =======================================================
     CREATE CONNECTION
  ======================================================= */

  connectionPromise = mongoose
    .connect(mongoUri, {
      /*
       * Allow Atlas up to 30 seconds
       * to select an available server.
       */

      serverSelectionTimeoutMS: 30000,

      /*
       * Allow the individual network
       * connection more time as well.
       */

      connectTimeoutMS: 30000,

      /*
       * Active socket timeout.
       */

      socketTimeoutMS: 45000,

      /*
       * Keep the Vercel pool controlled.
       */

      maxPoolSize: 10,

      minPoolSize: 0,

      /*
       * Close connections that remain
       * unused for this period.
       */

      maxIdleTimeMS: 10000,
    })
    .then(function () {
      console.log("MongoDB Atlas connected");

      return mongoose.connection;
    })
    .catch(function (error) {
      /*
       * A failed promise must not remain
       * cached. A future invocation should
       * be allowed to try again.
       */

      connectionPromise = null;

      console.error("MongoDB Atlas connection failed:", error.message);

      throw error;
    });

  return connectionPromise;
}

/* =========================================================
   CONNECTION EVENTS
========================================================= */

mongoose.connection.on("error", function (error) {
  console.error("MongoDB connection error:", error.message);
});

mongoose.connection.on("disconnected", function () {
  /*
   * Allow a future request to reconnect.
   */

  connectionPromise = null;

  console.warn("MongoDB Atlas disconnected");
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = connectDatabase;
