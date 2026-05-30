import User from "../models/User.model.js";
import Resume from "../models/Resume.model.js";
import CompanyVerification from "../models/CompanyVerification.model.js";
import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";
import Notification from "../models/Notification.model.js";
import Contact from "../models/Contact.model.js";
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

    // Block verification if no documents have been uploaded
    const verificationDoc = await CompanyVerification.findOne({ companyId: id });
    if (!verificationDoc || !verificationDoc.documents || verificationDoc.documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot verify: the company has not uploaded any documents. Ask them to upload verification documents first.",
      });
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

    // Cascade delete: jobs posted by this company
    const companyJobs = await Job.find({ company: company.companyName });
    const jobIds = companyJobs.map(j => j._id);

    // Delete applications for those jobs
    if (jobIds.length > 0) {
      const apps = await Application.find({ jobId: { $in: jobIds } });
      const appIds = apps.map(a => a._id);
      if (appIds.length > 0) {
        await Notification.deleteMany({ applicationId: { $in: appIds } });
        await Application.deleteMany({ jobId: { $in: jobIds } });
      }
      await Job.deleteMany({ _id: { $in: jobIds } });
    }

    // Delete verification records and company account
    await CompanyVerification.deleteOne({ companyId: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Company deleted successfully. Removed ${jobIds.length} job(s) and related applications.`,
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

// Dashboard analytics
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalApplicants,
      totalCompanies,
      verifiedCompanies,
      pendingVerification,
      totalJobs,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      hiredApplications,
      rejectedApplications,
      withdrawnApplications,
      totalContacts,
      unresolvedContacts,
    ] = await Promise.all([
      User.countDocuments({ userType: "applicant" }),
      User.countDocuments({ userType: "institution" }),
      User.countDocuments({ userType: "institution", isVerified: true }),
      User.countDocuments({ userType: "institution", verificationStatus: "pending" }),
      Job.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: "shortlisted" }),
      Application.countDocuments({ status: "hired" }),
      Application.countDocuments({ status: "rejected" }),
      Application.countDocuments({ status: "withdrawn" }),
      Contact.countDocuments(),
      Contact.countDocuments({ status: { $in: ["pending", "read"] } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { totalApplicants, totalCompanies, verifiedCompanies, pendingVerification },
        jobs: { totalJobs },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          shortlisted: shortlistedApplications,
          hired: hiredApplications,
          rejected: rejectedApplications,
          withdrawn: withdrawnApplications,
        },
        support: { totalContacts, unresolvedContacts },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
  }
};

// Get contacts with optional status filter
export const getContacts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const contacts = await Contact.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: contacts, count: contacts.length });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// =====================================================
// ADMIN SETTINGS
// =====================================================

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select("-password -resetPasswordCode -resetPasswordCodeExpiry");
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin profile", error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { fullname, currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const updates = {};

    if (fullname && fullname.trim()) updates.fullname = fullname.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password is required to set a new password" });
      }
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }

    const updated = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true })
      .select("-password -resetPasswordCode -resetPasswordCodeExpiry");

    res.status(200).json({ success: true, message: "Profile updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

export const createAdminAccount = async (req, res) => {
  try {
    const { fullname, email, phonenumber, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const lowerEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      fullname: fullname.trim(),
      email: lowerEmail,
      phonenumber: phonenumber?.trim() || "N/A",
      password: hashedPassword,
      userType: "admin",
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: { id: newAdmin._id, fullname: newAdmin.fullname, email: newAdmin.email, createdAt: newAdmin.createdAt },
    });
  } catch (error) {
    console.error("Error creating admin account:", error);
    res.status(500).json({ success: false, message: "Failed to create admin account", error: error.message });
  }
};

// =====================================================
// ADMIN SEND NOTIFICATION
// =====================================================

export const sendCustomNotification = async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({ success: false, message: "recipientId and message are required" });
    }

    const recipient = await User.findById(recipientId).select("fullname companyName userType");
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    const role = recipient.userType === "institution" ? "company" : "applicant";

    await Notification.create({
      userId: recipientId,
      role,
      type: "admin_notification",
      message: message.trim(),
    });

    res.status(200).json({ success: true, message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false, message: "Failed to send notification", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ userType: { $in: ["applicant", "institution"] } })
      .select("fullname companyName email userType")
      .sort({ userType: 1, fullname: 1 });

    const data = users.map(u => ({
      id: u._id,
      name: u.userType === "institution" ? (u.companyName || u.fullname) : u.fullname,
      email: u.email,
      type: u.userType,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

export const getAllApplicationsAdmin = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("userId", "fullname email phonenumber")
      .populate("jobId", "title company")
      .populate("resumeId")
      .sort({ appliedDate: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error("Error fetching all applications (admin):", error);
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

