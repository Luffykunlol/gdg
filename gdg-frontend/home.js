import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCUBxO9Ha2Fp4t9A1sFE6G-7VAOiSAwPWE";
const genAI = new GoogleGenerativeAI(API_KEY);

window.updateFileName = function updateFileName() {
    const fileInput = document.getElementById('docFile');
    const fileNameDisplay = document.getElementById('fileName');
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
        fileNameDisplay.classList.add('text-blue-700');
    } else {
        fileNameDisplay.textContent = "Drop file or browse";
        fileNameDisplay.classList.remove('text-blue-700');
    }
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Use readAsDataURL for images and PDFs (for Gemini multimodal)
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve({ type: 'file', data: base64, mimeType: file.type });
            };
        } else {
            // Treat as text for now
            reader.readAsText(file);
            reader.onload = () => resolve({ type: 'text', data: reader.result });
        }

        reader.onerror = reject;
    });
}

window.checkScam = async function checkScam() {
    const textInput = document.getElementById('scamText').value;
    const fileInput = document.getElementById('docFile');
    const language = document.getElementById('language').value;
    const resultDiv = document.getElementById('resultArea');
    const resultCard = document.getElementById('resultCard');
    const resultText = document.getElementById('resultText');
    const checkBtn = document.getElementById('checkBtn');

    if (!textInput.trim() && fileInput.files.length === 0) {
        alert("Please paste some text or upload a document first.");
        return;
    }

    // Reset UI
    resultDiv.classList.add('hidden');
    checkBtn.disabled = true;
    checkBtn.textContent = "Checking...";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let promptContent = [];
        let documentText = textInput || "";

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const filePayload = await readFile(file);

            if (filePayload.type === 'file') {
                promptContent.push({
                    inlineData: {
                        data: filePayload.data,
                        mimeType: filePayload.mimeType
                    }
                });
            } else {
                documentText += "\n\nFILE CONTENT:\n" + filePayload.data;
            }
        }

        const fullPrompt = `
You are Civic Shield AI helping Indian citizens.

${documentText ? `DOCUMENT CONTENT:\n${documentText}\n` : ""}

TASK:
1. Analyze the input (text or document) deeply for fraud indicators.
2. Start with a clear verdict: "VERDICT: SAFE", "VERDICT: CAUTION", or "VERDICT: HIGH RISK (SCAM)".
3. Explain clearly WHY it is safe or a scam.
4. Give checking advice.
5. Respond in ${language || "English"}
`;

        promptContent.unshift(fullPrompt);

        const result = await model.generateContent(promptContent);
        const apiResponse = result.response.text();

        // Display Result
        resultDiv.classList.remove('hidden');
        resultText.textContent = apiResponse;

        // Coloring Logic
        resultCard.classList.remove('border-red-500', 'bg-red-50', 'border-green-500', 'bg-green-50', 'border-yellow-500', 'bg-yellow-50');

        const upperResponse = apiResponse.toUpperCase();
        if (upperResponse.includes("HIGH RISK") || upperResponse.includes("SCAM") || upperResponse.includes("🚨")) {
            resultCard.classList.add('border-red-500', 'bg-red-50');
        } else if (upperResponse.includes("SAFE") || upperResponse.includes("NORMAL") || upperResponse.includes("✅")) {
            resultCard.classList.add('border-green-500', 'bg-green-50');
        } else {
            resultCard.classList.add('border-yellow-500', 'bg-yellow-50');
        }

        // Scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = "Check for Scam";
    }
}
