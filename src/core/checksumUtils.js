export async function computeSHA256(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSHA256FromBlob(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyIntegrity(originalChecksum, downloadedBlob) {
    const downloadedChecksum = await computeSHA256FromBlob(downloadedBlob);
    return {
        valid: originalChecksum === downloadedChecksum,
        originalChecksum,
        downloadedChecksum
    };
}
