
const API_KEY = "AIzaSyD74zbKZRrThGpF-Em0HLIIGUHxHe_6SVA";

const analyzeBtn = document.getElementById("analyzeBtn");
const inputContent = document.getElementById("inputContent");
const resultCard = document.getElementById("resultCard");
const historyList = document.getElementById("historyList");

const history = [];

analyzeBtn.addEventListener("click", async () => {
  const content = inputContent.value.trim();
  if (!content) return;

  // Reset UI for new scan
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "⏳ Analyzing...";
  //resultCard.textContent = "";
  document.getElementById("resultCard").classList.add("hidden");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this content for scams/phishing. Return ONLY a JSON object: {"result": "safe" | "suspicious" | "scam", "confidence": number, "analysis": "short explanation"}. Content: ${content}`
            }]
          }]
        })
      }
    );

    if (!res.ok) throw new Error("API Request Failed");

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean potential markdown code blocks
    text = text.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      displayStyledResult(parsed);
      
      // Add to history list
      history.unshift({
        content: content.substring(0, 40) + "...",
        result: parsed.result
      });
      renderHistory();
    } catch (e) {
      // If AI fails to send JSON, show raw text
      resultCard.textContent = text;
    }

  } catch (err) {
    document.getElementById("errorMsg").textContent = "Error: " + err.message;
} finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Content";
  }
});

function displayStyledResult(data) {
    const card = document.getElementById("resultCard");
    const badge = document.getElementById("statusBadge");
    const confBar = document.getElementById("confidenceBar");
    const confText = document.getElementById("confidenceText");
    const analysis = document.getElementById("analysisText");

    card.classList.add("visible");
    card.classList.remove("hidden"); // Ensure it's not hidden
    let score = data.confidence;
  if (score <= 1 && score > 0) {
    score = score * 100; 
  }

    const status = data.result.toLowerCase();
    
    // Base styles that don't change
    badge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border";
    confBar.className = "h-2 rounded-full transition-all duration-1000";

    if (status === "safe") {
        badge.classList.add("safe-status");
        confBar.classList.add("safe-bar");
    } else if (status === "scam" || status === "malicious") {
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
    <div class="bg-gray-900 border border-gray-800 p-3 rounded-lg flex justify-between items-center">
      <p class="text-xs text-gray-400 truncate w-2/3">${h.content}</p>
      <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-gray-700 text-gray-500">
        ${h.result}
      </span>
    </div>
  `).join("");
}