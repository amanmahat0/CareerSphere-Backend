import express from "express";
import * as applicationController from "../controllers/application.controller.js";
import auth from "../middlewares/auth.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

router.use(auth);

// Apply for a job
router.post("/submit", applicationController.submitJobApplication);

// Get user's applications (applicant view)
router.get("/", applicationController.getUserApplications);

// Get interview schedules (applicant view)
router.get("/interviews/schedule", applicationController.getInterviewSchedule);

// Get all applications for company's jobs (company view) - must be before /:id
router.get("/company/all", applicationController.getCompanyApplications);

// Get schedule for a specific date (conflict detection)
router.get("/company/schedule", applicationController.getScheduleForDate);

// Get company analytics
router.get("/company/analytics", applicationController.getCompanyAnalytics);

// Get applications for a specific job - must be before /:id
router.get("/job/:jobId", applicationController.getJobApplications);

// Update application status
router.put("/:id/status", applicationController.updateApplicationStatus);

// NEW STEP-SPECIFIC ENDPOINTS
// Test assignment
router.put("/:id/interview/test", applicationController.handleTestAssignment);

// Test result submission
router.put("/:id/interview/test-result", applicationController.handleTestResult);

// Test submission tracking (applicant marks as submitted)
router.put("/:id/test-submitted", applicationController.markTestSubmitted);

// Interview scheduling
router.put("/:id/interview/schedule", applicationController.handleInterviewSchedule);

// Interview result submission
router.put("/:id/interview/result", applicationController.handleInterviewResult);

// Offer sending - RBAC: company or admin only
router.put("/:id/interview/offer", requireRole(['admin', 'institution']), applicationController.handleOfferSend);

// Offer response (applicant accepting/rejecting/negotiating) — applicants only
router.put("/:id/interview/offer-response", requireRole(["applicant"]), applicationController.handleOfferResponse);

// Hire confirmation - RBAC: company or admin only
router.put("/:id/interview/hire", requireRole(['admin', 'institution']), applicationController.handleHireConfirmation);

// Withdraw application
router.post("/:id/withdraw", applicationController.withdrawApplication);

// Get audit log for an application
router.get("/:id/audit-log", applicationController.getApplicationAuditLog);

// OLD DEPRECATED ENDPOINT - routes to new handlers for backward compatibility
// Update interview step
router.put("/:id/interview", applicationController.updateInterviewStep);

// Shortlist application
router.put("/:id/shortlist", applicationController.shortlistApplication);

// Reject application
router.put("/:id/reject", applicationController.rejectApplication);

// Get application by ID - must be last to not conflict with other routes
router.get("/:id", applicationController.getApplicationById);

export default router;
