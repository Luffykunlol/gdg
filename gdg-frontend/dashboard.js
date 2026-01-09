import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");
const emptyState = document.getElementById("emptyState");

/* ---------------- AUTH CHECK ---------------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    welcome.textContent = `👋 ${user.email}`;
  }
});

/* ---------------- LOGOUT ---------------- */
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

/* ---------------- READ FILE HELPER ---------------- */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Info = reader.result.split(',')[1];
        resolve({ type: 'file', data: base64Info, mimeType: file.type });
      };
    } else {
      reader.readAsText(file);
      reader.onload = () => resolve({ type: 'text', data: reader.result });
    }

    reader.onerror = reject;
  });
}

/* ---------------- ANALYZE ---------------- */
analyzeBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("docFile");
  const question = document.getElementById("userQuestion").value;
  const language = document.getElementById("language").value;

  if (fileInput.files.length === 0) {
    alert("📄 Please upload a document (.txt or .pdf)");
    return;
  }

  if (!question.trim()) {
    alert("❓ Please ask a question");
    return;
  }

  // Show Loading State
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = `<span>⏳</span> Analyzing...`;
  resultDiv.classList.remove("hidden");
  emptyState.classList.add("hidden");
  resultDiv.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
        <div class="h-12 w-12 bg-indigo-200 rounded-full"></div>
        <div class="h-4 w-3/4 bg-slate-200 rounded"></div>
        <div class="h-4 w-1/2 bg-slate-200 rounded"></div>
    </div>
  `;

  try {
    const fileResult = await readFile(fileInput.files[0]);

    // Perfect sync: Use current origin if deployed, otherwise localhost emulator
    const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5001/civic-shield/us-central1/api"
      : "/api";

    const response = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileData: fileResult.type === 'file' ? fileResult.data : null,
        documentText: fileResult.type === 'text' ? fileResult.data : null,
        mimeType: fileResult.type === 'file' ? fileResult.mimeType : null,
        question,
        language
      })
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    // Determine Risk Color - Improved detection
    const textToAnalyze = data.answer.toUpperCase();
    let riskColor = "bg-green-100 text-green-700 border-green-200";
    let riskIcon = "✅";
    let identifiedRisk = "SAFE";

    if (textToAnalyze.includes("HIGH RISK") || textToAnalyze.includes("SCAM") || textToAnalyze.includes("🚨")) {
      riskColor = "bg-red-100 text-red-700 border-red-200";
      riskIcon = "🚨";
      identifiedRisk = "HIGH RISK";
    } else if (textToAnalyze.includes("CAUTION") || textToAnalyze.includes("⚠️") || textToAnalyze.includes("MEDIUM")) {
      riskColor = "bg-yellow-100 text-yellow-700 border-yellow-200";
      riskIcon = "⚠️";
      identifiedRisk = "CAUTION";
    }

    resultDiv.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Verdict Badge -->
        <div class="flex items-center justify-between">
             <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Safety Verdict</h3>
             <span class="px-4 py-1.5 rounded-full text-sm font-bold border ${riskColor} flex items-center gap-2 uppercase">
                ${riskIcon} ${identifiedRisk}
             </span>
        </div>

        <div class="prose prose-slate max-w-none">
           <div class="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">${data.answer}</div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = `
        <div class="text-center p-8 bg-red-50 rounded-xl border border-red-100">
            <div class="text-3xl mb-2">❌</div>
            <h3 class="text-red-800 font-bold mb-1">Analysis Failed</h3>
            <p class="text-red-600 text-sm">Could not connect to the AI server. Is the backend running?</p>
        </div>
    `;
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `<span>🔍</span> Run Protection Scan`;
  }
});
