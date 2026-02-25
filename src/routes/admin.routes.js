import express from "express";
import {
  getAllApplicants,
  createApplicant,
  updateApplicant,
  deleteApplicant,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Applicant management routes
router.get("/applicants", getAllApplicants);
router.post("/applicants", createApplicant);
router.put("/applicants/:id", updateApplicant);
router.delete("/applicants/:id", deleteApplicant);

export default router;
