const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    res.json({
      summary: "Document analyzed successfully.",
      answer: text,
      risk: "LOW",
      actions: [
        "Keep the document safely",
        "Do not share OTP or personal details",
        "Verify with official sources if unsure"
      ]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

exports.api = functions.https.onRequest(app);
