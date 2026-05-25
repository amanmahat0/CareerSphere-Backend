import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import dotenv from "dotenv";
import { sendVerificationEmail, generateVerificationCode } from "../middlewares/emailService.js";
dotenv.config();

// Signup for both Applicant and Institution
export const signup = async (req, res) => {
  try {
    const { fullname, email, phonenumber, password, userType } = req.body;

    // Validation
    if (!fullname || !email || !phonenumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate userType
    const validUserType = ["applicant", "institution", "admin"].includes(userType) ? userType : "applicant";
    
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

    // Create user object with optional companyName for institutions
    const userData = {
      fullname,
      email: email.toLowerCase(),
      phonenumber: trimmedPhoneNumber,
      password: hashed,
      userType: validUserType,
    };

    // Set companyName for institution/company users
    if (validUserType === "institution") {
      userData.companyName = fullname;
    }

    const user = await User.create(userData);

    // Generate token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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

    console.log(`[forgotPassword] Request for email=${email} userType=${userType}`);

    const user = await User.findOne({
      email: email.toLowerCase(),
      userType: userType || "applicant"
    });

    if (!user) {
      const anyUser = await User.findOne({ email: email.toLowerCase() });
      console.log(`[forgotPassword] User not found for userType=${userType}. Exists with different userType: ${anyUser ? anyUser.userType : "no"}`);
      return res.status(200).json({
        message: "If the email exists, a verification code has been sent"
      });
    }

    console.log(`[forgotPassword] User found: ${user._id}, sending email...`);

    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 5);

    user.resetPasswordCode = verificationCode;
    user.resetPasswordCodeExpiry = codeExpiry;
    await user.save();

    const emailSent = await sendVerificationEmail(email, verificationCode, user.fullname);
    console.log(`[forgotPassword] Email sent: ${emailSent}`);

    return res.status(200).json({
      message: "If the email exists, a verification code has been sent",
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
        process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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
