import express from "express";
import { chat } from "../controllers/chat.controller.js";
import auth from "../middlewares/auth.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

router.use(auth);
router.use(requireRole(["applicant"]));

router.post("/", chat);

export default router;
