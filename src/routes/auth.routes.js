import express from "express";
import { 
  signup, 
  login, 
  forgotPassword, 
  verifyCode, 
  resetPassword 
} from "../controllers/auth.controller.js";

const router = express.Router();

// Registration and Authentication
router.post("/signup", signup);
router.post("/login", login);

// Password Reset Flow
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

export default router;
