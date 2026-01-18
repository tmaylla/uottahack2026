// Memory cache to prevent duplicate API calls
const analysisCache = new Map();

// 1. Listen for the message from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if the message is the one we expect
    if (message.type === "ANALYZE_PAGE" && sender.tab) {
        const url = message.url;
        const textToAnalyze = message.text;

        console.log("Background: Received text from tab", sender.tab.id);

        // 2. Cache Check (Save tokens)
        if (analysisCache.has(url)) {
            console.log("Background: Using cached result for", url);
            const cachedData = analysisCache.get(url);
            sendWarningIfScam(sender.tab.id, cachedData);
            return true;
        }

        // 3. Call your working Server API
        // NOTE: We use the key 'text' to match your working manual code
        fetch("https://uottahack2026.onrender.com/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                url: url,
                text: textToAnalyze // Match the key your manual code used
            })
        })
        .then(res => {
            if (!res.ok) throw new Error(`Server Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log("Background: AI Result received:", data.result);
            
            // 4. Save to cache and trigger warning
            analysisCache.set(url, data);
            sendWarningIfScam(sender.tab.id, data);
        })
        .catch(err => {
            console.error("Background: API Error:", err);
        });

        return true; // Keeps the messaging channel open for the async fetch
    }
});

// Helper function to send the warning back to the specific tab
function sendWarningIfScam(tabId, data) {
    if (data && (data.result === "scam" || data.result === "suspicious")) {
        chrome.tabs.sendMessage(tabId, {
            action: "show_warning",
            data: data
        });
    }
}