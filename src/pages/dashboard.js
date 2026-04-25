import supabase from '../api/supabase.js';
import { listDirectory, getBreadcrumb, initVFS } from '../core/vfs.js';
import { getSessionLogs, initSessionLog, addSessionLog, LOG_ACTIONS } from '../core/logger.js';

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
    document.getElementById('currentDate').textContent =
        new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }

    initSessionLog();
    initVFS(user.id);

    await Promise.all([
        loadProfile(user.id),
        loadStats(user.id),
        loadRecentFiles(user.id),
        loadVfsTree(user.id),
    ]);

    renderAuditLog();
    renderTransferQueue();

    document.getElementById('btnClearAudit')?.addEventListener('click', () => {
        sessionStorage.removeItem('sftp_session_logs');
        initSessionLog();
        document.getElementById('auditLog').innerHTML = '<div class="empty-state">Log temizlendi.</div>';
    });
}

async function loadProfile(userId) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
    const name = profile?.username || 'Kullanıcı';
    const initial = name.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = initial;
}

async function loadStats(userId) {
    try {
        const [filesRes, sentRes, receivedRes] = await Promise.all([
            supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('file_shares').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
            supabase.from('file_shares').select('*', { count: 'exact', head: true }).eq('receiver_id', userId),
        ]);

        if (!filesRes.error)    animateCount('totalFiles',   0, filesRes.count    || 0, 900);
        if (!sentRes.error)     animateCount('sharedByMe',   0, sentRes.count     || 0, 900);
        if (!receivedRes.error) animateCount('sharedWithMe', 0, receivedRes.count || 0, 900);
    } catch (e) {
        console.error('Stats error:', e);
    }
}

async function loadRecentFiles(userId) {
    const tbody = document.getElementById('recentFilesTable');
    try {
        const { data: files, error } = await supabase
            .from('files').select('filename, created_at, mime_type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!files || files.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Henüz dosya yüklenmedi.</td></tr>';
            renderChart([]);
            document.getElementById('lastActivity').textContent = '—';
            return;
        }

        document.getElementById('lastActivity').textContent = timeAgo(new Date(files[0].created_at));

        tbody.innerHTML = '';
        files.forEach(f => {
            const tr = document.createElement('tr');
            const ext = (f.mime_type || '').split('/')[1]?.toUpperCase() || 'FILE';
            tr.innerHTML = `
                <td style="display:flex;align-items:center;gap:8px;">
                    ${fileIconSVG(f.filename)}
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;">${escHtml(f.filename)}</span>
                </td>
                <td>${new Date(f.created_at).toLocaleDateString('tr-TR')}</td>
                <td><span class="file-type-chip">${ext}</span></td>`;
            tbody.appendChild(tr);
        });

        const { data: all } = await supabase.from('files').select('mime_type').eq('user_id', userId).limit(200);
        renderChart(all || []);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:var(--red);padding:12px;">Hata: ${escHtml(e.message)}</td></tr>`;
    }
}

async function loadVfsTree(userId) {
    const tree = document.getElementById('vfsTree');
    try {
        const rootNodes = listDirectory(userId, 'root');

        if (rootNodes.length === 0) {
            tree.innerHTML = '<div class="empty-state">Klasör yok — S-FTP\'den oluşturun</div>';
            return;
        }

        tree.innerHTML = '';
        const rootLabel = document.createElement('div');
        rootLabel.className = 'vfs-node is-dir';
        rootLabel.innerHTML = `${folderIcon()} / (kök)`;
        tree.appendChild(rootLabel);

        rootNodes.forEach(node => {
            const el = document.createElement('div');
            el.className = `vfs-node node-indent ${node.type === 'directory' ? 'is-dir' : ''}`;
            el.style.paddingLeft = '20px';
            el.innerHTML = node.type === 'directory'
                ? `${folderIcon()} ${escHtml(node.name)}/`
                : `${fileIconSVG(node.name)} ${escHtml(node.name)}`;
            tree.appendChild(el);

            if (node.type === 'directory') {
                const children = listDirectory(userId, node.id);
                children.slice(0, 5).forEach(child => {
                    const ch = document.createElement('div');
                    ch.className = `vfs-node ${child.type === 'directory' ? 'is-dir' : ''}`;
                    ch.style.paddingLeft = '36px';
                    ch.innerHTML = child.type === 'directory'
                        ? `${folderIcon()} ${escHtml(child.name)}/`
                        : `${fileIconSVG(child.name)} ${escHtml(child.name)}`;
                    tree.appendChild(ch);
                });
                if (children.length > 5) {
                    const more = document.createElement('div');
                    more.className = 'vfs-node';
                    more.style.cssText = 'padding-left:36px;color:var(--text-dim);font-size:11px;';
                    more.textContent = `+${children.length - 5} daha...`;
                    tree.appendChild(more);
                }
            }
        });
    } catch (e) {
        tree.innerHTML = `<div class="empty-state" style="color:var(--red)">VFS hatası</div>`;
    }
}

