// Remove the hardcoded API_KEY
// const API_KEY = "AIzaSyDsDQ0_phtYpgadcFzNFE1VDmgmXukU46E";

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

// Call your server instead of Gemini directly
async function analyzeContent(url, pageText) {
  try {
    const trimmedText = pageText.substring(0, 5000);

    // Server endpoint instead of direct Gemini API
    const res = await fetch("https://uottahack2026.onrender.com/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  url: url,
  content: trimmedText
})
    });

    const data = await res.json();

    if (data.error) {
      console.error("Server API Error:", data.error);
      console.error("Server API Error:", data.error);
      return null;
    }

    return data; // already a parsed JSON object from server
  } catch (err) {
    console.error("AI Analysis Error:", err);
    return null;
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {

    // 1. Grab the text from the current page
    const pageText = await getPageText(tabId);

    // 2. Call your server with both URL and page text
    const aiResponse = await analyzeContent(tab.url, pageText);

    if (aiResponse && (aiResponse.result === "scam" || aiResponse.result === "suspicious")) {
      // Send a message to the webpage to show warning
      chrome.tabs.sendMessage(tabId, {
        action: "show_warning",
        data: aiResponse
      });
    }
  }
});
