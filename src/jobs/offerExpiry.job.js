import Application from "../models/Application.model.js";
import notificationService from "../services/notification.service.js";

/**
 * Scheduled job to handle offer expiry
 * Runs daily at 9:00 AM
 */
const startOfferExpiryJob = async () => {
  try {
    const cron = (await import("node-cron")).default;
    
    // Cron job runs every day at 9:00 AM (0 9 * * *)
    cron.schedule("0 9 * * *", async () => {
    try {
      console.log("Starting offer expiry check job...");

      // Find all pending offers that have expired
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredOffers = await Application.find({
        interviewStep: "offer",
        offerResponse: "pending",
        offerExpiryDate: { $lt: today },
      })
        .populate("userId")
        .populate("jobId");

      // Update each expired offer
      let updatedCount = 0;
      for (const application of expiredOffers) {
        application.offerResponse = "expired";
        application.updatedDate = Date.now();

        if (!application.auditLog) application.auditLog = [];
        application.auditLog.push({
          action: "offer_expired",
          fromStep: "offer",
          toStep: "offer",
          note: "Offer validity period expired",
          timestamp: new Date(),
        });

        await application.save();

        // Send notifications
        try {
          await notificationService.notifyApplicantOfferExpired(application);
          await notificationService.notifyCompanyOfferExpired(application);
        } catch (notifError) {
          console.error(`Failed to send expiry notifications for app ${application._id}:`, notifError.message);
        }

        updatedCount++;
      }

      console.log(`Offer expiry job completed. ${updatedCount} offers marked as expired.`);
    } catch (error) {
      console.error("Error in offer expiry job:", error.message);
    }
    });

    console.log("Offer expiry cron job scheduled (9 AM daily)");
  } catch (error) {
    console.warn("node-cron package not installed. Skipping offer expiry scheduling.");
    console.warn("   Install it with: npm install node-cron");
  }
};

export default startOfferExpiryJob;
