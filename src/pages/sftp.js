import supabase, { signOutUser } from '../api/supabase.js';
import { encryptFileForUpload, generateEncryptedKeys, decryptFile } from '../core/cryptoUtils.js';
import { computeSHA256 } from '../core/checksumUtils.js';
import { uploadInChunks, formatTransferRate } from '../core/chunkUpload.js';
import { initSessionLog, persistLog, getSessionLogs, formatLogEntry, LOG_ACTIONS } from '../core/logger.js';
import { initVFS, listDirectory, createDirectory, createFileNode, moveNode, deleteNode, getBreadcrumb, syncFilesWithVFS, getNode } from '../core/vfs.js';

let currentUser = null;
let currentDirId = 'root';
let selectedRemoteFile = null;
let localQueue = [];
let transferMode = 'binary';
let allRemoteFiles = [];

document.addEventListener('DOMContentLoaded', init);

async function init() {
    initSessionLog();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;

    initVFS(user.id);

    const profile = await getProfile();
    document.getElementById('connUser').textContent = profile?.username || user.email;
    document.getElementById('connStatus').querySelector('.conn-dot').style.background = '#22c55e';
    document.getElementById('connStatusText').textContent = 'Bağlı';

    addLog('sys', LOG_ACTIONS.CONNECT, `Bağlantı kuruldu — ${profile?.username || user.email}`);
    await persistLog(user.id, LOG_ACTIONS.LOGIN, { username: profile?.username });

    await loadRemote();
    setupListeners();
}

async function getProfile() {
    const { data } = await supabase.from('profiles').select('username,public_key,encrypted_private_key').eq('id', currentUser.id).single();
    return data;
}

async function loadRemote() {
    document.getElementById('remoteLoading').style.display = 'flex';
    try {
        const { data: files, error } = await supabase.from('files').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        if (error) throw error;
        allRemoteFiles = files || [];
        syncFilesWithVFS(currentUser.id, allRemoteFiles);
        renderRemote();
    } catch (e) {
        addLog('err', LOG_ACTIONS.ERROR, e.message);
    } finally {
        document.getElementById('remoteLoading').style.display = 'none';
    }
}

