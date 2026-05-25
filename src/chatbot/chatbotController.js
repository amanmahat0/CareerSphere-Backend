import Groq from "groq-sdk";
import chatbotRules from "./chatbotRules.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT =
  "You are CareerBot, a helpful assistant for CareerSphere, a placement and internship portal based in Nepal. " +
  "You only answer questions related to jobs, internships, career development, resume building, interview preparation, " +
  "and using the CareerSphere platform. CareerSphere helps students and fresh graduates find jobs, internships, and " +
  "traineeships at Nepali companies and institutions. " +
  "If a user asks about something completely unrelated to careers or the CareerSphere platform (such as cooking, sports, " +
  "entertainment, or general knowledge), politely decline and let them know you can only help with career and placement topics. " +
  "Keep answers concise, friendly, and practical. Use simple language suitable for students in Nepal.";

export async function handleChatMessage(req, res) {
  try {
    const { message, role } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Message is required." });
    }

    const normalized = message.trim().toLowerCase();

    // Rule-based layer: return first matching rule immediately
    for (const rule of chatbotRules) {
      const matched = rule.keywords.some((kw) => normalized.includes(kw.toLowerCase()));
      if (matched) {
        return res.json({ reply: rule.answer, source: "rule" });
      }
    }

    // Groq fallback
    try {
      const roleContext = role ? `The user is a ${role} on CareerSphere. ` : "";
      const userMessage = roleContext + message.trim();

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content || "";
      return res.json({ reply: text, source: "groq" });
    } catch (groqError) {
      console.error("Groq API error:", groqError.message);
      return res.json({
        reply:
          "I'm sorry, I couldn't process your request right now. Please try again in a moment, or visit our Help Center for more information.",
        source: "fallback",
      });
    }
  } catch (error) {
    console.error("Chatbot error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}
