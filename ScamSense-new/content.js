let lastProcessedText = "";
let lastUrl = location.href;
let debounceTimer;

function getPageContent() {
    // Priority list of selectors for Emails and Web Content
    const selectors = [
        '.a3s.aiL',                            // Gmail
        '[aria-label="Message body"]',          // Outlook
        '.msg-body',                            // Yahoo
        'main',                                 // Modern web standard
        'article'                               // Blog/News standard
    ];

    for (const s of selectors) {
        const el = document.querySelector(s);
        if (el && el.innerText.trim().length > 150) {
            return el.innerText.trim();
        }
    }
    return document.body.innerText.trim();
}

function sendToAnalysis() {
    const text = getPageContent();
    const url = location.href;

    // àDon't send if text is too short or hasn't changed
    if (text.length < 200) return;
    if (text === lastProcessedText && url === lastUrl) return;

    lastProcessedText = text;
    lastUrl = url;

    chrome.runtime.sendMessage({
        type: "ANALYZE_PAGE",
        url: url,
        text: text.substring(0, 5000)
    });
}

// Watch for dynamic content loading (essential for SPA like Gmail/Outlook)
const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sendToAnalysis, 2000); 
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial scan on page load
window.addEventListener('load', sendToAnalysis);


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "show_warning") {
        const { result, confidence, analysis } = request.data;
        
        // Create the Overlay
        const overlay = document.createElement('div');
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 999999;
            display: flex; align-items: center; justify-content: center;
            font-family: sans-serif;
        `;

        // Create the Modal Box
        const modal = document.createElement('div');
        modal.style = `
            background: white; padding: 40px; border-radius: 15px;
            max-width: 500px; text-align: center; border: 5px solid #ff4444;
        `;

        modal.innerHTML = `
            <h1 style="color: #ff4444; font-size: 28px;">⚠️ DANGER: ${result.toUpperCase()}</h1>
            <p style="font-size: 18px; color: #333;">AI is <b>${confidence}%</b> sure this site is a scam.</p>
            <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; text-align: left; margin: 20px 0;">
                <p><b>Analysis:</b> ${analysis}</p>
            </div>
            <button id="closeScamModal" style="padding: 10px 20px; background: #444; color: white; border: none; border-radius: 5px; cursor: pointer;">
                I understand, let me through
            </button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Make the button close the modal
        modal.querySelector('#closeScamModal').onclick = () => overlay.remove();
    }
});