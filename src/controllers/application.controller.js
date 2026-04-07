import Application from "../models/Application.model.js";
import Resume from "../models/Resume.model.js";
import Job from "../models/Job.model.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "secret");
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token. Please login again.');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired. Please login again.');
    }
    throw error;
  }
};

// Submit job application
export const submitJobApplication = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { jobId, coverLetter } = req.body;

    // Validate input
    if (!jobId || !coverLetter) {
      return res.status(400).json({
        success: false,
        message: "Job ID and cover letter are required",
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user has a completed resume
    const resume = await Resume.findOne({ userId: decoded.id });
    if (!resume || !resume.isComplete) {
      return res.status(400).json({
        success: false,
        message: "Please complete your resume before applying",
      });
    }

    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      jobId: jobId,
      userId: decoded.id,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create new application
    const application = new Application({
      jobId,
      userId: decoded.id,
      resumeId: resume._id,
      coverLetter,
    });

    await application.save();

    // Populate fields for response
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
      { path: "resumeId", select: "personalInfo" },
    ]);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "Error submitting application",
    });
  }
};

// Get user's applications
export const getUserApplications = async (req, res) => {
  try {
    const decoded = verifyToken(req);

    const applications = await Application.find({ userId: decoded.id })
      .populate("jobId", "title company type location salary")
      .populate("userId", "fullname email")
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    
    if (error.message === 'Invalid token. Please login again.' || error.message === 'Token expired. Please login again.') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate("jobId")
      .populate("userId", "fullname email")
      .populate("resumeId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the owner of the application
    if (application.userId._id.toString() !== decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching application",
    });
  }
};

// Update application status (Company/Admin only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ["pending", "shortlisted", "rejected", "accepted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    application.updatedDate = Date.now();
    await application.save();

    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating application",
    });
  }
};

// Withdraw application
export const withdrawApplication = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the owner
    if (application.userId.toString() !== decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    await Application.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error withdrawing application",
    });
  }
};

// Get applications for a job (Company/Admin only)
export const getJobApplications = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { jobId } = req.params;

    const applications = await Application.find({ jobId })
      .populate("userId", "fullname email phonenumber")
      .populate("resumeId")
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching job applications",
    });
  }
};

// Get all applications for company's jobs
export const getCompanyApplications = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const User = (await import("../models/User.model.js")).default;

    // Get company user details
    const company = await User.findById(decoded.id);
    if (!company || !company.companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name not found",
      });
    }

    // Find all jobs posted by this company
    const jobs = await Job.find({ company: company.companyName });
    const jobIds = jobs.map(job => job._id);

    // Find all applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("userId", "fullname email phonenumber")
      .populate("jobId", "title company")
      .populate("resumeId")
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching company applications:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching company applications",
    });
  }
};

// Update interview step
export const updateInterviewStep = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const {
      interviewStep,
      interviewStatus,
      interviewNotes,
      // Test fields
      testType,
      description,
      testDeadline,
      testMode,
      testLink,
      testLocation,
      testResult,
      testFeedback,
      // Interview fields
      interviewType,
      interviewDate,
      interviewTime,
      meetingLink,
      interviewLocation,
      interviewResult,
      interviewFeedback,
      // Offer fields
      salary,
      currency,
      joiningDate,
      benefits,
      contractFile,
      offerResponse,
      offerResponseNotes,
      // Hired fields
      startDate,
      hiredDate,
      hiringSummary,
    } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Update interview workflow fields
    if (interviewStep) application.interviewStep = interviewStep;
    if (interviewStatus) application.interviewStatus = interviewStatus;
    if (interviewNotes !== undefined) application.interviewNotes = interviewNotes;

    // Update test step fields
    if (testType !== undefined) application.testType = testType;
    if (description !== undefined) application.description = description;
    if (testDeadline !== undefined) application.testDeadline = testDeadline ? new Date(testDeadline) : null;
    if (testMode !== undefined) application.testMode = testMode;
    if (testLink !== undefined) application.testLink = testLink;
    if (testLocation !== undefined) application.testLocation = testLocation;
    if (testResult !== undefined) application.testResult = testResult;
    if (testFeedback !== undefined) application.testFeedback = testFeedback;

    // Update interview step fields
    if (interviewType !== undefined) application.interviewType = interviewType;
    if (interviewDate !== undefined) application.interviewDate = interviewDate ? new Date(interviewDate) : null;
    if (interviewTime !== undefined) application.interviewTime = interviewTime;
    if (meetingLink !== undefined) application.meetingLink = meetingLink;
    if (interviewLocation !== undefined) application.interviewLocation = interviewLocation;
    if (interviewResult !== undefined) application.interviewResult = interviewResult;
    if (interviewFeedback !== undefined) application.interviewFeedback = interviewFeedback;

    // Update offer step fields
    if (salary !== undefined) application.salary = salary;
    if (currency !== undefined) application.currency = currency;
    if (joiningDate !== undefined) application.joiningDate = joiningDate ? new Date(joiningDate) : null;
    if (benefits !== undefined) application.benefits = benefits;
    if (contractFile !== undefined) application.contractFile = contractFile;
    if (offerResponse !== undefined) application.offerResponse = offerResponse;
    if (offerResponseNotes !== undefined) application.offerResponseNotes = offerResponseNotes;

    // Update hired step fields
    if (startDate !== undefined) application.startDate = startDate ? new Date(startDate) : null;
    if (hiredDate !== undefined) application.hiredDate = hiredDate ? new Date(hiredDate) : null;
    if (hiringSummary !== undefined) application.hiringSummary = hiringSummary;

    application.updatedDate = Date.now();
    await application.save();

    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    res.status(200).json({
      success: true,
      message: "Interview step updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error updating interview step:", error);
    
    // Handle JWT-related errors
    if (error.message === 'Invalid token. Please login again.' || error.message === 'Token expired. Please login again.') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || "Error updating interview step",
    });
  }
};

// Shortlist and reject applications
export const shortlistApplication = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = "shortlisted";
    application.interviewStep = "shortlisted";
    application.interviewStatus = "pending";
    application.updatedDate = Date.now();
    await application.save();

    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    res.status(200).json({
      success: true,
      message: "Application shortlisted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error shortlisting application:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error shortlisting application",
    });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = "rejected";
    application.updatedDate = Date.now();
    await application.save();

    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error rejecting application",
    });
  }
};
