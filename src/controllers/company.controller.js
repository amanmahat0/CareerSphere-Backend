import User from "../models/User.model.js";
import CompanyVerification from "../models/CompanyVerification.model.js";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

// Get company profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.fullname,
        fullname: user.fullname,
        email: user.email,
        phone: user.phonenumber,
        phonenumber: user.phonenumber,
        address: user.address || "",
        companyName: user.companyName || "",
        companySize: user.companySize || "",
        website: user.website || "",
        aboutCompany: user.aboutCompany || "",
        socialMedia: {
          facebook: user.socialMedia?.facebook || "",
          instagram: user.socialMedia?.instagram || "",
          linkedin: user.socialMedia?.linkedin || "",
        },
        profilePicture: user.profilePicture,
        isGoogleAuth: user.isGoogleAuth,
        userType: user.userType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ message: error.message || "Failed to fetch profile" });
  }
};

// Update company profile
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      fullname,
      email,
      phone,
      phonenumber,
      address,
      companyName,
      companySize,
      website,
      aboutCompany,
      socialMedia
    } = req.body;

    const existingUser = await User.findById(req.userId);
    if (!existingUser || existingUser.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    const updateData = {};

    if (name || fullname) {
      updateData.fullname = name || fullname;
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.userId } });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use by another user" });
      }
      updateData.email = email.toLowerCase();
    }

    if (phone || phonenumber) {
      const phoneValue = phone || phonenumber;
      const existingPhone = await User.findOne({ phonenumber: phoneValue, _id: { $ne: req.userId } });
      if (existingPhone) {
        return res.status(409).json({ message: "Phone number already in use by another user" });
      }
      updateData.phonenumber = phoneValue;
    }

    if (address !== undefined) updateData.address = address;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companySize !== undefined) updateData.companySize = companySize;
    if (website !== undefined) updateData.website = website;
    if (aboutCompany !== undefined) updateData.aboutCompany = aboutCompany;

    if (socialMedia) {
      updateData.socialMedia = {
        facebook: socialMedia.facebook ?? existingUser.socialMedia?.facebook ?? "",
        instagram: socialMedia.instagram ?? existingUser.socialMedia?.instagram ?? "",
        linkedin: socialMedia.linkedin ?? existingUser.socialMedia?.linkedin ?? "",
      };
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.fullname,
        fullname: user.fullname,
        email: user.email,
        phone: user.phonenumber,
        phonenumber: user.phonenumber,
        address: user.address || "",
        companyName: user.companyName || "",
        companySize: user.companySize || "",
        website: user.website || "",
        aboutCompany: user.aboutCompany || "",
        socialMedia: {
          facebook: user.socialMedia?.facebook || "",
          instagram: user.socialMedia?.instagram || "",
          linkedin: user.socialMedia?.linkedin || "",
        },
        profilePicture: user.profilePicture,
        isGoogleAuth: user.isGoogleAuth,
        userType: user.userType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};

// Upload company logo/profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findById(req.userId);

    if (!user || user.userType !== "institution") {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const oldPath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profilePicture: profilePictureUrl } },
      { new: true }
    ).select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    res.status(200).json({
      success: true,
      message: "Company logo uploaded successfully",
      data: {
        profilePicture: updatedUser.profilePicture
      }
    });
  } catch (error) {
    console.error("Error uploading company logo:", error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || "Failed to upload company logo" });
  }
};

// Delete company logo/profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await User.findByIdAndUpdate(req.userId, { $set: { profilePicture: null } });

    res.status(200).json({
      success: true,
      message: "Company logo deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting company logo:", error);
    res.status(500).json({ message: error.message || "Failed to delete company logo" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    if (user.isGoogleAuth && !user.password) {
      return res.status(400).json({
        message: "Password change is not available for Google-authenticated accounts"
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.userId, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: error.message || "Failed to change password" });
  }
};

// Upload verification documents
export const uploadVerificationDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    let verification = await CompanyVerification.findOne({ companyId: req.userId });

    if (!verification) {
      verification = new CompanyVerification({ companyId: req.userId });
    }

    const newDocuments = req.files.map((file, index) => ({
      filename: file.filename,
      originalName: file.originalname,
      documentType: req.body.documentTypes?.[index] || "other",
      filePath: `/uploads/documents/${file.filename}`,
      uploadedAt: new Date(),
    }));

    verification.documents = [...(verification.documents || []), ...newDocuments];
    verification.verificationStatus = "pending";
    await verification.save();

    if (user.verificationStatus === "rejected") {
      user.verificationStatus = "pending";
      user.rejectionReason = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${newDocuments.length} document(s)`,
      data: {
        documents: verification.documents,
        verificationStatus: verification.verificationStatus,
      }
    });
  } catch (error) {
    console.error("Error uploading verification documents:", error);
    if (req.files) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ message: error.message || "Failed to upload verification documents" });
  }
};

// Get company verification status and documents
export const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    const verification = await CompanyVerification.findOne({ companyId: req.userId });

    res.status(200).json({
      success: true,
      data: {
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
        documents: verification?.documents || [],
        adminNotes: verification?.adminNotes,
        verifiedAt: verification?.verifiedAt,
      }
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    res.status(500).json({ message: error.message || "Failed to fetch verification status" });
  }
};
