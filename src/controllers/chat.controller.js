import Groq from "groq-sdk";
import User from "../models/User.model.js";
import Application from "../models/Application.model.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ success: false, message: "Chat service is not configured" });
    }

    // Fetch user profile
    const user = await User.findById(req.userId).select("fullname applicantType");

    // Fetch recent applications with job info for context
    const applications = await Application.find({ userId: req.userId })
      .populate("jobId", "title company type location")
      .sort({ appliedDate: -1 })
      .limit(8);

    const appSummary = applications.length > 0
      ? applications.map(a =>
          `• ${a.jobId?.title || "Unknown"} at ${a.jobId?.company || "Unknown"} — status: ${a.status}, step: ${a.interviewStep}${a.interviewDate ? `, interview: ${new Date(a.interviewDate).toLocaleDateString()}` : ""}`
        ).join("\n")
      : "No applications yet.";

    const systemPrompt = `You are CareerSphere Assistant, a friendly and knowledgeable career guide for job seekers in Nepal.

User: ${user?.fullname || "Applicant"} (${user?.applicantType || "Student"})

Their current applications:
${appSummary}

Your responsibilities:
- Help the user understand their application statuses and what each step means (shortlisted, test, interview, offer, hired)
- Give tailored interview preparation tips based on their applied positions
- Provide resume writing advice and career guidance
- Explain how to use CareerSphere features (resume builder, interview schedule, notifications, profile)
- Answer general job-search and career questions

Rules:
- Keep replies concise and friendly (3–5 sentences max unless the user asks for detail)
- Refer to the user's actual applications when relevant
- Do not invent application details beyond what is listed above
- If unsure about something, say so honestly
- Do not answer questions unrelated to careers, jobs, or the platform`;

    // Convert conversation history to Groq/OpenAI format (last 8 exchanges)
    const historyMessages = history.slice(-8).map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message.trim() },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "";
    res.json({ success: true, reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ success: false, message: "Chat service unavailable. Please try again." });
  }
};
