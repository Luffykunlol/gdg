const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCUBxO9Ha2Fp4t9A1sFE6G-7VAOiSAwPWE";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const SELECTED_MODEL = 'gemini-1.5-flash';

function normalizeRisk(text) {
  if (!text) return 'LOW';
  const t = text.toLowerCase();
  if (t.includes('high risk') || t.includes('fraud') || t.includes('immediate payment') || t.includes('transfer money') || t.includes('urgent')) return 'HIGH';
  if (t.includes('medium') || t.includes('caution') || t.includes('verify') || t.includes('suspicious')) return 'MEDIUM';
  if (t.includes('low') || t.includes('safe') || t.includes('no risk')) return 'LOW';
  // default to LOW when unclear
  return 'LOW';
}

app.post("/analyze", async (req, res) => {
  try {
    const { documentText, question, language, fileData, mimeType } = req.body;

    if (!documentText && !fileData) {
      return res.status(400).json({ error: "Missing input text or file" });
    }

    const fullPrompt = `
You are Civic Shield AI helping Indian citizens.

${documentText ? `DOCUMENT CONTENT:\n${documentText}\n` : ""}
QUESTION:
${question || "Analyze this for potential scams or fraud."}

TASK:
1. Explain what the document or message is about
2. Answer the user's question clearly
3. Detect fraud or risk (LOW / MEDIUM / HIGH)
4. Give step-by-step advice
5. Respond in ${language || "English"}
`;

    try {
      const model = genAI.getGenerativeModel({ model: SELECTED_MODEL });

      let result;
      if (fileData && mimeType) {
        result = await model.generateContent([
          fullPrompt,
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType
            }
          }
        ]);
      } else {
        result = await model.generateContent(fullPrompt);
      }

      const text = result.response.text();

      // Derive a simple risk label from the model output to keep frontend mapping stable
      const risk = normalizeRisk(text);

      res.json({
        summary: "Analysis completed successfully.",
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
