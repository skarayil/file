# Dosya Vadisi WSTP (Web-based Secure Transfer Protocol)

Endüstri standartlarında, istemci tarafında şifrelenmiş, yüksek güvenlikli dosya transfer ve depolama platformu.

## 🚀 Proje Hakkında

Bu proje, bir "Dosya Yükleme Sitesi"nin ötesine geçerek tamamen "Secure File Transfer Platform" mimarisiyle yeniden tasarlanmıştır. Güvenlik, veri bütünlüğü ve güvenilirlik ön planda tutularak, modern web teknolojileri ile "Sistem Mühendisi" titizliğiyle geliştirilmiştir.

## 🏗 Mimari Yapı

Proje, "Separation of Concerns" (Sorumlulukların Ayrılması) prensibine göre modüler bir klasör hiyerarşisi kullanır:

```
/
├── README.md               # Bu dosya
├── src/
│   ├── api/                # Dış servisler ve veritabanı bağlantıları
│   │   └── supabase.js     # Supabase yapılandırması
│   ├── core/               # Çekirdek mantık (Güvenlik, Protokol)
│   │   ├── cryptoUtils.js  # AES-256-GCM / RSA-2048 şifreleme algoritması
│   │   ├── checksumUtils.js# SHA-256 doğrulama
│   │   ├── keyManager.js   # Bellek-içi Master Key yönetimi
│   │   ├── logger.js       # FTP tarzı işlem kayıt mekanizması
│   │   ├── resumableUpload.js # Hata toleranslı (Resumable) transfer motoru
│   │   ├── transferManager.js # Core transfer kontrolcüsü
│   │   └── vfs.js          # Sanal Dosya Sistemi
│   ├── components/         # Bağımsız UI Modülleri
│   │   └── upload.js       # Dosya transfer arayüzü kontrolcüsü
│   ├── pages/              # Ana Uygulama Ekranları
│   │   ├── dashboard.js    # İstatistik ve transfer raporları
│   │   ├── login.js        # Kimlik doğrulama
│   │   ├── register.js     # Kayıt ve anahtar üretimi
│   │   └── sftp.js         # SFTP İstemci arayüzü
│   └── styles/             # Global stiller
│       └── styles.css
└── public/                 # Statik Varlıklar
    └── img/                # Resimler ve logolar
```

## 🔐 Güvenlik Tahkimatı (Security Hardening)

1.  **İstemci Tarafı Şifreleme (E2E):** Dosyalar sunucuya gönderilmeden önce istemcide şifrelenir (AES-256-GCM). Sunucu dosyaların içeriğini göremez.
2.  **Benzersiz Oturum Anahtarları (Session Keys):** Her dosya transferi için benzersiz bir şifreleme anahtarı üretilir.
3.  **SHA-256 Bütünlük Kontrolü:** Her parça (chunk) ve tüm dosya için SHA-256 karması hesaplanır, transfer sırasında ve sonrasında veri bütünlüğü garanti altına alınır.
4.  **MFA (İki Faktörlü Kimlik Doğrulama):** Login ve Register akışlarında TOTP (Time-based One-Time Password) ile ek güvenlik katmanı sağlanır.
5.  **Güvenli Anahtar Yönetimi:** Anahtar yönetimi (Master Key) hiçbir zaman veritabanında saklanmaz. Yalnızca bellek-içi (in-memory) tutulur ve 8 saat sonra kendini imha eder.

## ⚙️ Transfer Protokolü

*   **Chunked Transfer (Parçalı Gönderim):** Büyük dosyalar 5MB'lık parçalara (chunks) bölünerek gönderilir.
*   **Resumable Upload:** Ağ kesintilerinde, transfer işlemi kalınan parçadan (chunk) devam eder. Hata yönetimi (Error Handling) `resumableUpload.js` tarafından otomatik olarak yapılır (Exponential backoff mantığı ile).
*   **Audit Log:** Tüm işlemler (PUT, GET, DEL) gerçek zamanlı loglanır ve denetlenebilir.

## 🛠 Kurulum ve Çalıştırma

1.  Bağımlılıkları yüklemeye gerek yoktur (Proje Vanilla ES6 Modülleri kullanır).
2.  Yerel sunucu başlatın:
    ```bash
    npx serve .
    ```
3.  Tarayıcınızda açın: `http://localhost:3000/src/pages/index.html` (port değişiklik gösterebilir).

---
*Geliştirilmiş WSTP (Web-based Secure Transfer Protocol) sürümü.*
