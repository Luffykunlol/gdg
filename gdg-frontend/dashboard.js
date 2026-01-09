import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");

/* ---------------- AUTH CHECK ---------------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    welcome.textContent = `👋 Logged in as ${user.email}`;
  }
});

/* ---------------- LOGOUT ---------------- */
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

/* ---------------- READ FILE ---------------- */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/* ---------------- ANALYZE ---------------- */
analyzeBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("docFile");
  const question = document.getElementById("userQuestion").value;
  const language = document.getElementById("language").value;

  if (fileInput.files.length === 0) {
    alert("📄 Please upload a document");
    return;
  }

  if (!question.trim()) {
    alert("❓ Please ask a question");
    return;
  }

  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = "🤖 Analyzing document...";

  try {
    const documentText = await readFileAsText(fileInput.files[0]);

    const response = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentText,
        question,
        language
      })
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    resultDiv.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">📄 Summary</h3>
      <p class="mb-4">${data.summary}</p>

      <h3 class="text-lg font-semibold mb-2">❓ Answer</h3>
      <p class="mb-4 whitespace-pre-wrap">${data.answer}</p>

      <h3 class="text-lg font-semibold mb-2">⚠️ Risk Level</h3>
      <p class="mb-4 font-bold">${data.risk}</p>

      <h3 class="text-lg font-semibold mb-2">✅ Next Steps</h3>
      <ul class="list-disc ml-6">
        ${data.actions.map(a => `<li>${a}</li>`).join("")}
      </ul>
    `;
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML =
      "❌ Failed to analyze. Is backend running?";
  }
});
