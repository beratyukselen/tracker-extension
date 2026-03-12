// background.js

// TODO: Set these dynamically during extension installation or from profile selection
const USER_ID = "usr_12345"; 
const SERVER_URL = "https://backoffice.ekonomikosesi.com/api/telemetry/sync"; 

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
      behavior_data: activeTabInfo.behavior_data || []
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
    startTime: Date.now(),
    behavior_data: []
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

  chrome.storage.local.get(['activity_list', 'api_token', 'selected_profile_id'], async (result) => {
    const list = result.activity_list || [];
    const token = result.api_token;
    const activeProfileId = result.selected_profile_id || 1;
    
    if (list.length === 0) {
      console.log("[SYNC_SKIP] No new data to send.");
      return;
    }

    if (!token) {
      console.warn("[SYNC_BLOCKED] No API token found. User needs to login.");
      return;
    }

    const formattedList = list.map(item => ({
      url: item.url,
      title: item.title,
      search_term: item.search_term || "",
      duration: item.duration,
      behavior_data: item.behavior_data || []
    }));

    const payload = {
      profile_id: activeProfileId,
      activity_list: formattedList
    };

      console.log("JSON PAKETİ:\n", JSON.stringify(payload, null, 2));

    try {
      console.log(`[SYNC_START] Sending ${formattedList.length} records to server...`);

      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        keepalive: true 
      });

      if (response.ok || response.type === 'opaque') {
        console.log("[SYNC_SUCCESS] Data sent successfully. Clearing storage.");
        chrome.storage.local.set({ activity_list: [] });
      } else {
        const errorDetails = await response.json(); 
        console.error("[SYNC_ERROR] Server returned 422. Detaylar:", JSON.stringify(errorDetails, null, 2));
      }
    } catch (error) {
      console.error("[SYNC_FAILED] Fetch error. Data retained in storage.", error);
    }
  });
}

chrome.windows.onRemoved.addListener((windowId) => {
  syncDataToServer();
});

// (content.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "BEHAVIOR_DATA_COLLECTED") {
    if (activeTabInfo && activeTabInfo.url === message.url) {
      activeTabInfo.behavior_data.push(...message.data);
      console.log(`[BEHAVIOR_DATA] ${message.data.length} adet hareket geldi! Toplam: ${activeTabInfo.behavior_data.length}`);
    }
  }
});