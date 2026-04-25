import supabase from '../api/supabase.js';
import { encryptFileForUpload, generateEncryptedKeys, generateSessionKey } from './cryptoUtils.js';
import { computeSHA256 } from './checksumUtils.js';
import { resumableChunkUpload } from './resumableUpload.js';
import { persistLog, LOG_ACTIONS } from './logger.js';
import { getSessionKey } from './keyManager.js';

function sanitize(n) {
    const m = {'ç':'c','Ç':'C','ğ':'g','Ğ':'G','ş':'s','Ş':'S','ü':'u','Ü':'U','ı':'i','İ':'I','ö':'o','Ö':'O'};
    return n.replace(/[çÇğĞşŞüÜıİöÖ]/g, s => m[s]).replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export async function processFileTransfer(item, user, profile, onProgress, onStatus) {
    if (!profile?.public_key) {
        const pwd = getSessionKey(user.id)?.password || sessionStorage.getItem('temp_session_pwd');
        if (!pwd) throw new Error('Şifreleme anahtarı bulunamadı. Yeniden giriş yapın.');
        const keys = await generateEncryptedKeys(pwd);
        await supabase.from('profiles').update({ public_key: keys.publicKey, encrypted_private_key: keys.encryptedPrivateKey }).eq('id', user.id);
        profile.public_key = keys.publicKey;
    }

    onStatus('SHA-256 hesaplanıyor...');
    const fileChecksum = await computeSHA256(item.file);
    item.checksum = fileChecksum;

    const sessionKey = await generateSessionKey();
    item.sessionKeyId = sessionKey.rawBase64.slice(0, 8) + '…';

    onStatus('AES-256-GCM şifreleniyor...');
    const encResult = await encryptFileForUpload(item.file, profile.public_key);

    const isSingleChunk = encResult.encryptedBlob.size <= 5 * 1024 * 1024;

    if (isSingleChunk) {
        onProgress(30);
        onStatus('Yükleniyor...');
        
        const safeName = sanitize(item.file.name);
        const storagePath = `${user.id}/${Date.now()}_${safeName}`;

        const { error: storageErr } = await supabase.storage
            .from('file_manager')
            .upload(storagePath, encResult.encryptedBlob, { contentType: 'application/octet-stream', upsert: false });
        if (storageErr) throw storageErr;

        onProgress(85);
        onStatus('Kayıt ediliyor...');

        const { error: dbErr } = await supabase.from('files').insert({
            user_id: user.id, filepath: storagePath, filename: item.file.name,
            mime_type: item.file.type || 'application/octet-stream',
            size: item.file.size, sha256: fileChecksum,
            encryption_iv: encResult.iv, encryption_key: encResult.encryptedAesKey,
        });
        if (dbErr) throw dbErr;

    } else {
        onStatus('Parçalı transfer başlatılıyor...');
        const { chunkPaths, chunkChecksums, totalChunks } = await resumableChunkUpload(
            supabase, encResult.encryptedBlob, user.id, item.file.name,
            (pct, current, total) => {
                onProgress(pct);
                onStatus(`Parça ${current}/${total} — ${pct}%`);
            }
        );

        onProgress(95);
        onStatus('Metadata kaydediliyor...');

        const assembledPath = `${user.id}/${Date.now()}_${sanitize(item.file.name)}`;
        const { error: dbErr } = await supabase.from('files').insert({
            user_id: user.id, filepath: assembledPath, filename: item.file.name,
            mime_type: item.file.type || 'application/octet-stream',
            size: item.file.size, sha256: fileChecksum,
            encryption_iv: encResult.iv, encryption_key: encResult.encryptedAesKey,
            chunk_count: totalChunks, chunk_checksums: JSON.stringify(chunkChecksums),
        });
        if (dbErr) throw dbErr;
    }

    await persistLog(user.id, LOG_ACTIONS.UPLOAD, {
        filename: item.file.name, size: item.file.size, sha256: fileChecksum,
    });
}
