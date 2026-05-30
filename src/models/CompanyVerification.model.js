import mongoose from "mongoose";

const companyVerificationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    documents: [
        {
            filename: {
                type: String,
                required: true,
            },
            originalName: {
                type: String,
                required: true,
            },
            documentName: {
                type: String,
                trim: true,
                default: '',
            },
            documentType: {
                type: String,
                enum: ["registration_certificate", "business_license", "tax_id", "other"],
                required: true,
            },
            filePath: {
                type: String,
                required: true,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
        trim: true,
    },
    adminNotes: {
        type: String,
        default: null,
        trim: true,
    },
}, { timestamps: true });

const CompanyVerification = mongoose.model("CompanyVerification", companyVerificationSchema);
export default CompanyVerification;
