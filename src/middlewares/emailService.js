import nodemailer from "nodemailer";

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "careersphere67@gmail.com",
    pass: "fxgb svtu zapr hkdt",
  },
});

// Helper function to generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send verification email
export const sendVerificationEmail = async (email, code, fullname) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "noreply@careersphere.com",
    to: email,
    subject: "CareerSphere - Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 10px; display: block;">
            <g>
              <path d="M3 14C3 7.37258 8.37258 2 15 2H39C45.6274 2 51 7.37258 51 14V38C51 44.6274 45.6274 50 39 50H15C8.37258 50 3 44.6274 3 38V14Z" fill="white" shape-rendering="crispEdges"/>
              <path d="M21 36V18C21 17.4696 21.2107 16.9609 21.5858 16.5858C21.9609 16.2107 22.4696 16 23 16H31C31.5304 16 32.0391 16.2107 32.4142 16.5858C32.7893 16.9609 33 17.4696 33 18V36H21Z" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 26H19C18.4696 26 17.9609 26.2107 17.5858 26.5858C17.2107 26.9609 17 27.4696 17 28V34C17 34.5304 17.2107 35.0391 17.5858 35.4142C17.9609 35.7893 18.4696 36 19 36H21" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M33 23H35C35.5304 23 36.0391 23.2107 36.4142 23.5858C36.7893 23.9609 37 24.4696 37 25V34C37 34.5304 36.7893 35.0391 36.4142 35.4142C36.0391 35.7893 35.5304 36 35 36H33" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25 20H29" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25 24H29" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25 28H29" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25 32H29" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </svg>
          <h1 style="color: white; margin: 0; font-size: 28px;">CareerSphere</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Password Reset Request</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hi <strong>${fullname}</strong>,</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password. Use the verification code below to proceed with resetting your password. This code will expire in <strong>5 minutes</strong>.
          </p>
          <div style="background: white; border: 2px solid #1f3a8a; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <p style="color: #999; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase;">Verification Code</p>
            <p style="color: #1f3a8a; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
          </div>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
            <p style="color: #856404; font-size: 13px; margin: 0;">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. CareerSphere support will never ask for your verification code.
            </p>
          </div>
          <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
            If you didn't request this password reset, you can safely ignore this email. Your account will remain secure.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            © 2024 CareerSphere. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export default { generateVerificationCode, sendVerificationEmail };
