import User from "../models/User.model.js";
import bcrypt from "bcrypt";

// Get all applicants
export const getAllApplicants = async (req, res) => {
  try {
    const applicants = await User.find({ userType: "applicant" })
      .select("-password -resetPasswordCode -resetPasswordCodeExpiry")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applicants.map(user => ({
        id: user._id,
        name: user.fullname,
        email: user.email,
        phone: user.phonenumber,
        address: user.address || "",
        applicantType: user.applicantType || "Student",
        profilePicture: user.profilePicture,
        isGoogleAuth: user.isGoogleAuth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      count: applicants.length,
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Error fetching applicants", error: error.message });
  }
};

// Create a new applicant
export const createApplicant = async (req, res) => {
  try {
    const { fullname, email, phonenumber, password } = req.body;

    // Validation
    if (!fullname || !email || !phonenumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const lowerEmail = email.toLowerCase();
    const trimmedPhone = phonenumber.trim();

    // Check if email already exists
    const existingEmail = await User.findOne({ email: lowerEmail });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phonenumber: trimmedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new applicant
    const newApplicant = new User({
      fullname: fullname.trim(),
      email: lowerEmail,
      phonenumber: trimmedPhone,
      password: hashedPassword,
      userType: "applicant",
      applicantType: "Student",
    });

    await newApplicant.save();

    res.status(201).json({
      success: true,
      message: "Applicant created successfully",
      data: {
        id: newApplicant._id,
        name: newApplicant.fullname,
        email: newApplicant.email,
        phone: newApplicant.phonenumber,
        applicantType: newApplicant.applicantType,
        createdAt: newApplicant.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating applicant:", error);
    res.status(500).json({ message: "Error creating applicant", error: error.message });
  }
};

// Update an applicant
export const updateApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, phonenumber, password } = req.body;

    const applicant = await User.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    if (applicant.userType !== "applicant") {
      return res.status(400).json({ message: "User is not an applicant" });
    }

    const updateData = {};

    if (fullname) {
      updateData.fullname = fullname.trim();
    }

    if (email) {
      const lowerEmail = email.toLowerCase();
      // Check if email is used by another user
      const existingEmail = await User.findOne({ email: lowerEmail, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use by another user" });
      }
      updateData.email = lowerEmail;
    }

    if (phonenumber) {
      const trimmedPhone = phonenumber.trim();
      // Check if phone is used by another user
      const existingPhone = await User.findOne({ phonenumber: trimmedPhone, _id: { $ne: id } });
      if (existingPhone) {
        return res.status(409).json({ message: "Phone number already in use by another user" });
      }
      updateData.phonenumber = trimmedPhone;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedApplicant = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    res.status(200).json({
      success: true,
      message: "Applicant updated successfully",
      data: {
        id: updatedApplicant._id,
        name: updatedApplicant.fullname,
        email: updatedApplicant.email,
        phone: updatedApplicant.phonenumber,
        applicantType: updatedApplicant.applicantType,
        updatedAt: updatedApplicant.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating applicant:", error);
    res.status(500).json({ message: "Error updating applicant", error: error.message });
  }
};

// Delete an applicant
export const deleteApplicant = async (req, res) => {
  try {
    const { id } = req.params;

    const applicant = await User.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    if (applicant.userType !== "applicant") {
      return res.status(400).json({ message: "User is not an applicant" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Applicant deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting applicant:", error);
    res.status(500).json({ message: "Error deleting applicant", error: error.message });
  }
};
