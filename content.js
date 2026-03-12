// content.js

let behaviorData = [];
let lastMouseMoveTime = 0;
let lastScrollTime = 0;
let isTrackingAllowed = false;

chrome.storage.local.get(['allow_tracking'], (result) => {
    isTrackingAllowed = result.allow_tracking || false;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.allow_tracking) {
        isTrackingAllowed = changes.allow_tracking.newValue;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isTrackingAllowed) return;

    const now = Date.now();
    if (now - lastMouseMoveTime > 500) { 
        behaviorData.push({
            type: "mouse_move",
            x: e.clientX,
            y: e.clientY,
            t: now
        });
        lastMouseMoveTime = now;
    }
});

document.addEventListener('click', (e) => {
    if (!isTrackingAllowed) return;

    behaviorData.push({
        type: "mouse_click",
        button: e.button === 0 ? "left" : (e.button === 2 ? "right" : "middle"),
        x: e.clientX,
        y: e.clientY,
        t: Date.now()
    });
});

document.addEventListener('scroll', (e) => {
    if (!isTrackingAllowed) return;

    const now = Date.now();
    if (now - lastScrollTime > 500) {
        behaviorData.push({
            type: "mouse_scroll",
            scrollY: Math.round(window.scrollY),
            t: now
        });
        lastScrollTime = now;
    }
});

// 4. Klavye Hareketlerini Yakala
document.addEventListener('keydown', (e) => {
    if (!isTrackingAllowed) return;

    // Şifre girilen alanlardaki tuşları takip etmiyoruz (Güvenlik/Etik)
    if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'password') {
        return; 
    }

    behaviorData.push({
        type: "key_press",
        key: e.key, // Hangi tuşa basıldığını alıyoruz
        t: Date.now()
    });
});

function sendDataToBackground() {
    if (behaviorData.length > 0) {
        chrome.runtime.sendMessage({
            action: "BEHAVIOR_DATA_COLLECTED",
            url: window.location.href,
            data: behaviorData
        });
        
        behaviorData = []; 
    }
}

setInterval(sendDataToBackground, 3000);

window.addEventListener('beforeunload', sendDataToBackground);