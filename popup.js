// popup.js

const tabSettingsBtn = document.getElementById('tabSettingsBtn');
const tabQuickBtn = document.getElementById('tabQuickBtn');
const sectionSettings = document.getElementById('sectionSettings');
const sectionQuickUse = document.getElementById('sectionQuickUse');

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
    
    sectionSettings.classList.remove('hidden');
    sectionQuickUse.classList.add('hidden');
});

tabQuickBtn.addEventListener('click', () => {
    tabQuickBtn.classList.add('tab-active');
    tabQuickBtn.classList.remove('text-gray-500');
    tabSettingsBtn.classList.remove('tab-active');
    tabSettingsBtn.classList.add('text-gray-500');
    
    sectionQuickUse.classList.remove('hidden');
    sectionSettings.classList.add('hidden');
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
        const elTodayRoutines = document.getElementById('profileTodayRoutines');
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
        elTodayRoutines.innerHTML = "";
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
                        
                        const colorClass = isActive ? "text-indigo-700 bg-white border-indigo-200" : "text-gray-500 bg-gray-50 border-gray-200 opacity-80";
                        const iconColorClass = isActive ? "text-indigo-500" : "text-gray-400";
                        const statusDot = isActive ? `<span class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span><span class="text-[9px] font-medium text-green-700 pt-[0.5px]">Aktif</span>` : `<span class="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span><span class="text-[9px] font-medium text-red-600 pt-[0.5px]">Pasif</span>`;
                        
                        const item = document.createElement('div');
                        item.className = `flex items-center gap-1.5 px-2 py-1 rounded shadow-sm border ${colorClass}`;
                        item.innerHTML = `
                            <div class="${iconColorClass} flex-shrink-0">${getIcon(platName)}</div>
                            <div class="capitalize font-medium text-[10px] tracking-wide">${platName}</div>
                            <div class="flex items-center gap-1 border-l pl-1.5 ml-0.5" style="border-color: inherit">${statusDot}</div>
                        `;
                        item.setAttribute('title', acc.username || '');
                        elSocialAccounts.appendChild(item);
                    });
                }

                // Schedule
                const schedule = profileData.schedule;
                if (!schedule) {
                    elTimeSlot.textContent = "Belirtilmemiş";
                    elTodayRoutines.innerHTML = `<span class="text-[10px] text-indigo-400/80 italic bg-white px-2 py-1 rounded shadow-sm border border-indigo-100">Program bulunamadı</span>`;
                    elTomorrowRoutines.textContent = "Yok";
                } else {
                    elTimeSlot.textContent = schedule.time_slot || "--:-- - --:--";
                    
                    const istanbulTimeStr = new Date().toLocaleString("en-US", {timeZone: "Europe/Istanbul"});
                    const istanbulTime = new Date(istanbulTimeStr);
                    const dayOfWeek = istanbulTime.getDay();
                    
                    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                    const trDays = { sunday: "Pazar", monday: "Pazartesi", tuesday: "Salı", wednesday: "Çarşamba", thursday: "Perşembe", friday: "Cuma", saturday: "Cumartesi" };
                    
                    const todayStr = days[dayOfWeek];
                    const tomorrowStr = days[(dayOfWeek + 1) % 7];
                    
                    elTodayLabel.innerHTML = `<span class="text-indigo-500 font-bold">${trDays[todayStr]}</span> Rutini`;

                    const todayRoutines = schedule[`${todayStr}_routines`] || [];
                    const tomorrowRoutines = schedule[`${tomorrowStr}_routines`] || [];
                    
                    if (todayRoutines.length === 0) {
                        elTodayRoutines.innerHTML = `<span class="text-[10px] text-indigo-400/80 italic bg-white px-2 py-1 rounded shadow-sm border border-indigo-100">Bugün için rutin yok</span>`;
                    } else {
                        todayRoutines.forEach(r => {
                            const badge = document.createElement('span');
                            badge.className = "px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-medium rounded shadow-sm border border-indigo-700/50 whitespace-nowrap";
                            badge.textContent = r;
                            elTodayRoutines.appendChild(badge);
                        });
                    }
                    
                    if (tomorrowRoutines.length === 0) {
                        elTomorrowRoutines.textContent = "Rutin yok";
                    } else {
                        elTomorrowRoutines.textContent = tomorrowRoutines.join(", ");
                    }
                }

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
                document.getElementById('userName').textContent = userName;
                document.getElementById('userEmail').textContent = userEmail;
                
                await loadProfiles(finalToken);
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

document.getElementById('profileSelect').addEventListener('change', (e) => {
    fetchProfileDetails(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['api_token', 'user_email', 'selected_profile_id', 'allow_tracking'], (result) => {
        if (result.api_token) {
            loginFormContainer.classList.add('hidden');
            profileSelectionContainer.classList.remove('hidden');
            document.getElementById('userEmail').textContent = result.user_email || "Aktif Kullanıcı";
            
            document.getElementById('allowMouseTracking').checked = result.allow_tracking || false;
            
            loadProfiles(result.api_token).then(() => {
                if (result.selected_profile_id) {
                    profileSelect.value = result.selected_profile_id;
                    fetchProfileDetails(result.selected_profile_id); 
                }
            });
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