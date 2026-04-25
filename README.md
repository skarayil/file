# FileValley WSTP (Web-based Secure Transfer Protocol)

Endüstri standartlarında, istemci tarafında E2E şifrelenmiş, yüksek güvenlikli dosya transfer ve depolama platformu.

---

## 🚀 Proje Hakkında

Bu proje, standart bir "Dosya Yükleme Sitesi"nin ötesine geçerek tamamen "Secure File Transfer Platform" mimarisiyle yeniden tasarlanmıştır. Güvenlik, veri bütünlüğü ve güvenilirlik ön planda tutularak, modern web teknolojileri ile "Sistem Mühendisi" titizliğiyle geliştirilmiştir.

Uygulama, klasik web FTP (FileZilla benzeri) hissini, askeri düzeyde şifreleme ve modern web arayüzü ile birleştirir.

---

## ✨ Temel Özellikler

### 🔐 Güvenlik ve Şifreleme (Security Hardening)
*   **Uçtan Uca (E2E) Şifreleme:** Dosyalar sunucuya gönderilmeden önce tamamen tarayıcıda (istemci tarafında) **AES-256-GCM** ile şifrelenir. Sunucunun ve veritabanı yöneticilerinin dosyaları okuma imkânı yoktur.
*   **Oturum Anahtarları (Session Keys):** Her bir dosya transferi için kriptografik olarak benzersiz, tek seferlik bir oturum anahtarı üretilir.
*   **Bütünlük Kontrolü (Checksum):** Dosyanın her bir parçası (chunk) ve tamamı için **SHA-256** hash'i oluşturulur. Transfer sonrasında dosyanın milimetrik olarak bozulmadığı garanti edilir.
*   **Sıfır Bilgi Mimarisi (Zero-Knowledge):** Master Key (Ana Şifreleme Anahtarı) hiçbir zaman veritabanına veya localStorage'a kaydedilmez. Geçici olarak bellek-içi (in-memory) tutulur ve 8 saatlik bir TTL (Time-to-Live) süresi sonunda kendini otomatik imha eder.
*   **Çok Faktörlü Kimlik Doğrulama (MFA):** Kayıt ve giriş süreçleri, Google Authenticator / Authy gibi uygulamalar üzerinden TOTP (Zamana Dayalı Tek Kullanımlık Şifre) protokolü ile korunur.

### ⚙️ Transfer ve Ağ Protokolü
*   **Parçalı Aktarım (Chunked Transfer):** Büyük boyutlu dosyalar, tarayıcıyı yormamak ve ağ kullanımını optimize etmek için **5MB'lık** parçalara bölünerek sunucuya iletilir.
*   **Kaldığı Yerden Devam (Resumable Uploads):** İnternet bağlantısı koptuğunda, transfer çöktüğünde veya sekme yanlışlıkla kapatıldığında panik yapmanıza gerek yoktur. Dosyayı tekrar seçtiğinizde, sistem özel bir state algoritması (Exponential Backoff) ile dosyayı kaldığı %'lik dilimden (kaldığı chunk'tan) upload etmeye devam eder.

### 💻 Arayüz ve Kullanıcı Deneyimi (UI/UX)
*   **SFTP İstemcisi Modu:** Geleneksel FileZilla ve WinSCP tasarımlarından ilham alan çift panelli (Dual-Panel) görünüm. Sol tarafta VFS klasör ağacınız, sağ tarafta sunucu dosyalarınız.
*   **Sanal Dosya Sistemi (VFS - Virtual File System):** Kendi klasörlerinizi oluşturun, iç içe klasör (nested directory) hiyerarşileri yaratın ve dosyalarınızı taşıyın.
*   **Gelişmiş Dashboard:** Anlık işlem kayıtlarını, aktif transfer kuyruklarını ve dosya türü istatistiklerini barındıran endüstriyel "Dark Mode" kontrol paneli.
*   **Denetim Günlükleri (Audit Logs):** Tüm işlemler gerçek zamanlı olarak (FTP standartlarındaki komut kodlarıyla: `PUT`, `GET`, `DEL`, `MKDIR`) loglanır ve Dashboard üzerinden takip edilebilir.

---

## 🛠️ Kurulum ve Çalıştırma

Proje **Vanilla JavaScript (ES6+ Modules)** kullanılarak yazılmıştır. Karmaşık Node.js bağımlılıklarına, Webpack veya Vite gibi bundler'lara ihtiyaç duymaz. Tamamen tarayıcı üzerinde "Native" olarak çalışacak şekilde dizayn edilmiştir.

### Gereksinimler
Sadece yerel bir web sunucusuna ihtiyacınız vardır. Bunun için Node.js ekosistemindeki `serve`, `http-server` veya Python'un dahili HTTP sunucusunu kullanabilirsiniz.

### Adım Adım Çalıştırma
1. **Projeyi indirin ve terminalde proje dizinine gidin:**
   ```bash
   cd /path/to/dosya-vadisi
   ```

2. **Yerel sunucuyu başlatın (Önerilen: npx serve):**
   ```bash
   npx serve .
   ```
   *(Eğer Node.js yüklü değilse Python ile `python3 -m http.server 3000` komutunu da kullanabilirsiniz).*

