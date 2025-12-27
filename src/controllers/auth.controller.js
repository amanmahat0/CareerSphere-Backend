import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// Helper function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    // Check if user already exists
    const existing = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { phonenumber } 
      ] 
    });
    
    if (existing) {
      return res.status(409).json({ 
        message: existing.email === email.toLowerCase() 
          ? "Email already in use" 
          : "Phone number already in use" 
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullname,
      email: email.toLowerCase(),
      phonenumber,
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

    // Verify password
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
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 10); // Code expires in 10 minutes

    // Save code to user
    user.resetPasswordCode = verificationCode;
    user.resetPasswordCodeExpiry = codeExpiry;
    await user.save();

    // TODO: Send email with verification code
    // For now, we'll log it (remove in production)
    console.log(`Verification code for ${email}: ${verificationCode}`);

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

export default { signup, login, forgotPassword, verifyCode, resetPassword };
