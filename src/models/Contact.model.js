import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true,
        default: ""
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true
    },
    status: {
        type: String,
        enum: ["pending", "read", "replied", "resolved"],
        default: "pending"
    },
    adminNotes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
