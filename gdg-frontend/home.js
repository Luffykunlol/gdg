function updateFileName() {
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
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function checkScam() {
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
        let payload = {
            question: textInput || "Analyze this for potential scams or fraud.",
            language: language,
            documentText: textInput
        };

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileData = await readFile(file);
            payload.fileData = fileData;
            payload.mimeType = file.type;
        }

        // Perfect sync: Use current origin if deployed, otherwise localhost emulator
        const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:5001/civic-shield/us-central1/api"
            : "/api"; // When deployed to Firebase, we use rewrites

        const response = await fetch(`${BASE_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const apiResponse = data.answer;

        // Display Result
        resultDiv.classList.remove('hidden');
        resultText.textContent = apiResponse;

        // Coloring Logic (Phase 4 & 5 Compliance)
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
        alert("Sorry, there was an error checking the scam. Please try again later.");
        console.error(err);
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = "Check for Scam";
    }
}
