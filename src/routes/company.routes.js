import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  changePassword,
  uploadVerificationDocuments,
  getVerificationStatus,
} from "../controllers/company.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.use(auth);

// Ensure uploads directories exist
const profilesDir = path.join(process.cwd(), "uploads", "profiles");
const documentsDir = path.join(process.cwd(), "uploads", "documents");

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `company-${uniqueSuffix}${ext}`);
  },
});

const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
  }
};

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Configure multer for verification documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${ext}`);
  },
});

const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, images, and Word documents are allowed"), false);
  }
};

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Get company profile
router.get("/profile", getProfile);

// Update company profile
router.post("/profile/update", updateProfile);

// Upload company logo
router.post("/profile/picture", profileUpload.single("profilePicture"), uploadProfilePicture);

// Delete company logo
router.delete("/profile/picture", deleteProfilePicture);

// Change password
router.post("/change-password", changePassword);

// Upload verification documents
router.post("/documents/upload", documentUpload.array("documents", 5), uploadVerificationDocuments);

// Get verification status
router.get("/verification-status", getVerificationStatus);

export default router;
