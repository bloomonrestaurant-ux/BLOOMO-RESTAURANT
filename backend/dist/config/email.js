"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const sendOTPEmail = async (email, name, otp) => {
    // In development, just log the OTP and return success to avoid Resend sandbox limits!
    if (process.env.NODE_ENV === "development") {
        console.log(`
========================================
[DEVELOPMENT OTP LOG]

To: ${email}
Name: ${name}
OTP: ${otp}

========================================
`);
        return { id: "dev_mock_id" };
    }
    try {
        const { data, error } = await resend.emails.send({
            from: `Bloomon Family Restaurant <${EMAIL_FROM}>`,
            to: email,
            subject: "Verify Your Account - Bloomon Family Restaurant",
            html: `
      <div style="font-family:Arial;padding:30px;background:#111;color:#fff">
        <h2>Hello ${name},</h2>

        <p>Your verification code is:</p>

        <div style="
          font-size:40px;
          font-weight:bold;
          letter-spacing:10px;
          color:#c5a059;
          margin:30px 0;
        ">
          ${otp}
        </div>

        <p>This OTP is valid for 5 minutes.</p>

        <p>Bloomon Family Restaurant</p>
      </div>
      `,
        });
        if (error) {
            console.error(error);
            throw error;
        }
        console.log("Email sent:", data);
        return data;
    }
    catch (err) {
        console.error("Resend Error:", err);
        throw err;
    }
};
exports.sendOTPEmail = sendOTPEmail;
