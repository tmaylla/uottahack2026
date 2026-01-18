// Memory cache to save results and prevent re-calling Gemini for the same page
const analysisCache = new Map();


async function callScamSenseAPI(url, content) {
    // 1. Check if we already have a result for this URL
    if (analysisCache.has(url)) {
        console.log("ScamSense: Using cached result for:", url);
        return analysisCache.get(url);
    }

    try {
        console.log("ScamSense: Sending request to server...");
        
        const response = await fetch("https://uottahack2026.onrender.com/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                url: url, 
                content: content 
            })
        });

        
        if (response.status === 429) {
            return { result: "error", analysis: "Rate limit reached. Please wait a minute." };
        }

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        
        // 2. Save the result in cache if successful
        if (data && data.result) {
            analysisCache.set(url, data);
        }
        
        return data;

    } catch (err) {
        console.error("ScamSense API Error:", err);
        return null;
    }
}

/**
 * Listen for messages from content.js
 */
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "ANALYZE_PAGE" && sender.tab) {
        
        // Trigger the analysis
        callScamSenseAPI(message.url, message.text).then(data => {
            
            // Only show the warning if the result is NOT "safe"
            if (data && (data.result === "scam" || data.result === "suspicious")) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "show_warning",
                    data: data
                });
            }
        });
    }
    // Required to keep the message port open for the async fetch
    return true; 
});

/**
 * Clean up memory when a tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
   
});