function renderRemote() {
    const area = document.getElementById('remoteFileArea');
    const search = document.getElementById('remoteSearch').value.toLowerCase();
    const sort = document.getElementById('remoteSort').value;

    const nodes = listDirectory(currentUser.id, currentDirId);

    const dirs = nodes.filter(n => n.type === 'directory');
    let files = nodes.filter(n => n.type === 'file');

    if (search) files = files.filter(f => f.name.toLowerCase().includes(search));

    files.sort((a, b) => {
        if (sort === 'name-asc') return a.name.localeCompare(b.name);
        if (sort === 'name-desc') return b.name.localeCompare(a.name);
        if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
        if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
        return 0;
    });

    area.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'remote-row-header';
    header.innerHTML = `<span></span><span>Ad</span><span style="text-align:right">Boyut</span><span style="text-align:right">Tarih</span><span style="text-align:right">SHA-256</span>`;
    area.appendChild(header);

    if (currentDirId !== 'root') {
        const parentNode = getNode(currentUser.id, currentDirId);
        const upRow = document.createElement('div');
        upRow.className = 'dir-row';
        upRow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> ..`;
        upRow.addEventListener('click', () => navigateTo(parentNode?.parent_id || 'root'));
        area.appendChild(upRow);
    }

    dirs.forEach(dir => {
        const row = document.createElement('div');
        row.className = 'dir-row';
        row.draggable = true;
        row.dataset.nodeId = dir.id;
        row.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> ${escHtml(dir.name)}/`;
        row.addEventListener('click', () => navigateTo(dir.id));
        row.addEventListener('contextmenu', e => showContextMenu(e, dir));
        setupDragSource(row, dir);
        setupDropTarget(row, dir);
        area.appendChild(row);
    });

    if (dirs.length === 0 && files.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'remote-empty';
        empty.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Bu dizin boş</span>`;
        area.appendChild(empty);
        return;
    }

    files.forEach(node => {
        const record = allRemoteFiles.find(f => f.id === node.file_record_id);
        const row = document.createElement('div');
        row.className = 'remote-row';
        row.dataset.nodeId = node.id;
        row.draggable = true;

        const date = record ? new Date(record.created_at).toLocaleDateString('tr-TR') : '-';
        const size = record?.size ? formatSize(record.size) : '-';
        const checksum = record?.sha256 ? record.sha256.slice(0, 12) + '…' : '—';

        row.innerHTML = `
            <span class="row-icon">${fileIconSVG(node.name)}</span>
            <span class="row-name">${escHtml(node.name)}</span>
            <span class="row-size">${size}</span>
            <span class="row-date">${date}</span>
            <span class="row-checksum" title="${record?.sha256 || 'Checksum yok'}">${checksum}</span>`;

        row.addEventListener('click', () => {
            document.querySelectorAll('.remote-row.selected').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            selectedRemoteFile = { node, record };
        });

        row.addEventListener('dblclick', () => { selectedRemoteFile = { node, record }; handleDownload(); });
        row.addEventListener('contextmenu', e => showContextMenu(e, node, record));
        setupDragSource(row, node);
        area.appendChild(row);
    });

    renderBreadcrumb();
}

function navigateTo(dirId) {
    currentDirId = dirId || 'root';
    selectedRemoteFile = null;
    renderRemote();
    addLog('sys', LOG_ACTIONS.CD, getBreadcrumbPath());
}

function renderBreadcrumb() {
    const bc = document.getElementById('remoteBreadcrumb');
    const crumbs = getBreadcrumb(currentUser.id, currentDirId);
    bc.innerHTML = crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return `<span class="bc-item ${isLast ? 'bc-current' : ''}" data-id="${c.id}">${c.name === '/' ? '/' : escHtml(c.name)}</span>${isLast ? '' : '<span class="bc-sep">/</span>'}`;
    }).join('');
    bc.querySelectorAll('.bc-item:not(.bc-current)').forEach(el => {
        el.addEventListener('click', () => navigateTo(el.dataset.id));
    });
}

function getBreadcrumbPath() {
    return getBreadcrumb(currentUser.id, currentDirId).map(c => c.name).join('/');
}

// ─── LOCAL PANEL ─────────────────────────────────

function handleLocalFiles(files) {
    files.forEach(file => {
        if (!localQueue.some(q => q.file.name === file.name && q.file.size === file.size)) {
            localQueue.push({ file, status: 'pending', progress: 0, message: '' });
        }
    });
    renderLocalPanel();
}

function renderLocalPanel() {
    const dropZone = document.getElementById('localDropZone');
    const list = document.getElementById('localFileList');
    if (localQueue.length === 0) {
        dropZone.style.display = 'flex';
        list.style.display = 'none';
        return;
    }
    dropZone.style.display = 'none';
    list.style.display = 'block';
    list.innerHTML = '';
    localQueue.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'local-file-item';
        div.innerHTML = `
            <span class="lf-icon">${fileIconSVG(item.file.name)}</span>
            <span class="lf-name">${escHtml(item.file.name)}</span>
            <span class="lf-size">${formatSize(item.file.size)}</span>
            <span class="lf-status ${item.status}"></span>
            <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:16px;line-height:1;" data-i="${i}" class="btn-rm-local">&times;</button>`;
        list.appendChild(div);
    });
    list.querySelectorAll('.btn-rm-local').forEach(btn => {
        btn.addEventListener('click', () => {
            localQueue.splice(parseInt(btn.dataset.i), 1);
            renderLocalPanel();
        });
    });
}

// ─── UPLOAD ──────────────────────────────────────

async function handleUpload() {
    const pending = localQueue.filter(i => i.status === 'pending' || i.status === 'error');
    if (pending.length === 0) { addLog('sys', 'INFO', 'Kuyrukta bekleyen dosya yok'); return; }

    const profile = await getProfile();
    if (!profile?.public_key) { addLog('err', LOG_ACTIONS.ERROR, 'Şifreleme anahtarı eksik'); return; }

    for (let i = 0; i < localQueue.length; i++) {
        const item = localQueue[i];
        if (item.status !== 'pending' && item.status !== 'error') continue;

        item.status = 'uploading';
        item.message = 'SHA-256 hesaplanıyor...';
        renderLocalPanel();
        addQueueItem(item, i);

        try {
            const checksum = await computeSHA256(item.file);
            item.message = 'Şifreleniyor...';
            updateQueueItem(i, 'uploading', 'Şifreleniyor...', 20);

            const enc = await encryptFileForUpload(item.file, profile.public_key);

            item.message = 'Yükleniyor...';
            updateQueueItem(i, 'uploading', 'Yükleniyor...', 40);

            const safeName = sanitize(item.file.name);
            const storagePath = `${currentUser.id}/${Date.now()}_${safeName}`;

            await uploadInChunks(supabase, enc.encryptedBlob, storagePath, (pct) => {
                updateQueueItem(i, 'uploading', `${pct}%`, 40 + pct * 0.5);
            });

            const { data: dbData, error: dbErr } = await supabase.from('files').insert({
                user_id: currentUser.id,
                filepath: storagePath,
                filename: item.file.name,
                mime_type: item.file.type || 'application/octet-stream',
                encryption_iv: enc.iv,
                encryption_key: enc.encryptedAesKey,
                size: item.file.size,
                sha256: checksum,
                transfer_mode: transferMode,
                parent_directory: currentDirId
            }).select().single();

            if (dbErr) throw dbErr;

            createFileNode(currentUser.id, dbData, currentDirId);
            allRemoteFiles.push(dbData);

            item.status = 'success';
            item.message = 'Tamamlandı';
            updateQueueItem(i, 'success', `OK — ${formatSize(item.file.size)}`, 100);
            addLog('put', LOG_ACTIONS.UPLOAD, `${item.file.name} (${formatSize(item.file.size)}) [${transferMode.toUpperCase()}]`);
            await persistLog(currentUser.id, LOG_ACTIONS.UPLOAD, { filename: item.file.name, size: item.file.size, sha256: checksum });

        } catch (err) {
            item.status = 'error';
            item.message = err.message;
            updateQueueItem(i, 'error', err.message, 0);
            addLog('err', LOG_ACTIONS.ERROR, err.message);
        }
        renderLocalPanel();
    }
    renderRemote();
}

