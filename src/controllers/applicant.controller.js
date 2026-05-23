import User from "../models/User.model.js";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

// Get applicant profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
        applicantType: user.applicantType || "Student",
        profilePicture: user.profilePicture,
        isGoogleAuth: user.isGoogleAuth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: error.message || "Failed to fetch profile" });
  }
};

// Update applicant profile
export const updateProfile = async (req, res) => {
  try {
    const { name, fullname, email, phone, phonenumber, address, applicantType } = req.body;

    const updateData = {};

    if (name || fullname) {
      updateData.fullname = name || fullname;
    }

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.userId } });
      if (existingUser) {
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

    if (address !== undefined) {
      updateData.address = address;
    }

    if (applicantType) {
      updateData.applicantType = applicantType;
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
        applicantType: user.applicantType || "Student",
        profilePicture: user.profilePicture,
        isGoogleAuth: user.isGoogleAuth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findById(req.userId);
    if (user?.profilePicture && user.profilePicture.startsWith("/uploads/")) {
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

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: profilePictureUrl,
      }
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: error.message || "Failed to upload profile picture" });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const oldPath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await User.findByIdAndUpdate(req.userId, { $set: { profilePicture: null } });

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({ message: error.message || "Failed to delete profile picture" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isGoogleAuth && !user.password) {
      return res.status(400).json({
        message: "Cannot change password for Google authenticated accounts. Please use Google to sign in."
      });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.userId, { $set: { password: hashedPassword } });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: error.message || "Failed to change password" });
  }
};
