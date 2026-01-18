const API_KEY = "AIzaSyB7V86BHgtwc7-7_tA41343dsgMW9h90RU";

// Helper to get text content from a tab
async function getPageText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => document.body.innerText,
    });
    return results[0].result;
  } catch (err) {
    console.error("Failed to extract text:", err);
    return "";
  }
}

async function analyzeContent(url, pageText) {
  try {
    // Trim text to 5000 chars to avoid token limits
    const trimmedText = pageText.substring(0, 5000);
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Analyze this website for scams. 
              URL: ${url}
              Visible Text Content: ${trimmedText}
              
              Return ONLY a JSON object: {"result": "safe" | "suspicious" | "scam", "confidence": 0-100, "analysis": "Short bullet points with recommendations."}` 
            }]
          }]
        })
      }
    );
    
    const data = await res.json();
//for when it get error 403 (usualy when the key is getting blocked)
    if (data.error) {
      console.error("Gemini Error Message:", data.error.message);
      document.getElementById("errorMsg").textContent = `API Error: ${data.error.message}`;
      return;
    }
    const text = data.candidates[0].content.parts[0].text;
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("AI Analysis Error:", err);
    return null;
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
   

    // 1. Grab the text from the current page
    const pageText = await getPageText(tabId);

    // 2. Call AI with both URL and page text
    const aiResponse = await analyzeContent(tab.url, pageText);

    if (aiResponse) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: `Scam Check: ${aiResponse.result.toUpperCase()}`,
        message: `${aiResponse.analysis} (Accuracy: ${aiResponse.confidence}%)`,
        priority: aiResponse.result === "scam" ? 2 : 0
      });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => delete lastNotifiedDomains[tabId]);