import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_USER!;

export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<any> => {

  if (process.env.NODE_ENV === "development") {
    console.log(`
========================================
[DEVELOPMENT OTP LOG]
To: ${email} (${name})
OTP Code: ${otp}
========================================
`);
  }

  // KEEP YOUR EXISTING HTML TEMPLATE HERE
  const htmlContent = `
    <!-- Paste your existing HTML here exactly as it is -->
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify Your Account - Bloomon Family Restaurant",
      html: htmlContent,
    });

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error: any) {
    console.error("Error sending email via Gmail:", error);

    if (process.env.NODE_ENV === "development") {
      console.warn(
        `WARNING: Gmail failed to send email: ${error.message || error}`
      );

      return {
        success: false,
        simulated: true,
      };
    }

    throw error;
  }
};


const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Bloomon Family Restaurant Account</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0f17;
          color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #111827;
          border: 1px solid rgba(197, 160, 89, 0.2);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        }
        .header {
          background-color: #0b0f17;
          padding: 30px 40px;
          text-align: center;
          border-bottom: 1px solid rgba(197, 160, 89, 0.15);
        }
        .logo-text {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #c5a059;
          text-decoration: none;
          text-transform: uppercase;
        }
        .logo-sub {
          display: block;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #9ca3af;
          margin-top: 4px;
          text-transform: uppercase;
        }
        .content {
          padding: 40px;
          line-height: 1.6;
        }
        h1 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 20px;
        }
        p {
          color: #d1d5db;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .otp-container {
          background-color: #0b0f17;
          border: 1px solid rgba(197, 160, 89, 0.3);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 0.25em;
          color: #c5a059;
          margin: 0;
        }
        .expiry-text {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 10px;
          margin-bottom: 0;
        }
        .footer {
          background-color: #0b0f17;
          padding: 30px 40px;
          text-align: center;
          border-top: 1px solid rgba(197, 160, 89, 0.1);
          font-size: 11px;
          color: #6b7280;
        }
        .footer a {
          color: #c5a059;
          text-decoration: none;
        }
        .security-notice {
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          margin-top: 20px;
          padding-top: 20px;
          font-size: 11px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">Bloomon Family Restaurant</div>
          <div class="logo-sub">Warangal's Finest Diner</div>
        </div>
        <div class="content">
          <h1>Hello, ${name}</h1>
          <p>Thank you for choosing Bloomon Family Restaurant. To proceed with your request, please use the following secure 6-digit verification code:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <p class="expiry-text"><strong>Valid for 5 minutes</strong></p>
          </div>
          
          <p>Enter this verification code on our application to complete your authentication. Please do not share this code with anyone.</p>
          
          <div class="security-notice">
            <strong>Security Notice:</strong> If you did not make this request or sign up for an account, please ignore this email safely.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Bloomon Family Restaurant. All rights reserved.</p>
          <p>Warangal, Telangana, India</p>
        </div>
      </div>
    </body>
    </html>
  `;

try {
  const response = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Verify Your Account - Bloomon Family Restaurant`,
    html: htmlContent,
  });

  if (response.error) {
    throw response.error;
  }

  return response.data;
} catch (error: any) {
  console.error('Error sending email via Resend:', error);

  // In local development, gracefully fall back to the console logs instead of blocking registration
  if (process.env.NODE_ENV === 'development') {
    console.warn(`WARNING: Resend failed to send email: ${error.message || error}. Falling back to simulated delivery since NODE_ENV is development.`);
    return { id: 'mock-id', simulated: true };
  }

  throw error;
}
};
