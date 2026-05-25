import Contact from "../models/Contact.model.js";
import Mailjet from "node-mailjet";

const FROM_EMAIL = "careersphere67@gmail.com";
const FROM_NAME = "CareerSphere";

const getClient = () =>
    new Mailjet({ apiKey: process.env.MAILJET_API_KEY, apiSecret: process.env.MAILJET_SECRET_KEY });

const sendMail = async (to, subject, html) => {
    try {
        await getClient().post("send", { version: "v3.1" }).request({
            Messages: [
                {
                    From: { Email: FROM_EMAIL, Name: FROM_NAME },
                    To: [{ Email: to }],
                    Subject: subject,
                    HTMLPart: html,
                },
            ],
        });
    } catch (err) {
        console.error(`Failed to send email to ${to}:`, err.message);
    }
};

// Submit contact form
export const submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, subject, and message are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Create contact entry
        const contact = new Contact({
            name,
            email,
            phone: phone || "",
            subject,
            message
        });

        await contact.save();

        // Send confirmation email to user
        await sendMail(
            email,
            "CareerSphere - We received your message",
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1f3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">CareerSphere</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Thank you for contacting us!</p>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
                    <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                        We have received your message regarding "<strong>${subject}</strong>". Our team will review it and get back to you as soon as possible.
                    </p>
                    <div style="background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <p style="color: #999; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase;">Your Message</p>
                        <p style="color: #333; font-size: 14px; margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        Typically, we respond within 24-48 business hours.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                        © 2026 CareerSphere. All rights reserved.
                    </p>
                </div>
            </div>`
        );

        // Send notification to admin
        await sendMail(
            "careersphere67@gmail.com",
            `New Contact Form: ${subject}`,
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f3a8a;">New Contact Form Submission</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${phone || "Not provided"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Subject:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${subject}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Message:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; white-space: pre-wrap;">${message}</td>
                    </tr>
                </table>
            </div>`
        );

        return res.status(201).json({
            success: true,
            message: "Your message has been sent successfully. We'll get back to you soon!"
        });

    } catch (error) {
        console.error("Contact form error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit contact form. Please try again later."
        });
    }
};

// Get all contact submissions (admin only)
export const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error("Get contacts error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contacts"
        });
    }
};

// Update contact status (admin only)
export const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status, adminNotes },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact updated successfully",
            data: contact
        });
    } catch (error) {
        console.error("Update contact error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update contact"
        });
    }
};
