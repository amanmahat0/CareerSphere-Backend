import { BrevoClient } from "@getbrevo/brevo";
import Notification from "../models/Notification.model.js";

const FROM_EMAIL = "careersphere67@gmail.com";
const FROM_NAME = "CareerSphere";

const getClient = () => new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

export const sendEmail = async (to, subject, htmlContent) => {
  try {
    await getClient().transactionalEmails.sendTransacEmail({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      htmlContent,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    if (error.response) {
      console.error("Brevo response:", JSON.stringify(error.response.body || error.response, null, 2));
    }
  }
};

/**
 * Create in-app notification
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

    if (global.io) {
      const { emitNotification } = await import("../socket/socketManager.js");
      emitNotification(global.io, userId.toString(), notification);
    }
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

export const notifyApplicantShortlisted = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Shortlist Notification - ${jobTitle}`,
      `<h2>Great News! You've Been Shortlisted</h2>
      <p>Hi ${applicantName},</p>
      <p>Congratulations! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been shortlisted.</p>
      <p>We will be in touch soon with the next steps of the interview process.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
    );
    await createNotification(
      application.userId._id,
      "applicant",
      "application_shortlisted",
      `Congratulations! You've been shortlisted for ${jobTitle} at ${companyName}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyApplicantShortlisted:", error.message);
  }
};

export const notifyApplicantTestAssigned = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Test Assignment - ${jobTitle}`,
      `<h2>Test Assignment Notification</h2>
      <p>Hi ${applicantName},</p>
      <p><strong>${companyName}</strong> has assigned a test for the position of <strong>${jobTitle}</strong>.</p>
      <ul>
        <li>Test Type: ${application.testType || "N/A"}</li>
        <li>Deadline: ${application.testDeadline ? new Date(application.testDeadline).toLocaleDateString() : "N/A"}</li>
        ${application.testMode === "online" ? `<li>Test Link: <a href="${application.testLink}">${application.testLink}</a></li>` : ""}
        ${application.testMode === "offline" ? `<li>Test Location: ${application.testLocation}</li>` : ""}
      </ul>
      <p>Please complete the test within the given deadline.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
    );
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

export const notifyApplicantInterviewScheduled = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Interview Scheduled - ${jobTitle}`,
      `<h2>Interview Scheduled</h2>
      <p>Hi ${applicantName},</p>
      <p><strong>${companyName}</strong> has scheduled an interview for <strong>${jobTitle}</strong>.</p>
      <ul>
        <li>Date: ${application.interviewDate ? new Date(application.interviewDate).toLocaleDateString() : "N/A"}</li>
        <li>Time: ${application.interviewTime || "N/A"}</li>
        <li>Type: ${application.interviewType || "N/A"}</li>
        ${application.interviewType === "online" ? `<li>Meeting Link: <a href="${application.meetingLink}">${application.meetingLink}</a></li>` : ""}
        ${application.interviewType === "offline" ? `<li>Location: ${application.interviewLocation}</li>` : ""}
      </ul>
      <p>Please be ready 5 minutes before the scheduled time.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
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

export const notifyApplicantOfferReceived = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Job Offer - ${jobTitle}`,
      `<h2>Job Offer</h2>
      <p>Hi ${applicantName},</p>
      <p><strong>${companyName}</strong> is pleased to offer you the position of <strong>${jobTitle}</strong>.</p>
      <ul>
        <li>Salary: ${application.currency} ${application.salary || "N/A"} per year</li>
        <li>Joining Date: ${application.joiningDate ? new Date(application.joiningDate).toLocaleDateString() : "N/A"}</li>
        ${application.benefits ? `<li>Benefits: ${application.benefits}</li>` : ""}
        ${application.offerExpiryDate ? `<li>Offer Expires: ${new Date(application.offerExpiryDate).toLocaleDateString()}</li>` : ""}
      </ul>
      <p>Please log in to your CareerSphere account to accept or reject this offer.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
    );
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

export const notifyApplicantRejected = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Application Update - ${jobTitle}`,
      `<h2>Application Status Update</h2>
      <p>Hi ${applicantName},</p>
      <p>Thank you for your interest in <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>After careful consideration, we have decided not to move forward with your application at this time.</p>
      ${application.interviewFeedback ? `<p><strong>Feedback:</strong> ${application.interviewFeedback}</p>` : ""}
      <p>We appreciate your efforts and wish you the best in your career.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
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

export const notifyApplicantHired = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Congratulations! - ${jobTitle}`,
      `<h2>Congratulations! You've Been Hired</h2>
      <p>Hi ${applicantName},</p>
      <p><strong>${companyName}</strong> is excited to have you join the team for <strong>${jobTitle}</strong>.</p>
      <p><strong>Start Date:</strong> ${application.startDate ? new Date(application.startDate).toLocaleDateString() : "N/A"}</p>
      <p>Please log in to your CareerSphere account for further instructions and onboarding details.</p>
      <p>We look forward to working with you!</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
    );
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

export const notifyCompanyOfferResponse = async (application) => {
  try {
    const companyEmail = process.env.COMPANY_HR_EMAIL || "hr@company.com";
    const { fullname: applicantName } = application.userId;
    const { title: jobTitle } = application.jobId;
    const response = application.offerResponse;

    await sendEmail(
      companyEmail,
      `Offer Response: ${applicantName} - ${response.toUpperCase()}`,
      `<h2>Offer Response</h2>
      <p>Hi HR Team,</p>
      <p><strong>${applicantName}</strong> has ${response} the job offer for <strong>${jobTitle}</strong>.</p>
      ${application.offerResponseNotes ? `<p><strong>Applicant's Note:</strong> ${application.offerResponseNotes}</p>` : ""}
      <p>Please log in to CareerSphere to view more details.</p>
      <p>Best regards,<br/>CareerSphere System</p>`
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

export const notifyCompanyApplicationWithdrawn = async (application) => {
  try {
    const companyEmail = process.env.COMPANY_HR_EMAIL || "hr@company.com";
    const { fullname: applicantName } = application.userId;
    const { title: jobTitle } = application.jobId;

    await sendEmail(
      companyEmail,
      `Application Withdrawn: ${applicantName}`,
      `<h2>Application Withdrawn</h2>
      <p>Hi HR Team,</p>
      <p><strong>${applicantName}</strong> has withdrawn their application for <strong>${jobTitle}</strong>.</p>
      ${application.withdrawalReason ? `<p><strong>Reason:</strong> ${application.withdrawalReason}</p>` : ""}
      <p>You can view withdrawn applications in your CareerSphere dashboard.</p>
      <p>Best regards,<br/>CareerSphere System</p>`
    );
    await createNotification(
      application.jobId.companyId,
      "company",
      "application_withdrawn",
      `${applicantName} has withdrawn their application for ${jobTitle}`,
      application._id
    );
  } catch (error) {
    console.error("Error in notifyCompanyApplicationWithdrawn:", error.message);
  }
};

export const notifyApplicantOfferExpired = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Offer Expired - ${jobTitle}`,
      `<h2>Offer Expired</h2>
      <p>Hi ${applicantName},</p>
      <p>The job offer for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has expired on ${application.offerExpiryDate ? new Date(application.offerExpiryDate).toLocaleDateString() : "the deadline"}.</p>
      <p>If you are still interested, please contact the company directly.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
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

export const notifyCompanyOfferExpired = async (application) => {
  try {
    const companyEmail = process.env.COMPANY_HR_EMAIL || "hr@company.com";
    const { fullname: applicantName } = application.userId;
    const { title: jobTitle } = application.jobId;

    await sendEmail(
      companyEmail,
      `Offer Expired: ${applicantName}`,
      `<h2>Offer Expired</h2>
      <p>Hi HR Team,</p>
      <p>The offer sent to <strong>${applicantName}</strong> for <strong>${jobTitle}</strong> expired on ${application.offerExpiryDate ? new Date(application.offerExpiryDate).toLocaleDateString() : "the deadline"}.</p>
      <p>The applicant did not respond within the deadline. You can send a new offer or move to the next candidate.</p>
      <p>Best regards,<br/>CareerSphere System</p>`
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
    await sendEmail(
      interviewerEmail,
      `Interview Invitation - ${jobTitle}`,
      `<h2>Interview Panel Invitation</h2>
      <p>Hi ${interviewerName},</p>
      <p>You have been invited to interview for <strong>${jobTitle}</strong>.</p>
      <p><strong>Candidate:</strong> ${applicantName}</p>
      <ul>
        <li>Date: ${new Date(interviewDate).toLocaleDateString()}</li>
        <li>Time: ${interviewTime}</li>
        <li>Meeting Link: <a href="${meetingLink}">${meetingLink}</a></li>
      </ul>
      <p>Please prepare and arrive 5 minutes early.</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
    );
  } catch (error) {
    console.error("Error in notifyInterviewerInvite:", error.message);
  }
};

export const notifyApplicantInterviewReminder = async (application) => {
  try {
    const { email: applicantEmail, fullname: applicantName } = application.userId;
    const { company: companyName, title: jobTitle } = application.jobId;

    await sendEmail(
      applicantEmail,
      `Interview Reminder - ${jobTitle}`,
      `<h2>Interview Reminder</h2>
      <p>Hi ${applicantName},</p>
      <p>This is a reminder about your upcoming interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <ul>
        <li>Date: ${application.interviewDate ? new Date(application.interviewDate).toLocaleDateString() : "N/A"}</li>
        <li>Time: ${application.interviewTime || "N/A"}</li>
        ${application.interviewType === "online" ? `<li>Meeting Link: <a href="${application.meetingLink}">${application.meetingLink}</a></li>` : ""}
        ${application.interviewType === "offline" ? `<li>Location: ${application.interviewLocation}</li>` : ""}
      </ul>
      <p>Please be ready 5 minutes before the scheduled time.</p>
      <p>Good luck!</p>
      <p>Best regards,<br/>CareerSphere Team</p>`
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
