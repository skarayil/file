const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadInChunks(supabase, blob, storagePath, onProgress) {
    const totalSize = blob.size;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    if (totalChunks === 1) {
        const { error } = await supabase.storage
            .from('file_manager')
            .upload(storagePath, blob, {
                contentType: 'application/octet-stream',
                upsert: false
            });
        if (error) throw error;
        if (onProgress) onProgress(100, 1, 1);
        return storagePath;
    }

    const chunkPaths = [];
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalSize);
        const chunk = blob.slice(start, end);
        const chunkPath = `${storagePath}.part${i}`;

        let retries = 3;
        while (retries > 0) {
            const { error } = await supabase.storage
                .from('file_manager')
                .upload(chunkPath, chunk, {
                    contentType: 'application/octet-stream',
                    upsert: true
                });
            if (!error) {
                chunkPaths.push(chunkPath);
                break;
            }
            retries--;
            if (retries === 0) throw new Error(`Chunk ${i + 1}/${totalChunks} yüklenemedi: ${error.message}`);
            await new Promise(r => setTimeout(r, 1000));
        }

        if (onProgress) {
            const pct = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(pct, i + 1, totalChunks);
        }
    }

    return chunkPaths;
}

export function formatTransferRate(bytesPerSecond) {
    if (bytesPerSecond >= 1024 * 1024) return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
    if (bytesPerSecond >= 1024) return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
    return bytesPerSecond + ' B/s';
}
