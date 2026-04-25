import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend files

// --- VERİTABANI (JSON Tabanlı) ---
const DB_FILE = path.join(__dirname, 'data.json');
let db = { users: [], files: [], shares: [] };

if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        console.error("Veritabanı okunamadı:", e);
    }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// --- DOSYA YÜKLEME AYARLARI (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// --- AUTH API ---
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Tüm alanlar zorunludur." });
    
    if (db.users.find(u => u.username === username)) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
    }
    
    db.users.push({ username, email, password });
    saveDB();
    res.json({ message: "Kayıt başarılı!" });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ message: "Giriş başarılı!", username: user.username });
    } else {
        res.status(401).json({ error: "Hatalı kullanıcı adı veya şifre." });
    }
});

// --- DOSYA API ---
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Dosya yüklenemedi." });
    
    const uploader = req.body.username || 'Anonim';
    const newFile = {
        id: Date.now().toString(),
        filename: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        uploader: uploader,
        date: new Date().toISOString()
    };
    
    db.files.push(newFile);
    saveDB();
    res.json({ message: "Dosya başarıyla yüklendi!", file: newFile });
});

app.get('/api/files', (req, res) => {
    // Return all files (or we could filter by uploader)
    res.json(db.files);
});

app.delete('/api/files/:id', (req, res) => {
    const fileIndex = db.files.findIndex(f => f.id === req.params.id);
    if (fileIndex !== -1) {
        const file = db.files[fileIndex];
        try {
            fs.unlinkSync(path.join(uploadDir, file.storedName));
        } catch (e) {
            console.error("Dosya diskten silinemedi:", e);
        }
        db.files.splice(fileIndex, 1);
        saveDB();
        res.json({ message: "Dosya başarıyla silindi." });
    } else {
        res.status(404).json({ error: "Dosya bulunamadı." });
    }
});

// --- PAYLAŞIM API ---
app.post('/api/share', (req, res) => {
    const { fileId, users, date, time, limit } = req.body;
    const share = { id: Date.now().toString(), fileId, users, expiration: `${date} ${time}`, limit };
    db.shares.push(share);
    saveDB();
    res.json({ message: "Paylaşım başarıyla oluşturuldu!", share });
});

// --- FTP MOCK API ---
app.get('/api/ftp/remote', (req, res) => {
    // Just return uploaded files as remote for realistic feeling
    const files = db.files.map(f => ({
        name: f.filename,
        size: f.size,
        date: f.date,
        hash: f.storedName.substring(0, 8)
    }));
    res.json(files);
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});