3. **Tarayıcıyı açın:**
   Terminalde belirtilen adrese (genellikle `http://localhost:3000` veya `http://127.0.0.1:3000`) gidin.
   Ana sayfa direkt olarak `/src/pages/index.html`'e yönlendirecektir.

---

## 📖 Kullanım Kılavuzu

Uygulamayı kullanmaya başlamak için aşağıdaki senaryoları takip edebilirsiniz:

### 1. Kayıt ve İlk Kurulum (Onboarding)
1. `Kayıt Ol` sayfasına gidin.
2. E-posta, Kullanıcı Adı ve Şifre (En az 8 karakter) girerek hesap oluşturun.
3. Arka planda saniyeler içerisinde size özel **RSA-2048 ve AES-256** şifreleme anahtarları üretilecek ve sadece Public Key (Açık Anahtar) veritabanına gönderilecektir.
4. Karşınıza **MFA (2FA)** QR kodu çıkacaktır. Telefonunuzdaki bir Authenticator uygulaması ile bu kodu okutun ve 6 haneli kodu sisteme girerek hesabınızı %100 güvenli hale getirin. (Dilerseniz bu adımı atlayabilirsiniz).

### 2. Dosya Yükleme (Resumable Upload)
1. Sol menüden **Dosya Yükle**'ye tıklayın.
2. İstediğiniz dosyaları (örneğin 2GB'lık bir video) Sürükle-Bırak alanına atın.
3. `Şifrele ve Aktar` butonuna basın.
4. Dosyalarınız önce **SHA-256** kontrolünden geçer, ardından AES ile şifrelenir ve 5MB'lık parçalar halinde yüklenmeye başlar.
5. **Test Etmek İçin:** Yükleme %50'deyken sayfayı yenileyin veya internetinizi kesin. Ardından tekrar aynı dosyayı yükleme ekranına atın, sistemin dosyayı en baştan değil, %50'den itibaren yüklemeye devam ettiğini göreceksiniz!

### 3. SFTP İstemcisi ve Sanal Klasörler (VFS)
1. Sol menüden **S-FTP İstemcisi**'ne tıklayın. Karşınıza tam ekran, koyu temalı bir komuta merkezi açılacaktır.
2. Sol alt panelden `Sağ Tık -> Yeni Klasör` diyerek klasör oluşturun. 
3. Sağ paneldeki dosyalarınızı sol paneldeki klasörlere sürükleyip bırakarak VFS (Sanal Dosya Sistemi) üzerinde taşıma işlemlerini yönetebilirsiniz.
4. Alt kısımdaki `Transfer Log` sekmesinden o anki ağ trafiğinizi ve loglarınızı (Örn: `200 OK - PUT File`) canlı olarak izleyebilirsiniz.

### 4. Dashboard ve İzleme (Monitoring)
1. Ana sayfa (Dashboard), sisteminizin genel durumunu gösterir.
2. Sağ üstte `E2E Şifreli` badge'inin yeşil yandığını teyit edin.
3. Sağ alttaki **FTP Session Log** penceresinden daha önceki tüm girişlerinizi, yüklemelerinizi ve hatalı işlemleri inceleyin. İşiniz bittiğinde güvenliğiniz için `Temizle` butonuna basarak logları silebilirsiniz.

---

## 🏗️ Klasör Mimarisi (Directory Mapping)

Proje, kurumsal kodlama standartları ve "Separation of Concerns" prensibi doğrultusunda yapılandırılmıştır.

```text
/
├── README.md               # Bu belge
├── src/
│   ├── api/                # Dış servisler
│   │   └── supabase.js     # Supabase veri ve Auth konfigürasyonu
│   ├── core/               # Sistemin "Beyni" - Güvenlik ve Protokoller
│   │   ├── cryptoUtils.js  # AES ve RSA kriptografi motoru
│   │   ├── checksumUtils.js# Hash ve bütünlük algoritmaları
│   │   ├── resumableUpload.js# Kaldığı yerden devam etme state manager'ı
│   │   ├── chunkUpload.js  # Dosya paketleme (chunk) motoru
│   │   ├── transferManager.js# Upload ve aktarım süreç yönlendiricisi
│   │   ├── keyManager.js   # Bellek-içi Master Key kasası
│   │   ├── logger.js       # Audit Log işlemcisi
│   │   └── vfs.js          # Sanal Dosya Sistemi klasör ağacı mantığı
│   ├── components/         # Bağlaç ve UI mantıkları
│   │   └── upload.js       # Dosya yükleme sayfasının DOM yöneticisi
│   ├── pages/              # Uygulama Ekranları (Views & Controllers)
│   │   ├── index.html / dashboard.js 
│   │   ├── login.html / login.js     
│   │   ├── register.html / register.js
│   │   ├── sftp.html / sftp.js       
│   │   ├── files.html / files.js     
│   │   ├── upload.html               
│   │   └── shared.html / shared.js   
│   └── styles/             # Global CSS Stilleri
│       └── styles.css
└── public/                 # Statik Varlıklar
    └── img/                # Logolar, ikonlar
```

---
*Powered by Web Crypto API & Vanilla JS.*
