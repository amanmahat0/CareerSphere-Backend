import express from "express";
import { 
    submitContactForm, 
    getAllContacts, 
    updateContactStatus 
} from "../controllers/contact.controller.js";

const router = express.Router();

// Public route - submit contact form
router.post("/", submitContactForm);

// Admin routes
router.get("/", getAllContacts);
router.patch("/:id", updateContactStatus);

export default router;
