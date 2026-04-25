import supabase from '../api/supabase.js';
import { getResumableUploads, cancelResumableUpload } from '../core/resumableUpload.js';
import { initSessionLog } from '../core/logger.js';
import { processFileTransfer } from '../core/transferManager.js';

const fileInput     = document.getElementById('fileInput');
const uploadBtn     = document.getElementById('uploadBtn');
const statusDiv     = document.getElementById('status');
const fileListQueue = document.getElementById('fileListQueue');
const queueTitle    = document.querySelector('.queue-title');
const clearQueueBtn = document.querySelector('.btn-queue-clear');

let fileQueue = [];

document.addEventListener('DOMContentLoaded', () => {
    initSessionLog();
    renderResumeBanner();

    fileInput?.addEventListener('change', e => {
        if (e.target.files.length) { handleFiles(Array.from(e.target.files)); e.target.value = ''; }
    });
    clearQueueBtn?.addEventListener('click', () => { fileQueue = []; renderQueue(); });
    uploadBtn?.addEventListener('click', processQueue);

    const zone = document.querySelector('.upload-drop-zone');
    if (zone) {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drop-active'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drop-active'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drop-active');
            if (e.dataTransfer.files.length) handleFiles(Array.from(e.dataTransfer.files));
        });
    }
});

function handleFiles(files) {
    files.forEach(f => {
        if (!fileQueue.some(q => q.file.name === f.name && q.file.size === f.size)) {
            fileQueue.push({ file: f, status: 'pending', progress: 0, message: '', checksum: null, sessionKeyId: null });
        }
    });
    renderQueue();
}

function renderQueue() {
    if (!fileListQueue) return;
    if (queueTitle) queueTitle.textContent = `Transfer Kuyruğu (${fileQueue.length})`;
    fileListQueue.innerHTML = '';

    if (fileQueue.length === 0) {
        fileListQueue.innerHTML = `<p style="text-align:center;padding:24px;color:#6b7280;font-size:13px;">Kuyruk boş</p>`;
        return;
    }

    fileQueue.forEach((item, idx) => {
        const progressBar = item.status === 'uploading'
            ? `<div class="upload-progress-track"><div class="upload-progress-fill" style="width:${item.progress}%"></div></div>`
            : '';
        const checksumBadge = item.checksum
            ? `<span class="checksum-badge" title="SHA-256: ${item.checksum}">✓ SHA-256</span>`
            : '';
        const skBadge = item.sessionKeyId
            ? `<span class="session-key-badge" title="Session Key ID: ${item.sessionKeyId}">🔑 SK</span>`
            : '';

        fileListQueue.insertAdjacentHTML('beforeend', `
            <div class="file-item-card status-${item.status}">
                <div class="file-item-flex">
                    <div class="file-icon-box">${fileIconSVG(item.file.name)}</div>
                    <div class="file-info">
                        <div class="file-header">
                            <p class="file-name" title="${escHtml(item.file.name)}">${escHtml(item.file.name)}</p>
                            <div class="file-actions">
                                ${statusIcon(item.status)}
                                ${checksumBadge}${skBadge}
                                <button class="btn-remove" data-i="${idx}">×</button>
                            </div>
                        </div>
                        <p class="file-size">${formatSize(item.file.size)}</p>
                        ${item.message ? `<p class="item-msg ${item.status === 'error' ? 'msg-error' : ''}">${escHtml(item.message)}</p>` : ''}
                        ${progressBar}
                    </div>
                </div>
            </div>`);
    });

    fileListQueue.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', e => {
            const i = parseInt(e.currentTarget.dataset.i);
            fileQueue.splice(i, 1);
            renderQueue();
        });
    });
}

async function processQueue() {
    const pending = fileQueue.filter(i => ['pending','error'].includes(i.status));
    if (!pending.length) {
        setStatus(fileQueue.length ? 'Tüm dosyalar yüklendi.' : 'Önce dosya seçin.', fileQueue.length ? 'success' : 'error');
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Aktarılıyor...';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setStatus('Oturum bulunamadı. Lütfen giriş yapın.', 'error');
        uploadBtn.disabled = false;
        return;
    }

    let { data: profile } = await supabase.from('profiles').select('public_key').eq('id', user.id).single();

    for (let i = 0; i < fileQueue.length; i++) {
        const item = fileQueue[i];
        if (!['pending','error'].includes(item.status)) continue;

        item.status   = 'uploading';
        item.message  = 'Hazırlanıyor...';
        item.progress = 0;
        renderQueue();

        try {
            await processFileTransfer(item, user, profile, 
                (pct) => { item.progress = pct; renderQueue(); },
                (msg) => { item.message = msg; renderQueue(); }
            );
            item.status   = 'success';
            item.message  = 'Transfer tamamlandı';
            item.progress = 100;
        } catch (err) {
            item.status  = 'error';
            item.message = err.message;
        }
        renderQueue();
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Şifrele ve Aktar';
    setStatus('Kuyruk işlendi.', 'success');
}

function renderResumeBanner() {
    const pending = getResumableUploads();
    if (!pending.length || !fileListQueue) return;

    const banner = document.createElement('div');
    banner.style.cssText = 'background:#064e3b;border:1px solid #10b981;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:12px;color:#6ee7b7;';
    banner.innerHTML = `<strong>${pending.length} yarım transfer bulundu.</strong> Devam ettirmek için dosyaları tekrar seçin — sistem kaldığı yerden devam eder.
        <button id="btnClearResume" style="margin-left:12px;background:none;border:none;color:#ef4444;cursor:pointer;font-size:11px;">Temizle</button>`;
    fileListQueue.parentElement?.insertBefore(banner, fileListQueue);
    document.getElementById('btnClearResume')?.addEventListener('click', () => {
        pending.forEach(s => cancelResumableUpload(s.resumeId));
        banner.remove();
    });
}

function setStatus(msg, type) {
    if (!statusDiv) return;
    statusDiv.textContent = msg;
    statusDiv.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : 'inherit';
}

function statusIcon(s) {
    if (s === 'success')  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    if (s === 'error')    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    if (s === 'uploading') return `<div style="width:14px;height:14px;border:2px solid #374151;border-top-color:#10b981;border-radius:50%;animation:spin .6s linear infinite;"></div>`;
    return '';
}

function formatSize(b) {
    if (!b) return '0 B';
    const u = ['B','KB','MB','GB'], i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / 1024 ** i).toFixed(1) + ' ' + u[i];
}

function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fileIconSVG(name) {
    const ext = (name||'').split('.').pop().toLowerCase();
    const c = ['jpg','jpeg','png','gif','webp','svg'].includes(ext) ? '#f59e0b' :
              ['mp4','mov','avi','mkv'].includes(ext) ? '#a855f7' :
              ['pdf','doc','docx'].includes(ext) ? '#10b981' : '#6b7280';
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}