/**
 * Copyright © 2026 Sude Naz Karayıldırım. All rights reserved.
 * This backend server is part of the FileValley project, designed and developed by Sude Naz Karayıldırım.
 */
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
    const username = req.query.username;
    if (!username) return res.json([]);

    const ownFiles = db.files.filter(f => f.uploader === username);

    const sharedFileIds = db.shares
        .filter(s => {
            const users = s.users.split(',').map(u => u.trim());
            return users.includes(username);
        })
        .map(s => s.fileId);

    const sharedFiles = db.files
        .filter(f => sharedFileIds.includes(f.id) && f.uploader !== username)
        .map(f => ({ ...f, isShared: true, sharedBy: f.uploader }));

    res.json([...ownFiles, ...sharedFiles]);
});

app.delete('/api/files/:id', (req, res) => {
    const username = req.query.username;
    const fileIndex = db.files.findIndex(f => f.id === req.params.id);
    if (fileIndex !== -1) {
        const file = db.files[fileIndex];
        if (username && file.uploader !== username) {
            return res.status(403).json({ error: "Bu dosya size ait değil." });
        }
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

// --- DASHBOARD API ---
app.get('/api/dashboard', (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const userFiles = db.files.filter(f => f.uploader === username);
    const totalFiles = userFiles.length;
    const totalSize = userFiles.reduce((sum, f) => sum + f.size, 0);

    const activeShares = db.shares.filter(s => {
        const file = db.files.find(f => f.id === s.fileId && f.uploader === username);
        return !!file;
    }).length;

    const recentFiles = [...userFiles]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const imageExts = ['jpg','jpeg','png','gif','svg','webp','bmp','ico'];
    const docExts = ['pdf','doc','docx','txt','xls','xlsx','ppt','pptx','csv'];
    const archExts = ['zip','rar','tar','gz','7z','bz2'];

    const breakdown = { images: 0, documents: 0, archives: 0, other: 0 };
    userFiles.forEach(f => {
        const ext = f.filename.split('.').pop().toLowerCase();
        if (imageExts.includes(ext)) breakdown.images += f.size;
        else if (docExts.includes(ext)) breakdown.documents += f.size;
        else if (archExts.includes(ext)) breakdown.archives += f.size;
        else breakdown.other += f.size;
    });

    res.json({ totalFiles, totalSize, activeShares, recentFiles, breakdown });
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
    const username = req.query.username;
    const userFiles = username ? db.files.filter(f => f.uploader === username) : [];
    const files = userFiles.map(f => ({
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
