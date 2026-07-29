import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const EMAIL_FROM =
  process.env.EMAIL_FROM || "bloomonrestaurant@gmail.com";

export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<any> => {
  if (process.env.NODE_ENV === "development") {
    console.log(`
========================================
[DEVELOPMENT OTP LOG]

To: ${email}
Name: ${name}
OTP: ${otp}

========================================
`);
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify Your Bloomon Family Restaurant Account</title>

<style>
body{
margin:0;
padding:0;
background:#0b0f17;
font-family:Arial,Helvetica,sans-serif;
color:#ffffff;
}

.container{
max-width:600px;
margin:30px auto;
background:#111827;
border-radius:12px;
overflow:hidden;
border:1px solid rgba(197,160,89,.25);
}

.header{
padding:35px;
text-align:center;
background:#0b0f17;
border-bottom:1px solid rgba(197,160,89,.2);
}

.logo{
font-size:28px;
font-weight:bold;
letter-spacing:3px;
color:#c5a059;
}

.subtitle{
margin-top:6px;
font-size:11px;
letter-spacing:4px;
color:#999;
text-transform:uppercase;
}

.content{
padding:40px;
}

h1{
margin-top:0;
color:#ffffff;
font-size:24px;
}

p{
font-size:15px;
line-height:1.7;
color:#d1d5db;
}

.otp-box{
margin:35px 0;
padding:25px;
background:#0b0f17;
border:1px solid rgba(197,160,89,.35);
border-radius:10px;
text-align:center;
}

.otp{
font-size:42px;
font-weight:bold;
letter-spacing:12px;
color:#c5a059;
}

.expire{
margin-top:10px;
font-size:13px;
color:#9ca3af;
}

.footer{
padding:30px;
text-align:center;
background:#0b0f17;
border-top:1px solid rgba(197,160,89,.15);
font-size:12px;
color:#9ca3af;
}
</style>
</head>

<body>

<div class="container">

<div class="header">
<div class="logo">BLOOMON FAMILY RESTAURANT</div>
<div class="subtitle">Warangal's Finest Diner</div>
</div>

<div class="content">

<h1>Hello ${name},</h1>

<p>
Thank you for registering with
<b>Bloomon Family Restaurant.</b>
</p>

<p>
Use the verification code below to complete your registration.
</p>

<div class="otp-box">
<div class="otp">${otp}</div>
<div class="expire">
This OTP is valid for <b>5 minutes</b>.
</div>
</div>

<p>
If you did not request this verification code,
please ignore this email.
</p>

<p>
Thank you for choosing Bloomon Family Restaurant.
</p>

</div>

<div class="footer">
© ${new Date().getFullYear()} Bloomon Family Restaurant<br>
Warangal, Telangana, India
</div>

</div>

</body>
</html>
`;

  try {
    const info = await transporter.sendMail({
      from: `"Bloomon Family Restaurant" <${EMAIL_FROM}>`,
      to: email,
      subject: "Verify Your Account - Bloomon Family Restaurant",
      html: htmlContent,
    });

    console.log("Email sent successfully:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Brevo SMTP Error:", error);
    throw error;
  }
};