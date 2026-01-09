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
const USE_MOCK = !process.env.GEMINI_API_KEY;
if (USE_MOCK) {
  console.warn("⚠️ GEMINI_API_KEY is missing — running in MOCK mode.");
}
const genAI = USE_MOCK ? null : new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Auto-discover a working model ID at startup when a key is present.
let SELECTED_MODEL = process.env.GEMINI_MODEL || null;
async function discoverModel() {
  if (!genAI) return null;
  if (SELECTED_MODEL) return SELECTED_MODEL;
  try {
    // listModels() may be supported by the client library; if not, this will throw.
    const list = await genAI.listModels?.();
    let models = list?.models || list || [];
    // Normalize to array of ids if the shape differs
    if (Array.isArray(models) && models.length && typeof models[0] === 'object' && models[0].name) {
      models = models.map(m => m.name || m.model || m.id);
    }
    console.log('Discovered models:', models.slice(0, 20));

    // Pick the first candidate that looks like a Gemini generative model
    const candidate = models.find(m => /gemini/i.test(m) && !/embed|textembedding/i.test(m));
    if (candidate) {
      SELECTED_MODEL = candidate;
      console.log('Selected model:', SELECTED_MODEL);
      return SELECTED_MODEL;
    }
  } catch (e) {
    console.warn('Could not list models:', e?.message || e);
  }

  // Fallback to a safe default used elsewhere. This may still 404 depending on account.
  SELECTED_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5';
  console.log('Falling back to model:', SELECTED_MODEL);
  return SELECTED_MODEL;
}

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
    if (USE_MOCK) {
      // Return a deterministic mock response for local development
      const mock = {
        summary: "Mock: document looks like a standard civic notice.",
        answer: "This is a simulated answer. For full analysis set GEMINI_API_KEY and restart the server.",
        risk: "SAFE",
        actions: [
          "Keep a copy of the document",
          "Do not share sensitive OTPs or personal data",
          "Verify with the issuing agency via official channels"
        ]
      };
      return res.json(mock);
    }

    // Prefer the stable model used in the cloud functions. If unavailable,
    // this call may throw; handle errors and fall back to a mock response
    // so local development doesn't break.
    try {
      const modelId = await discoverModel();
      const model = genAI.getGenerativeModel({
        model: modelId,
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

      return res.json(jsonResponse);
    } catch (err) {
      console.error("Analysis Error (live model failed):", err);
      // Return a helpful mock response so frontend and tests can continue.
      return res.status(200).json({
        summary: "Fallback: analysis unavailable (model error).",
        answer: "The external generative model failed. Check server logs for details.",
        risk: "CAUTION",
        actions: [
          "Keep a copy of the document",
          "Do not share OTPs or personal data",
          "Verify with issuing agency via official channels"
        ]
      });
    }

  } catch (err) {
    console.error("Analysis Error:", err);
    res.status(500).json({
      error: "Analysis failed",
      details: err.message
    });
  }
});

/* ---------------- MODELS (DISCOVERY) ---------------- */
app.get('/models', async (req, res) => {
  if (!genAI) return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
  try {
    const list = await genAI.listModels?.();
    // Log the raw response for debugging
    console.log('Raw listModels response:', JSON.stringify(list || list?.models || list, null, 2));

    // If caller requested raw output, return the unprocessed client response
    if (String(req.query.raw) === '1') {
      return res.json({ raw: list });
    }

    let models = list?.models || list || [];
    if (Array.isArray(models) && models.length && typeof models[0] === 'object' && models[0].name) {
      models = models.map(m => ({ name: m.name || m.model || m.id, raw: m }));
    }
    return res.json({ models });
  } catch (err) {
    console.error('Model list failed:', err?.message || err);
    return res.status(500).json({ error: 'Could not list models', details: err?.message });
  }
});

/* ---------------- START ---------------- */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🛡️ Civic Shield Backend running on http://localhost:${PORT}`);
});
