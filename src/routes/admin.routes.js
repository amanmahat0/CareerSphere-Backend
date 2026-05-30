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
  getDashboardStats,
  getContacts,
  getAdminProfile,
  updateAdminProfile,
  createAdminAccount,
  sendCustomNotification,
  getAllUsers,
  getAllApplicationsAdmin,
} from "../controllers/admin.controller.js";
import auth from "../middlewares/auth.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

router.use(auth);
router.use(requireRole(["admin"]));

// Dashboard analytics
router.get("/dashboard/stats", getDashboardStats);

// Contact/support with optional ?status= filter
router.get("/contacts", getContacts);

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

// Admin settings
router.get("/settings/profile", getAdminProfile);
router.put("/settings/profile", updateAdminProfile);
router.post("/settings/create-admin", createAdminAccount);

// All applications (for admin interview management)
router.get("/applications", getAllApplicationsAdmin);

// Send custom notification + recipient picker
router.get("/users", getAllUsers);
router.post("/notifications/send", sendCustomNotification);

export default router;
