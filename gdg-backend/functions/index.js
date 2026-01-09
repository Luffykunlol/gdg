const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SELECTED_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

function normalizeRisk(text) {
  if (!text) return 'LOW';
  const t = text.toLowerCase();
  if (t.includes('high risk') || t.includes('fraud') || t.includes('immediate payment') || t.includes('transfer money') || t.includes('urgent')) return 'HIGH';
  if (t.includes('medium') || t.includes('caution') || t.includes('verify') || t.includes('suspicious')) return 'MEDIUM';
  if (t.includes('low') || t.includes('safe') || t.includes('no risk') ) return 'LOW';
  // default to LOW when unclear
  return 'LOW';
}

app.post("/analyze", async (req, res) => {
  try {
    const { documentText, question, language } = req.body;

    if (!documentText || !question) {
      return res.status(400).json({ error: "Missing input" });
    }

    const fullPrompt = `
You are Civic Shield AI helping Indian citizens.

DOCUMENT:
${documentText}

QUESTION:
${question}

TASK:
1. Explain what the document is about
2. Answer the user's question clearly
3. Detect fraud or risk (LOW / MEDIUM / HIGH)
4. Give step-by-step advice
5. Respond in ${language || "English"}
`;

    try {
      const model = genAI.getGenerativeModel({ model: SELECTED_MODEL });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();

      // Derive a simple risk label from the model output to keep frontend mapping stable
      const risk = normalizeRisk(text);

      res.json({
        summary: "Document analyzed successfully.",
        answer: text,
        risk: risk,
        actions: [
          "Keep the document safely",
          "Do not share OTP or personal details",
          "Verify with official sources if unsure"
        ]
      });
    } catch (err) {
      console.error('Live model error:', err);
      res.json({
        summary: "Analysis unavailable (model error)",
        answer: "The analysis service failed. Try again later or check function logs.",
        risk: "MEDIUM",
        actions: [
          "Keep the document safely",
          "Do not share OTP or personal details",
          "Verify with official sources if unsure"
        ]
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

exports.api = functions.https.onRequest(app);
