const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT || 587),

  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",

  auth: {
    user: process.env.SMTP_USER,

    pass: process.env.SMTP_PASS,
  },
});

/* =========================================================
   VERIFY SMTP
========================================================= */

async function verifyMailer() {
  await transporter.verify();

  console.log("SMTP mailer ready");
}

/* =========================================================
   SEND OTP
========================================================= */

async function sendOtpEmail({ to, code }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,

    to,

    subject: "Verify Your Email",

    text:
      `Your First Credit Merchant verification code is ${code}. ` +
      "This code expires in 10 minutes.",

    html: `
            <div
                style="
                    font-family: Arial, sans-serif;
                    max-width: 560px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #111827;
                "
            >

                <h2>
                    Verify Your Email
                </h2>


                <p>
                    Use the following verification
                    code to complete your registration.
                </p>


                <div
                    style="
                        background: #f3f4f6;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        margin: 24px 0;
                    "
                >

                    <span
                        style="
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                        "
                    >
                        ${code}
                    </span>

                </div>


                <p>
                    The code expires in 10 minutes
                    and can only be used once.
                </p>


                <p
                    style="
                        color: #6b7280;
                        font-size: 13px;
                    "
                >
                    If you did not attempt to create
                    an account, ignore this email.
                </p>

            </div>
        `,
  });
}

module.exports = {
  transporter,
  verifyMailer,
  sendOtpEmail,
};