function renderAuditLog() {
    const container = document.getElementById('auditLog');
    const logs = getSessionLogs();

    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="empty-state">Henüz işlem kaydı yok.</div>';
        return;
    }

    container.innerHTML = '';
    logs.slice(0, 80).forEach(entry => {
        const div = document.createElement('div');
        div.className = 'audit-entry';

        const time = new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const cmdClass = resolveLogClass(entry.action);
        const detail   = entry.filename || entry.directory || entry.detail || '';

        div.innerHTML = `
            <span class="audit-ts">${time}</span>
            <span class="audit-cmd ${cmdClass}">${escHtml(entry.action)}</span>
            <span class="audit-detail">${escHtml(detail)}</span>`;
        container.appendChild(div);
    });
}

function renderTransferQueue() {
    const container = document.getElementById('queueList');
    const badge = document.getElementById('queueBadge');

    const raw = sessionStorage.getItem('sftp_session_logs');
    const logs = raw ? JSON.parse(raw) : [];
    const transfers = logs.filter(l => [LOG_ACTIONS.UPLOAD, LOG_ACTIONS.DOWNLOAD].includes(l.action));

    badge.textContent = transfers.length;

    if (transfers.length === 0) {
        container.innerHTML = '<div class="empty-state">Aktif transfer yok</div>';
        return;
    }

    container.innerHTML = '';
    transfers.slice(0, 20).forEach(entry => {
        const div = document.createElement('div');
        const isUp = entry.action === LOG_ACTIONS.UPLOAD;
        div.className = `queue-item qi-success`;
        div.innerHTML = `
            <span style="color:${isUp ? '#60a5fa' : '#34d399'};font-size:13px;">${isUp ? '↑' : '↓'}</span>
            <span class="qi-name">${escHtml(entry.filename || entry.action)}</span>
            <span class="qi-size">${entry.size ? formatSize(entry.size) : ''}</span>
            <div class="qi-bar"><div class="qi-fill" style="width:100%"></div></div>`;
        container.appendChild(div);
    });
}

function renderChart(files) {
    const ctx = document.getElementById('fileTypeChart')?.getContext('2d');
    if (!ctx) return;

    const counts = {};
    files.forEach(f => {
        const type = (f.mime_type || 'other').split('/')[1]?.toUpperCase() || 'OTHER';
        counts[type] = (counts[type] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data   = Object.values(counts);

    if (labels.length === 0) { labels.push('Veri Yok'); data.push(1); }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#3b82f6','#22c55e','#a855f7','#f97316','#ef4444','#eab308','#06b6d4'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#64748b', font: { size: 11 }, boxWidth: 10, padding: 12 }
                }
            }
        }
    });
}

function resolveLogClass(action) {
    if (action === LOG_ACTIONS.UPLOAD)   return 'cmd-put';
    if (action === LOG_ACTIONS.DOWNLOAD) return 'cmd-get';
    if (action === LOG_ACTIONS.DELETE)   return 'cmd-del';
    if ([LOG_ACTIONS.LOGIN, LOG_ACTIONS.LOGOUT].includes(action)) return 'cmd-auth';
    if (action === LOG_ACTIONS.ERROR)    return 'cmd-err';
    return 'cmd-sys';
}

function animateCount(id, from, to, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = null;
    const step = ts => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        el.textContent = Math.floor(progress * (to - from) + from);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - date) / 1000);
    if (s < 60)    return 'Az önce';
    if (s < 3600)  return Math.floor(s / 60) + ' dk önce';
    if (s < 86400) return Math.floor(s / 3600) + ' sa önce';
    return Math.floor(s / 86400) + ' gün önce';
}

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 ** 2)   return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 ** 3)   return (bytes / 1024 ** 2).toFixed(1) + ' MB';
    return (bytes / 1024 ** 3).toFixed(2) + ' GB';
}

function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function folderIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function fileIconSVG(name) {
    const ext = (name || '').split('.').pop().toLowerCase();
    const imgExts = ['jpg','jpeg','png','gif','svg','webp'];
    const col = imgExts.includes(ext) ? '#f59e0b' : '#64748b';
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}