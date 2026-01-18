chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PAGE_TEXT") {
        
        // 1. Prepare the data exactly how your Fastify server wants it
        // Server expects: { "url": "...", "content": "..." }
        const payload = {
            url: message.url,      // Passed from content.js
            content: message.text  // Map 'text' to 'content'
        };

        // 2. Send to your specific server endpoint
        // Note the path is /api/analyze, not just /analyze
        fetch("http://localhost:3000/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 3. If the server says it's a SCAM, warn the user
            if (data.result === "scam") {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "show_warning",
                    data: data
                });
            }
        })
        .catch(error => {
            console.error("Connection Failed:", error);
        });
    }
});