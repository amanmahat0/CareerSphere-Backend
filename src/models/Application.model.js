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
  coverLetter: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "shortlisted", "rejected", "accepted"],
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
  // Interview Pipeline Steps
  interviewStep: {
    type: String,
    enum: ["shortlisted", "test", "interview", "offer", "hired"],
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

  // Test Step Fields
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

  // Interview Step Fields
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

  // Offer Step Fields
  salary: {
    type: Number,
    default: null,
  },
  currency: {
    type: String,
    default: "USD",
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
  offerResponse: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  offerResponseNotes: {
    type: String,
    default: "",
  },

  // Hired Step Fields
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
});

// Create a compound unique index to prevent duplicate applications
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
