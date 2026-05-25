import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import applicantRoutes from "./routes/applicant.routes.js";
import companyRoutes from "./routes/company.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import chatbotRoute from "./chatbot/chatbotRoute.js";

connectDB();

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const cors = require("cors");


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// Serve static files for uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/home", (req, res) => {
  res.json({ message: "API is running... Hello world" });
});

// Public routes (no auth required) — register before any auth middleware
app.use("/api/chatbot", chatbotRoute);

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/applicant", applicantRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

export default app;