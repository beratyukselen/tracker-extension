// background.js

let activeTabInfo = null;

// Helper function to extract search keywords from popular platforms
function extractSearchTerm(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    // Google Search & Google News
    if (hostname.includes("google.com") && url.pathname.startsWith("/search")) {
      return url.searchParams.get("q"); 
    }
    // YouTube Search
    else if (hostname.includes("youtube.com") && url.pathname.startsWith("/results")) {
      return url.searchParams.get("search_query"); 
    }
    // X (Twitter) Search
    else if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
      if (url.pathname.startsWith("/search")) {
        return url.searchParams.get("q"); 
      }
    }
    
    return null; // Return null if it's not a search results page
  } catch (error) {
    return null;
  }
}

async function saveActivity() {
  if (!activeTabInfo || !activeTabInfo.startTime) return;

  const durationInSeconds = Math.floor((Date.now() - activeTabInfo.startTime) / 1000);

  if (durationInSeconds > 0) {
    const termLog = activeTabInfo.searchTerm ? ` | Search: "${activeTabInfo.searchTerm}"` : "";
    console.log(`[SAVED] URL: ${activeTabInfo.url} | Duration: ${durationInSeconds} sec${termLog}`);
    // TODO: Replace console.log with chrome.storage.local write in the next phase
  }

  activeTabInfo.startTime = null;
}

async function startTracking(tab) {
  // Ignore system pages and empty tabs
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

  await saveActivity();

  // Extract the search term if it exists, otherwise it will be null
  const extractedTerm = extractSearchTerm(tab.url);

  activeTabInfo = {
    url: tab.url,
    title: tab.title,
    searchTerm: extractedTerm,
    startTime: Date.now()
  };
  
  console.log(`[TRACKING_STARTED] Title: ${tab.title}`);
}

// Tab event listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    startTracking(tab);
  } catch (error) {
    console.error("Failed to get tab info:", error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    startTracking(tab);
  }
});

// Idle state check (60 seconds of inactivity)
chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle' || newState === 'locked') {
    console.log("[AFK] Inactivity detected, pausing timer.");
    saveActivity();
  } else if (newState === 'active') {
    console.log("[ACTIVE] User returned, resuming tracking.");
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        startTracking(tabs[0]);
      }
    });
  }
});