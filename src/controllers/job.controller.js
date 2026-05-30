import Job from "../models/Job.model.js";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("Authorization header missing");
  }
  
  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new Error("Bearer token not provided");
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired. Please login again.");
    }
    throw new Error("Invalid or malformed token");
  }
};

// Create a new job posting
export const createJob = async (req, res) => {
    try {
        const decoded = verifyToken(req);
        
        // Get company info from authenticated user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found. Please login again." 
            });
        }

        // Block unverified companies from posting jobs
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Your company account must be verified before you can post jobs. Please submit your verification documents.",
            });
        }

        // Use companyName if available, otherwise use fullname (for backward compatibility)
        const companyName = user.companyName || user.fullname;
        if (!companyName) {
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
            company: companyName,
            type,
            location,
            duration,
            description,
            salary,
            skills: skills || [],
            deadline: deadline || "",
            logo: logo || "",
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

// Get jobs posted by the authenticated company
export const getMyJobs = async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found." });
        }

        const companyName = user.companyName || user.fullname;
        if (!companyName) {
            return res.status(400).json({ success: false, message: "Company name not found in profile." });
        }

        const jobs = await Job.find({ company: companyName }).sort({ postDate: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs: jobs.map(j => j.toObject()),
        });
    } catch (error) {
        console.error("Error fetching company jobs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch jobs", error: error.message });
    }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
    try {
        const { type, location } = req.query;

        let filter = {};
        if (type) filter.type = type;
        if (location) filter.location = { $regex: location, $options: "i" };

        const jobs = await Job.find(filter).sort({ postDate: -1 });

        // Attach company profile pictures by matching companyName
        const companyNames = [...new Set(jobs.map(j => j.company).filter(Boolean))];
        const companyUsers = await User.find({
            companyName: { $in: companyNames },
            userType: "institution",
        }).select("companyName profilePicture isVerified");

        const companyMap = {};
        companyUsers.forEach(u => {
            if (u.companyName) companyMap[u.companyName] = { profilePicture: u.profilePicture, isVerified: u.isVerified };
        });

        const jobsWithLogos = jobs.map(j => ({
            ...j.toObject(),
            companyLogo: companyMap[j.company]?.profilePicture || j.logo || null,
            companyIsVerified: companyMap[j.company]?.isVerified || false,
        }));

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs: jobsWithLogos,
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

        // Attach full company profile
        const companyUser = await User.findOne({
            companyName: job.company,
            userType: "institution",
        }).select("profilePicture email phonenumber address companySize industry website aboutCompany socialMedia isVerified");

        const jobWithLogo = {
            ...job.toObject(),
            companyLogo: companyUser?.profilePicture || job.logo || null,
            companyIsVerified: companyUser?.isVerified || false,
            companyInfo: companyUser ? {
                email:       companyUser.email,
                phone:       companyUser.phonenumber,
                address:     companyUser.address,
                companySize: companyUser.companySize,
                industry:    companyUser.industry,
                website:     companyUser.website,
                about:       companyUser.aboutCompany,
                socialMedia: companyUser.socialMedia,
                isVerified:  companyUser.isVerified,
            } : null,
        };

        res.status(200).json({
            success: true,
            job: jobWithLogo,
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

        // Verify token to ensure user is authenticated
        const decoded = verifyToken(req);
        
        // Get the job to verify ownership
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: "Job not found" 
            });
        }

        // Optional: Verify that the user owns this job (if you have a createdBy field)
        // For now, we just verify they're authenticated
        
        const updatedJob = await Job.findByIdAndUpdate(id, updates, { 
            new: true, 
            runValidators: true 
        });

        res.status(200).json({ 
            success: true, 
            message: "Job updated successfully", 
            job: updatedJob 
        });
    } catch (error) {
        console.error("Error updating job:", error);
        if (error.message.includes("token") || error.message.includes("Token") || error.message.includes("Authorization")) {
            return res.status(401).json({ 
                success: false, 
                message: error.message 
            });
        }
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

        // Verify token to ensure user is authenticated
        const decoded = verifyToken(req);

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
        if (error.message.includes("token") || error.message.includes("Token") || error.message.includes("Authorization")) {
            return res.status(401).json({ 
                success: false, 
                message: error.message 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete job", 
            error: error.message 
        });
    }
};
