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
});

const Job = mongoose.model("Job", jobSchema);
export default Job;