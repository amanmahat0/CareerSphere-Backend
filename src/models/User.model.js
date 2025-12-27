import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phonenumber: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        enum: ["applicant", "institution"],
        required: true,
        default: "applicant",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    resetPasswordCode: {
        type: String,
        default: null,
    },
    resetPasswordCodeExpiry: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;