// ─── DOWNLOAD ────────────────────────────────────

async function handleDownload() {
    if (!selectedRemoteFile?.record) { addLog('err', LOG_ACTIONS.ERROR, 'Önce bir dosya seçin'); return; }
    const { record } = selectedRemoteFile;

    requestPassword(`"${record.filename}" dosyasını indirmek için giriş şifrenizi girin`, async (password) => {
        if (!password) return;
        try {
            addLog('get', LOG_ACTIONS.DOWNLOAD, record.filename);
            const profile = await getProfile();
            const { data: blob, error } = await supabase.storage.from('file_manager').download(record.filepath);
            if (error) throw error;

            const decrypted = await decryptFile(blob, record, profile.encrypted_private_key, password);
            const url = URL.createObjectURL(decrypted);
            const a = document.createElement('a');
            a.href = url; a.download = record.filename;
            document.body.appendChild(a); a.click();
            URL.revokeObjectURL(url); a.remove();

            await persistLog(currentUser.id, LOG_ACTIONS.DOWNLOAD, { filename: record.filename });
        } catch (e) {
            addLog('err', LOG_ACTIONS.ERROR, e.message);
        }
    });
}

// ─── DELETE ──────────────────────────────────────

async function handleDelete() {
    if (!selectedRemoteFile) { addLog('err', LOG_ACTIONS.ERROR, 'Önce bir dosya seçin'); return; }
    const { node, record } = selectedRemoteFile;
    if (!confirm(`"${node.name}" silinsin mi?`)) return;

    try {
        if (record) {
            await supabase.storage.from('file_manager').remove([record.filepath]);
            await supabase.from('files').delete().eq('id', record.id);
            allRemoteFiles = allRemoteFiles.filter(f => f.id !== record.id);
        }
        deleteNode(currentUser.id, node.id);
        selectedRemoteFile = null;
        addLog('del', LOG_ACTIONS.DELETE, node.name);
        await persistLog(currentUser.id, LOG_ACTIONS.DELETE, { filename: node.name });
        renderRemote();
    } catch (e) {
        addLog('err', LOG_ACTIONS.ERROR, e.message);
    }
}

// ─── MKDIR ───────────────────────────────────────

function openMkdir() {
    document.getElementById('mkdirModal').style.display = 'flex';
    document.getElementById('mkdirName').focus();
}

function confirmMkdir() {
    const name = document.getElementById('mkdirName').value.trim();
    if (!name) return;
    try {
        createDirectory(currentUser.id, name, currentDirId);
        addLog('sys', LOG_ACTIONS.MKDIR, name);
        document.getElementById('mkdirModal').style.display = 'none';
        document.getElementById('mkdirName').value = '';
        renderRemote();
    } catch (e) {
        addLog('err', LOG_ACTIONS.ERROR, e.message);
    }
}

// ─── QUEUE UI ────────────────────────────────────

function addQueueItem(item, index) {
    const list = document.getElementById('queueList');
    const empty = list.querySelector('.queue-empty');
    if (empty) empty.remove();

    const div = document.createElement('div');
    div.className = 'queue-item qi-pending';
    div.id = `qi-${index}`;
    div.innerHTML = `
        <span class="qi-icon">📄</span>
        <span class="qi-name">${escHtml(item.file.name)}</span>
        <span class="qi-size">${formatSize(item.file.size)}</span>
        <div class="qi-progress-bar"><div class="qi-progress-fill" style="width:0%"></div></div>
        <span class="qi-status st-pending">Bekliyor</span>`;
    list.appendChild(div);
    updateQueueCount();
}

