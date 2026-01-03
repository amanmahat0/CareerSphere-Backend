import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.model.js";



// Helper function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "careersphere67@gmail.com",
    pass: "fxgb svtu zapr hkdt", // <-- MUST be App Password
  },
});

// Helper function to send verification email
const sendVerificationEmail = async (email, code, fullname) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "noreply@careersphere.com",
    to: email,
    subject: "CareerSphere - Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
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

// Signup for both Applicant and Institution
export const signup = async (req, res) => {
  try {
    const { fullname, email, phonenumber, password, userType } = req.body;

    // Validation
    if (!fullname || !email || !phonenumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate userType
    const validUserType = userType === "institution" ? "institution" : "applicant";
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Trim phone number
    const trimmedPhoneNumber = phonenumber.trim();
    const lowerEmail = email.toLowerCase();

    // Debug logging
    console.log("Attempting signup with:", { fullname, email: lowerEmail, phonenumber: trimmedPhoneNumber });

    // Check if email already exists
    const existingEmail = await User.findOne({ email: lowerEmail });
    if (existingEmail) {
      console.log("Email already exists:", lowerEmail);
      return res.status(409).json({ 
        message: "Email already in use" 
      });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phonenumber: trimmedPhoneNumber });
    if (existingPhone) {
      console.log("Phone number already exists:", trimmedPhoneNumber);
      return res.status(409).json({ 
        message: "Phone number already in use" 
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullname,
      email: email.toLowerCase(),
      phonenumber: trimmedPhoneNumber,
      password: hashed,
      userType: validUserType,
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Return safe user data (without password)
    const safeUser = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      phonenumber: user.phonenumber,
      userType: user.userType,
      profilePicture: user.profilePicture,
      isGoogleAuth: user.isGoogleAuth,
      createdAt: user.createdAt,
    };

    return res.status(201).json({ 
      message: "Account created successfully",
      user: safeUser, 
      token 
    });
  } catch (err) {
    console.error("Signup error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `${field === "email" ? "Email" : "Phone number"} already in use` 
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
};

// Login for both Applicant and Institution
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user signed up with Google
    if (user.isGoogleAuth) {
      return res.status(400).json({ 
        message: "This account was created with Google. Please use Google Sign-In." 
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Return safe user data (without password)
    const safeUser = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      phonenumber: user.phonenumber,
      userType: user.userType,
      profilePicture: user.profilePicture,
      isGoogleAuth: user.isGoogleAuth,
      createdAt: user.createdAt,
    };

    return res.status(200).json({ 
      message: "Login successful",
      user: safeUser, 
      token 
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password - Send verification code
export const forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email and userType
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      userType: userType || "applicant"
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({ 
        message: "If the email exists, a verification code has been sent" 
      });
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 5); // Code expires in 5 minutes

    // Save code to user
    user.resetPasswordCode = verificationCode;
    user.resetPasswordCodeExpiry = codeExpiry;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode, user.fullname);

    return res.status(200).json({ 
      message: "If the email exists, a verification code has been sent",
      // Remove this in production - only for development
      code: process.env.NODE_ENV === "development" ? verificationCode : undefined
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify Code
export const verifyCode = async (req, res) => {
  try {
    const { email, code, userType } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      userType: userType || "applicant"
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if code exists and is valid
    if (!user.resetPasswordCode || !user.resetPasswordCodeExpiry) {
      return res.status(400).json({ message: "No verification code found. Please request a new one." });
    }

    // Check if code has expired
    if (new Date() > user.resetPasswordCodeExpiry) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // Verify code
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Code is valid - return success
    return res.status(200).json({ 
      message: "Verification code is valid",
      verified: true
    });
  } catch (err) {
    console.error("Verify code error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      userType: userType || "applicant"
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if code exists (user must have verified code first)
    if (!user.resetPasswordCode) {
      return res.status(400).json({ message: "Please verify your code first" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(password, 10);

    // Update password and clear reset code
    user.password = hashed;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpiry = null;
    await user.save();

    return res.status(200).json({ 
      message: "Password reset successfully" 
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Google OAuth Signup/Login (ONLY FOR APPLICANTS)
export const googleAuth = async (req, res) => {
  try {
    const { googleId, email, fullname, profilePicture, userType } = req.body;

    // Validation
    if (!googleId || !email || !fullname) {
      return res.status(400).json({ 
        message: "Google ID, email, and fullname are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // IMPORTANT: Google OAuth is ONLY for applicants, not institutions
    if (userType === "institution") {
      return res.status(403).json({ 
        message: "Google Sign-In is only available for applicants. Institutions must use email and password." 
      });
    }

    // Force userType to applicant for Google auth
    const validUserType = "applicant";

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists with Google ID - login
      const token = jwt.sign(
        { id: user._id, userType: user.userType },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      const safeUser = {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phonenumber: user.phonenumber,
        userType: user.userType,
        profilePicture: user.profilePicture,
        isGoogleAuth: user.isGoogleAuth,
        createdAt: user.createdAt,
      };

      return res.status(200).json({
        message: "Login successful",
        user: safeUser,
        token,
      });
    }

    // Check if user exists with this email (but different auth method)
    user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // IMPORTANT: Only link if user is an applicant
      if (user.userType === "institution") {
        return res.status(403).json({ 
          message: "This email is registered as an institution. Google Sign-In is only for applicants." 
        });
      }

      // If user signed up with email/password, prevent Google login with same email
      if (!user.isGoogleAuth) {
        return res.status(409).json({ 
          message: "This email is already registered with email and password. Please use email/password login instead." 
        });
      }

      // User already has Google auth - this shouldn't happen as we checked googleId above
      return res.status(409).json({ 
        message: "An account with this email already exists" 
      });
    }

    // New user - create account with Google
    user = await User.create({
      fullname,
      email: email.toLowerCase(),
      googleId,
      isGoogleAuth: true,
      isVerified: true, // Google accounts are automatically verified
      profilePicture: profilePicture || null,
      userType: validUserType,
      // phonenumber and password are not required for Google auth
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Return safe user data
    const safeUser = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      phonenumber: user.phonenumber,
      userType: user.userType,
      profilePicture: user.profilePicture,
      isGoogleAuth: user.isGoogleAuth,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      message: "Account created successfully with Google",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `${field === "googleId" ? "Google account" : "Email"} already in use`,
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
};

export default { signup, login, forgotPassword, verifyCode, resetPassword, googleAuth };
