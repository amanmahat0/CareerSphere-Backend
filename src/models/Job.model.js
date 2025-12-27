import mongoose from "mongoose";
const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    salary: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true,
    },
    requirements: {
        type: String,
        required: true,
    },
    createdby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdat: {
        type: Date,
        default: Date.now,
    },
    applications: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
        default: null,
    },
});
const Job = mongoose.model("Job", jobSchema);
export default Job;