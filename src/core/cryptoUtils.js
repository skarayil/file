function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
}

export async function generateSessionKey() {
    const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );
    const raw = await window.crypto.subtle.exportKey('raw', key);
    return { key, rawBase64: arrayBufferToBase64(raw) };
}

export async function encryptWithSessionKey(data, sessionKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, data);
    return { ciphertext: enc, iv: arrayBufferToBase64(iv) };
}

export async function decryptWithSessionKey(ciphertext, sessionKeyRaw, ivBase64) {
    const iv  = base64ToArrayBuffer(ivBase64);
    const key = await window.crypto.subtle.importKey('raw', base64ToArrayBuffer(sessionKeyRaw), { name: 'AES-GCM' }, false, ['decrypt']);
    return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
}

export async function generateEncryptedKeys(password) {
    const enc = new TextEncoder();

    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const fixedSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    const material = await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    const derivedKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: fixedSalt, iterations: 100000, hash: "SHA-256" },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        derivedKey,
        privateKeyBuffer
    );

    const combinedBuffer = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
    combinedBuffer.set(iv);
    combinedBuffer.set(new Uint8Array(encryptedContent), iv.byteLength);

    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

    return {
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        encryptedPrivateKey: arrayBufferToBase64(combinedBuffer.buffer)
    };
}

async function importPublicKey(base64Key) {
    const binaryKey = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
        "spki",
        binaryKey,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
}

export async function encryptFileForUpload(file, publicKeyBase64) {
    const aesKey = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();

    const encryptedContentBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        aesKey,
        fileBuffer
    );

    const publicKey = await importPublicKey(publicKeyBase64);

    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

    const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        rawAesKey
    );

    return {
        encryptedBlob: new Blob([encryptedContentBuffer], { type: 'application/octet-stream' }),
        iv: arrayBufferToBase64(iv),
        encryptedAesKey: arrayBufferToBase64(encryptedAesKeyBuffer)
    };
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function decryptFile(fileBlob, metadata, encryptedPrivateKey, password) {
    const enc = new TextEncoder();

    const fixedSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    const material = await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: fixedSalt, iterations: 100000, hash: "SHA-256" },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    const encryptedPrivKeyBuffer = base64ToArrayBuffer(encryptedPrivateKey);
    const privKeyIV = encryptedPrivKeyBuffer.slice(0, 12);
    const privKeyData = encryptedPrivKeyBuffer.slice(12);

    let privateKey;
    try {
        const privateKeyBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: privKeyIV },
            wrappingKey,
            privKeyData
        );
        privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
    } catch (e) {
        throw new Error("Şifre yanlış! Private Key çözülemedi.");
    }

    const encryptedAesKeyBuffer = base64ToArrayBuffer(metadata.encryption_key);
    const rawAesKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedAesKeyBuffer
    );

    const aesKey = await window.crypto.subtle.importKey(
        "raw",
        rawAesKeyBuffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const fileBuffer = await fileBlob.arrayBuffer();
    const fileIV = base64ToArrayBuffer(metadata.encryption_iv);

    const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fileIV },
        aesKey,
        fileBuffer
    );

    return new Blob([decryptedContent], { type: metadata.mime_type });
}

export async function reEncryptKeyForShare(encryptedPrivateKey, password, currentEncryptedAesKey, recipientPublicKeyBase64) {
    const enc = new TextEncoder();

    const fixedSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const material = await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    const wrappingKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: fixedSalt, iterations: 100000, hash: "SHA-256" },
        material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );

    const encryptedPrivKeyBuffer = base64ToArrayBuffer(encryptedPrivateKey);
    const privKeyIV = encryptedPrivKeyBuffer.slice(0, 12);
    const privKeyData = encryptedPrivKeyBuffer.slice(12);

    const privateKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: privKeyIV }, wrappingKey, privKeyData
    );
    const senderPrivateKey = await window.crypto.subtle.importKey(
        "pkcs8", privateKeyBuffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]
    );

    const encryptedAesKeyBuffer = base64ToArrayBuffer(currentEncryptedAesKey);
    const rawAesKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" }, senderPrivateKey, encryptedAesKeyBuffer
    );

    const recipientPublicKeyBuffer = base64ToArrayBuffer(recipientPublicKeyBase64);
    const recipientPublicKey = await window.crypto.subtle.importKey(
        "spki", recipientPublicKeyBuffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]
    );

    const newEncryptedAesKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" }, recipientPublicKey, rawAesKeyBuffer
    );

    return arrayBufferToBase64(newEncryptedAesKey);
}