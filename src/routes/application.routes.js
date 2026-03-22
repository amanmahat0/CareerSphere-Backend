import express from "express";
import * as applicationController from "../controllers/application.controller.js";

const router = express.Router();

// Apply for a job
router.post("/submit", applicationController.submitJobApplication);

// Get user's applications (applicant view)
router.get("/", applicationController.getUserApplications);

// Get all applications for company's jobs (company view) - must be before /:id
router.get("/company/all", applicationController.getCompanyApplications);

// Get applications for a specific job - must be before /:id
router.get("/job/:jobId", applicationController.getJobApplications);

// Update application status
router.put("/:id/status", applicationController.updateApplicationStatus);

// Withdraw application
router.delete("/:id", applicationController.withdrawApplication);

// Get application by ID - must be last to not conflict with other routes
router.get("/:id", applicationController.getApplicationById);

export default router;
