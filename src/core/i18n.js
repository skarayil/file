const dictionary = {
    "Dashboard": {
        "tr": "Gösterge Paneli",
        "en": "Dashboard"
    },
    "Tüm Dosyalar": {
        "tr": "Tüm Dosyalar",
        "en": "All Files"
    },
    "Dosya Yükle": {
        "tr": "Dosya Yükle",
        "en": "Upload File"
    },
    "S-FTP İstemcisi": {
        "tr": "S-FTP İstemcisi",
        "en": "S-FTP Client"
    },
    "Çıkış Yap": {
        "tr": "Çıkış Yap",
        "en": "Log Out"
    },
    "Son İşlemler": {
        "tr": "Son İşlemler",
        "en": "Recent Activity"
    },
    "Aktif Transferler": {
        "tr": "Aktif Transferler",
        "en": "Active Transfers"
    },
    "Şifrele ve Aktar": {
        "tr": "Şifrele ve Aktar",
        "en": "Encrypt & Transfer"
    },
    "Giriş Yap": {
        "tr": "Giriş Yap",
        "en": "Login"
    },
    "Kayıt Ol": {
        "tr": "Kayıt Ol",
        "en": "Sign Up"
    },
    "Kuyruk boş": {
        "tr": "Kuyruk boş",
        "en": "Queue is empty"
    },
    "Hesap Oluştur": {
        "tr": "Hesap Oluştur",
        "en": "Create Account"
    },
    "Kullanıcı Adı": {
        "tr": "Kullanıcı Adı",
        "en": "Username"
    },
    "Şifre": {
        "tr": "Şifre",
        "en": "Password"
    },
    "Güvenli Giriş": {
        "tr": "Güvenli Giriş",
        "en": "Secure Login"
    },
    "Dosya Vadisi": {
        "tr": "FileValley",
        "en": "FileValley"
    }
};

let currentLang = localStorage.getItem('app_lang') || 'tr';

function applyTranslations() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        const text = node.nodeValue.trim();
        if (text && text.length > 0) {
            for (const [key, langs] of Object.entries(dictionary)) {
                if (text === langs['tr'] && currentLang === 'en') {
                    node.nodeValue = node.nodeValue.replace(langs['tr'], langs['en']);
                } else if (text === langs['en'] && currentLang === 'tr') {
                    node.nodeValue = node.nodeValue.replace(langs['en'], langs['tr']);
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Dil butonunu ekle
    const toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 16px;background:var(--accent,#10b981);color:white;border:none;border-radius:20px;cursor:pointer;font-weight:bold;box-shadow:0 4px 6px rgba(0,0,0,0.2);";
    toggleBtn.textContent = currentLang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR';
    
    toggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('app_lang', currentLang);
        window.location.reload();
    });
    
    document.body.appendChild(toggleBtn);
    applyTranslations();

    // Dinamik DOM değişikliklerini de çevirmek için MutationObserver
    const observer = new MutationObserver(mutations => {
        applyTranslations();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
