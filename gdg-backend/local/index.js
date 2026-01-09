import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
// increase limit for PDF base64 uploads
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing from environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------------- ANALYSIS ENDPOINT ---------------- */
app.post("/analyze", async (req, res) => {
  try {
    const { documentText, fileData, mimeType, question, language } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    if (!documentText && !fileData) {
      return res.status(400).json({ error: "Missing document content" });
    }

    // Role & Safety Protocol
    const systemInstruction = `
You are Civic Shield, an AI assistant dedicated to protecting ordinary citizens from fraud, scams, and bureaucracy.

CORE SAFETY PROTOCOL:
1. SCAN: Analyze the input for high-risk keywords (OTP, Aadhaar, Urgent Payment, Lottery, Click this link).
2. VERDICT: Classify the situation immediately as one of:
   - "SAFE": Normal civic documents, routine delays, standard forms.
   - "CAUTION": Unfamiliar requests, mild irregularities.
   - "HIGH RISK": Requests for money/OTP, urgency, threats, unofficial links.
3. SIMPLIFY: Explain the content in extremely simple, non-legalistic language (ELI5).
4. DIRECT: Provide a numbered list of concrete actions.

OUTPUT FORMAT (JSON ONLY):
{
  "summary": "One sentence summary of what this is.",
  "answer": "Clear answer to the user's specific question.",
  "risk": "SAFE" | "CAUTION" | "HIGH RISK",
  "actions": ["Step 1", "Step 2", "Step 3"]
}

RESPONSE LANGUAGE:
Respond strictly in ${language || "English"}.
`;

    // Construct the model parts
    const parts = [];

    // Add file data (PDF) if present
    if (fileData) {
      parts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType || "application/pdf",
        },
      });
    }

    // Add text data if present (mutually exclusive usually, but handled)
    if (documentText) {
      parts.push({ text: `DOCUMENT CONTENT:\n${documentText}` });
    }

    // Add User Question
    parts.push({ text: `USER QUESTION:\n${question}` });

    // Generate
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const outputText = result.response.text();
    const jsonResponse = JSON.parse(outputText);

    res.json(jsonResponse);

  } catch (err) {
    console.error("Analysis Error:", err);
    res.status(500).json({
      error: "Analysis failed",
      details: err.message
    });
  }
});

/* ---------------- START ---------------- */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🛡️ Civic Shield Backend running on http://localhost:${PORT}`);
});
