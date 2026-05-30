import express from "express";
import {
    createJob,
    getAllJobs,
    getMyJobs,
    getJobById,
    updateJob,
    deleteJob
} from "../controllers/job.controller.js";

const router = express.Router();

// POST /api/jobs - Create a new job
router.post("/", createJob);

// GET /api/jobs - Get all jobs (with optional filters)
router.get("/", getAllJobs);

// GET /api/jobs/mine - Get jobs posted by the authenticated company (must be before /:id)
router.get("/mine", getMyJobs);

// GET /api/jobs/:id - Get a single job by ID
router.get("/:id", getJobById);

// PUT /api/jobs/:id - Update a job
router.put("/:id", updateJob);

// DELETE /api/jobs/:id - Delete a job
router.delete("/:id", deleteJob);

export default router;
