// popup.js

const tabSettingsBtn = document.getElementById('tabSettingsBtn');
const tabQuickBtn = document.getElementById('tabQuickBtn');
const tabOperationBtn = document.getElementById('tabOperationBtn');
const tabInfoBtn = document.getElementById('tabInfoBtn');

const sectionSettings = document.getElementById('sectionSettings');
const sectionQuickUse = document.getElementById('sectionQuickUse');
const sectionOperation = document.getElementById('sectionOperation');
const sectionInfo = document.getElementById('sectionInfo');

const loginFormContainer = document.getElementById('loginFormContainer');
const profileSelectionContainer = document.getElementById('profileSelectionContainer');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const loginMessage = document.getElementById('loginMessage');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const profileSelect = document.getElementById('profileSelect');

const loginTabEmail = document.getElementById('loginTabEmail');
const loginTabToken = document.getElementById('loginTabToken');
const emailAuthFields = document.getElementById('emailAuthFields');
const tokenAuthFields = document.getElementById('tokenAuthFields');

const operationNotSelectedMsg = document.getElementById('operationNotSelectedMsg');
const operationContentContainer = document.getElementById('operationContentContainer');
const operationDaySelect = document.getElementById('operationDaySelect');
const operationTimeSlot = document.getElementById('operationTimeSlot');
const operationRoutinesContainer = document.getElementById('operationRoutinesContainer');

let loginMethod = 'email'; 

// Tab and View Switching Logic
loginTabEmail.addEventListener('click', () => {
    loginMethod = 'email';
    loginTabEmail.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
    loginTabEmail.classList.remove('text-gray-500', 'hover:text-gray-700');
    loginTabToken.classList.add('text-gray-500', 'hover:text-gray-700');
    loginTabToken.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
    
    emailAuthFields.classList.remove('hidden');
    tokenAuthFields.classList.add('hidden');
});

loginTabToken.addEventListener('click', () => {
    loginMethod = 'token';
    loginTabToken.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
    loginTabToken.classList.remove('text-gray-500', 'hover:text-gray-700');
    loginTabEmail.classList.add('text-gray-500', 'hover:text-gray-700');
    loginTabEmail.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
    
    tokenAuthFields.classList.remove('hidden');
    emailAuthFields.classList.add('hidden');
});

tabSettingsBtn.addEventListener('click', () => {
    tabSettingsBtn.classList.add('tab-active');
    tabSettingsBtn.classList.remove('text-gray-500');
    tabQuickBtn.classList.remove('tab-active');
    tabQuickBtn.classList.add('text-gray-500');
    tabOperationBtn.classList.remove('tab-active');
    tabOperationBtn.classList.add('text-gray-500');
    tabInfoBtn.classList.remove('text-blue-600', 'bg-blue-50');
    tabInfoBtn.classList.add('text-gray-500');
    
    sectionSettings.classList.remove('hidden');
    sectionQuickUse.classList.add('hidden');
    sectionOperation.classList.add('hidden');
    sectionInfo.classList.add('hidden');
});

tabQuickBtn.addEventListener('click', () => {
    tabQuickBtn.classList.add('tab-active');
    tabQuickBtn.classList.remove('text-gray-500');
    tabSettingsBtn.classList.remove('tab-active');
    tabSettingsBtn.classList.add('text-gray-500');
    tabOperationBtn.classList.remove('tab-active');
    tabOperationBtn.classList.add('text-gray-500');
    tabInfoBtn.classList.remove('text-blue-600', 'bg-blue-50');
    tabInfoBtn.classList.add('text-gray-500');
    
    sectionQuickUse.classList.remove('hidden');
    sectionSettings.classList.add('hidden');
    sectionOperation.classList.add('hidden');
    sectionInfo.classList.add('hidden');
});

tabOperationBtn.addEventListener('click', () => {
    tabOperationBtn.classList.add('tab-active');
    tabOperationBtn.classList.remove('text-gray-500');
    tabSettingsBtn.classList.remove('tab-active');
    tabSettingsBtn.classList.add('text-gray-500');
    tabQuickBtn.classList.remove('tab-active');
    tabQuickBtn.classList.add('text-gray-500');
    tabInfoBtn.classList.remove('text-blue-600', 'bg-blue-50');
    tabInfoBtn.classList.add('text-gray-500');
    
    sectionOperation.classList.remove('hidden');
    sectionSettings.classList.add('hidden');
    sectionQuickUse.classList.add('hidden');
    sectionInfo.classList.add('hidden');
    
    loadOperationSchedule();
});

