// background.js

let activeTabInfo = null;

async function saveActivity() {
  if (!activeTabInfo || !activeTabInfo.startTime) return;

  const durationInSeconds = Math.floor((Date.now() - activeTabInfo.startTime) / 1000);

  if (durationInSeconds > 0) {
    console.log(`[SAVED] URL: ${activeTabInfo.url} | Duration: ${durationInSeconds} sec`);
    // TODO: Replace console.log with chrome.storage.local write in the next phase
  }

  activeTabInfo.startTime = null;
}

async function startTracking(tab) {
  // Ignore system pages and empty tabs
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

  await saveActivity();

  activeTabInfo = {
    url: tab.url,
    title: tab.title,
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