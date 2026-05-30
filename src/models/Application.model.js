import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true,
  },
  // Snapshot of the resume at the time of application — immutable per submission
  resumeSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  coverLetter: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "shortlisted", "rejected", "accepted", "withdrawn", "expired"],
    default: "pending",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },

  // ── Interview Pipeline ────────────────────────────────────────────────
  interviewStep: {
    type: String,
    enum: ["shortlisted", "test", "interview", "offer", "hired", "withdrawn", "rejected"],
    default: "shortlisted",
  },
  interviewStatus: {
    type: String,
    enum: ["pending", "in progress", "completed", "skipped", "scheduled", "offer_sent"],
    default: "pending",
  },
  interviewNotes: {
    type: String,
    default: "",
  },

  // ── Skipped Steps Tracking (FIX 2) ───────────────────────────────────
  skippedSteps: [
    {
      step: { type: String, enum: ["test", "interview", "offer"] },
      skippedAt: { type: Date, default: Date.now },
      skippedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],

  // ── Revert History (FIX 1) ───────────────────────────────────────────
  revertHistory: [
    {
      fromStep: { type: String },
      toStep: { type: String },
      reason: { type: String },
      date: { type: Date, default: Date.now },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],

  // ── Test Fields ───────────────────────────────────────────────────────
  testType: {
    type: String,
    enum: ["skill_assessment", "coding_test", "aptitude_test"],
    default: null,
  },
  description: {
    type: String,
    default: "",
  },
  testDeadline: {
    type: Date,
    default: null,
  },
  testMode: {
    type: String,
    enum: ["online", "offline"],
    default: null,
  },
  testLink: {
    type: String,
    default: "",
  },
  testLocation: {
    type: String,
    default: "",
  },
  testResult: {
    type: String,
    default: "",
  },
  testFeedback: {
    type: String,
    default: "",
  },
  testSubmittedAt: {
    type: Date,
    default: null,
  },
  testOverdue: {                         // FIX 3 — flagged by cron after 7 days
    type: Boolean,
    default: false,
  },

  // ── Single-Round Interview Fields (legacy, kept for backward compat) ──
  interviewType: {
    type: String,
    enum: ["online", "offline"],
    default: null,
  },
  interviewDate: {
    type: Date,
    default: null,
  },
  interviewTime: {
    type: String,
    default: "",
  },
  meetingLink: {
    type: String,
    default: "",
  },
  interviewLocation: {
    type: String,
    default: "",
  },
  interviewResult: {
    type: String,
    default: "",
  },
  interviewFeedback: {
    type: String,
    default: "",
  },
  interviewers: [
    {
      name: { type: String },
      email: { type: String },
      role: { type: String },
      feedbackNote: { type: String, default: "" },
    },
  ],

  // ── Multiple Interview Rounds (FIX 7) ─────────────────────────────────
  interviewRound: { type: Number, default: 1 },
  interviews: [
    {
      round: { type: Number },
      date: { type: Date },
      time: { type: String },
      type: { type: String, enum: ["online", "offline"] },
      meetingLink: { type: String },
      location: { type: String },
      notes: { type: String },
      interviewers: [String],
      result: { type: String, enum: ["selected", "not_selected"] },
      feedback: { type: String },
      interviewerFeedback: [{ name: String, feedback: String }],
      scheduledAt: { type: Date, default: Date.now },
      completedAt: { type: Date },
    },
  ],

  // ── Offer Fields ──────────────────────────────────────────────────────
  salary: {
    type: Number,
    default: null,
  },
  currency: {
    type: String,
    default: "NPR",
  },
  joiningDate: {
    type: Date,
    default: null,
  },
  benefits: {
    type: String,
    default: "",
  },
  contractFile: {
    type: String,
    default: "",
  },
  offerExpiryDate: {
    type: Date,
    default: null,
  },
  // Unified offer status (FIX 6, FIX 8)
  offerStatus: {
    type: String,
    enum: ["pending", "accepted", "declined", "negotiation", "expired", "revised"],
    default: "pending",
  },
  // Legacy offer response (kept for backward compat)
  offerResponse: {
    type: String,
    enum: ["pending", "accepted", "rejected", "negotiating", "expired"],
    default: "pending",
  },
  offerResponseNotes: {
    type: String,
    default: "",
  },
  // Offer negotiation thread (FIX 8)
  offerNegotiation: [
    {
      from: { type: String, enum: ["applicant", "company"] },
      notes: { type: String },
      proposedSalary: { type: Number },
      proposedJoiningDate: { type: Date },
      date: { type: Date, default: Date.now },
    },
  ],
  lastNudgedAt: { type: Date, default: null }, // FIX 10 — rate-limit nudges

  // Legacy counter-offer fields (backward compat)
  counterOfferSalary: { type: Number, default: null },
  counterOfferJoiningDate: { type: Date, default: null },
  counterOfferMessage: { type: String, maxLength: 500, default: "" },

  // ── Hired Fields ──────────────────────────────────────────────────────
  startDate: {
    type: Date,
    default: null,
  },
  hiredDate: {
    type: Date,
    default: null,
  },
  hiringSummary: {
    type: String,
    default: "",
  },

  // ── Rejection ─────────────────────────────────────────────────────────
  rejectionReason: { type: String, default: "" },
  rejectedAt: { type: Date, default: null },
  rejectedAtStep: { type: String, default: "" }, // FIX 1

  // ── Withdrawal ────────────────────────────────────────────────────────
  withdrawalReason: { type: String, default: "" },
  withdrawnAt: { type: Date, default: null },

  // ── Tracking ──────────────────────────────────────────────────────────
  lastViewedAt: { type: Date, default: null },
  reminderSentAt: { type: Date, default: null },

  // ── Audit Log ─────────────────────────────────────────────────────────
  auditLog: [
    {
      action: { type: String },
      fromStep: { type: String },
      toStep: { type: String },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      performedByRole: { type: String },
      note: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