tabInfoBtn.addEventListener('click', () => {
    tabInfoBtn.classList.add('text-blue-600', 'bg-blue-50');
    tabInfoBtn.classList.remove('text-gray-500');
    
    tabOperationBtn.classList.remove('tab-active');
    tabOperationBtn.classList.add('text-gray-500');
    tabSettingsBtn.classList.remove('tab-active');
    tabSettingsBtn.classList.add('text-gray-500');
    tabQuickBtn.classList.remove('tab-active');
    tabQuickBtn.classList.add('text-gray-500');
    
    sectionInfo.classList.remove('hidden');
    sectionOperation.classList.add('hidden');
    sectionSettings.classList.add('hidden');
    sectionQuickUse.classList.add('hidden');
});

// API Calls and Data Handling
async function loadProfiles(token) {
    try {
        const response = await fetch('https://backoffice.ekonomikosesi.com/api/profiles', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            profileSelect.innerHTML = ''; 
            
            const profiles = Array.isArray(data) ? data : (data.data || []);
            
            profiles.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.full_name || `Profil ${p.id}`; 
                profileSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Failed to fetch profiles:", error);
    }
}

async function fetchProfileDetails(profileId) {
    chrome.storage.local.get(['api_token'], async (result) => {
        const token = result.api_token;
        if (!token) return;

        const detailsContainer = document.getElementById('profileDetailsContainer');
        if (!detailsContainer) return;

        const elFullName = document.getElementById('profileFullName');
        const elStatus = document.getElementById('profileStatus');
        const elGroupName = document.getElementById('profileGroupName');
        const elGroupNote = document.getElementById('profileGroupNote');
        const elSocialAccounts = document.getElementById('profileSocialAccounts');
        const elTimeSlot = document.getElementById('profileTimeSlot');
        const elTomorrowRoutines = document.getElementById('profileTomorrowRoutines');
        const elTodayLabel = document.getElementById('todayLabel');

        detailsContainer.classList.remove('hidden');
        
        // Modal reset state
        elFullName.textContent = "Yükleniyor...";
        elStatus.textContent = "...";
        elStatus.className = "px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-200 text-gray-600 whitespace-nowrap";
        elGroupName.textContent = "...";
        elGroupNote.textContent = "...";
        elSocialAccounts.innerHTML = `<span class="text-indigo-400 italic text-[10px]">Yükleniyor...</span>`;
        elTimeSlot.textContent = "--:-- - --:--";
        elTomorrowRoutines.textContent = "...";

        try {
            const response = await fetch(`https://backoffice.ekonomikosesi.com/api/profiles/${profileId}?with=schedule,socialAccounts`, {
                method: "GET",
                headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const responseData = await response.json();
                const profileData = responseData.data || responseData;
                
                // Name & Status
                elFullName.textContent = profileData.full_name || "İsimsiz Profil";
                
                const statusStr = (profileData.status || "").toLowerCase();
                if (statusStr === "active" || statusStr === "aktif") {
                    elStatus.textContent = "Aktif";
                    elStatus.className = "px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700 whitespace-nowrap border border-green-200";
                } else {
                    elStatus.textContent = profileData.status || "Pasif";
                    elStatus.className = "px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 whitespace-nowrap border border-red-200";
                }

                // Group
                elGroupName.textContent = profileData.group_name || "Grup Yok";
                elGroupNote.textContent = profileData.group_note || "Not bulunmuyor";

                // Social Accounts
                const socials = profileData.social_accounts || [];
                if (socials.length === 0) {
                    elSocialAccounts.innerHTML = `<span class="text-indigo-400 italic text-[10px] bg-white px-2 py-1 rounded shadow-sm border border-indigo-100">Sosyal hesap bulunamadı</span>`;
                } else {
                    elSocialAccounts.innerHTML = "";
                    const getIcon = (plat) => {
                        const p = (plat || "").toLowerCase();
                        if (p === 'gmail' || p === 'google') return `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`;
                        if (p === 'twitter' || p === 'x') return `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`;
                        if (p === 'youtube') return `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
                        return `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
                    };

                    socials.forEach(acc => {
                        const platName = acc.platform || 'Bilinmiyor';
                        const sStatus = (acc.status || "").toLowerCase();
                        const isActive = sStatus === 'active' || sStatus === 'aktif';
                        
                        const colorClass = isActive ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200";
                        const iconColorClass = isActive ? "text-green-500" : "text-red-500";
                        
                        const item = document.createElement('div');
                        item.className = `flex items-center gap-1.5 px-2 py-1 rounded shadow-sm border ${colorClass}`;
                        item.innerHTML = `
                            <div class="${iconColorClass} flex-shrink-0">${getIcon(platName)}</div>
                            <div class="capitalize font-medium text-[10px] tracking-wide">${platName}</div>
                        `;
                        item.setAttribute('title', `${acc.username || 'Bilinmiyor'} (${isActive ? 'Aktif' : 'Pasif'})`);
                        elSocialAccounts.appendChild(item);
                    });
                }

                // Setup global schedule data and render it
                currentScheduleData = profileData.schedule || null;
                
                if (!operationDaySelect.dataset.initialized) {
                    const istanbulTimeStr = new Date().toLocaleString("en-US", {timeZone: "Europe/Istanbul"});
                    const dayOfWeek = new Date(istanbulTimeStr).getDay();
                    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                    operationDaySelect.value = days[dayOfWeek];
                    operationDaySelect.dataset.initialized = 'true';
                }
                
                renderOperationDay(operationDaySelect.value);

            } else {
                detailsContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error(error);
            detailsContainer.classList.add('hidden');
        }
    });
}

// Event Listeners
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const token = document.getElementById('token').value;

    if (loginMethod === 'email' && (!email || !pass)) {
        showLoginError("Lütfen e-posta ve şifrenizi girin.");
        return;
    } else if (loginMethod === 'token' && !token) {
        showLoginError("Lütfen token girin.");
        return;
    }

    const originalContent = btnLogin.innerHTML;
    btnLogin.innerHTML = '<span class="loader"></span> <span>Bağlanıyor...</span>';
    btnLogin.disabled = true;

    try {
        let finalToken = null;
        let userEmail = "";
        let userName = "Aktif Kullanıcı";

        if (loginMethod === 'email') {
            const response = await fetch(`https://backoffice.ekonomikosesi.com/api/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (response.ok && data.token) { 
                finalToken = data.token;
                userEmail = email; 
            } else {
                throw new Error(data.message || "Hata: Giriş bilgileri geçersiz.");
            }
        } else if (loginMethod === 'token') {
            const response = await fetch('https://backoffice.ekonomikosesi.com/api/me', {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                finalToken = token;
                userEmail = data.email || "token_user@cleansheet.com";
            } else {
                throw new Error("Hata: Geçersiz veya süresi dolmuş token.");
            }
        }

        if (finalToken) {
            chrome.storage.local.set({ api_token: finalToken, user_email: userEmail }, async () => {
                loginFormContainer.classList.add('hidden');
                profileSelectionContainer.classList.remove('hidden');
                tabOperationBtn.classList.remove('hidden');
                tabInfoBtn.classList.remove('hidden');
                document.getElementById('userName').textContent = userName;
                document.getElementById('userEmail').textContent = userEmail;
                
                await loadProfiles(finalToken);
                loadInfoData(finalToken); // Also load info data
                showToast("Başarıyla giriş yapıldı!");
            });
        }
    } catch (error) {
        showLoginError(error.message || "Bağlantı hatası: Sunucuya ulaşılamadı.");
    } finally {
        btnLogin.innerHTML = originalContent;
        btnLogin.disabled = false;
    }
});

btnLogout.addEventListener('click', () => {
    chrome.storage.local.get(['api_token'], async (result) => {
        if (result.api_token) {
            try {
                await fetch('https://backoffice.ekonomikosesi.com/api/logout', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${result.api_token}` }
                });
            } catch (error) { 
                console.error("Logout error:", error); 
            }
        }
        
        chrome.storage.local.remove(['api_token', 'user_email', 'selected_profile_id'], () => {
            profileSelectionContainer.classList.add('hidden');
            loginFormContainer.classList.remove('hidden');
            tabOperationBtn.classList.add('hidden');
            tabInfoBtn.classList.add('hidden');
            
            // Ayarlar tabına geri dön
            tabSettingsBtn.click();

            document.getElementById('email').value = "";
            document.getElementById('password').value = "";
            document.getElementById('token').value = "";
            document.getElementById('allowMouseTracking').checked = false;
            loginMessage.classList.add('hidden');
            showToast("Başarıyla çıkış yapıldı.");
        });
    });
});

