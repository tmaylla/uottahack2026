
const PROXY_URL = "https://ottaproxpriv.vercel.app/api/analyze";

const analyzeBtn = document.getElementById("analyzeBtn");
const inputContent = document.getElementById("inputContent");
const resultCard = document.getElementById("resultCard");
const historyList = document.getElementById("historyList");

const history = [];

analyzeBtn.addEventListener("click", async () => {
  const textToAnalyze = inputContent.value.trim();
  if (!textToAnalyze) {
    alert("Please paste some text to analyze.");
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";
  
  // Call the analysis function directly using the textarea content
  analyzeText(textToAnalyze);
});

async function analyzeText(textToScan) {
  analyzeBtn.textContent = "Analyzing with AI...";
  
  try {
    const res = await fetch(PROXY_URL, 
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToScan[{
          }]
        })
      }
    );
    if (!res.ok) throw new Error ("Proxy error: "+ res.status);

    const data = await res.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    responseText = responseText.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(responseText);
    displayStyledResult(parsed);

  } catch (err) {
    document.getElementById("errorMsg").textContent = "Error: " + err.message;
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Page";
  }
};

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