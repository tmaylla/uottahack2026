const analyzeBtn = document.getElementById("analyzeBtn");
const inputContent = document.getElementById("inputContent");
const resultCard = document.getElementById("resultCard");
const historyList = document.getElementById("historyList");

let history = [];

analyzeBtn.addEventListener("click", async () => {
  const textToAnalyze = inputContent.value.trim();
  if (!textToAnalyze) {
    alert("Please paste some text to analyze.");
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing with AI...";

  try {
    const RENDER_API_URL = "https://uottahack2026.onrender.com/api/analyze";

    const res = await fetch(RENDER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textToAnalyze })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      document.getElementById("errorMsg").textContent = data.error;
      return;
    }

    displayStyledResult(data);

    history.unshift({ content: textToAnalyze, result: data.result });
    history = history.slice(0, 5);
    renderHistory();

  } catch (err) {
    console.error("Request failed:", err);
    document.getElementById("errorMsg").textContent = "Failed to connect to server.";
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Content";
  }
}); 

function displayStyledResult(data) {
  const badge = document.getElementById("statusBadge");
  const confBar = document.getElementById("confidenceBar");
  const confText = document.getElementById("confidenceText");
  const analysis = document.getElementById("analysisText");

  resultCard.classList.add("visible");

  const status = data.result.toLowerCase();
  let score = data.confidence;
  if (score <= 1) score = Math.round(score * 100);

  badge.className = "";
  confBar.className = "h-2 rounded-full transition-all duration-1000";

  if (status === "safe") {
    badge.classList.add("safe-status");
    confBar.classList.add("safe-bar");
  } else if (status === "scam") {
    badge.classList.add("scam-status");
    confBar.classList.add("scam-bar");
  } else {
    badge.classList.add("suspicious-status");
    confBar.classList.add("suspicious-bar");
  }

  badge.textContent = status.toUpperCase();
  confText.textContent = `${score}%`;
  confBar.style.width = `${score}%`;
  analysis.textContent = data.analysis;
}

function renderHistory() {
  historyList.innerHTML = history.map(h => `
    <div style="background:#111827;border:1px solid #374151;border-radius:8px;padding:8px;font-size:11px;display:flex;justify-content:space-between;gap:8px;">
      <span style="color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.content}</span>
      <strong>${h.result}</strong>
    </div>
  `).join("");
}
