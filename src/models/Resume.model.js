import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  personalInfo: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    linkedin: {
      type: String,
      trim: true,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    summary: {
      type: String,
      trim: true,
      default: null,
    },
  },
  education: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      degree: {
        type: String,
        required: true,
        trim: true,
      },
      institution: {
        type: String,
        required: true,
        trim: true,
      },
      year: {
        type: String,
        trim: true,
      },
      cgpa: {
        type: String,
        trim: true,
      },
    },
  ],
  experience: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      company: {
        type: String,
        required: true,
        trim: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      duration: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
    },
  ],
  skills: [
    {
      type: String,
      trim: true,
    },
  ],
  projects: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      link: {
        type: String,
        trim: true,
      },
    },
  ],
  certifications: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      issuer: {
        type: String,
        trim: true,
      },
      date: {
        type: String,
        trim: true,
      },
    },
  ],
  isComplete: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
resumeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
resumeSchema.index({ userId: 1 });

export default mongoose.model("Resume", resumeSchema);
