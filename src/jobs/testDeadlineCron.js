import Application from "../models/Application.model.js";
import { createNotification } from "../services/notification.service.js";

/**
 * FIX 3: Cron job for test deadline enforcement — runs every 6 hours.
 * - 48 h overdue: notify company that the applicant has not submitted
 * - 7 d overdue: set testOverdue = true, notify admin
 */
const startTestDeadlineJob = async () => {
  try {
    const cron = (await import("node-cron")).default;

    cron.schedule("0 */6 * * *", async () => {
      try {
        const now = new Date();
        const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const d7Ago  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

        // Applications in test step, deadline has passed, test not yet submitted
        const overdueCandidates = await Application.find({
          interviewStep: "test",
          testDeadline: { $lt: now },
          testSubmittedAt: null,
          testResult: "",
        })
          .populate("userId", "fullname email")
          .populate("jobId", "title company postedBy");

        for (const application of overdueCandidates) {
          const deadline = application.testDeadline;
          const hoursOverdue = (now - deadline) / (1000 * 60 * 60);

          // 7-day flag — set testOverdue and notify admin
          if (hoursOverdue >= 168 && !application.testOverdue) {
            application.testOverdue = true;
            application.updatedDate = Date.now();
            await application.save();

            // Notify admin (userId = null means system notification; skip if no admin id)
            if (application.jobId?.postedBy) {
              await createNotification(
                application.jobId.postedBy,
                "company",
                "admin_notification",
                `Test overdue (7+ days): ${application.userId?.fullname} for "${application.jobId?.title}" has not submitted their test.`,
                application._id
              ).catch(() => {});
            }
          } else if (hoursOverdue >= 48 && !application.testOverdue) {
            // 48-hour reminder — notify company
            if (application.jobId?.postedBy) {
              await createNotification(
                application.jobId.postedBy,
                "company",
                "admin_notification",
                `Test reminder: ${application.userId?.fullname} for "${application.jobId?.title}" has not submitted their test (48 h overdue).`,
                application._id
              ).catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error("Error in test deadline cron:", error.message);
      }
    });

    console.log("Test deadline cron job scheduled (every 6 hours)");
  } catch (error) {
    console.warn("node-cron not available. Skipping test deadline scheduling.");
  }
};

export default startTestDeadlineJob;
