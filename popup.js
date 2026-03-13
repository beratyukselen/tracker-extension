// popup.js

// DOM Elements
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

// Login Tabs Elements
const loginTabEmail = document.getElementById('loginTabEmail');
const loginTabToken = document.getElementById('loginTabToken');
const emailAuthFields = document.getElementById('emailAuthFields');
const tokenAuthFields = document.getElementById('tokenAuthFields');

let loginMethod = 'email'; 

// Login Tabs Switching Logic
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

// Tab Switching Logic
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

// YENİ FONKSİYON: API'den Gerçek Profilleri Çekme
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
                option.textContent = p.name || `Profil ${p.id}`; 
                profileSelect.appendChild(option);
            });
        } else {
            console.error("Profiller çekilemedi:", response.status);
        }
    } catch (error) {
        console.error("Profilleri çekerken hata oluştu:", error);
    }
}

// Login
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

// Logout
btnLogout.addEventListener('click', () => {
    chrome.storage.local.get(['api_token'], async (result) => {
        if (result.api_token) {
            // Sunucuya da çıkış yaptığımızı haber veriyoruz
            try {
                await fetch('https://backoffice.ekonomikosesi.com/api/logout', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${result.api_token}` }
                });
            } catch (e) { console.error("Logout API Hatası", e); }
        }
        
        // Kasayı temizle ve arayüzü başa döndür
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

// Profile Selection Feedback
document.getElementById('btnSaveProfile').addEventListener('click', () => {
    const selectEl = document.getElementById('profileSelect');
    const profileId = selectEl.value;
    const profileName = selectEl.options[selectEl.selectedIndex].text;
    const trackingAllowed = document.getElementById('allowMouseTracking').checked; // Checkbox durumu
    
    // Hem ID'yi hem de Takip iznini kasaya (storage) atıyoruz
    chrome.storage.local.set({ 
        selected_profile_id: parseInt(profileId),
        allow_tracking: trackingAllowed 
    }, () => {
        let message = `${profileName} aktif edildi.`;
        if(trackingAllowed) message += " Takip açık.";
        showToast(message);
    });
});

// Quick Actions Feedback
document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const action = this.querySelector('.text-sm').textContent;
        showToast(`${action} başlatılıyor...`);
    });
});

// Helper Functions
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

// Eklenti ilk açıldığında hafızayı kontrol et ve arayüzü geri yükle
document.addEventListener('DOMContentLoaded', () => {
    fetchClientIP();
    chrome.storage.local.get(['api_token', 'user_email', 'selected_profile_id', 'allow_tracking'], (result) => {
        if (result.api_token) {
            loginFormContainer.classList.add('hidden');
            profileSelectionContainer.classList.remove('hidden');
            document.getElementById('userEmail').textContent = result.user_email || "Aktif Kullanıcı";
            
            // Checkbox durumunu geri yükle (yoksa false gelsin)
            document.getElementById('allowMouseTracking').checked = result.allow_tracking || false;
            
            // Profilleri çek ve çekme işlemi bitince seçili olanı işaretle
            loadProfiles(result.api_token).then(() => {
                if (result.selected_profile_id) {
                    profileSelect.value = result.selected_profile_id;
                }
            });
        }
    });
});

// sunucudan IP bilgisini çeken fonksiyon
async function fetchClientIP() {
    try {
        const response = await fetch("https://backoffice.ekonomikosesi.com/api/ip", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const data = await response.json();
            // API'den dönen cevaba göre IP'yi HTML'e yazdırıyoruz
            const ipAddress = data.ip || data.client_ip || data; 
            document.getElementById('clientIp').textContent = ipAddress;
            console.log("IP Başarıyla Çekildi:", ipAddress);
        } else {
            document.getElementById('clientIp').textContent = "Bulunamadı";
        }
    } catch (error) {
        console.error("IP çekilirken hata:", error);
        document.getElementById('clientIp').textContent = "Bağlantı Hatası";
    }
}