document.getElementById('btnSaveProfile').addEventListener('click', () => {
    const selectEl = document.getElementById('profileSelect');
    const profileId = selectEl.value;
    const profileName = selectEl.options[selectEl.selectedIndex].text;
    const trackingAllowed = document.getElementById('allowMouseTracking').checked;
    
    chrome.storage.local.set({ 
        selected_profile_id: parseInt(profileId),
        allow_tracking: trackingAllowed 
    }, () => {
        let message = `${profileName} aktif edildi.`;
        if(trackingAllowed) message += " Takip açık.";
        showToast(message);
    });
});

const validDomains = [
    'ekonomikosesi.com',
    'wallstreetturkish.com',
    'mansetetkisi.com',
    'onlinemalumat.com',
    'muvezzi.com',
    'dijitalsurmanset.com',
    'thesansasyonel.com',
    'sansasyonelgazete.com',
    'newsmanset.com',
    'ekonomininsesi.com'
];

document.getElementById('btnSearchGoogle').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(tabs[0].url)}`, '_blank');
        }
    });
});

document.getElementById('btnCheckIndex').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            window.open(`https://www.google.com/search?q=site:${encodeURIComponent(tabs[0].url)}`, '_blank');
        }
    });
});

document.getElementById('btnOpenBackoffice').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                const urlObj = new URL(tabs[0].url);
                const domain = urlObj.hostname.replace('www.', '');
                
                if (validDomains.includes(domain)) {
                    const pathname = urlObj.pathname;
                    const match = pathname.match(/-(\d+)\/?$/);
                    
                    if (match && match[1]) {
                        const postUrlId = match[1];
                        const backofficeUrl = `https://backoffice.ekonomikosesi.com/admin/news/${postUrlId}/edit?domain=${domain}`;
                        window.open(backofficeUrl, '_blank');
                    } else {
                        showToast("İçerik ID'si bulunamadı. Lütfen bir haber detay sayfasında deneyin.");
                    }
                } else {
                    showToast("Bu özellik sadece desteklenen haber sitelerinde çalışır.");
                }
            } catch (e) {
                showToast("Geçersiz URL.");
            }
        }
    });
});

