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

connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files for uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/home", (req, res) => {
  res.json({ message: "API is running... Hello world" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/applicant", applicantRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);

export default app;