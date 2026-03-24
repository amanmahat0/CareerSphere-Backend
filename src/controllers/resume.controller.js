import Resume from "../models/Resume.model.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  return jwt.verify(token, process.env.JWT_SECRET || "secret");
};

// Get resume for current user
export const getResume = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    
    const resume = await Resume.findOne({ userId: decoded.id });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found. Create a new one.",
      });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

// Create or update resume
export const saveResume = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const {
      personalInfo,
      education,
      experience,
      skills,
      projects,
      certifications,
      isComplete,
    } = req.body;

    // Validate required fields
    if (!personalInfo || !personalInfo.name || !personalInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Personal info (name and email) are required",
      });
    }

    // Filter out empty entries from arrays
    const filteredEducation = (education || []).filter(e => e.degree && e.institution);
    const filteredExperience = (experience || []).filter(e => e.title && e.company);
    const filteredProjects = (projects || []).filter(p => p.title);
    const filteredCertifications = (certifications || []).filter(c => c.title);
    const filteredSkills = (skills || []).filter(s => s && s.trim());

    const resumeData = {
      userId: decoded.id,
      personalInfo,
      education: filteredEducation,
      experience: filteredExperience,
      skills: filteredSkills,
      projects: filteredProjects,
      certifications: filteredCertifications,
      isComplete: isComplete || false,
    };

    let resume = await Resume.findOne({ userId: decoded.id });

    if (resume) {
      // Update existing resume
      resume = await Resume.findByIdAndUpdate(resume._id, resumeData, {
        new: true,
        runValidators: true,
      });
      
      return res.status(200).json({
        success: true,
        message: "Resume updated successfully",
        data: resume,
      });
    } else {
      // Create new resume
      resume = new Resume(resumeData);
      await resume.save();

      return res.status(201).json({
        success: true,
        message: "Resume created successfully",
        data: resume,
      });
    }
  } catch (error) {
    console.error("Error saving resume:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error saving resume",
    });
  }
};

// Update personal info
export const updatePersonalInfo = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { personalInfo } = req.body;

    if (!personalInfo) {
      return res.status(400).json({
        success: false,
        message: "Personal info is required",
      });
    }

    let resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      resume = new Resume({
        userId: decoded.id,
        personalInfo,
      });
      await resume.save();
    } else {
      resume.personalInfo = personalInfo;
      await resume.save();
    }

    res.status(200).json({
      success: true,
      message: "Personal info updated successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error updating personal info:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating personal info",
    });
  }
};

// Add education
export const addEducation = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { degree, institution, year, cgpa } = req.body;

    if (!degree || !institution) {
      return res.status(400).json({
        success: false,
        message: "Degree and institution are required",
      });
    }

    let resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      resume = new Resume({
        userId: decoded.id,
        education: [{ degree, institution, year, cgpa }],
      });
    } else {
      // Check if this education entry already exists (prevent duplicates)
      const exists = resume.education.some(
        (edu) => edu.degree === degree && edu.institution === institution
      );
      
      if (!exists) {
        resume.education.push({ degree, institution, year, cgpa });
      } else {
        // Entry already exists, just return success to prevent duplicate
        return res.status(200).json({
          success: true,
          message: "Education entry already exists",
          data: resume,
        });
      }
    }

    await resume.save();

    res.status(201).json({
      success: true,
      message: "Education added successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error adding education:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error adding education",
    });
  }
};

// Update education
export const updateEducation = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { educationId } = req.params;
    const { degree, institution, year, cgpa } = req.body;

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const education = resume.education.id(educationId);
    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education not found",
      });
    }

    education.degree = degree || education.degree;
    education.institution = institution || education.institution;
    education.year = year || education.year;
    education.cgpa = cgpa || education.cgpa;

    await resume.save();

    res.status(200).json({
      success: true,
      message: "Education updated successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error updating education:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating education",
    });
  }
};

// Delete education
export const deleteEducation = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { educationId } = req.params;

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    resume.education = resume.education.filter((e) => e._id.toString() !== educationId);
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Education deleted successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error deleting education:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error deleting education",
    });
  }
};

// Add experience
export const addExperience = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { company, title, duration, description } = req.body;

    if (!company || !title) {
      return res.status(400).json({
        success: false,
        message: "Company and title are required",
      });
    }

    let resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      resume = new Resume({
        userId: decoded.id,
        experience: [{ company, title, duration, description }],
      });
    } else {
      // Check if this experience entry already exists (prevent duplicates)
      const exists = resume.experience.some(
        (exp) => exp.company === company && exp.title === title
      );
      
      if (!exists) {
        resume.experience.push({ company, title, duration, description });
      } else {
        // Entry already exists, just return success to prevent duplicate
        return res.status(200).json({
          success: true,
          message: "Experience entry already exists",
          data: resume,
        });
      }
    }

    await resume.save();

    res.status(201).json({
      success: true,
      message: "Experience added successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error adding experience:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error adding experience",
    });
  }
};

// Update experience
export const updateExperience = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { experienceId } = req.params;
    const { company, title, duration, description } = req.body;

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const experience = resume.experience.id(experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    experience.company = company || experience.company;
    experience.title = title || experience.title;
    experience.duration = duration || experience.duration;
    experience.description = description || experience.description;

    await resume.save();

    res.status(200).json({
      success: true,
      message: "Experience updated successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating experience",
    });
  }
};

// Delete experience
export const deleteExperience = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { experienceId } = req.params;

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    resume.experience = resume.experience.filter((e) => e._id.toString() !== experienceId);
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Experience deleted successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error deleting experience:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error deleting experience",
    });
  }
};

// Update skills
export const updateSkills = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: "Skills must be an array",
      });
    }

    let resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      resume = new Resume({
        userId: decoded.id,
        skills,
      });
    } else {
      resume.skills = skills;
    }

    await resume.save();

    res.status(200).json({
      success: true,
      message: "Skills updated successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error updating skills:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating skills",
    });
  }
};

// Add project
export const addProject = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { title, description, link } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Project title is required",
      });
    }

    let resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      resume = new Resume({
        userId: decoded.id,
        projects: [{ title, description, link }],
      });
    } else {
      resume.projects.push({ title, description, link });
    }

    await resume.save();

    res.status(201).json({
      success: true,
      message: "Project added successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error adding project",
    });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { projectId } = req.params;

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    resume.projects = resume.projects.filter((p) => p._id.toString() !== projectId);
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error deleting project",
    });
  }
};

// Add certification
export const addCertification = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { title, issuer, date } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Certification title is required",
      });
    }

    let resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      resume = new Resume({
        userId: decoded.id,
        certifications: [{ title, issuer, date }],
      });
    } else {
      resume.certifications.push({ title, issuer, date });
    }

    await resume.save();

    res.status(201).json({
      success: true,
      message: "Certification added successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error adding certification:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error adding certification",
    });
  }
};

// Delete certification
export const deleteCertification = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { certificationId } = req.params;

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    resume.certifications = resume.certifications.filter(
      (c) => c._id.toString() !== certificationId
    );
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error deleting certification:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error deleting certification",
    });
  }
};

// Mark resume as complete
export const markAsComplete = async (req, res) => {
  try {
    const decoded = verifyToken(req);

    const resume = await Resume.findOne({ userId: decoded.id });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    resume.isComplete = true;
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Resume marked as complete",
      data: resume,
    });
  } catch (error) {
    console.error("Error marking resume as complete:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error marking resume as complete",
    });
  }
};
