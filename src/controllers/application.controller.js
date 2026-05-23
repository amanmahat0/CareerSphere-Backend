import Application from "../models/Application.model.js";
import Resume from "../models/Resume.model.js";
import Job from "../models/Job.model.js";
import { createNotification } from "../services/notification.service.js";

// Submit job application
export const submitJobApplication = async (req, res) => {
  try {

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
    const resume = await Resume.findOne({ userId: req.userId });
    if (!resume || !resume.isComplete) {
      return res.status(400).json({
        success: false,
        message: "Please complete your resume before applying",
      });
    }

    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      jobId: jobId,
      userId: req.userId,
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
      userId: req.userId,
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


    const applications = await Application.find({ userId: req.userId })
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

// Get user's interview schedules
export const getInterviewSchedule = async (req, res) => {
  try {


    const interviews = await Application.find({ 
      userId: req.userId,
      interviewStep: { $in: ["test", "interview", "offer", "hired"] },
      interviewStatus: { $ne: "completed" }
    })
      .populate("jobId", "title company")
      .populate("userId", "fullname email")
      .sort({ interviewDate: 1 });

    const formattedInterviews = interviews.map(app => ({
      id: app._id,
      companyName: app.jobId?.company || "N/A",
      jobTitle: app.jobId?.title || "N/A",
      scheduledDate: app.interviewDate || app.testDeadline,
      status: app.interviewStatus,
      interviewStep: app.interviewStep,
      interviewType: app.interviewType,
      meetingLink: app.meetingLink,
      testLink: app.testLink,
      interviewLocation: app.interviewLocation,
      testLocation: app.testLocation,
    }));

    res.status(200).json({
      success: true,
      count: formattedInterviews.length,
      data: formattedInterviews,
    });
  } catch (error) {
    console.error("Error fetching interview schedule:", error);
    
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
    if (application.userId._id.toString() !== req.userId) {
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

    const { id } = req.params;
    const { withdrawalReason } = req.body;

    const application = await Application.findById(id)
      .populate("userId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the owner
    if (application.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Only allow withdrawal at certain stages
    if (!["shortlisted", "test"].includes(application.interviewStep)) {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw application after interview has been scheduled",
      });
    }

    // Update application status
    const previousStep = application.interviewStep;
    application.status = "withdrawn";
    application.interviewStep = "withdrawn";
    application.withdrawalReason = withdrawalReason || "";
    application.withdrawnAt = new Date();
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "withdrew",
      fromStep: previousStep,
      toStep: "withdrawn",
      performedBy: req.userId,
      performedByRole: "applicant",
      note: withdrawalReason,
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    // Trigger notification to company
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyCompanyApplicationWithdrawn(application);

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
      data: application,
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

    const User = (await import("../models/User.model.js")).default;

    // Get company user details
    const company = await User.findById(req.userId);
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

    // Auto-progression logic based on test/interview results
    // If test result is submitted, automatically move candidate
    if (testResult !== undefined && !interviewStep) {
      if (testResult === "fail") {
        application.interviewStep = "rejected";
      } else if (testResult === "pass") {
        application.interviewStep = "interview";
      }
    }

    // If interview result is submitted, automatically move candidate
    if (interviewResult !== undefined && !interviewStep) {
      if (interviewResult === "rejected") {
        application.interviewStep = "rejected";
      } else if (interviewResult === "selected") {
        application.interviewStep = "offer";
      }
    }

    // If offer response is submitted, automatically move candidate
    if (offerResponse !== undefined && !interviewStep) {
      if (offerResponse === "accepted") {
        application.interviewStep = "hired";
      } else if (offerResponse === "rejected") {
        application.interviewStep = "rejected";
      }
    }

    application.updatedDate = Date.now();
    await application.save();

    // Create notifications based on updates
    try {
      // Notify applicant when test is assigned (testLink set without testResult)
      if (testLink && !testResult) {
        await createNotification(
          application.userId,
          "applicant",
          "test_assigned",
          `A test has been assigned for your application at ${application.jobId.company}.`,
          application._id
        );
      }

      // Notify applicant when moving to interview scheduling (after test pass)
      if (interviewStep === "interview" && testResult === "pass") {
        await createNotification(
          application.userId,
          "applicant",
          "interview_scheduled",
          `Congratulations! You passed the test. Your interview has been scheduled at ${application.jobId.company}.`,
          application._id
        );
      }

      // Notify applicant when offer is received (when moving to offer step)
      if (interviewStep === "offer" && interviewResult === "selected") {
        await createNotification(
          application.userId,
          "applicant",
          "offer_received",
          `Congratulations! You passed the interview. You have received a job offer from ${application.jobId.company}. Please review and respond.`,
          application._id
        );
      }

      // Notify applicant when hired
      if (interviewStep === "hired" && offerResponse === "accepted") {
        await createNotification(
          application.userId,
          "applicant",
          "hired",
          `Congratulations! Welcome to ${application.jobId.company}. We're excited to have you on board!`,
          application._id
        );
      }

      // Notify applicant when application is rejected
      if (application.interviewStep === "rejected") {
        let reason = "Your application has been rejected.";
        if (testResult === "fail") {
          reason = "Your test result did not meet our requirements. Thank you for your interest!";
        } else if (interviewResult === "rejected") {
          reason = "Your interview result did not match our expectations. Thank you for your interest!";
        } else if (offerResponse === "rejected") {
          reason = "Thank you for your interest. We wish you the best in your future endeavors!";
        }

        await createNotification(
          application.userId,
          "applicant",
          "rejected",
          reason,
          application._id
        );
      }

      // Notify company when applicant accepts offer
      if (offerResponse === "accepted") {
        await createNotification(
          application.jobId.postedBy,
          "company",
          "offer_response",
          `${application.userId.fullname} has accepted your offer for ${application.jobId.title}.`,
          application._id
        );
      }

      // Notify company when applicant rejects offer
      if (offerResponse === "rejected") {
        await createNotification(
          application.jobId.postedBy,
          "company",
          "offer_response",
          `${application.userId.fullname} has rejected your offer for ${application.jobId.title}.`,
          application._id
        );
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError.message);
      // Continue execution even if notification fails
    }

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

    // Trigger notification to applicant
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyApplicantShortlisted(application);

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

    // Trigger notification to applicant
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyApplicantRejected(application);

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

// ============ NEW STEP-SPECIFIC HANDLERS ============

/**
 * Handle test assignment
 */
export const handleTestAssignment = async (req, res) => {
  try {

    const { id } = req.params;
    const { testType, description, testDeadline, testMode, testLink, testLocation } = req.body;

    const application = await Application.findById(id)
      .populate("userId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Validate required fields
    if (!testType || !testMode) {
      return res.status(400).json({ success: false, message: "Test type and mode are required" });
    }

    if (testMode === "online" && !testLink) {
      return res.status(400).json({ success: false, message: "Test link required for online test" });
    }
    if (testMode === "offline" && !testLocation) {
      return res.status(400).json({ success: false, message: "Test location required for offline test" });
    }

    // Update application
    application.interviewStep = "test";
    application.interviewStatus = "scheduled";
    application.testType = testType;
    application.description = description || "";
    application.testDeadline = testDeadline ? new Date(testDeadline) : null;
    application.testMode = testMode;
    application.testLink = testLink || "";
    application.testLocation = testLocation || "";
    application.updatedDate = Date.now();

    // Add to audit log
    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "test_assigned",
      fromStep: "shortlisted",
      toStep: "test",
      performedBy: req.userId,
      performedByRole: "company",
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    // Trigger notification
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyApplicantTestAssigned(application);

    res.status(200).json({ success: true, message: "Test assigned successfully", data: application });
  } catch (error) {
    console.error("Error assigning test:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle test result submission
 */
export const handleTestResult = async (req, res) => {
  try {

    const { id } = req.params;
    const { testResult, testFeedback } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!testResult) {
      return res.status(400).json({ success: false, message: "Test result is required" });
    }

    application.testResult = testResult;
    application.testFeedback = testFeedback || "";
    application.interviewStatus = "completed";
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "test_result_submitted",
      fromStep: "test",
      toStep: "test",
      performedBy: req.userId,
      performedByRole: "company",
      note: `Test result: ${testResult}`,
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    res.status(200).json({ success: true, message: "Test result updated successfully", data: application });
  } catch (error) {
    console.error("Error updating test result:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle interview scheduling
 */
export const handleInterviewSchedule = async (req, res) => {
  try {

    const { id } = req.params;
    const { interviewType, interviewDate, interviewTime, meetingLink, interviewLocation, interviewers } = req.body;

    const application = await Application.findById(id)
      .populate("userId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!interviewType || !interviewDate || !interviewTime) {
      return res.status(400).json({ success: false, message: "Interview type, date, and time are required" });
    }

    if (interviewType === "online" && !meetingLink) {
      return res.status(400).json({ success: false, message: "Meeting link required for online interview" });
    }
    if (interviewType === "offline" && !interviewLocation) {
      return res.status(400).json({ success: false, message: "Location required for offline interview" });
    }

    application.interviewStep = "interview";
    application.interviewStatus = "scheduled";
    application.interviewType = interviewType;
    application.interviewDate = new Date(interviewDate);
    application.interviewTime = interviewTime;
    application.meetingLink = meetingLink || "";
    application.interviewLocation = interviewLocation || "";
    application.interviewers = interviewers || [];
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "interview_scheduled",
      fromStep: "test",
      toStep: "interview",
      performedBy: req.userId,
      performedByRole: "company",
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    // Trigger notification
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyApplicantInterviewScheduled(application);

    // Notify interviewers if any
    if (interviewers && interviewers.length > 0) {
      for (const interviewer of interviewers) {
        notificationService.notifyInterviewerInvite(
          interviewer.email,
          interviewer.name,
          application.userId.fullname,
          application.jobId.title,
          application.interviewDate,
          application.interviewTime,
          application.meetingLink
        );
      }
    }

    res.status(200).json({ success: true, message: "Interview scheduled successfully", data: application });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle interview result submission
 */
export const handleInterviewResult = async (req, res) => {
  try {

    const { id } = req.params;
    const { interviewResult, interviewFeedback } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!interviewResult) {
      return res.status(400).json({ success: false, message: "Interview result is required" });
    }

    application.interviewResult = interviewResult;
    application.interviewFeedback = interviewFeedback || "";
    application.interviewStatus = "completed";
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "interview_result_submitted",
      fromStep: "interview",
      toStep: "interview",
      performedBy: req.userId,
      performedByRole: "company",
      note: `Interview result: ${interviewResult}`,
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    res.status(200).json({ success: true, message: "Interview result updated successfully", data: application });
  } catch (error) {
    console.error("Error updating interview result:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle offer sending
 */
export const handleOfferSend = async (req, res) => {
  try {

    const { id } = req.params;
    const { salary, currency, joiningDate, benefits, contractFile, offerExpiryDate } = req.body;

    const application = await Application.findById(id)
      .populate("userId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!salary || !joiningDate) {
      return res.status(400).json({ success: false, message: "Salary and joining date are required" });
    }

    application.interviewStep = "offer";
    application.interviewStatus = "offer_sent";
    application.salary = salary;
    application.currency = currency || "USD";
    application.joiningDate = new Date(joiningDate);
    application.benefits = benefits || "";
    application.contractFile = contractFile || "";
    application.offerExpiryDate = offerExpiryDate ? new Date(offerExpiryDate) : null;
    application.offerResponse = "pending";
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "offer_sent",
      fromStep: "interview",
      toStep: "offer",
      performedBy: req.userId,
      performedByRole: "company",
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    // Trigger notification
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyApplicantOfferReceived(application);

    res.status(200).json({ success: true, message: "Offer sent successfully", data: application });
  } catch (error) {
    console.error("Error sending offer:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle offer response (applicant accepting/rejecting/negotiating)
 */
export const handleOfferResponse = async (req, res) => {
  try {

    const { id } = req.params;
    const {
      offerResponse,
      offerResponseNotes,
      counterOfferSalary,
      counterOfferJoiningDate,
      counterOfferMessage,
    } = req.body;

    const application = await Application.findById(id)
      .populate("userId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.userId._id.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: this is not your application" });
    }

    if (!["accepted", "rejected", "negotiating"].includes(offerResponse)) {
      return res.status(400).json({ success: false, message: "Invalid offer response" });
    }

    application.offerResponse = offerResponse;
    application.offerResponseNotes = offerResponseNotes || "";

    if (offerResponse === "negotiating") {
      application.counterOfferSalary = counterOfferSalary || null;
      application.counterOfferJoiningDate = counterOfferJoiningDate ? new Date(counterOfferJoiningDate) : null;
      application.counterOfferMessage = counterOfferMessage || "";
    }

    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "offer_response",
      fromStep: "offer",
      toStep: "offer",
      performedBy: req.userId,
      performedByRole: "applicant",
      note: `Offer ${offerResponse}`,
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    // Trigger notification to company
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyCompanyOfferResponse(application);

    res.status(200).json({ success: true, message: "Offer response recorded successfully", data: application });
  } catch (error) {
    console.error("Error processing offer response:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle hire confirmation
 */
export const handleHireConfirmation = async (req, res) => {
  try {

    const { id } = req.params;
    const { startDate, hiringSummary } = req.body;

    const application = await Application.findById(id)
      .populate("userId")
      .populate("jobId");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!startDate) {
      return res.status(400).json({ success: false, message: "Start date is required" });
    }

    application.interviewStep = "hired";
    application.status = "accepted";
    application.startDate = new Date(startDate);
    application.hiredDate = new Date();
    application.hiringSummary = hiringSummary || "";
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "hired",
      fromStep: "offer",
      toStep: "hired",
      performedBy: req.userId,
      performedByRole: "company",
      timestamp: new Date(),
    });

    await application.save();
    await application.populate([
      { path: "userId", select: "fullname email" },
      { path: "jobId", select: "title company" },
    ]);

    // Trigger notification
    const notificationService = await import("../services/notification.service.js");
    notificationService.notifyApplicantHired(application);

    res.status(200).json({ success: true, message: "Candidate marked as hired successfully", data: application });
  } catch (error) {
    console.error("Error confirming hire:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Mark test as submitted by applicant
 */
export const markTestSubmitted = async (req, res) => {
  try {

    const { id } = req.params;

    const application = await Application.findById(id)
      .populate("userId", "fullname email")
      .populate("jobId", "title company");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.testSubmittedAt = new Date();
    application.updatedDate = Date.now();

    if (!application.auditLog) application.auditLog = [];
    application.auditLog.push({
      action: "test_submitted",
      fromStep: "test",
      toStep: "test",
      performedBy: req.userId,
      performedByRole: "applicant",
      timestamp: new Date(),
    });

    await application.save();

    res.status(200).json({ success: true, message: "Test marked as submitted", data: application });
  } catch (error) {
    console.error("Error marking test as submitted:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get schedule for a specific date (check for conflicts)
 */
export const getScheduleForDate = async (req, res) => {
  try {

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date query parameter is required" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get company's jobs
    const User = (await import("../models/User.model.js")).default;
    const company = await User.findById(req.userId);

    if (!company || !company.companyName) {
      return res.status(400).json({ success: false, message: "Company not found" });
    }

    const jobs = await Job.find({ company: company.companyName });
    const jobIds = jobs.map(job => job._id);

    // Find interviews scheduled for this date
    const interviews = await Application.find({
      jobId: { $in: jobIds },
      interviewDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("userId", "fullname email")
      .populate("jobId", "title");

    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get application audit log
 */
export const getApplicationAuditLog = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      data: application.auditLog || [],
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get company analytics (aggregated stats)
 */
export const getCompanyAnalytics = async (req, res) => {
  try {


    const User = (await import("../models/User.model.js")).default;
    const company = await User.findById(req.userId);

    if (!company || !company.companyName) {
      return res.status(400).json({ success: false, message: "Company not found" });
    }

    const jobs = await Job.find({ company: company.companyName });
    const jobIds = jobs.map(job => job._id);

    // Get all applications for company
    const allApplications = await Application.find({ jobId: { $in: jobIds } })
      .populate("userId", "fullname")
      .populate("jobId", "title");

    // Calculate metrics
    const total = allApplications.length;
    const byStep = {
      shortlisted: allApplications.filter(a => a.interviewStep === "shortlisted").length,
      test: allApplications.filter(a => a.interviewStep === "test").length,
      interview: allApplications.filter(a => a.interviewStep === "interview").length,
      offer: allApplications.filter(a => a.interviewStep === "offer").length,
      hired: allApplications.filter(a => a.interviewStep === "hired").length,
      rejected: allApplications.filter(a => a.interviewStep === "rejected").length,
    };

    const testCandidates = allApplications.filter(a => a.interviewStep === "test" || a.testResult);
    const testPassCount = testCandidates.filter(a => a.testResult === "pass").length;
    const testPassRate = testCandidates.length > 0 ? ((testPassCount / testCandidates.length) * 100).toFixed(2) : 0;

    const interviewCandidates = allApplications.filter(a => a.interviewStep === "interview" || a.interviewResult);
    const offerCandidates = allApplications.filter(a => a.interviewStep === "offer" || a.interviewStep === "hired");
    const interviewToOfferRate = interviewCandidates.length > 0 ? ((offerCandidates.length / interviewCandidates.length) * 100).toFixed(2) : 0;

    const acceptedOffers = allApplications.filter(
      a => a.interviewStep === "hired" || a.offerResponse === "accepted"
    ).length;
    const totalOffers = allApplications.filter(a => a.interviewStep === "offer").length;
    const acceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(2) : 0;

    let timeTohireSum = 0;
    let hiredCount = 0;
    allApplications.forEach(app => {
      if (app.hiredDate && app.appliedDate) {
        timeTohireSum += (app.hiredDate - app.appliedDate) / (1000 * 60 * 60 * 24); // Convert to days
        hiredCount++;
      }
    });
    const avgTimeToHire = hiredCount > 0 ? (timeTohireSum / hiredCount).toFixed(2) : 0;

    const shortlistedRate = total > 0 ? ((byStep.shortlisted / total) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalApplications: total,
        shortlistedRate: parseFloat(shortlistedRate),
        testPassRate: parseFloat(testPassRate),
        interviewToOfferRate: parseFloat(interviewToOfferRate),
        offerAcceptanceRate: parseFloat(acceptanceRate),
        avgTimeToHireInDays: parseFloat(avgTimeToHire),
        byStep,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
