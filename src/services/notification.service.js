import nodemailer from "nodemailer";
import Notification from "../models/Notification.model.js";

// Initialize email transporter with Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "careersphere67@gmail.com",
    pass: process.env.EMAIL_PASS || "fxgb svtu zapr hkdt",
  },
});

/**
 * Send email using Nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML body of the email
 */
export const sendEmail = async (to, subject, htmlBody) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "careersphere67@gmail.com",
      to,
      subject,
      html: htmlBody,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    // Do not throw — let the API continue even if email fails
  }
};

/**
 * Create in-app notification
 * @param {ObjectId} userId - User ID
 * @param {string} role - User role ("applicant" | "company")
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {ObjectId} applicationId - Application ID
 */
export const createNotification = async (
  userId,
  role,
  type,
  message,
  applicationId
) => {
  try {
    const notification = new Notification({
      userId,
      role,
      type,
      message,
      applicationId,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();

    // Emit notification via WebSocket if io is available
    if (global.io) {
      const { emitNotification } = await import("../socket/socketManager.js");
      emitNotification(global.io, userId.toString(), notification);
    }
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    // Do not throw — continue even if notification creation fails
  }
};

/**
 * Notify applicant when shortlisted
 */
export const notifyApplicantShortlisted = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Great News! You've Been Shortlisted</h2>
      <p>Hi ${applicantName},</p>
      <p>Congratulations! We're pleased to inform you that your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been shortlisted.</p>
      <p>You have impressed us with your qualifications and experience. We would like to move forward with your application for further evaluation.</p>
      <p>We will be in touch soon with the next steps of our interview process.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    console.log(`[ACTION] Sending email to ${applicantEmail}`);
    await sendEmail(
      applicantEmail,
      `Shortlist Notification - ${jobTitle}`,
      htmlBody
    );
    console.log(`[SUCCESS] Email sent successfully`);
    
    console.log(`[ACTION] Creating in-app notification`);
    await createNotification(
      application.userId._id,
      "applicant",
      "application_shortlisted",
      `Congratulations! You've been shortlisted for ${jobTitle} at ${companyName}`,
      application._id
    );
    console.log(`[SUCCESS] Shortlist notification completed`);
  } catch (error) {
    console.error("Error in notifyApplicantShortlisted:", error.message);
  }
};

/**
 * Notify applicant when test is assigned
 */
export const notifyApplicantTestAssigned = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Test Assignment Notification</h2>
      <p>Hi ${applicantName},</p>
      <p><strong>${companyName}</strong> has assigned a test for the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>Test Type: ${application.testType || "N/A"}</li>
        <li>Deadline: ${application.testDeadline ? new Date(application.testDeadline).toLocaleDateString() : "N/A"}</li>
        ${application.testMode === "online" ? `<li>Test Link: <a href="${application.testLink}">${application.testLink}</a></li>` : ""}
        ${application.testMode === "offline" ? `<li>Test Location: ${application.testLocation}</li>` : ""}
      </ul>
      <p>Please complete the test within the given deadline.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(applicantEmail, `Test Assignment - ${jobTitle}`, htmlBody);
    await createNotification(
      application.userId._id,
      "applicant",
      "test_assigned",
      `Test assigned for ${jobTitle} at ${companyName}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantTestAssigned:", error.message);
  }
};

/**
 * Notify applicant when interview is scheduled
 */
export const notifyApplicantInterviewScheduled = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Interview Scheduled</h2>
      <p>Hi ${applicantName},</p>
      <p>Congratulations! <strong>${companyName}</strong> has scheduled an interview for the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date: ${application.interviewDate ? new Date(application.interviewDate).toLocaleDateString() : "N/A"}</li>
        <li>Time: ${application.interviewTime || "N/A"}</li>
        <li>Type: ${application.interviewType || "N/A"}</li>
        ${application.interviewType === "online" ? `<li>Meeting Link: <a href="${application.meetingLink}">${application.meetingLink}</a></li>` : ""}
        ${application.interviewType === "offline" ? `<li>Location: ${application.interviewLocation}</li>` : ""}
      </ul>
      <p>Please be ready 5 minutes before the scheduled time.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(
      applicantEmail,
      `Interview Scheduled - ${jobTitle}`,
      htmlBody
    );
    await createNotification(
      application.userId._id,
      "applicant",
      "interview_scheduled",
      `Interview scheduled for ${jobTitle} at ${companyName}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantInterviewScheduled:", error.message);
  }
};

/**
 * Notify applicant when offer is received
 */
