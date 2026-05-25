import { Router } from "express";
import { handleChatMessage } from "./chatbotController.js";

const router = Router();

// Public endpoint — no auth middleware
router.post("/message", handleChatMessage);

export default router;