document.getElementById('btnArchiveOrg').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            window.open(`https://web.archive.org/web/*/${tabs[0].url}`, '_blank');
        }
    });
});

document.getElementById('profileSelect').addEventListener('change', (e) => {
    fetchProfileDetails(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['api_token', 'user_email', 'selected_profile_id', 'allow_tracking'], (result) => {
        if (result.api_token) {
            loginFormContainer.classList.add('hidden');
            profileSelectionContainer.classList.remove('hidden');
            tabOperationBtn.classList.remove('hidden');
            tabInfoBtn.classList.remove('hidden');
            document.getElementById('userEmail').textContent = result.user_email || "Aktif Kullanıcı";
            
            document.getElementById('allowMouseTracking').checked = result.allow_tracking || false;
            
            loadProfiles(result.api_token).then(() => {
                if (result.selected_profile_id) {
                    profileSelect.value = result.selected_profile_id;
                    fetchProfileDetails(result.selected_profile_id); 
                }
            });
            loadInfoData(result.api_token); // Load Info Data
        }
    });
});

// Utility Functions
function showLoginError(msg) {
    loginMessage.textContent = msg;
    loginMessage.classList.remove('hidden', 'bg-green-100', 'text-green-700');
    loginMessage.classList.add('bg-red-100', 'text-red-700');
}

function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.remove('translate-y-20');
    setTimeout(hideToast, 3000);
}

function hideToast() {
    toast.classList.add('translate-y-20');
}

let currentScheduleData = null;

