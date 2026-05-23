import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["Internship", "Job", "Traineeship"],
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    postDate: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
        required: true,
    },
    salary: {
        type: String,
        required: true,
    },
    skills: {
        type: [String],
        default: [],
    },
    deadline: {
        type: String,
        default: "",
    },
    logo: {
        type: String,
        default: "",
    },
    requirements: {
        type: [String],
        default: [],
    },
    responsibilities: {
        type: [String],
        default: [],
    },
    benefits: {
        type: [String],
        default: [],
    },
    applicants: {
        type: Number,
        default: 0,
    },
});

const Job = mongoose.model("Job", jobSchema);
export default Job;