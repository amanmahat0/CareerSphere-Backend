import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all notifications for logged-in user
router.get("/", getNotifications);

// Mark a single notification as read
router.put("/:id/read", markAsRead);

// Mark all notifications as read
router.put("/read-all", markAllAsRead);

export default router;
