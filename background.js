// background.js

// TODO: Set these dynamically during extension installation
const USER_ID = "usr_12345"; 
const PROFILE_ID = "prof_67890"; 
const SERVER_URL = "https://webhook.site/senin-test-url-gelecek"; // TODO: Add actual backend URL

let activeTabInfo = null;

function extractSearchTerm(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    if (hostname.includes("google.com") && url.pathname.startsWith("/search")) return url.searchParams.get("q"); 
    else if (hostname.includes("youtube.com") && url.pathname.startsWith("/results")) return url.searchParams.get("search_query"); 
    else if ((hostname.includes("x.com") || hostname.includes("twitter.com")) && url.pathname.startsWith("/search")) return url.searchParams.get("q"); 
    
    return null;
  } catch (error) {
    return null;
  }
}

async function saveActivity() {
  if (!activeTabInfo || !activeTabInfo.startTime) return;

  const durationInSeconds = Math.floor((Date.now() - activeTabInfo.startTime) / 1000);

  if (durationInSeconds > 0) {
    const activityRecord = {
      url: activeTabInfo.url,
      title: activeTabInfo.title,
      search_term: activeTabInfo.searchTerm || "",
      duration: durationInSeconds,
      status: "active",
      http_referrer: "" // TODO: Implement HTTP referrer tracking
    };

    console.log(`[SAVING_TO_STORAGE] URL: ${activityRecord.url} | Duration: ${activityRecord.duration}s`);
    
    chrome.storage.local.get({ activity_list: [] }, (result) => {
      const updatedList = result.activity_list;
      updatedList.push(activityRecord);
      chrome.storage.local.set({ activity_list: updatedList });
    });
  }

  activeTabInfo.startTime = null;
}

async function startTracking(tab) {
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

  await saveActivity();

  activeTabInfo = {
    url: tab.url,
    title: tab.title,
    searchTerm: extractSearchTerm(tab.url),
    startTime: Date.now()
  };
  
  console.log(`[TRACKING_STARTED] Title: ${tab.title}`);
}

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

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle' || newState === 'locked') {
    console.log("[AFK] Inactivity detected. Saving session.");
    saveActivity();
  } else if (newState === 'active') {
    console.log("[ACTIVE] User returned. Resuming.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) startTracking(tabs[0]);
    });
  }
});

chrome.alarms.create("syncDataAlarm", { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncDataAlarm") {
    syncDataToServer();
  }
});

async function syncDataToServer() {
  if (!navigator.onLine) {
    console.log("[SYNC_BLOCKED] Offline mode. Data remains in storage.");
    return;
  }

  chrome.storage.local.get({ activity_list: [] }, async (result) => {
    const list = result.activity_list;
    
    if (list.length === 0) {
      console.log("[SYNC_SKIP] No new data to send.");
      return;
    }

    const payload = {
      user_id: USER_ID,
      profile_id: PROFILE_ID,
      timestamp: Date.now(),
      activity_list: list
    };

    try {
      console.log(`[SYNC_START] Sending ${list.length} records to server...`);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true 
      });

      if (response.ok || response.type === 'opaque') {
        console.log("[SYNC_SUCCESS] Data sent successfully. Clearing storage.");
        chrome.storage.local.set({ activity_list: [] });
      } else {
        console.error("[SYNC_ERROR] Server returned:", response.status);
      }
    } catch (error) {
      console.error("[SYNC_FAILED] Fetch error. Data retained in storage.", error);
    }
  });
}

// background.js

// TODO: Set these dynamically during extension installation
const USER_ID = "usr_12345"; 
const PROFILE_ID = "prof_67890"; 
const SERVER_URL = "https://webhook.site/senin-test-url-gelecek"; // TODO: Add actual backend URL

let activeTabInfo = null;

function extractSearchTerm(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    if (hostname.includes("google.com") && url.pathname.startsWith("/search")) return url.searchParams.get("q"); 
    else if (hostname.includes("youtube.com") && url.pathname.startsWith("/results")) return url.searchParams.get("search_query"); 
    else if ((hostname.includes("x.com") || hostname.includes("twitter.com")) && url.pathname.startsWith("/search")) return url.searchParams.get("q"); 
    
    return null;
  } catch (error) {
    return null;
  }
}

async function saveActivity() {
  if (!activeTabInfo || !activeTabInfo.startTime) return;

  const durationInSeconds = Math.floor((Date.now() - activeTabInfo.startTime) / 1000);

  if (durationInSeconds > 0) {
    const activityRecord = {
      url: activeTabInfo.url,
      title: activeTabInfo.title,
      search_term: activeTabInfo.searchTerm || "",
      duration: durationInSeconds,
      status: "active",
      http_referrer: "" // TODO: Implement HTTP referrer tracking
    };

    console.log(`[SAVING_TO_STORAGE] URL: ${activityRecord.url} | Duration: ${activityRecord.duration}s`);
    
    chrome.storage.local.get({ activity_list: [] }, (result) => {
      const updatedList = result.activity_list;
      updatedList.push(activityRecord);
      chrome.storage.local.set({ activity_list: updatedList });
    });
  }

  activeTabInfo.startTime = null;
}

async function startTracking(tab) {
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

  await saveActivity();

  activeTabInfo = {
    url: tab.url,
    title: tab.title,
    searchTerm: extractSearchTerm(tab.url),
    startTime: Date.now()
  };
  
  console.log(`[TRACKING_STARTED] Title: ${tab.title}`);
}

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

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle' || newState === 'locked') {
    console.log("[AFK] Inactivity detected. Saving session.");
    saveActivity();
  } else if (newState === 'active') {
    console.log("[ACTIVE] User returned. Resuming.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) startTracking(tabs[0]);
    });
  }
});

chrome.alarms.create("syncDataAlarm", { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncDataAlarm") {
    syncDataToServer();
  }
});

async function syncDataToServer() {
  if (!navigator.onLine) {
    console.log("[SYNC_BLOCKED] Offline mode. Data remains in storage.");
    return;
  }

  chrome.storage.local.get({ activity_list: [] }, async (result) => {
    const list = result.activity_list;
    
    if (list.length === 0) {
      console.log("[SYNC_SKIP] No new data to send.");
      return;
    }

    const payload = {
      user_id: USER_ID,
      profile_id: PROFILE_ID,
      timestamp: Date.now(),
      activity_list: list
    };

    try {
      console.log(`[SYNC_START] Sending ${list.length} records to server...`);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true 
      });

      if (response.ok || response.type === 'opaque') {
        console.log("[SYNC_SUCCESS] Data sent successfully. Clearing storage.");
        chrome.storage.local.set({ activity_list: [] });
      } else {
        console.error("[SYNC_ERROR] Server returned:", response.status);
      }
    } catch (error) {
      console.error("[SYNC_FAILED] Fetch error. Data retained in storage.", error);
    }
  });

  chrome.windows.onRemoved.addListener((windowId) => {
  // Trigger final sync when the browser window is closed
  syncDataToServer();
});
}