import Application from "../models/Application.model.js";
import notificationService from "../services/notification.service.js";

/**
 * FIX 6: Scheduled job to handle offer expiry — runs hourly
 */
const startOfferExpiryJob = async () => {
  try {
    const cron = (await import("node-cron")).default;

    // Hourly schedule
    cron.schedule("0 * * * *", async () => {
      try {
        console.log("Starting offer expiry check job...");

        const now = new Date();

        const expiredOffers = await Application.find({
          interviewStep: "offer",
          offerStatus: { $nin: ["accepted", "declined", "expired"] },
          offerExpiryDate: { $lt: now },
        })
          .populate("userId")
          .populate("jobId");

        let updatedCount = 0;
        for (const application of expiredOffers) {
          application.offerStatus = "expired";
          application.offerResponse = "expired";
          application.interviewStep = "rejected";
          application.status = "expired";
          application.rejectionReason = "Offer expired without response";
          application.rejectedAt = now;
          application.rejectedAtStep = "offer";
          application.updatedDate = Date.now();

          if (!application.auditLog) application.auditLog = [];
          application.auditLog.push({
            action: "offer_expired",
            fromStep: "offer",
            toStep: "rejected",
            note: "Offer validity period expired (auto)",
            timestamp: now,
          });

          await application.save();

          // Notify both sides
          try {
            await notificationService.notifyApplicantOfferExpired(application);
            await notificationService.notifyCompanyOfferExpired(application);
          } catch (notifError) {
            console.error(`Failed to send expiry notifications for app ${application._id}:`, notifError.message);
          }

          // FIX 11: Emit pipeline update to applicant
          if (global.io && application.userId?._id) {
            global.io
              .to(`notifications-${application.userId._id}`)
              .emit("pipeline_update", {
                applicationId: application._id,
                interviewStep: "rejected",
                offerStatus: "expired",
              });
          }

          updatedCount++;
        }

        if (updatedCount > 0) {
          console.log(`Offer expiry job: ${updatedCount} offer(s) auto-expired.`);
        }
      } catch (error) {
        console.error("Error in offer expiry job:", error.message);
      }
    });

    console.log("Offer expiry cron job scheduled (hourly)");
  } catch (error) {
    console.warn("node-cron not available. Skipping offer expiry scheduling.");
  }
};

export default startOfferExpiryJob;