async function loadOperationSchedule() {
    chrome.storage.local.get(['api_token', 'selected_profile_id'], async (result) => {
        if (!result.selected_profile_id || !result.api_token) {
            operationNotSelectedMsg.classList.remove('hidden');
            operationContentContainer.classList.add('hidden');
            return;
        }

        operationNotSelectedMsg.classList.add('hidden');
        operationContentContainer.classList.remove('hidden');
        
        if (!operationDaySelect.dataset.initialized) {
            const istanbulTimeStr = new Date().toLocaleString("en-US", {timeZone: "Europe/Istanbul"});
            const dayOfWeek = new Date(istanbulTimeStr).getDay();
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            operationDaySelect.value = days[dayOfWeek];
            operationDaySelect.dataset.initialized = 'true';
        }
        
        if (currentScheduleData) {
            renderOperationDay(operationDaySelect.value);
        } else {
            // Profil datası henüz yüklenmediyse tekrar fetchProfileDetails ile tetikle.
            fetchProfileDetails(result.selected_profile_id);
        }
    });
}

let routineDescriptions = {};

async function loadInfoData(token) {
    try {
        const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
        
        const [routinesRes, actionsRes] = await Promise.all([
            fetch('https://backoffice.ekonomikosesi.com/api/routines?per_page=100', { headers }),
            fetch('https://backoffice.ekonomikosesi.com/api/action-codes?per_page=100', { headers })
        ]);

        const routinesData = routinesRes.ok ? await routinesRes.json() : { data: [] };
        const actionsData = actionsRes.ok ? await actionsRes.json() : { data: [] };

        const rList = document.getElementById('routineList');
        const aList = document.getElementById('actionCodeList');
        
        if(rList) rList.innerHTML = '';
        if(aList) aList.innerHTML = '';

        const routines = Array.isArray(routinesData.data) ? routinesData.data : [];
        const actions = Array.isArray(actionsData.data) ? actionsData.data : [];

        if (routines.length === 0 && rList) {
            rList.innerHTML = '<div class="text-indigo-400 italic px-1">Rutin bulunamadı.</div>';
        } else if (rList) {
            routines.forEach(r => {
                routineDescriptions[r.name] = r.process || 'Belirtilmemiş';
                const div = document.createElement('div');
                div.className = "py-1 px-2";
                div.innerHTML = `<strong class="text-indigo-900 font-semibold px-1 bg-indigo-100 rounded">${r.name}:</strong> ${r.platform ? `<span class="text-gray-500">[${r.platform}]</span> ` : ''}${r.process || ''}`;
                rList.appendChild(div);
            });
        }

        if (actions.length === 0 && aList) {
            aList.innerHTML = '<div class="text-indigo-400 italic px-1">Aksiyon kodu bulunamadı.</div>';
        } else if (aList) {
            actions.forEach(a => {
                routineDescriptions[a.code] = a.summary || a.purpose || 'Belirtilmemiş';
                const div = document.createElement('div');
                div.className = "py-1 px-2";
                div.innerHTML = `<strong class="text-indigo-900 font-semibold px-1 bg-indigo-100 rounded">${a.code}:</strong> ${a.name ? `<span class="text-gray-500">[${a.name}]</span> ` : ''}${a.summary || a.purpose || ''}`;
                aList.appendChild(div);
            });
        }
        
        // Re-render tooltips now that descriptions are loaded
        if (currentScheduleData && !sectionOperation.classList.contains('hidden')) {
            renderOperationDay(operationDaySelect.value);
        }
    } catch (error) {
        console.error("Failed to load info data:", error);
        const rList = document.getElementById('routineList');
        const aList = document.getElementById('actionCodeList');
        if(rList) rList.innerHTML = '<li class="text-red-500 italic">Veri yüklenemedi.</li>';
        if(aList) aList.innerHTML = '<li class="text-red-500 italic">Veri yüklenemedi.</li>';
    }
}

