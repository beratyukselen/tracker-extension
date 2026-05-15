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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "QUICK_AUDIT") {
        try {
            const title = document.title || '';
            const host = window.location.hostname;
            
            // Özel site tanımlamaları (H1 ve İçerik Div'i)
            const siteSelectors = {
                'dijitalsurmanset.com': { content: 'article.news-post', h1: 'h1.title-gallery' },
                'ekonomikosesi.com': { content: 'article.site-content-block.single', h1: 'h1.post-headline' },
                'ekonomininsesi.com': { content: 'div.c-article-content__container', h1: 'h1.c-article-header__title' },
                'mansetetkisi': { content: 'div.article__content-wrap.site-content-block', h1: 'h1.article__title' },
                'muvezzi.com': { content: 'article.site-content-block', h1: 'h1.news-title' },
                'newsmanset.com': { content: 'article.site-content-block', h1: '#main h1' },
                'onlinemalumat': { content: 'div.full-content.content-main-block div.article-single__content.site-content-block', h1: 'main.article-single__main.article-single__main--featured h1' },
                'sansasyonelgazete.com': { content: 'article .post-content.panel', h1: 'article .post-header h1' },
                'thesansasyonel.com': { content: 'section.content-rail .content-column', h1: 'header.content-head.site-container.article-head h1.content-title' },
                'wallstreetturkish.com': { content: 'div.c-article-content__container', h1: 'h1.c-article-header__title' }
            };

            let h1Selector = 'h1';
            let contentSelector = 'body';

            for (let key in siteSelectors) {
                if (host.includes(key)) {
                    h1Selector = siteSelectors[key].h1;
                    contentSelector = siteSelectors[key].content;
                    break;
                }
            }

            const h1Element = document.querySelector(h1Selector) || document.querySelector('h1');
            const h1 = h1Element ? h1Element.innerText.trim() : 'Yok';
            
            // Kelime sayısı (Özel kapsayıcı yoksa body'e fallback)
            const contentElement = document.querySelector(contentSelector);
            const textContent = contentElement ? contentElement.innerText : (document.body.innerText || '');
            const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
            
            // Meta Description
            const metaDescTag = document.querySelector('meta[name="description"]');
            const metaDescLength = metaDescTag ? metaDescTag.getAttribute('content').length : 0;
            
            // Yayınlanma / Güncellenme Tarihleri (Schema.org veya Meta tag'ler)
            let publishedDate = 'Bulunamadı';
            let modifiedDate = 'Bulunamadı';
            
            // Schema.org LD-JSON içinden arama
            const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
            for (let script of scriptTags) {
                try {
                    const data = JSON.parse(script.innerText);
                    if (data.datePublished) publishedDate = new Date(data.datePublished).toLocaleString('tr-TR');
                    if (data.dateModified) modifiedDate = new Date(data.dateModified).toLocaleString('tr-TR');
                } catch (e) {
                    // JSON parse error, ignore
                }
            }
            
            // Eğer LD-JSON'da yoksa meta taglere bak
            if (publishedDate === 'Bulunamadı') {
                const pubMeta = document.querySelector('meta[property="article:published_time"]');
                if (pubMeta) publishedDate = new Date(pubMeta.getAttribute('content')).toLocaleString('tr-TR');
            }
            if (modifiedDate === 'Bulunamadı') {
                const modMeta = document.querySelector('meta[property="article:modified_time"]');
                if (modMeta) modifiedDate = new Date(modMeta.getAttribute('content')).toLocaleString('tr-TR');
            }

            sendResponse({
                success: true,
                data: {
                    title: title,
                    titleLength: title.length,
                    h1: h1,
                    wordCount: wordCount,
                    metaDescLength: metaDescLength,
                    publishedDate: publishedDate,
                    modifiedDate: modifiedDate
                }
            });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    return true;
});