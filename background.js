chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log("🟢 [YÜKLENDİ] URL:", tab.url, "| Başlık:", tab.title);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      console.log("🔵 [SEKME DEĞİŞTİ] URL:", tab.url, "| Başlık:", tab.title);
    }
  } catch (error) {
    console.error("Sekme bilgisi alınamadı:", error);
  }
});