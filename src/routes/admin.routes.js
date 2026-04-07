import express from "express";
import {
  getAllApplicants,
  createApplicant,
  updateApplicant,
  deleteApplicant,
  getAllCompanies,
  getCompanyDetails,
  createCompany,
  updateCompany,
  verifyCompany,
  rejectCompany,
  deleteCompany,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Applicant management routes
router.get("/applicants", getAllApplicants);
router.post("/applicants", createApplicant);
router.put("/applicants/:id", updateApplicant);
router.delete("/applicants/:id", deleteApplicant);

// Company management routes
router.get("/companies", getAllCompanies);
router.post("/companies", createCompany);
router.get("/companies/:id", getCompanyDetails);
router.put("/companies/:id", updateCompany);
router.post("/companies/:id/verify", verifyCompany);
router.post("/companies/:id/reject", rejectCompany);
router.delete("/companies/:id", deleteCompany);

export default router;