export const notifyApplicantOfferReceived = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Job Offer</h2>
      <p>Hi ${applicantName},</p>
      <p><strong>${companyName}</strong> is pleased to offer you the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Offer Details:</strong></p>
      <ul>
        <li>Salary: ${application.currency} ${application.salary || "N/A"} per year</li>
        <li>Joining Date: ${application.joiningDate ? new Date(application.joiningDate).toLocaleDateString() : "N/A"}</li>
        ${application.benefits ? `<li>Benefits: ${application.benefits}</li>` : ""}
        ${application.offerExpiryDate ? `<li>Offer Expires: ${new Date(application.offerExpiryDate).toLocaleDateString()}</li>` : ""}
      </ul>
      <p>Please log in to your CareerSphere account to accept or reject this offer.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(applicantEmail, `Job Offer - ${jobTitle}`, htmlBody);
    await createNotification(
      application.userId._id,
      "applicant",
      "offer_received",
      `Job offer received for ${jobTitle} at ${companyName}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantOfferReceived:", error.message);
  }
};

/**
 * Notify applicant when rejected
 */
export const notifyApplicantRejected = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Application Status Update</h2>
      <p>Hi ${applicantName},</p>
      <p>Thank you for your interest in the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>After careful consideration, we have decided not to move forward with your application at this time.</p>
      ${application.interviewFeedback ? `<p><strong>Feedback:</strong></p><p>${application.interviewFeedback}</p>` : ""}
      <p>We appreciate your efforts and wish you the best in your career.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(
      applicantEmail,
      `Application Update - ${jobTitle}`,
      htmlBody
    );
    await createNotification(
      application.userId._id,
      "applicant",
      "application_rejected",
      `Your application for ${jobTitle} at ${companyName} was not selected`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantRejected:", error.message);
  }
};

/**
 * Notify applicant when hired
 */
export const notifyApplicantHired = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Congratulations! You've Been Hired</h2>
      <p>Hi ${applicantName},</p>
      <p>Congratulations! <strong>${companyName}</strong> is excited to have you join the team for the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Start Date:</strong> ${application.startDate ? new Date(application.startDate).toLocaleDateString() : "N/A"}</p>
      <p>Please log in to your CareerSphere account for further instructions and onboarding details.</p>
      <p>We look forward to working with you!</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(applicantEmail, `Congratulations! - ${jobTitle}`, htmlBody);
    await createNotification(
      application.userId._id,
      "applicant",
      "hired",
      `You have been hired for ${jobTitle} at ${companyName}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantHired:", error.message);
  }
};

/**
 * Notify company when applicant responds to offer
 */
export const notifyCompanyOfferResponse = async (application) => {
  try {
    const companyEmail = process.env.COMPANY_HR_EMAIL || "hr@company.com";
    const applicantName = application.userId.fullname;
    const jobTitle = application.jobId.title;
    const response = application.offerResponse;

    const htmlBody = `
      <h2>Offer Response</h2>
      <p>Hi HR Team,</p>
      <p><strong>${applicantName}</strong> has ${response} the job offer for <strong>${jobTitle}</strong>.</p>
      ${application.offerResponseNotes ? `<p><strong>Applicant's Note:</strong></p><p>${application.offerResponseNotes}</p>` : ""}
      <p>Please log in to CareerSphere to view more details.</p>
      <p>Best regards,<br/>CareerSphere System</p>
    `;

    await sendEmail(
      companyEmail,
      `Offer Response: ${applicantName} - ${response.toUpperCase()}`,
      htmlBody
    );
    await createNotification(
      application.jobId.companyId,
      "company",
      "offer_response",
      `${applicantName} has ${response} the offer for ${jobTitle}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyCompanyOfferResponse:", error.message);
  }
};

/**
 * Notify company when applicant withdraws application
 */
