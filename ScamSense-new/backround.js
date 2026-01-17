chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    console.log("Tab loaded:", tab.url);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png", // Point to your physical file
      title: "Scam Detector",
      message: `Scanning: ${new URL(tab.url).hostname}`,
      priority: 2
    });
  }
});