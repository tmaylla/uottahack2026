const geminiAPI_KEY = "AIzaSyB7TRGHZ7ar52s_rf4ASt4AV821Q3hKSPw";
let lastNotifiedDomains = {};

// 1. AI Analysis Function
async function analyzeUrl(url) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiAPI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Analyze this URL for scams/phishing: "${url}". Return ONLY a JSON object with: {"result": "safe" | "suspicious" | "scam", "confidence": 0-100, "analysis": "short explanation"}` }]
          }]
        })
      }
    );
    const data = await res.json();
    // Clean the string in case Gemini adds markdown code blocks
    const cleanJson = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "");
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("AI Error:", err);
    return null;
  }
}

// 2. Tab Update Listener
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    const domain = new URL(tab.url).hostname;

    // Only scan if it's a new domain for this tab
    if (lastNotifiedDomains[tabId] === domain) return;
    lastNotifiedDomains[tabId] = domain;

    console.log("Scanning new domain:", domain);

    // Call the AI
    const aiResponse = await analyzeUrl(tab.url);

    if (aiResponse) {
      // 3. Create Notification based on AI result
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: `Scam Check: ${aiResponse.result.toUpperCase()}`,
        message: `${aiResponse.analysis} (Confidence: ${aiResponse.confidence}%)`,
        priority: aiResponse.result === "scam" ? 2 : 0
      });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => delete lastNotifiedDomains[tabId]);