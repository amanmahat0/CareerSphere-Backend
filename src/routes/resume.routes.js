import express from "express";
import * as resumeController from "../controllers/resume.controller.js";

const router = express.Router();

// GET resume
router.get("/", resumeController.getResume);

// Save/Update entire resume
router.post("/save", resumeController.saveResume);

// Personal Info
router.put("/personal-info", resumeController.updatePersonalInfo);

// Education
router.post("/education", resumeController.addEducation);
router.put("/education/:educationId", resumeController.updateEducation);
router.delete("/education/:educationId", resumeController.deleteEducation);

// Experience
router.post("/experience", resumeController.addExperience);
router.put("/experience/:experienceId", resumeController.updateExperience);
router.delete("/experience/:experienceId", resumeController.deleteExperience);

// Skills
router.put("/skills", resumeController.updateSkills);

// Projects
router.post("/projects", resumeController.addProject);
router.delete("/projects/:projectId", resumeController.deleteProject);

// Certifications
router.post("/certifications", resumeController.addCertification);
router.delete("/certifications/:certificationId", resumeController.deleteCertification);

// Mark as complete
router.put("/mark-complete", resumeController.markAsComplete);

export default router;
