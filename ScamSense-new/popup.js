const API_KEY = "AIzaSyC2yntuFTRrs4bcaKe62-kvSQYhhS1Ne0A";

const analyzeBtn = document.getElementById("analyzeBtn");
const inputContent = document.getElementById("inputContent");
const resultCard = document.getElementById("resultCard");
const historyList = document.getElementById("historyList");

const history = [];

analyzeBtn.addEventListener("click", async () => {
  const url = inputContent.value.trim();
  if (!url) return;

  resultCard.textContent = "⏳ Analyzing...";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `How likely is this website to be a scam? URL: ${url}`
            }]
          }]
        })
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    geminiResult.textContent = text;

    history.push({
      content: url,
      result: "unknown",
      confidence: 0
    });

    renderHistory();

  } catch (err) {
    console.error(err);
    geminiResult.textContent = "Error: " + err.message;
  }
});

function renderHistory() {
  historyList.innerHTML = history.map(h => `
    <div class="bg-gray-800 p-2 rounded">
      <p class="text-sm mb-1">${h.content}</p>
      <p class="text-xs text-gray-400">
        ANALYZED
      </p>
    </div>
  `).join("");
}