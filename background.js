// background.js

const SERVER_URL = "https://backoffice.ekonomikosesi.com/api/telemetry/sync"; 

let activeTabInfo = null;

// Search Term Extraction Engine
function extractSearchTerm(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    if (hostname.includes("google.com") && url.pathname.startsWith("/search")) return url.searchParams.get("q"); 
    else if (hostname.includes("youtube.com") && url.pathname.startsWith("/results")) return url.searchParams.get("search_query"); 
    else if ((hostname.includes("x.com") || hostname.includes("twitter.com")) && url.pathname.startsWith("/search")) return url.searchParams.get("q"); 
    else if (hostname.includes("instagram.com") && url.pathname.startsWith("/explore/tags/")) return url.pathname.split('/')[3];
    else if (hostname.includes("linkedin.com") && url.pathname.startsWith("/search/results/")) return url.searchParams.get("keywords");
    else if (hostname.includes("tiktok.com") && url.pathname.startsWith("/search")) return url.searchParams.get("q");
    else if (hostname.includes("eksisozluk.com") && url.searchParams.has("q")) return url.searchParams.get("q");

    return null;
  } catch (error) {
    return null;
  }
}

// Activity Data Management
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

    console.log(`[STORAGE] Saving activity: ${activityRecord.url} | ${activityRecord.duration}s`);
    
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
  
  console.log(`[TRACKING] Started for: ${tab.title}`);
}

// Tab and Window Event Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    startTracking(tab);
  } catch (error) {
    console.error("[ERROR] Failed to retrieve tab info:", error);
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
    console.log("[SYSTEM] Inactivity detected. Saving current session.");
    saveActivity();
  } else if (newState === 'active') {
    console.log("[SYSTEM] User active. Resuming tracking.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) startTracking(tabs[0]);
    });
  }
});

chrome.windows.onRemoved.addListener(() => {
  syncDataToServer();
});

// Telemetry Sync Engine
chrome.alarms.create("syncDataAlarm", { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncDataAlarm") {
    syncDataToServer();
  }
});

async function syncDataToServer() {
  if (!navigator.onLine) {
    console.warn("[SYNC] Offline mode. Data retained in local storage.");
    return;
  }

  chrome.storage.local.get(['activity_list', 'api_token', 'selected_profile_id'], async (result) => {
    const list = result.activity_list || [];
    const token = result.api_token;
    const activeProfileId = result.selected_profile_id || 1;
    
    if (list.length === 0) return;

    if (!token) {
      console.warn("[SYNC] Missing API token. Sync aborted.");
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

    try {
      console.log(`[SYNC] Dispatching ${formattedList.length} records to server.`);

      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.type === 'opaque') {
        console.log("[SYNC] Data successfully synced. Purging local storage.");
        chrome.storage.local.set({ activity_list: [] });
      } else {
        const errorDetails = await response.json(); 
        console.error("[SYNC] Server rejected payload:", errorDetails);
      }
    } catch (error) {
      console.error("[SYNC] Network failure during sync:", error);
    }
  });
}

// Inter-script Communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "BEHAVIOR_DATA_COLLECTED") {
    if (activeTabInfo && activeTabInfo.url === message.url) {
      activeTabInfo.behavior_data.push(...message.data);
      console.log(`[BEHAVIOR] Received ${message.data.length} events. Total: ${activeTabInfo.behavior_data.length}`);
    }
  }
});