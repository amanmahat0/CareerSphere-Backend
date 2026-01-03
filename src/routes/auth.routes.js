import express from "express";
import { 
  signup, 
  login, 
  forgotPassword, 
  verifyCode, 
  resetPassword,
  googleAuth
} from "../controllers/auth.controller.js";

const router = express.Router();

// Registration and Authentication
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth); // Google OAuth signup/login

// Password Reset Flow
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

export default router;
