const crypto = require("crypto");

const OTP = require("../models/OTP");

const { sendOtpEmail } = require("./mailer");

const OTP_LIFETIME_MINUTES = 10;

const OTP_LIFETIME_MS = OTP_LIFETIME_MINUTES * 60 * 1000;

const OTP_RESEND_SECONDS = 60;

const OTP_MAX_ATTEMPTS = 5;

/* =========================================================
   GENERATE OTP
========================================================= */

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

/* =========================================================
   HASH OTP
========================================================= */

function hashOtpCode(code) {
  if (!process.env.OTP_SECRET) {
    throw new Error("OTP_SECRET is not configured.");
  }

  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(String(code))
    .digest("hex");
}

/* =========================================================
   SECURE HASH COMPARISON
========================================================= */

function compareOtpHash(suppliedHash, storedHash) {
  const suppliedBuffer = Buffer.from(suppliedHash, "hex");

  const storedBuffer = Buffer.from(storedHash, "hex");

  if (suppliedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(suppliedBuffer, storedBuffer);
}

/* =========================================================
   ISSUE OTP
========================================================= */

async function issueOtp({ user, purpose, enforceCooldown = true }) {
  const cooldownStart = new Date(Date.now() - OTP_RESEND_SECONDS * 1000);

  const recentOtp = await OTP.findOne({
    user: user._id,

    purpose,

    usedAt: null,

    createdAt: {
      $gt: cooldownStart,
    },
  }).sort({
    createdAt: -1,
  });

  if (enforceCooldown && recentOtp) {
    const error = new Error(
      `Please wait ${OTP_RESEND_SECONDS} seconds before requesting another code.`,
    );

    error.statusCode = 429;

    throw error;
  }

  /*
   * Only one current unused OTP is kept for
   * each user and purpose.
   */

  await OTP.deleteMany({
    user: user._id,
    purpose,
    usedAt: null,
  });

  const code = generateOtpCode();

  const otpRecord = await OTP.create({
    user: user._id,

    purpose,

    codeHash: hashOtpCode(code),

    expiresAt: new Date(Date.now() + OTP_LIFETIME_MS),
  });

  try {
    await sendOtpEmail({
      to: user.email,
      code,
      purpose,
    });
  } catch (error) {
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    throw error;
  }

  return {
    expiresAt: otpRecord.expiresAt,
  };
}

/* =========================================================
   VERIFY OTP
========================================================= */

async function verifyOtpCode({ userId, purpose, code }) {
  if (!code || !/^\d{6}$/.test(String(code).trim())) {
    return {
      valid: false,
      reason: "invalid",
    };
  }

  const otpRecord = await OTP.findOne({
    user: userId,

    purpose,

    usedAt: null,

    expiresAt: {
      $gt: new Date(),
    },
  })
    .sort({
      createdAt: -1,
    })
    .select("+codeHash");

  if (!otpRecord) {
    return {
      valid: false,
      reason: "expired",
    };
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      valid: false,
      reason: "attempts",
    };
  }

  const suppliedHash = hashOtpCode(String(code).trim());

  const matches = compareOtpHash(suppliedHash, otpRecord.codeHash);

  if (!matches) {
    otpRecord.attempts += 1;

    await otpRecord.save();

    return {
      valid: false,
      reason: "invalid",
    };
  }

  otpRecord.usedAt = new Date();

  await otpRecord.save();

  return {
    valid: true,
    otp: otpRecord,
  };
}

module.exports = {
  OTP_LIFETIME_MINUTES,
  OTP_RESEND_SECONDS,
  OTP_MAX_ATTEMPTS,

  generateOtpCode,
  hashOtpCode,
  issueOtp,
  verifyOtpCode,
};
