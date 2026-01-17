const geminiAPI_KEY = "AIzaSyB7TRGHZ7ar52s_rf4ASt4AV821Q3hKSPw";
const OpenAiAPI_KEY = "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";
const analyzeBtn = document.getElementById("analyzeBtn");
const inputContent = document.getElementById("inputContent");
const resultCard = document.getElementById("resultCard");
const historyList = document.getElementById("historyList");
const geminiResult = document.getElementById("geminiResult");
const openaiResult = document.getElementById("openaiResult");

const history = [];

async function analyzeWithGemini(content) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiAPI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: scamPrompt("url", content) }]
        }]
      })
    }
  );

  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}
async function analyzeWithOpenAI(content) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: scamPrompt("url", content) }],
      temperature: 0.2
    })
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}


analyzeBtn.addEventListener("click", async () => {const content = inputContent.value.trim();
  if (!content) return;

  geminiResult.textContent = "⏳ Analyzing...";
  openaiResult.textContent = "⏳ Analyzing...";

  try {
    const [gemini, openai] = await Promise.all([
      analyzeWithGemini(content),
      analyzeWithOpenAI(content)
    ]);

    renderResult(geminiResult, gemini);
    renderResult(openaiResult, openai);

  } catch (err) {
    console.error(err);
    geminiResult.textContent = "Error";
    openaiResult.textContent = "Error";
  }
});

function scamPrompt(type, content) {
  return `You are a scam detection expert. Analyze the following ${type} for potential phishing, fraud, scam, or malicious intent.

Content to analyze: "${content}"

Analyze for:
- Phishing indicators
- Too good to be true offers
- Urgency or pressure
- Suspicious patterns
- Known scam signatures

Return a JSON object with:
- result: "safe", "suspicious", or "scam"
- confidence: number (0-100)
- analysis: A concise explanation of why (max 2-3 sentences).
`;
}
function renderResult(el, ai) {
  el.innerHTML = `
    <p class="result ${ai.result}">${ai.result.toUpperCase()}</p>
    <p>Confidence: ${ai.confidence}%</p>
    <p class="analysis">${ai.analysis}</p>
  `;
}


function renderHistory() {
  historyList.innerHTML = history.map(h => `
    <div class="bg-gray-800 p-3 rounded space-y-1">
      <p class="text-sm truncate">${h.content}</p>
      <div class="flex justify-between text-xs">
        <span class="${
          h.result === "scam" ? "text-red-400" :
          h.result === "suspicious" ? "text-yellow-400" :
          "text-green-400"
        }">
          ${h.result.toUpperCase()}
        </span>
        <span class="text-gray-400">
          ${h.confidence}%
        </span>
      </div>
      <p class="text-[10px] text-gray-500">
        ${h.model}
      </p>
    </div>
  `).join("");
}
