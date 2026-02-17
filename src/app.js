import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import contactRoutes from "./routes/contact.routes.js";

connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/home", (req, res) => {
  res.json({ message: "API is running... Hello world" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/contact", contactRoutes);

export default app;