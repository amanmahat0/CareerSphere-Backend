import Certificate from "../models/Certificate.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import path from "path";

// Admin: upload and issue a certificate to a user or company
export const issueCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Certificate file is required" });
    }

    const { recipientId, title, description } = req.body;

    if (!recipientId || !title) {
      return res.status(400).json({ success: false, message: "recipientId and title are required" });
    }

    const recipient = await User.findById(recipientId).select("fullname companyName userType");
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    const recipientType = recipient.userType === "institution" ? "institution" : "applicant";

    const fileUrl = `/uploads/certificates/${req.file.filename}`;

    const certificate = await Certificate.create({
      recipientId,
      recipientType,
      title,
      description: description || "",
      fileUrl,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      issuedBy: req.userId,
    });

    // In-app notification
    await Notification.create({
      userId: recipientId,
      role: recipientType === "institution" ? "company" : "applicant",
      type: "certificate_issued",
      message: `You have received a new certificate: "${title}". Check your certificates section to view and download it.`,
    });

    res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      certificate,
    });
  } catch (error) {
    console.error("Error issuing certificate:", error);
    res.status(500).json({ success: false, message: "Failed to issue certificate", error: error.message });
  }
};

// Admin: get all issued certificates (optionally filter by recipient)
export const getAllCertificates = async (req, res) => {
  try {
    const { recipientId } = req.query;
    const filter = recipientId ? { recipientId } : {};

    const certificates = await Certificate.find(filter)
      .populate("recipientId", "fullname companyName email userType")
      .populate("issuedBy", "fullname")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch certificates", error: error.message });
  }
};

// Admin: delete a certificate
export const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findByIdAndDelete(id);
    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }
    res.status(200).json({ success: true, message: "Certificate deleted" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ success: false, message: "Failed to delete certificate", error: error.message });
  }
};

// User/Company: get own certificates (received)
export const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ recipientId: req.userId })
      .populate("issuedBy", "fullname companyName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    console.error("Error fetching my certificates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch certificates", error: error.message });
  }
};

// Company: get certificates issued by this company
export const getIssuedCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ issuedBy: req.userId })
      .populate("recipientId", "fullname email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    console.error("Error fetching issued certificates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch issued certificates", error: error.message });
  }
};