function updateQueueItem(index, status, msg, pct) {
    const div = document.getElementById(`qi-${index}`);
    if (!div) return;
    div.className = `queue-item qi-${status}`;
    div.querySelector('.qi-status').className = `qi-status st-${status}`;
    div.querySelector('.qi-status').textContent = msg;
    div.querySelector('.qi-progress-fill').style.width = pct + '%';
    updateQueueCount();
}

function updateQueueCount() {
    const count = document.getElementById('queueList').querySelectorAll('.queue-item').length;
    document.getElementById('queueCount').textContent = count;
}

// ─── SESSION LOG UI ───────────────────────────────

function addLog(type, action, detail) {
    const list = document.getElementById('logList');
    const empty = list.querySelector('.log-empty');
    if (empty) empty.remove();

    const now = new Date().toLocaleTimeString('tr-TR');
    const line = document.createElement('div');
    const cls = { put:'log-put', get:'log-get', del:'log-del', err:'log-err', auth:'log-auth', sys:'log-sys' }[type] || 'log-sys';
    line.className = `log-line ${cls}`;
    line.innerHTML = `<span class="log-ts">${now}</span><span class="log-cmd">${action}</span>${escHtml(detail)}`;
    list.insertBefore(line, list.firstChild);
}

// ─── DRAG & DROP ──────────────────────────────────

function setupDragSource(el, node) {
    el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('nodeId', node.id);
        e.dataTransfer.effectAllowed = 'move';
    });
}

function setupDropTarget(el, targetNode) {
    el.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; el.style.background = 'var(--accent-glow)'; });
    el.addEventListener('dragleave', () => { el.style.background = ''; });
    el.addEventListener('drop', e => {
        e.preventDefault();
        el.style.background = '';
        const srcId = e.dataTransfer.getData('nodeId');
        if (srcId && srcId !== targetNode.id) {
            try {
                const moved = moveNode(currentUser.id, srcId, targetNode.id);
                addLog('sys', LOG_ACTIONS.MOVE, `${moved.name} → ${targetNode.name}`);
                persistLog(currentUser.id, LOG_ACTIONS.MOVE, { filename: moved.name, directory: targetNode.name });
                renderRemote();
            } catch (err) { addLog('err', LOG_ACTIONS.ERROR, err.message); }
        }
    });
}

// ─── CONTEXT MENU ─────────────────────────────────

function showContextMenu(e, node, record) {
    e.preventDefault();
    removeContextMenu();
    selectedRemoteFile = record ? { node, record } : { node, record: null };

    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    if (node.type === 'file') {
        addCtxItem(menu, '⬇ İndir (GET)', () => handleDownload());
        addCtxItem(menu, '🔒 Checksum Göster', () => showChecksum(node, record));
        addCtxDiv(menu);
        addCtxItem(menu, '🗑 Sil', () => handleDelete(), true);
    } else {
        addCtxItem(menu, '📂 Aç', () => navigateTo(node.id));
        addCtxDiv(menu);
        addCtxItem(menu, '🗑 Sil', () => handleDelete(), true);
    }

    document.body.appendChild(menu);
    document.addEventListener('click', removeContextMenu, { once: true });
}

function addCtxItem(menu, label, fn, danger = false) {
    const item = document.createElement('div');
    item.className = `ctx-item${danger ? ' ctx-danger' : ''}`;
    item.textContent = label;
    item.addEventListener('click', () => { removeContextMenu(); fn(); });
    menu.appendChild(item);
}

function addCtxDiv(menu) {
    const sep = document.createElement('div');
    sep.className = 'ctx-sep';
    menu.appendChild(sep);
}

function removeContextMenu() {
    document.querySelectorAll('.ctx-menu').forEach(m => m.remove());
}

// ─── CHECKSUM MODAL ───────────────────────────────

function showChecksum(node, record) {
    document.getElementById('checksumModal').style.display = 'flex';
    document.getElementById('checksumFilename').textContent = node.name;
    document.getElementById('checksumValue').textContent = record?.sha256 || '— (Bu dosya için checksum kaydedilmemiş)';
    document.getElementById('checksumStatus').textContent = record?.sha256 ? '✓ SHA-256 mevcut' : '';
    document.getElementById('checksumStatus').className = 'checksum-status ' + (record?.sha256 ? 'valid' : '');
}

