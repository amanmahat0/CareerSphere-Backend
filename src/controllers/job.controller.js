import Job from "../models/Job.model.js";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  return jwt.verify(token, process.env.JWT_SECRET || "secret");
};

// Create a new job posting
export const createJob = async (req, res) => {
    try {
        const decoded = verifyToken(req);
        
        // Get company info from authenticated user
        const user = await User.findById(decoded.id);
        if (!user || !user.companyName) {
            return res.status(400).json({ 
                success: false, 
                message: "Company information not found in your profile" 
            });
        }

        const { 
            title, 
            type, 
            location, 
            duration, 
            description, 
            salary,
            skills,
            deadline,
            logo,
            requirements,
            responsibilities,
            benefits
        } = req.body;

        // Validate required fields
        if (!title || !type || !location || !duration || !description || !salary) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        // Validate job type
        const validTypes = ["Internship", "Job", "Traineeship"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid job type. Must be Internship, Job, or Traineeship" 
            });
        }

        const newJob = new Job({
            title,
            company: user.companyName,
            type,
            location,
            duration,
            description,
            salary,
            skills: skills || [],
            deadline: deadline || "",
            logo: logo || "💼",
            requirements: requirements || [],
            responsibilities: responsibilities || [],
            benefits: benefits || [],
        });

        await newJob.save();

        res.status(201).json({ 
            success: true, 
            message: "Job posted successfully", 
            job: newJob 
        });
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to create job", 
            error: error.message 
        });
    }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
    try {
        const { type, location } = req.query;
        
        let filter = {};
        if (type) filter.type = type;
        if (location) filter.location = { $regex: location, $options: "i" };

        const jobs = await Job.find(filter)
            .sort({ postDate: -1 });

        res.status(200).json({ 
            success: true, 
            count: jobs.length,
            jobs 
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch jobs", 
            error: error.message 
        });
    }
};

// Get a single job by ID
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            job 
        });
    } catch (error) {
        console.error("Error fetching job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch job", 
            error: error.message 
        });
    }
};

// Update a job
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findByIdAndUpdate(id, updates, { 
            new: true, 
            runValidators: true 
        });

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Job updated successfully", 
            job 
        });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update job", 
            error: error.message 
        });
    }
};

// Delete a job
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findByIdAndDelete(id);

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Job deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete job", 
            error: error.message 
        });
    }
};
