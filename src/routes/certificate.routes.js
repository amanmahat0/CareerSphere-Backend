import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  issueCertificate,
  getAllCertificates,
  deleteCertificate,
  getMyCertificates,
  getIssuedCertificates,
} from "../controllers/certificate.controller.js";
import auth from "../middlewares/auth.js";
import requireRole from "../middlewares/requireRole.js";

const router = express.Router();

// Ensure upload directory exists
const certificatesDir = path.join(process.cwd(), "uploads", "certificates");
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, certificatesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `cert-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const certificateFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: certificateStorage,
  fileFilter: certificateFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(auth);

// Admin routes
router.get("/", requireRole(["admin"]), getAllCertificates);
router.delete("/:id", requireRole(["admin"]), deleteCertificate);

// Admin + Company: issue a certificate
router.post("/issue", requireRole(["admin", "institution"]), upload.single("certificate"), issueCertificate);

// Company: certificates issued by this company
router.get("/issued", requireRole(["admin", "institution"]), getIssuedCertificates);

// Applicant / Company: view own received certificates
router.get("/mine", getMyCertificates);

export default router;