// ─── PASSWORD MODAL ───────────────────────────────

function requestPassword(desc, callback) {
    document.getElementById('pwdModalDesc').textContent = desc;
    document.getElementById('pwdModal').style.display = 'flex';
    document.getElementById('pwdModalInput').value = '';
    document.getElementById('pwdModalInput').focus();

    const confirm = document.getElementById('pwdModalConfirm');
    const cancel = document.getElementById('pwdModalCancel');
    const close = document.getElementById('pwdModalClose');

    const done = (val) => {
        document.getElementById('pwdModal').style.display = 'none';
        confirm.replaceWith(confirm.cloneNode(true));
        cancel.replaceWith(cancel.cloneNode(true));
        close.replaceWith(close.cloneNode(true));
        callback(val);
    };

    document.getElementById('pwdModalConfirm').addEventListener('click', () => done(document.getElementById('pwdModalInput').value));
    document.getElementById('pwdModalCancel').addEventListener('click', () => done(null));
    document.getElementById('pwdModalClose').addEventListener('click', () => done(null));
}

// ─── LISTENERS ────────────────────────────────────

function setupListeners() {
    document.getElementById('btnUpload').addEventListener('click', handleUpload);
    document.getElementById('btnDownload').addEventListener('click', handleDownload);
    document.getElementById('btnDelete').addEventListener('click', handleDelete);
    document.getElementById('btnNewFolder').addEventListener('click', openMkdir);
    document.getElementById('btnRefresh').addEventListener('click', loadRemote);
    document.getElementById('btnLogout').addEventListener('click', signOutUser);

    document.getElementById('mkdirConfirm').addEventListener('click', confirmMkdir);
    document.getElementById('mkdirCancel').addEventListener('click', () => { document.getElementById('mkdirModal').style.display = 'none'; });
    document.getElementById('mkdirClose').addEventListener('click', () => { document.getElementById('mkdirModal').style.display = 'none'; });
    document.getElementById('mkdirName').addEventListener('keydown', e => { if (e.key === 'Enter') confirmMkdir(); });

    document.getElementById('checksumClose').addEventListener('click', () => { document.getElementById('checksumModal').style.display = 'none'; });
    document.getElementById('checksumClose2').addEventListener('click', () => { document.getElementById('checksumModal').style.display = 'none'; });

    document.getElementById('remoteSearch').addEventListener('input', renderRemote);
    document.getElementById('remoteSort').addEventListener('change', renderRemote);

    document.getElementById('btnClearQueue').addEventListener('click', () => {
        document.getElementById('queueList').innerHTML = '<div class="queue-empty">Kuyruk boş</div>';
        updateQueueCount();
    });

    document.getElementById('btnClearLog').addEventListener('click', () => {
        document.getElementById('logList').innerHTML = '<div class="log-empty">Henüz işlem yok...</div>';
    });

    document.getElementById('modeBinary').addEventListener('click', () => setMode('binary'));
    document.getElementById('modeAscii').addEventListener('click', () => setMode('ascii'));

    const dropZone = document.getElementById('localDropZone');
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleLocalFiles(Array.from(e.dataTransfer.files));
    });

    document.getElementById('filePickerInput').addEventListener('change', e => {
        if (e.target.files.length) { handleLocalFiles(Array.from(e.target.files)); e.target.value = ''; }
    });
}

function setMode(mode) {
    transferMode = mode;
    document.getElementById('modeBinary').classList.toggle('active', mode === 'binary');
    document.getElementById('modeAscii').classList.toggle('active', mode === 'ascii');
    addLog('sys', 'MODE', mode.toUpperCase());
}

// ─── UTILS ────────────────────────────────────────

function formatSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function sanitize(name) {
    const map = { 'ç':'c','Ç':'C','ğ':'g','Ğ':'G','ş':'s','Ş':'S','ü':'u','Ü':'U','ı':'i','İ':'I','ö':'o','Ö':'O' };
    return name.replace(/[çÇğĞşŞüÜıİöÖ]/g, s => map[s]).replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fileIconSVG(name) {
    const ext = name.split('.').pop().toLowerCase();
    const img = ['jpg','jpeg','png','gif','svg','webp','heic'].includes(ext);
    const vid = ['mp4','mov','avi','mkv'].includes(ext);
    const aud = ['mp3','wav','ogg','flac'].includes(ext);
    const arc = ['zip','rar','7z','tar','gz'].includes(ext);
    const col = img ? '#f59e0b' : vid ? '#8b5cf6' : aud ? '#22c55e' : arc ? '#ef4444' : '#6b7280';
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}
