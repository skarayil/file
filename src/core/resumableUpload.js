const RESUME_KEY = 'wstp_resume_state';
const CHUNK_SIZE  = 5 * 1024 * 1024; // 5 MB

function buildResumeId(userId, fileName, fileSize) {
    return `${userId}_${fileName}_${fileSize}`;
}

function loadState(resumeId) {
    try {
        const raw = localStorage.getItem(`${RESUME_KEY}_${resumeId}`);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveState(resumeId, state) {
    localStorage.setItem(`${RESUME_KEY}_${resumeId}`, JSON.stringify(state));
}

function clearState(resumeId) {
    localStorage.removeItem(`${RESUME_KEY}_${resumeId}`);
}

export async function resumableChunkUpload(supabase, encryptedBlob, userId, fileName, onProgress) {
    const resumeId    = buildResumeId(userId, fileName, encryptedBlob.size);
    const totalChunks = Math.ceil(encryptedBlob.size / CHUNK_SIZE);
    const basePath    = `${userId}/chunks/${resumeId}`;

    let state = loadState(resumeId);

    if (!state) {
        state = {
            resumeId,
            totalChunks,
            completedChunks: [],
            chunkPaths: [],
            chunkChecksums: [],
            basePath,
            startedAt: new Date().toISOString()
        };
    }

    const completed = new Set(state.completedChunks);

    for (let i = 0; i < totalChunks; i++) {
        if (completed.has(i)) {
            if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 100), i + 1, totalChunks, 'resumed');
            continue;
        }

        const start = i * CHUNK_SIZE;
        const end   = Math.min(start + CHUNK_SIZE, encryptedBlob.size);
        const chunk = encryptedBlob.slice(start, end);

        const chunkChecksum = await computeChunkChecksum(chunk);
        const chunkPath     = `${basePath}_part${i}`;

        await uploadChunkWithRetry(supabase, chunk, chunkPath, 4);

        state.completedChunks.push(i);
        state.chunkPaths.push(chunkPath);
        state.chunkChecksums.push(chunkChecksum);
        saveState(resumeId, state);

        if (onProgress) {
            const pct = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(pct, i + 1, totalChunks, 'uploading');
        }
    }

    clearState(resumeId);
    return { chunkPaths: state.chunkPaths, chunkChecksums: state.chunkChecksums, totalChunks };
}

async function uploadChunkWithRetry(supabase, chunk, path, maxRetries) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) await sleep(Math.min(1000 * 2 ** attempt, 8000));
        const { error } = await supabase.storage
            .from('file_manager')
            .upload(path, chunk, { contentType: 'application/octet-stream', upsert: true });
        if (!error) return;
        lastError = error;
    }
    throw new Error(`Chunk yüklenemedi (${maxRetries} deneme): ${lastError.message}`);
}

async function computeChunkChecksum(chunk) {
    const buf  = await chunk.arrayBuffer();
    const hash = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getResumableUploads() {
    const keys   = Object.keys(localStorage).filter(k => k.startsWith(RESUME_KEY));
    return keys.map(k => {
        try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
    }).filter(Boolean);
}

export function cancelResumableUpload(resumeId) {
    clearState(resumeId);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
