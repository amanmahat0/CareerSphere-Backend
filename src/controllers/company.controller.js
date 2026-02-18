import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  return jwt.verify(token, process.env.JWT_SECRET || "secret");
};

// Get company profile
export const getProfile = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded.id).select("-password -resetPasswordCode -resetPasswordCodeExpiry");
    
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
    res.status(401).json({ message: error.message || "Authentication failed" });
  }
};

// Update company profile
export const updateProfile = async (req, res) => {
  try {
    const decoded = verifyToken(req);
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

    // Check if user is a company
    const existingUser = await User.findById(decoded.id);
    if (!existingUser || existingUser.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    const updateData = {};
    
    // Handle both name formats (contact person name)
    if (name || fullname) {
      updateData.fullname = name || fullname;
    }
    
    if (email) {
      // Check if email is already in use by another user
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: decoded.id } });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use by another user" });
      }
      updateData.email = email.toLowerCase();
    }
    
    // Handle both phone formats
    if (phone || phonenumber) {
      const phoneValue = phone || phonenumber;
      // Check if phone is already in use by another user
      const existingPhone = await User.findOne({ phonenumber: phoneValue, _id: { $ne: decoded.id } });
      if (existingPhone) {
        return res.status(409).json({ message: "Phone number already in use by another user" });
      }
      updateData.phonenumber = phoneValue;
    }
    
    if (address !== undefined) {
      updateData.address = address;
    }

    // Company specific fields
    if (companyName !== undefined) {
      updateData.companyName = companyName;
    }

    if (companySize !== undefined) {
      updateData.companySize = companySize;
    }

    if (website !== undefined) {
      updateData.website = website;
    }

    if (aboutCompany !== undefined) {
      updateData.aboutCompany = aboutCompany;
    }

    if (socialMedia) {
      updateData.socialMedia = {
        facebook: socialMedia.facebook ?? existingUser.socialMedia?.facebook ?? "",
        instagram: socialMedia.instagram ?? existingUser.socialMedia?.instagram ?? "",
        linkedin: socialMedia.linkedin ?? existingUser.socialMedia?.linkedin ?? "",
      };
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
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
    const decoded = verifyToken(req);
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate the URL for the uploaded file
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    // Get old profile picture path to delete it
    const user = await User.findById(decoded.id);
    
    if (!user || user.userType !== "institution") {
      // Delete uploaded file
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

    // Update user with new profile picture
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
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
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || "Failed to upload company logo" });
  }
};

// Delete company logo/profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    // Delete the file if it exists
    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update user to remove profile picture
    await User.findByIdAndUpdate(
      decoded.id,
      { $set: { profilePicture: null } }
    );

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
    const decoded = verifyToken(req);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType !== "institution") {
      return res.status(403).json({ message: "Access denied. This endpoint is for companies only." });
    }

    // Check if user is Google authenticated
    if (user.isGoogleAuth && !user.password) {
      return res.status(400).json({ 
        message: "Password change is not available for Google-authenticated accounts" 
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: error.message || "Failed to change password" });
  }
};
