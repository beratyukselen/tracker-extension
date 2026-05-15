let behaviorData = [];
let lastMouseMoveTime = 0;
let lastScrollTime = 0;
let isTrackingAllowed = false;

let initialDataSent = false;

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

    if (!initialDataSent) {
        behaviorData.push({ type: "viewport", w: window.innerWidth, h: window.innerHeight, t: Date.now() });
        initialDataSent = true;
    }

    const now = Date.now();
    if (now - lastMouseMoveTime > 100) {
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

    let targetElement = e.target;
    let elementInfo = targetElement.tagName.toLowerCase();
    if (targetElement.id) elementInfo += `#${targetElement.id}`;
    if (targetElement.className && typeof targetElement.className === 'string') {
        elementInfo += `.${targetElement.className.split(' ').join('.')}`;
    }

    behaviorData.push({
        type: "mouse_click",
        button: e.button === 0 ? "left" : (e.button === 2 ? "right" : "middle"),
        x: e.clientX,
        y: e.clientY,
        target: elementInfo,
        t: Date.now()
    });
});
document.addEventListener('scroll', (e) => {
    if (!isTrackingAllowed) return;

    const now = Date.now();
    if (now - lastScrollTime > 250) {
        behaviorData.push({
            type: "mouse_scroll",
            scrollY: Math.round(window.scrollY),
            t: now
        });
        lastScrollTime = now;
    }
}, { passive: true });

document.addEventListener('keydown', (e) => {
    if (!isTrackingAllowed) return;

    if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'password') {
        return;
    }

    behaviorData.push({
        type: "key_press",
        key: e.key,
        t: Date.now()
    });
});

window.addEventListener('blur', () => {
    if (isTrackingAllowed) behaviorData.push({ type: "tab_blur", t: Date.now() });
});

window.addEventListener('focus', () => {
    if (isTrackingAllowed) behaviorData.push({ type: "tab_focus", t: Date.now() });
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