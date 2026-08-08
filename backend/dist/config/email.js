"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const sendOTPEmail = async (email, name, otp) => {
    console.log("========================================");
    console.log("Sending OTP email...");
    console.log("To:", email);
    console.log("Name:", name);
    console.log("OTP:", otp);
    console.log("From:", EMAIL_FROM);
    console.log("========================================");
    // Check Resend API key
    if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is missing!");
        // Development fallback
        if (process.env.NODE_ENV !== "production") {
            console.log("DEVELOPMENT OTP LOG");
            console.log("To:", email);
            console.log("Name:", name);
            console.log("OTP:", otp);
            return {
                id: "dev_mock_id",
            };
        }
        throw new Error("RESEND_API_KEY is not configured");
    }
    try {
        const { data, error } = await resend.emails.send({
            from: `Bloomon Family Restaurant <${EMAIL_FROM}>`,
            to: [email],
            subject: "Verify Your Account - Bloomon Family Restaurant",
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Verify Your Account</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #0b0b0b;
              font-family: Arial, Helvetica, sans-serif;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 40px auto;
                background-color: #111111;
                border: 1px solid #2a2a2a;
                border-radius: 12px;
                padding: 40px 30px;
                text-align: center;
              "
            >

              <h1
                style="
                  margin: 0 0 10px 0;
                  color: #c5a059;
                  font-size: 28px;
                  letter-spacing: 2px;
                "
              >
                BLOOMON FAMILY RESTAURANT
              </h1>

              <p
                style="
                  color: #999999;
                  font-size: 13px;
                  letter-spacing: 2px;
                  margin-bottom: 35px;
                "
              >
                JOIN WARANGAL'S FINEST DINER
              </p>

              <h2
                style="
                  color: #ffffff;
                  font-size: 22px;
                  margin-bottom: 15px;
                "
              >
                Hello ${name},
              </h2>

              <p
                style="
                  color: #cccccc;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                Thank you for creating an account with
                <strong style="color: #c5a059;">
                  Bloomon Family Restaurant
                </strong>.
              </p>

              <p
                style="
                  color: #cccccc;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                Please use the verification code below to complete your
                registration.
              </p>

              <div
                style="
                  margin: 35px 0;
                  padding: 25px;
                  background-color: #1a1a1a;
                  border: 1px solid #c5a059;
                  border-radius: 10px;
                "
              >
                <p
                  style="
                    margin: 0 0 12px 0;
                    color: #999999;
                    font-size: 13px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                  "
                >
                  Verification Code
                </p>

                <div
                  style="
                    font-size: 40px;
                    font-weight: bold;
                    letter-spacing: 10px;
                    color: #c5a059;
                  "
                >
                  ${otp}
                </div>
              </div>

              <p
                style="
                  color: #aaaaaa;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                This verification code is valid for
                <strong style="color: #ffffff;">
                  5 minutes
                </strong>.
              </p>

              <p
                style="
                  color: #777777;
                  font-size: 13px;
                  line-height: 1.6;
                  margin-top: 30px;
                "
              >
                If you did not create an account with us, you can safely
                ignore this email.
              </p>

              <hr
                style="
                  border: none;
                  border-top: 1px solid #2a2a2a;
                  margin: 35px 0;
                "
              />

              <p
                style="
                  color: #c5a059;
                  font-size: 14px;
                  margin: 0;
                "
              >
                Bloomon Family Restaurant
              </p>

              <p
                style="
                  color: #666666;
                  font-size: 12px;
                  margin-top: 8px;
                "
              >
                Taste Royal Luxury
              </p>

            </div>
          </body>
        </html>
      `,
        });
        if (error) {
            console.error("Resend API Error:");
            console.error(error);
            throw new Error(error.message || "Failed to send OTP email");
        }
        console.log("========================================");
        console.log("OTP EMAIL SENT SUCCESSFULLY");
        console.log("Email ID:", data?.id);
        console.log("To:", email);
        console.log("========================================");
        return data;
    }
    catch (err) {
        console.error("========================================");
        console.error("RESEND ERROR");
        console.error(err);
        console.error("========================================");
        throw new Error(err?.message || "Failed to send OTP email");
    }
};
exports.sendOTPEmail = sendOTPEmail;
