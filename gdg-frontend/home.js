async function checkScam() {
    const textInput = document.getElementById('scamText').value;
    const language = document.getElementById('language').value;
    const resultDiv = document.getElementById('resultArea');
    const resultCard = document.getElementById('resultCard');
    const resultText = document.getElementById('resultText');
    const checkBtn = document.getElementById('checkBtn');

    if (!textInput.trim()) {
        alert("Please paste some text first.");
        return;
    }

    // Reset UI
    resultDiv.classList.add('hidden');
    checkBtn.disabled = true;
    checkBtn.textContent = "Checking...";

    try {
        // Change this URL to your live Firebase Function URL once deployed
        const response = await fetch("http://localhost:5001/civic-shield/us-central1/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: textInput,
                language: language,
                documentText: textInput
            })
        });

        const data = await response.json();
        const apiResponse = data.answer;

        // Display Result
        resultDiv.classList.remove('hidden');
        resultText.textContent = apiResponse;

        // Coloring Logic (Phase 4 & 5 Compliance)
        resultCard.classList.remove('border-red-500', 'bg-red-50', 'border-green-500', 'bg-green-50', 'border-yellow-500', 'bg-yellow-50');

        const upperResponse = apiResponse.toUpperCase();
        if (upperResponse.includes("HIGH RISK") || upperResponse.includes("SCAM")) {
            resultCard.classList.add('border-red-500', 'bg-red-50');
        } else if (upperResponse.includes("SAFE") || upperResponse.includes("NORMAL")) {
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
