<div align="center">

# 🗂️ FileValley — Güvenli Dosya Platformu

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=22&pause=1000&color=10B981&center=true&vCenter=true&width=700&lines=Uçtan+Uca+Şifreli+Dosya+Yönetimi;Sanal+Dosya+Sistemi+%26+Denetim+Günlüğü;Vanilla+JS+%2B+Express+ile+Geliştirildi!" alt="Typing SVG" />

<br/>

[![HTML5](https://img.shields.io/badge/HTML5-Vanilla-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![CSS3](https://img.shields.io/badge/CSS3-Custom%20Design%20System-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](https://github.com/skarayil)

<br/>

> **Profesyonel, güvenli ve birleşik bir dosya transfer platformu.**  
> Uçtan uca şifreleme, FTP istemcisi ve çok dilli arayüz ile tam donanımlı.  
> Harici veritabanı gerektirmez — JSON tabanlı yerel depolama ile çalışır.

<br/>

### 🌐 [Canlı Demo → skarayil.github.io/FileValley_BVHackathon](https://skarayil.github.io/FileValley_BVHackathon/)

<br/>

[✨ Özellikler](#-özellikler) • [🚀 Kurulum](#-kurulum-ve-çalıştırma) • [📁 Proje Yapısı](#-proje-yapısı) • [🔐 Güvenlik](#-güvenlik) • [👩‍💻 Geliştirici](#-geliştirici)

</div>

---

## ✨ Özellikler

<table>
  <tr>
    <td align="center">🔐</td>
    <td><strong>Uçtan Uca Şifreleme</strong></td>
    <td>Dosyalar yüklenmeden önce Web Crypto API (AES-GCM) ile istemci tarafında şifrelenir</td>
  </tr>
  <tr>
    <td align="center">📁</td>
    <td><strong>Dosya Yönetimi</strong></td>
    <td>Yükleme, indirme, silme ve türe göre gruplama desteklenir</td>
  </tr>
  <tr>
    <td align="center">🔗</td>
    <td><strong>Güvenli Dosya Paylaşımı</strong></td>
    <td>Kullanıcıya özel paylaşım, son kullanma tarihi ve indirme limiti ayarlanabilir</td>
  </tr>
  <tr>
    <td align="center">🖥️</td>
    <td><strong>S-FTP İstemcisi</strong></td>
    <td>Binary / ASCII mod desteğiyle çift panelli dosya aktarım arayüzü (PUT / GET / DEL)</td>
  </tr>
  <tr>
    <td align="center">📊</td>
    <td><strong>Gösterge Paneli</strong></td>
    <td>Toplam dosya sayısı, kullanılan alan, aktif paylaşımlar ve Chart.js depolama dağılımı grafiği</td>
  </tr>
  <tr>
    <td align="center">👤</td>
    <td><strong>Kullanıcı Yönetimi</strong></td>
    <td>Kayıt, giriş ve şifre sıfırlama akışları; kullanıcıya özel dosya izolasyonu</td>
  </tr>
  <tr>
    <td align="center">🌍</td>
    <td><strong>Çok Dilli Destek</strong></td>
    <td>Türkçe ve İngilizce arasında anlık geçiş — tüm arayüz metinleri i18n sistemiyle yönetilir</td>
  </tr>
  <tr>
    <td align="center">🎨</td>
    <td><strong>Profesyonel Yeşil Tema</strong></td>
    <td>Emerald & Mint paleti, Inter yazı tipi ve tutarlı tasarım sistemi (app-layout.css)</td>
  </tr>
  <tr>
    <td align="center">🔔</td>
    <td><strong>Toast Bildirimleri</strong></td>
    <td>Tüm işlemler için animasyonlu başarı / hata bildirimleri</td>
  </tr>
</table>

---

## 🚀 Kurulum ve Çalıştırma

### 1 — Repoyu Klonla

```bash
git clone https://github.com/skarayil/FileValley_BVHackathon.git
cd FileValley_BVHackathon
```

### 2 — Bağımlılıkları Yükle

```bash
npm install
```

### 3 — Sunucuyu Başlat

```bash
node server.js
```

Tarayıcında `http://localhost:3000` adresini aç.

> **Not:** Node.js `>=20` önerilir. Tüm bağımlılıklar `package.json` içindedir.

---

## 📁 Proje Yapısı

```
FileValley/
├── index.html          ← Gösterge Paneli (Dashboard)
├── server.js           ← Express REST API sunucusu
├── data.json           ← JSON tabanlı veritabanı (kullanıcılar, dosyalar, paylaşımlar)
├── package.json
│
└── uploads/            ← Yüklenen dosyaların saklandığı klasör (otomatik oluşturulur)
```

---

## 🌐 API Uç Noktaları

| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `POST` | `/api/register` | Yeni kullanıcı kaydı |
| `POST` | `/api/login` | Kullanıcı girişi |
| `POST` | `/api/upload` | Dosya yükleme (multipart/form-data) |
| `GET` | `/api/files?username=` | Kullanıcının dosyalarını listeler (paylaşılanlar dahil) |
| `DELETE` | `/api/files/:id` | Dosya silme |
| `GET` | `/api/dashboard?username=` | İstatistikler ve depolama dağılımı |
| `POST` | `/api/share` | Dosya paylaşımı oluşturma |
| `GET` | `/api/ftp/remote` | FTP uzak site dosya listesi |

---

## 🔐 Güvenlik

- **İstemci Taraflı Şifreleme:** Dosyalar sunucuya ulaşmadan önce Web Crypto API ile AES-GCM algoritmasıyla şifrelenir
- **Kullanıcı İzolasyonu:** Her kullanıcı yalnızca kendi yüklediği dosyalara erişebilir
- **Paylaşım Kontrolü:** Dosya paylaşımlarına son kullanma tarihi ve indirme limiti tanımlanabilir
- **Yetkilendirme Koruması:** Silme işlemlerinde sahiplik doğrulaması yapılır (`403 Forbidden`)

---

## 🖥️ S-FTP İstemcisi

Çift panelli FTP arayüzü iki bölümden oluşur:

| Panel | İçerik |
|-------|--------|
| **Yerel Site** | Giriş yapan kullanıcının kendi yüklediği dosyalar |
| **Uzak Site** | Başka kullanıcılar tarafından kendisiyle paylaşılan dosyalar |

**Desteklenen Aktarım Modları:**
- 🔵 **Binary (İkili)** — Görsel, arşiv ve ikili dosyalar için
- 📄 **ASCII (Metin)** — Düz metin ve CSV dosyaları için

---

## 🛠️ Kullanılan Teknolojiler

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| Vanilla HTML5 / CSS3 / JS | Arayüz geliştirme |
| Express.js (v5) | REST API sunucusu |
| Multer | Dosya yükleme (multipart) |
| Chart.js | Depolama dağılımı grafiği |
| Web Crypto API | İstemci taraflı AES-GCM şifreleme |
| Inter (Google Fonts) | Tipografi |
| JSON (data.json) | Hafif yerel veritabanı |

---

## 📝 Lisans

Bu yazılım **[Sude Naz Karayıldırım](https://github.com/skarayil)** tarafından geliştirilmiştir.  
Tüm fikri ve hukuki hakları saklıdır. © 2026

---

<div align="center">

## 👩‍💻 Created by Sude Naz Karayıldırım

[![GitHub](https://img.shields.io/badge/GitHub-skarayil-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/skarayil)
[![42 Profile](https://img.shields.io/badge/42%20Profile-skarayil-black?style=flat-square&logo=42&logoColor=white)](https://profile.intra.42.fr/users/skarayil)

**⭐ Eğer bu proje işinize yaradıysa, repo'ya star vermeyi unutmayın!**

<sub>© 2026 Sude Naz Karayıldırım • FileValley — Güvenli Dosya Platformu • github.com/skarayil</sub>

</div>