export const notifyCompanyApplicationWithdrawn = async (application) => {
  try {
    const companyEmail = process.env.COMPANY_HR_EMAIL || "hr@company.com";
    const applicantName = application.userId.fullname;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Application Withdrawn</h2>
      <p>Hi HR Team,</p>
      <p><strong>${applicantName}</strong> has withdrawn their application for <strong>${jobTitle}</strong>.</p>
      ${application.withdrawalReason ? `<p><strong>Reason:</strong></p><p>${application.withdrawalReason}</p>` : ""}
      <p>You can view withdrawn applications in your CareerSphere dashboard.</p>
      <p>Best regards,<br/>CareerSphere System</p>
    `;

    await sendEmail(
      companyEmail,
      `Application Withdrawn: ${applicantName}`,
      htmlBody
    );
    await createNotification(
      application.jobId.companyId,
      "company",
      "application_withdrawn",
      `${applicantName} has withdrawn their application for ${jobTitle}`,
      application._id
    );
  } catch (error) {
    console.error(
      "Error in notifyCompanyApplicationWithdrawn:",
      error.message
    );
  }
};

/**
 * Notify applicant when offer expires
 */
export const notifyApplicantOfferExpired = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Offer Expired</h2>
      <p>Hi ${applicantName},</p>
      <p>The job offer for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has expired.</p>
      <p>The deadline for accepting or rejecting the offer was ${application.offerExpiryDate ? new Date(application.offerExpiryDate).toLocaleDateString() : "unknown"}.</p>
      <p>If you are interested, please contact the company directly.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(
      applicantEmail,
      `Offer Expired - ${jobTitle}`,
      htmlBody
    );
    await createNotification(
      application.userId._id,
      "applicant",
      "offer_expired",
      `Your offer for ${jobTitle} at ${companyName} has expired`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantOfferExpired:", error.message);
  }
};

/**
 * Notify company when offer expires
 */
export const notifyCompanyOfferExpired = async (application) => {
  try {
    const companyEmail = process.env.COMPANY_HR_EMAIL || "hr@company.com";
    const applicantName = application.userId.fullname;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Offer Expired</h2>
      <p>Hi HR Team,</p>
      <p>The job offer sent to <strong>${applicantName}</strong> for <strong>${jobTitle}</strong> has expired on ${application.offerExpiryDate ? new Date(application.offerExpiryDate).toLocaleDateString() : "unknown"}.</p>
      <p>The applicant did not respond within the deadline.</p>
      <p>You can send a new offer or move to the next candidate.</p>
      <p>Best regards,<br/>CareerSphere System</p>
    `;

    await sendEmail(
      companyEmail,
      `Offer Expired: ${applicantName}`,
      htmlBody
    );
    await createNotification(
      application.jobId.companyId,
      "company",
      "offer_expired",
      `Offer to ${applicantName} for ${jobTitle} has expired`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyCompanyOfferExpired:", error.message);
  }
};

/**
 * Notify interviewer when invited to panel
 */
export const notifyInterviewerInvite = async (
  interviewerEmail,
  interviewerName,
  applicantName,
  jobTitle,
  interviewDate,
  interviewTime,
  meetingLink
) => {
  try {
    const htmlBody = `
      <h2>Interview Panel Invitation</h2>
      <p>Hi ${interviewerName},</p>
      <p>You have been invited to participate in an interview for the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Candidate:</strong> ${applicantName}</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date: ${new Date(interviewDate).toLocaleDateString()}</li>
        <li>Time: ${interviewTime}</li>
        <li>Meeting Link: <a href="${meetingLink}">${meetingLink}</a></li>
      </ul>
      <p>Please prepare for the interview and arrive 5 minutes early.</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(interviewerEmail, `Interview Invitation - ${jobTitle}`, htmlBody);
  } catch (error) {
    console.error("Error in notifyInterviewerInvite:", error.message);
  }
};

/**
 * Notify applicant about interview reminder
 */
export const notifyApplicantInterviewReminder = async (application) => {
  try {
    const applicantEmail = application.userId.email;
    const applicantName = application.userId.fullname;
    const companyName = application.jobId.company;
    const jobTitle = application.jobId.title;

    const htmlBody = `
      <h2>Interview Reminder</h2>
      <p>Hi ${applicantName},</p>
      <p>This is a reminder about your upcoming interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date: ${application.interviewDate ? new Date(application.interviewDate).toLocaleDateString() : "N/A"}</li>
        <li>Time: ${application.interviewTime || "N/A"}</li>
        ${application.interviewType === "online" ? `<li>Meeting Link: <a href="${application.meetingLink}">${application.meetingLink}</a></li>` : ""}
        ${application.interviewType === "offline" ? `<li>Location: ${application.interviewLocation}</li>` : ""}
      </ul>
      <p>Please be ready 5 minutes before the scheduled time. Make sure your camera, microphone, and internet connection are working properly.</p>
      <p>Good luck!</p>
      <p>Best regards,<br/>CareerSphere Team</p>
    `;

    await sendEmail(
      applicantEmail,
      `Interview Reminder - ${jobTitle}`,
      htmlBody
    );
    await createNotification(
      application.userId._id,
      "applicant",
      "interview_reminder",
      `Reminder: Your interview for ${jobTitle} at ${companyName} is coming up`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantInterviewReminder:", error.message);
  }
};

export default {
  sendEmail,
  createNotification,
  notifyApplicantShortlisted,
  notifyApplicantTestAssigned,
  notifyApplicantInterviewScheduled,
  notifyApplicantOfferReceived,
  notifyApplicantRejected,
  notifyApplicantHired,
  notifyCompanyOfferResponse,
  notifyCompanyApplicationWithdrawn,
  notifyApplicantOfferExpired,
  notifyCompanyOfferExpired,
  notifyInterviewerInvite,
  notifyApplicantInterviewReminder,
};
