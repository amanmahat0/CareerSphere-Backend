import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
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
    phonenumber: {
        type: String,
        required: function() {
            // Phone number is required only if not using Google auth
            return !this.isGoogleAuth;
        },
        trim: true,
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if not using Google auth
            return !this.isGoogleAuth;
        },
    },
    // Google OAuth fields
    googleId: {
        type: String,
        sparse: true,
        default: null,
    },
    isGoogleAuth: {
        type: Boolean,
        default: false,
    },
    profilePicture: {
        type: String,
        default: null, // URL from Google profile picture or uploaded file
    },
    address: {
        type: String,
        default: null,
        trim: true,
    },
    applicantType: {
        type: String,
        enum: ["Student", "Fresh Graduate", "Experienced", "Career Changer"],
        default: "Student",
    },
    userType: {
        type: String,
        enum: ["applicant", "institution", "admin"],
        required: true,
        default: "applicant",
    },
    // Company/Institution specific fields
    companyName: {
        type: String,
        default: null,
        trim: true,
    },
    companySize: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", null],
        default: null,
    },
    website: {
        type: String,
        default: null,
        trim: true,
    },
    aboutCompany: {
        type: String,
        default: null,
        trim: true,
    },
    socialMedia: {
        facebook: {
            type: String,
            default: null,
            trim: true,
        },
        instagram: {
            type: String,
            default: null,
            trim: true,
        },
        linkedin: {
            type: String,
            default: null,
            trim: true,
        },
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    // Google users are automatically verified
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