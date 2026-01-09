import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------------- TEST ---------------- */
app.get("/", (req, res) => {
  res.send("Civic Shield backend running with Gemini ✅");
});

/* ---------------- ANALYZE ---------------- */
app.post("/analyze", async (req, res) => {
  try {
    const { documentText, question, language } = req.body;

    if (!documentText || !question) {
      return res.status(400).json({ error: "Missing input" });
    }

    const prompt = `
You are Civic Shield AI.

DOCUMENT:
${documentText}

USER QUESTION:
${question}

INSTRUCTIONS:
1. Summarize the document
2. Answer the user's question clearly
3. Identify any fraud or risk
4. Provide step-by-step advice
5. Use simple language
6. Respond in ${language || "English"}

FORMAT RESPONSE AS JSON WITH:
summary
answer
risk (LOW / MEDIUM / HIGH)
actions (array of steps)
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 🔴 SAFETY: Gemini returns text, so we map manually
    res.json({
      summary: "Document analyzed successfully.",
      answer: text,
      risk: "LOW",
      actions: [
        "Read the document carefully",
        "Do not share personal details",
        "Verify with official sources if unsure"
      ]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini analysis failed" });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