function renderOperationDay(dayStr) {
    const elTimeSlot = document.getElementById('profileTimeSlot');
    const elTomorrowRoutines = document.getElementById('profileTomorrowRoutines');
    const elTodayLabel = document.getElementById('todayLabel');
    const tomorrowDayLabel = document.getElementById('tomorrowDayLabel');
    
    if (!currentScheduleData) {
        operationRoutinesContainer.innerHTML = '<span class="text-[10px] text-red-500 italic bg-white px-2 py-1 rounded border border-red-100">Program bulunamadı</span>';
        elTimeSlot.textContent = "Belirtilmemiş";
        elTomorrowRoutines.textContent = "Yok";
        return;
    }
    
    elTimeSlot.textContent = currentScheduleData.time_slot || "--:-- - --:--";
    operationRoutinesContainer.innerHTML = "";
    
    // Set Day Label
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const trDays = { sunday: "Pazar", monday: "Pazartesi", tuesday: "Salı", wednesday: "Çarşamba", thursday: "Perşembe", friday: "Cuma", saturday: "Cumartesi" };
    
    elTodayLabel.innerHTML = `<span class="text-indigo-500 font-bold">${trDays[dayStr]}</span> RUTİNİ`;

    // Try fetching with _routines suffix or directly (API support both forms)
    const routines = currentScheduleData[`${dayStr}_routines`] || currentScheduleData[dayStr] || [];
    
    if (routines.length === 0) {
        operationRoutinesContainer.innerHTML = '<span class="text-[10px] text-indigo-400/80 italic bg-white px-2 py-1 rounded shadow-sm border border-indigo-100">Bu gün için rutin yok</span>';
    } else {
        routines.forEach(r => {
            let rText = typeof r === 'string' ? r : (r.name || 'Bilinmeyen Rutin');
            let routineBase = rText;
            let duration = "";
            const match = rText.match(/(.*?)\[(.*?)\]/);
            if (match) {
                routineBase = match[1].trim();
                duration = match[2].trim();
            }
            
            const desc = routineDescriptions[routineBase] || 'Belirtilen aksiyon veya platform işlemi.';

            const badge = document.createElement('div');
            badge.className = "group relative flex items-center cursor-help";
            badge.title = desc; // Fallback native tooltip
            
            let htmlStr = `<div class="flex items-center bg-indigo-600 text-white text-xs font-semibold rounded shadow-sm border border-indigo-700 overflow-hidden">
                <span class="px-2 py-1">${routineBase}</span>`;
            
            if (duration) {
                htmlStr += `<span class="px-1.5 py-1 bg-indigo-800 text-[10px] text-indigo-100 border-l border-indigo-700/50">${duration}</span>`;
            }
            
            htmlStr += `</div>
                <div class="absolute top-[calc(100%+6px)] left-0 w-[180px] bg-gray-900 text-white text-[10px] rounded px-2 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[999] text-left whitespace-normal leading-tight shadow-xl">
                    <div class="font-bold text-indigo-300 mb-0.5">${routineBase}</div>
                    ${desc}
                </div>`;
                
            badge.innerHTML = htmlStr;
            operationRoutinesContainer.appendChild(badge);
        });
        
        // Setup Alarm
        const todayIndex = new Date().getDay();
        const curDayIndex = days.indexOf(dayStr);
        if (curDayIndex === todayIndex && currentScheduleData.time_slot && currentScheduleData.time_slot.includes('-')) {
            chrome.runtime.sendMessage({
                action: "SETUP_ROUTINE_ALARMS",
                time_slot: currentScheduleData.time_slot
            });
        }
    }

    // Tomorrow routines logic
    const currentDayIndex = days.indexOf(dayStr);
    const tomorrowStr = days[(currentDayIndex + 1) % 7];
    tomorrowDayLabel.textContent = `${trDays[tomorrowStr]}:`;
    
    const tomorrowRoutines = currentScheduleData[`${tomorrowStr}_routines`] || currentScheduleData[tomorrowStr] || [];
    
    if (tomorrowRoutines.length === 0) {
        elTomorrowRoutines.textContent = "Rutin yok";
    } else {
        const tNames = tomorrowRoutines.map(r => typeof r === 'string' ? r : (r.name || '')).filter(r => r !== '');
        elTomorrowRoutines.textContent = tNames.join(", ");
    }
}

operationDaySelect.addEventListener('change', (e) => {
    renderOperationDay(e.target.value);
});

// Accordion Logic for Info Tab
document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('svg');
        content.classList.toggle('hidden');
        if (content.classList.contains('hidden')) {
            icon.classList.remove('-rotate-180');
        } else {
            icon.classList.add('-rotate-180');
        }
    });
});