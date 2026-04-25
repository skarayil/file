const dictionary = {
    // Nav & Sidebar
    "Dashboard": { "tr": "Gösterge Paneli", "en": "Dashboard" },
    "Dosyalarım": { "tr": "Dosyalarım", "en": "My Files" },
    "Paylaşılanlar": { "tr": "Paylaşılanlar", "en": "Shared with Me" },
    "Bana Paylaşılanlar": { "tr": "Bana Paylaşılanlar", "en": "Shared with Me" },
    "Dosya Yükle": { "tr": "Dosya Yükle", "en": "Upload File" },
    "S-FTP Client": { "tr": "S-FTP İstemcisi", "en": "S-FTP Client" },
    "Çıkış Yap": { "tr": "Çıkış Yap", "en": "Log Out" },
    "Çıkış": { "tr": "Çıkış Yap", "en": "Log Out" },
    
    // Auth
    "Tekrar Hoş Geldiniz": { "tr": "Tekrar Hoş Geldiniz", "en": "Welcome Back" },
    "Güvenli dosya transferi için oturum açın": { "tr": "Güvenli dosya transferi için oturum açın", "en": "Sign in for secure file transfer" },
    "E-posta": { "tr": "E-posta", "en": "Email" },
    "Şifre": { "tr": "Şifre", "en": "Password" },
    "Güvenli Giriş": { "tr": "Güvenli Giriş", "en": "Secure Login" },
    "Hesabınız yok mu?": { "tr": "Hesabınız yok mu?", "en": "Don't have an account?" },
    "Kayıt Olun": { "tr": "Kayıt Olun", "en": "Register" },
    
    // Dashboard Stats
    "Toplam Dosya": { "tr": "Toplam Dosya", "en": "Total Files" },
    "Giden Paylaşım": { "tr": "Giden Paylaşım", "en": "Outgoing Shares" },
    "Gelen Paylaşım": { "tr": "Gelen Paylaşım", "en": "Incoming Shares" },
    "Son Aktivite": { "tr": "Son Aktivite", "en": "Last Activity" },
    "Sanal Dosya Sistemi": { "tr": "Sanal Dosya Sistemi", "en": "Virtual File System" },
    "Transfer Kuyruğu": { "tr": "Transfer Kuyruğu", "en": "Transfer Queue" },
    "Dosya Dağılımı": { "tr": "Dosya Dağılımı", "en": "File Distribution" },
    "Son Yüklenen Dosyalar": { "tr": "Son Yüklenen Dosyalar", "en": "Recently Uploaded" },
    "Tümü": { "tr": "Tümü", "en": "All" },
    "Tam Ekran": { "tr": "Tam Ekran", "en": "Full Screen" },
    
    // Files Page
    "Yeni Dosya Yükle": { "tr": "Yeni Dosya Yükle", "en": "Upload New File" },
    "Dosya ara...": { "tr": "Dosya ara...", "en": "Search files..." },
    "En Yeni": { "tr": "En Yeni", "en": "Newest" },
    "En Eski": { "tr": "En Eski", "en": "Oldest" },
    "İsim (A-Z)": { "tr": "İsim (A-Z)", "en": "Name (A-Z)" },
    "İsim (Z-A)": { "tr": "İsim (Z-A)", "en": "Name (Z-A)" },
    "Tüm Dosyalar": { "tr": "Tüm Dosyalar", "en": "All Files" },
    "Görseller": { "tr": "Görseller", "en": "Images" },
    "Belgeler": { "tr": "Belgeler", "en": "Documents" },
    "Videolar": { "tr": "Videolar", "en": "Videos" },
    "Ses Dosyaları": { "tr": "Ses Dosyaları", "en": "Audio" },
    "Arşivler": { "tr": "Arşivler", "en": "Archives" },
    "Diğer": { "tr": "Diğer", "en": "Other" },
    "Türe Göre Grupla": { "tr": "Türe Göre Grupla", "en": "Group by Type" },
    
    // SFTP
    "Yerel Site": { "tr": "Yerel Site", "en": "Local Site" },
    "Uzak Site (Sunucu)": { "tr": "Uzak Site (Sunucu)", "en": "Remote Site" },
    "Bağlanıyor...": { "tr": "Bağlanıyor...", "en": "Connecting..." },
    "Yenile": { "tr": "Yenile", "en": "Refresh" },
    "Oluştur": { "tr": "Oluştur", "en": "Create" },
    "İptal": { "tr": "İptal", "en": "Cancel" },
    
    // Common
    "Yükleniyor...": { "tr": "Yükleniyor...", "en": "Loading..." },
    "Dosya Adı": { "tr": "Dosya Adı", "en": "Filename" },
    "Tür": { "tr": "Tür", "en": "Type" },
    "Tarih": { "tr": "Tarih", "en": "Date" },
    "İşlemler": { "tr": "İşlemler", "en": "Actions" },
    "Paylaş": { "tr": "Paylaş", "en": "Share" },
    "İndir": { "tr": "İndir", "en": "Download" }
};

let currentLang = localStorage.getItem('app_lang') || 'tr';

function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (text) {
            for (const [key, langs] of Object.entries(dictionary)) {
                if (text === langs['tr'] && currentLang === 'en') {
                    node.nodeValue = node.nodeValue.replace(langs['tr'], langs['en']);
                } else if (text === langs['en'] && currentLang === 'tr') {
                    node.nodeValue = node.nodeValue.replace(langs['en'], langs['tr']);
                }
            }
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Handle placeholders
        if (node.placeholder) {
            for (const [key, langs] of Object.entries(dictionary)) {
                if (node.placeholder === langs['tr'] && currentLang === 'en') {
                    node.placeholder = langs['en'];
                } else if (node.placeholder === langs['en'] && currentLang === 'tr') {
                    node.placeholder = langs['tr'];
                }
            }
        }
        node.childNodes.forEach(translateNode);
    }
}

function applyTranslations() {
    translateNode(document.body);
}

document.addEventListener('DOMContentLoaded', () => {
    // Dil butonunu ekle
    const toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 16px;background:var(--accent,#10b981);color:white;border:none;border-radius:20px;cursor:pointer;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;font-family:sans-serif;font-size:13px;";
    toggleBtn.innerHTML = currentLang === 'tr' ? '<span>🇬🇧</span> EN' : '<span>🇹🇷</span> TR';
    
    toggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('app_lang', currentLang);
        window.location.reload();
    });
    
    document.body.appendChild(toggleBtn);
    applyTranslations();

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => translateNode(node));
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
