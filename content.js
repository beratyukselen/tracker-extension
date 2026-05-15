const MOUSE_MOVE_DELAY = 500;

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
    if (now - lastMouseMoveTime > MOUSE_MOVE_DELAY) {
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
        (async () => {
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

                let h1Selector = 'article h1, h1';
                let contentSelector = 'article';

                for (let key in siteSelectors) {
                    if (host.includes(key)) {
                        h1Selector = siteSelectors[key].h1;
                        contentSelector = siteSelectors[key].content;
                        break;
                    }
                }
                
                // Schema.org LD-JSON içinden veri çıkarma hazırlığı
                let publishedDate = 'Bulunamadı';
                let modifiedDate = 'Bulunamadı';
                let schemaH1 = null;
                let schemaBody = null;
                
                const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
                for (let script of scriptTags) {
                    try {
                        const data = JSON.parse(script.innerText);
                        const processSchema = (obj) => {
                            if (obj.datePublished && publishedDate === 'Bulunamadı') publishedDate = new Date(obj.datePublished).toLocaleString('tr-TR');
                            if (obj.dateModified && modifiedDate === 'Bulunamadı') modifiedDate = new Date(obj.dateModified).toLocaleString('tr-TR');
                            if (obj.headline && !schemaH1) schemaH1 = obj.headline;
                            if (obj.name && !schemaH1) schemaH1 = obj.name;
                            if (obj.articleBody && !schemaBody) schemaBody = obj.articleBody;
                        };
                        
                        if (Array.isArray(data)) {
                            data.forEach(processSchema);
                        } else if (data['@graph'] && Array.isArray(data['@graph'])) {
                            data['@graph'].forEach(processSchema);
                        } else {
                            processSchema(data);
                        }
                    } catch (e) {
                        // JSON parse hatası
                    }
                }

                const h1Element = document.querySelector(h1Selector) || document.querySelector('h1');
                let h1 = h1Element ? h1Element.innerText.trim() : 'Yok';
                if (h1 === 'Yok' && schemaH1) h1 = schemaH1 + ' (Schema)';
                
                // Kelime sayısı (Özel kapsayıcı veya article, yoksa schema, yoksa body)
                let contentElement = document.querySelector(contentSelector);
                let textContent = contentElement ? contentElement.innerText : '';
                if (!textContent && schemaBody) {
                    textContent = schemaBody;
                } else if (!textContent) {
                    textContent = document.body.innerText || '';
                }
                const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
                const charCount = textContent.length;
                const h1WordCount = h1.split(/\s+/).filter(word => word.length > 0 && word !== '(Schema)').length;
                const h1CharCount = h1.replace(' (Schema)', '').length;
                
                // Meta Description
                const metaDescTag = document.querySelector('meta[name="description"]');
                const metaDescLength = metaDescTag ? metaDescTag.getAttribute('content').length : 0;
                
                // Öne Çıkan Görsel (Feature Image)
                let imgElement = contentElement ? contentElement.querySelector('img') : null;
                let imgUrl = imgElement ? imgElement.src : null;
                
                if (!imgUrl) {
                    const ogImage = document.querySelector('meta[property="og:image"]');
                    if (ogImage) imgUrl = ogImage.getAttribute('content');
                }

                let featureImageObj = {
                    url: imgUrl || 'Yok',
                    width: imgElement ? imgElement.naturalWidth : 0,
                    height: imgElement ? imgElement.naturalHeight : 0,
                    format: 'Bilinmiyor',
                    sizeKb: 0
                };

                if (imgUrl && imgUrl !== 'Yok') {
                    try {
                        const extMatch = imgUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i);
                        if (extMatch) {
                            featureImageObj.format = extMatch[1].toUpperCase();
                        }
                        
                        // Dosya boyutunu almak için HEAD isteği yap
                        const response = await fetch(imgUrl, { method: 'HEAD', cache: 'force-cache' });
                        if (response.ok) {
                            const contentLength = response.headers.get('content-length');
                            if (contentLength) {
                                featureImageObj.sizeKb = Math.round(parseInt(contentLength) / 1024);
                            }
                            
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.startsWith('image/')) {
                                featureImageObj.format = contentType.split('/')[1].toUpperCase();
                            }
                        }
                    } catch (e) {
                        // CORS veya başka bir sebeple fetch başarısız olursa ignore
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

                // URL & Canonical Analizi
                const urlLength = window.location.href.length;
                const canonicalTag = document.querySelector('link[rel="canonical"]');
                const canonicalUrl = canonicalTag ? canonicalTag.href : null;
                const isCanonicalMatch = canonicalUrl ? window.location.href.split('?')[0] === canonicalUrl.split('?')[0] : false;

                // Sosyal Medya Etiketleri
                const hasOgTitle = !!document.querySelector('meta[property="og:title"]');
                const hasOgImage = !!document.querySelector('meta[property="og:image"]');
                const hasTwitterCard = !!(document.querySelector('meta[name="twitter:card"]') || document.querySelector('meta[property="twitter:card"]'));

                // Link Analizi (İçerik içi)
                let internalLinks = 0;
                let externalLinks = 0;
                let nofollowLinks = 0;
                let dofollowLinks = 0;
                if (contentElement) {
                    const links = contentElement.querySelectorAll('a');
                    links.forEach(a => {
                        if (!a.href || a.href.startsWith('javascript:')) return;
                        if (a.hostname === host) {
                            internalLinks++;
                        } else {
                            externalLinks++;
                            if (a.rel && a.rel.toLowerCase().includes('nofollow')) {
                                nofollowLinks++;
                            } else {
                                dofollowLinks++;
                            }
                        }
                    });
                }

                // Başlık Hiyerarşisi (H2/H3)
                let h2Count = 0;
                let h3Count = 0;
                let hierarchyError = false;
                if (contentElement) {
                    const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    let lastLevel = 1; // Başlangıç seviyesi H1 kabul edilebilir
                    headings.forEach(h => {
                        const level = parseInt(h.tagName.substring(1));
                        if (level === 2) h2Count++;
                        if (level === 3) h3Count++;
                        if (level > lastLevel + 1) {
                            hierarchyError = true;
                        }
                        lastLevel = level;
                    });
                }

                sendResponse({
                    success: true,
                    data: {
                        h1: h1,
                        h1WordCount: h1WordCount,
                        h1CharCount: h1CharCount,
                        wordCount: wordCount,
                        charCount: charCount,
                        metaDescLength: metaDescLength,
                        publishedDate: publishedDate,
                        modifiedDate: modifiedDate,
                        featureImage: featureImageObj,
                        linkAnalysis: {
                            internal: internalLinks,
                            external: externalLinks,
                            nofollow: nofollowLinks,
                            dofollow: dofollowLinks
                        },
                        headings: {
                            h2: h2Count,
                            h3: h3Count,
                            hierarchyError: hierarchyError
                        },
                        urlAnalysis: {
                            length: urlLength,
                            hasCanonical: !!canonicalUrl,
                            isCanonicalMatch: isCanonicalMatch
                        },
                        social: {
                            ogTitle: hasOgTitle,
                            ogImage: hasOgImage,
                            twitterCard: hasTwitterCard
                        }
                    }
                });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }
    return true;
});