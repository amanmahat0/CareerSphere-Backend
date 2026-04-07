import User from "../models/User.model.js";
import Resume from "../models/Resume.model.js";
import CompanyVerification from "../models/CompanyVerification.model.js";
import bcrypt from "bcrypt";

// Get all applicants
export const getAllApplicants = async (req, res) => {
  try {
    const applicants = await User.find({ userType: "applicant" })
      .select("-password -resetPasswordCode -resetPasswordCodeExpiry")
      .sort({ createdAt: -1 });

    // Fetch resume status for each applicant
    const applicantsWithResume = await Promise.all(
      applicants.map(async (user) => {
        const resume = await Resume.findOne({ userId: user._id });
        return {
          id: user._id,
          name: user.fullname,
          email: user.email,
          phone: user.phonenumber,
          address: user.address || "",
          applicantType: user.applicantType || "Student",
          profilePicture: user.profilePicture,
          isGoogleAuth: user.isGoogleAuth,
          resumeStatus: resume?.isComplete ? "completed" : "pending",
          isResumeCompleted: resume?.isComplete || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: applicantsWithResume,
      count: applicantsWithResume.length,
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

// =====================================================
// COMPANY MANAGEMENT FUNCTIONS
// =====================================================

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await User.find({ userType: "institution" })
      .select("-password -resetPasswordCode -resetPasswordCodeExpiry")
      .sort({ createdAt: -1 });

    // Get verification info for each company
    const companiesWithVerification = await Promise.all(
      companies.map(async (company) => {
        const verification = await CompanyVerification.findOne({ companyId: company._id });
        return {
          id: company._id,
          companyName: company.companyName,
          contactPerson: company.fullname,
          email: company.email,
          phone: company.phonenumber,
          website: company.website,
          industry: company.aboutCompany,
          address: company.address,
          companySize: company.companySize,
          profilePicture: company.profilePicture,
          isVerified: company.isVerified,
          verificationStatus: company.verificationStatus || "pending",
          rejectionReason: company.rejectionReason,
          documentsCount: verification?.documents?.length || 0,
          isGoogleAuth: company.isGoogleAuth,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: companiesWithVerification,
      count: companiesWithVerification.length,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Error fetching companies", error: error.message });
  }
};

// Get company details with verification documents
export const getCompanyDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await User.findById(id)
      .select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.userType !== "institution") {
      return res.status(400).json({ message: "User is not a company" });
    }

    const verification = await CompanyVerification.findOne({ companyId: id })
      .populate("verifiedBy", "fullname email");

    res.status(200).json({
      success: true,
      data: {
        id: company._id,
        companyName: company.companyName,
        contactPerson: company.fullname,
        email: company.email,
        phone: company.phonenumber,
        website: company.website,
        industry: company.aboutCompany,
        address: company.address,
        companySize: company.companySize,
        profilePicture: company.profilePicture,
        socialMedia: company.socialMedia,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
        rejectionReason: company.rejectionReason,
        documents: verification?.documents || [],
        adminNotes: verification?.adminNotes,
        verifiedAt: verification?.verifiedAt,
        verifiedBy: verification?.verifiedBy,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ message: "Error fetching company details", error: error.message });
  }
};

// Verify company
export const verifyCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, adminNotes } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const company = await User.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.userType !== "institution") {
      return res.status(400).json({ message: "User is not a company" });
    }

    // Update company verification status
    company.isVerified = true;
    company.verificationStatus = "approved";
    company.rejectionReason = null;
    await company.save();

    // Update verification document
    let verification = await CompanyVerification.findOne({ companyId: id });
    if (verification) {
      verification.verificationStatus = "approved";
      verification.verifiedAt = new Date();
      verification.verifiedBy = adminId;
      verification.adminNotes = adminNotes || null;
      await verification.save();
    }

    res.status(200).json({
      success: true,
      message: "Company verified successfully",
      data: {
        id: company._id,
        companyName: company.companyName,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Error verifying company:", error);
    res.status(500).json({ message: "Error verifying company", error: error.message });
  }
};

// Reject company
export const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminNotes } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const company = await User.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.userType !== "institution") {
      return res.status(400).json({ message: "User is not a company" });
    }

    // Update company verification status
    company.isVerified = false;
    company.verificationStatus = "rejected";
    company.rejectionReason = reason;
    await company.save();

    // Update verification document
    let verification = await CompanyVerification.findOne({ companyId: id });
    if (verification) {
      verification.verificationStatus = "rejected";
      verification.rejectionReason = reason;
      verification.adminNotes = adminNotes || null;
      await verification.save();
    }

    res.status(200).json({
      success: true,
      message: "Company rejected successfully",
      data: {
        id: company._id,
        companyName: company.companyName,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
        rejectionReason: company.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Error rejecting company:", error);
    res.status(500).json({ message: "Error rejecting company", error: error.message });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await User.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.userType !== "institution") {
      return res.status(400).json({ message: "User is not a company" });
    }

    // Delete associated verification records
    await CompanyVerification.deleteOne({ companyId: id });

    // Delete company user account
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ message: "Error deleting company", error: error.message });
  }
};

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { companyName, email, phonenumber, password } = req.body;

    // Validation
    if (!companyName || !email || !phonenumber || !password) {
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

    // Create new company
    const newCompany = new User({
      companyName: companyName.trim(),
      fullname: companyName.trim(), // Set fullname as company name for contact person
      email: lowerEmail,
      phonenumber: trimmedPhone,
      password: hashedPassword,
      userType: "institution",
      verificationStatus: "pending",
      isVerified: false,
    });

    await newCompany.save();

    // Create verification record
    await CompanyVerification.create({
      companyId: newCompany._id,
      verificationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: {
        id: newCompany._id,
        companyName: newCompany.companyName,
        email: newCompany.email,
        phone: newCompany.phonenumber,
        verificationStatus: newCompany.verificationStatus,
        createdAt: newCompany.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Error creating company", error: error.message });
  }
};

// Update a company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, email, phonenumber, password } = req.body;

    const company = await User.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.userType !== "institution") {
      return res.status(400).json({ message: "User is not a company" });
    }

    const updateData = {};

    if (companyName) {
      updateData.companyName = companyName.trim();
      updateData.fullname = companyName.trim(); // Update fullname as well
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

    const updatedCompany = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: {
        id: updatedCompany._id,
        companyName: updatedCompany.companyName,
        email: updatedCompany.email,
        phone: updatedCompany.phonenumber,
        updatedAt: updatedCompany.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ message: "Error updating company", error: error.message });
  }
};

