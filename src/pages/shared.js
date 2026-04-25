import supabase from '../api/supabase.js';
import { decryptFile } from '../core/cryptoUtils.js';

const sharedFileList = document.getElementById('sharedFileList');
const filesGrid = document.getElementById('filesGrid');
const sharedTable = document.getElementById('sharedTable');
const loadingDiv = document.getElementById('loading');
const statusDiv = document.getElementById('status');
const searchInput = document.getElementById('searchInput');
const sortFilter = document.getElementById('sortFilter');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const groupByTypeCheckbox = document.getElementById('groupByType');
const viewListBtn = document.getElementById('viewList');
const viewGridBtn = document.getElementById('viewGrid');

let allShares = [];
let currentView = 'list';

document.addEventListener('DOMContentLoaded', fetchSharedFiles);

// Event listeners
if (searchInput) searchInput.addEventListener('input', filterAndRenderShares);
if (sortFilter) sortFilter.addEventListener('change', filterAndRenderShares);
if (statusFilter) statusFilter.addEventListener('change', filterAndRenderShares);
if (typeFilter) typeFilter.addEventListener('change', filterAndRenderShares);
if (groupByTypeCheckbox) groupByTypeCheckbox.addEventListener('change', filterAndRenderShares);

if (viewListBtn) {
    viewListBtn.addEventListener('click', () => {
        currentView = 'list';
        viewListBtn.classList.add('active');
        viewGridBtn.classList.remove('active');
        filterAndRenderShares();
    });
}

if (viewGridBtn) {
    viewGridBtn.addEventListener('click', () => {
        currentView = 'grid';
        viewGridBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        filterAndRenderShares();
    });
}

async function fetchSharedFiles() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const { data: shares, error } = await supabase
            .from('file_shares')
            .select(`
                id,
                expires_at,
                downloads_remained,
                encrypted_key_for_receiver,
                created_at,
                files:file_id (
                    id,
                    filename,
                    filepath,
                    encryption_iv,
                    mime_type
                ),
                sender:sender_id (
                    username
                )
            `)
            .eq('receiver_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allShares = shares || [];
        filterAndRenderShares();

    } catch (error) {
        console.error('Hata:', error);
        statusDiv.textContent = 'Hata: ' + error.message;
        statusDiv.style.color = 'red';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function getFileType(filename) {
    if (!filename) return 'other';
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'heic'].includes(ext)) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'rtf'].includes(ext)) return 'document';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive';
    return 'other';
}

function getFileIcon(filename) {
    const type = getFileType(filename);
    const icons = {
        image: '🖼️',
        document: '📄',
        video: '🎥',
        audio: '🎵',
        archive: '🗄️',
        other: '📎'
    };
    return icons[type] || '📎';
}

function getFileTypeName(type) {
    const names = {
        image: 'Görsel',
        document: 'Belge',
        video: 'Video',
        audio: 'Ses',
        archive: 'Arşiv',
        other: 'Diğer'
    };
    return names[type] || 'Diğer';
}

function getFileTypeGroupIcon(type) {
    const icons = {
        image: '🖼️',
        document: '📁',
        video: '🎬',
        audio: '🎶',
        archive: '📦',
        other: '📂'
    };
    return icons[type] || '📂';
}

function isShareExpired(share) {
    if (!share.expires_at) return false;
    return new Date() > new Date(share.expires_at);
}

function isShareActive(share) {
    if (!share.files) return false;
    if (isShareExpired(share)) return false;
    if (share.downloads_remained === 0) return false;
    return true;
}

function filterAndRenderShares() {
    let filtered = [...allShares];
    
    // Search filter
    if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(share => {
                const fileName = share.files?.filename || '';
                const senderName = share.sender?.username || '';
                return fileName.toLowerCase().includes(searchTerm) || 
                       senderName.toLowerCase().includes(searchTerm);
            });
        }
    }
    
    // Status filter
    if (statusFilter) {
        const statusValue = statusFilter.value;
        if (statusValue !== 'all') {
            filtered = filtered.filter(share => {
                if (statusValue === 'active') return isShareActive(share);
                if (statusValue === 'expired') return !isShareActive(share);
                return true;
            });
        }
    }
    
    // Type filter
    if (typeFilter) {
        const typeValue = typeFilter.value;
        if (typeValue !== 'all') {
            filtered = filtered.filter(share => {
                if (!share.files) return false;
                return getFileType(share.files.filename) === typeValue;
            });
        }
    }
    
    // Sort
    if (sortFilter) {
        const sortValue = sortFilter.value;
        filtered.sort((a, b) => {
            switch(sortValue) {
                case 'date-desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'date-asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'name-asc':
                    return (a.files?.filename || '').localeCompare(b.files?.filename || '', 'tr');
                case 'name-desc':
                    return (b.files?.filename || '').localeCompare(a.files?.filename || '', 'tr');
                default:
                    return 0;
            }
        });
    }
    
    const shouldGroup = groupByTypeCheckbox && groupByTypeCheckbox.checked;
    
    if (currentView === 'list') {
        if (sharedTable) sharedTable.style.display = 'table';
        if (filesGrid) filesGrid.style.display = 'none';
        if (shouldGroup) {
            renderGroupedList(filtered);
        } else {
            renderList(filtered);
        }
    } else {
        if (sharedTable) sharedTable.style.display = 'none';
        if (filesGrid) filesGrid.style.display = 'grid';
        if (shouldGroup) {
            renderGroupedGrid(filtered);
        } else {
            renderGrid(filtered);
        }
    }
}

function renderList(shares) {
    sharedFileList.innerHTML = '';

    if (!shares || shares.length === 0) {
        sharedFileList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #6b7280;">Hiç paylaşılan dosya bulunamadı.</td></tr>';
        return;
    }

    shares.forEach(share => {
        const tr = document.createElement('tr');
        const fileName = share.files ? share.files.filename : "[Silinmiş Dosya]";
        const senderName = share.sender ? share.sender.username : "Bilinmeyen";
        const fileType = getFileType(fileName);
        
        let expireText = "Süresiz";
        let isExpired = isShareExpired(share);

        if (share.expires_at) {
            const expireDate = new Date(share.expires_at);
            expireText = expireDate.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        const limitText = share.downloads_remained === -1 ? "Limitsiz" : share.downloads_remained;
        const isLimitReached = share.downloads_remained === 0;
        const isDisabled = !isShareActive(share);

        tr.innerHTML = `
            <td>
                <div class="file-name-cell">
                    <span class="file-icon">${getFileIcon(fileName)}</span>
                    <span class="file-name-text">${fileName}</span>
                </div>
            </td>
            <td>
                <span class="file-type-badge ${fileType}">
                    ${getFileIcon(fileName)} ${getFileTypeName(fileType)}
                </span>
            </td>
            <td>${senderName}</td>
            <td>
                <span class="${isExpired ? 'status-expired' : ''}">${expireText}</span>
                ${isExpired ? '<br><span class="status-badge expired">Süresi Doldu</span>' : ''}
            </td>
            <td class="${isLimitReached ? 'status-expired' : ''}">${limitText}</td>
            <td>
                <button class="btn-download" data-id="${share.id}" ${isDisabled ? 'disabled' : ''}>
                    ${isDisabled ? 'Erişim Yok' : 'İndir'}
                </button>
            </td>
        `;

        if (!isDisabled) {
            tr.querySelector('.btn-download').addEventListener('click', () => handleSharedDownload(share));
        }

        sharedFileList.appendChild(tr);
    });
}

function renderGroupedList(shares) {
    sharedFileList.innerHTML = '';

    if (!shares || shares.length === 0) {
        sharedFileList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #6b7280;">Hiç paylaşılan dosya bulunamadı.</td></tr>';
        return;
    }

    const grouped = {};
    shares.forEach(share => {
        if (!share.files) return;
        const type = getFileType(share.files.filename);
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(share);
    });

    Object.keys(grouped).forEach(type => {
        const groupShares = grouped[type];
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <td colspan="6" style="background: #f9fafb; padding: 12px 16px;">
                <div style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: #111827;">
                    <span style="font-size: 1.3rem;">${getFileTypeGroupIcon(type)}</span>
                    <span>${getFileTypeName(type)}</span>
                    <span style="font-size: 0.85rem; color: #6b7280; font-weight: 500;">(${groupShares.length})</span>
                </div>
            </td>
        `;
        sharedFileList.appendChild(headerRow);

        groupShares.forEach(share => {
            const tr = document.createElement('tr');
            const fileName = share.files.filename;
            const senderName = share.sender ? share.sender.username : "Bilinmeyen";
            
            let expireText = "Süresiz";
            let isExpired = isShareExpired(share);

            if (share.expires_at) {
                const expireDate = new Date(share.expires_at);
                expireText = expireDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            const limitText = share.downloads_remained === -1 ? "Limitsiz" : share.downloads_remained;
            const isLimitReached = share.downloads_remained === 0;
            const isDisabled = !isShareActive(share);

            tr.innerHTML = `
                <td>
                    <div class="file-name-cell">
                        <span class="file-icon">${getFileIcon(fileName)}</span>
                        <span class="file-name-text">${fileName}</span>
                    </div>
                </td>
                <td>
                    <span class="file-type-badge ${type}">
                        ${getFileIcon(fileName)} ${getFileTypeName(type)}
                    </span>
                </td>
                <td>${senderName}</td>
                <td>
                    <span class="${isExpired ? 'status-expired' : ''}">${expireText}</span>
                    ${isExpired ? '<br><span class="status-badge expired">Süresi Doldu</span>' : ''}
                </td>
                <td class="${isLimitReached ? 'status-expired' : ''}">${limitText}</td>
                <td>
                    <button class="btn-download" data-id="${share.id}" ${isDisabled ? 'disabled' : ''}>
                        ${isDisabled ? 'Erişim Yok' : 'İndir'}
                    </button>
                </td>
            `;

            if (!isDisabled) {
                tr.querySelector('.btn-download').addEventListener('click', () => handleSharedDownload(share));
            }

            sharedFileList.appendChild(tr);
        });
    });
}

function renderGrid(shares) {
    if (!filesGrid) return;
    filesGrid.innerHTML = '';

    if (!shares || shares.length === 0) {
        filesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #6b7280;">Hiç paylaşılan dosya bulunamadı.</div>';
        return;
    }

    shares.forEach(share => {
        const fileName = share.files ? share.files.filename : "[Silinmiş Dosya]";
        const senderName = share.sender ? share.sender.username : "Bilinmeyen";
        const fileType = getFileType(fileName);
        
        let expireText = "Süresiz";
        let isExpired = isShareExpired(share);

        if (share.expires_at) {
            const expireDate = new Date(share.expires_at);
            expireText = expireDate.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short'
            });
        }

        const limitText = share.downloads_remained === -1 ? "∞" : share.downloads_remained;
        const isDisabled = !isShareActive(share);

        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
            <div class="file-card-icon">${getFileIcon(fileName)}</div>
            <div class="file-card-name" title="${fileName}">${fileName}</div>
            <div class="file-card-info">
                <div class="file-card-info-row">
                    <span class="file-type-badge ${fileType}">${getFileTypeName(fileType)}</span>
                </div>
                <div class="file-card-info-row">
                    <span>👤 ${senderName}</span>
                </div>
                <div class="file-card-info-row">
                    <span class="${isExpired ? 'status-expired' : ''}">⏰ ${expireText}</span>
                    <span>📊 ${limitText}</span>
                </div>
            </div>
            <div class="file-card-actions">
                <button class="btn-download" data-id="${share.id}" ${isDisabled ? 'disabled' : ''}>
                    ${isDisabled ? 'Erişim Yok' : 'İndir'}
                </button>
            </div>
        `;

        if (!isDisabled) {
            card.querySelector('.btn-download').addEventListener('click', (e) => {
                e.stopPropagation();
                handleSharedDownload(share);
            });
        }

        filesGrid.appendChild(card);
    });
}

function renderGroupedGrid(shares) {
    if (!filesGrid) return;
    filesGrid.innerHTML = '';
    filesGrid.style.display = 'block';
    
    if (!shares || shares.length === 0) {
        filesGrid.innerHTML = '<div style="text-align:center; padding: 40px; color: #6b7280;">Hiç paylaşılan dosya bulunamadı.</div>';
        return;
    }

    const grouped = {};
    shares.forEach(share => {
        if (!share.files) return;
        const type = getFileType(share.files.filename);
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(share);
    });

    Object.keys(grouped).forEach(type => {
        const groupShares = grouped[type];
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'type-group';
        
        const header = document.createElement('div');
        header.className = 'type-group-header';
        header.innerHTML = `
            <span class="type-group-icon">${getFileTypeGroupIcon(type)}</span>
            <span>${getFileTypeName(type)}</span>
            <span class="type-group-count">(${groupShares.length})</span>
        `;
        groupDiv.appendChild(header);
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'files-grid';
        
        groupShares.forEach(share => {
            const fileName = share.files.filename;
            const senderName = share.sender ? share.sender.username : "Bilinmeyen";
            
            let expireText = "Süresiz";
            let isExpired = isShareExpired(share);

            if (share.expires_at) {
                const expireDate = new Date(share.expires_at);
                expireText = expireDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short'
                });
            }

            const limitText = share.downloads_remained === -1 ? "∞" : share.downloads_remained;
            const isDisabled = !isShareActive(share);

            const card = document.createElement('div');
            card.className = 'file-card';
            card.innerHTML = `
                <div class="file-card-icon">${getFileIcon(fileName)}</div>
                <div class="file-card-name" title="${fileName}">${fileName}</div>
                <div class="file-card-info">
                    <div class="file-card-info-row">
                        <span class="file-type-badge ${type}">${getFileTypeName(type)}</span>
                    </div>
                    <div class="file-card-info-row">
                        <span>👤 ${senderName}</span>
                    </div>
                    <div class="file-card-info-row">
                        <span class="${isExpired ? 'status-expired' : ''}">⏰ ${expireText}</span>
                        <span>📊 ${limitText}</span>
                    </div>
                </div>
                <div class="file-card-actions">
                    <button class="btn-download" data-id="${share.id}" ${isDisabled ? 'disabled' : ''}>
                        ${isDisabled ? 'Erişim Yok' : 'İndir'}
                    </button>
                </div>
            `;

            if (!isDisabled) {
                card.querySelector('.btn-download').addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleSharedDownload(share);
                });
            }

            gridContainer.appendChild(card);
        });
        
        groupDiv.appendChild(gridContainer);
        filesGrid.appendChild(groupDiv);
    });
}

function renderSharedFiles(shares) {
    sharedFileList.innerHTML = '';

    if (!shares || shares.length === 0) {
        sharedFileList.innerHTML = '<tr><td colspan="5" style="text-align:center">Sizinle paylaşılan dosya yok.</td></tr>';
        return;
    }

    shares.forEach(share => {
        const tr = document.createElement('tr');

        let expireText = "Süresiz";
        let isExpired = false;

        if (share.expires_at) {
            const expireDate = new Date(share.expires_at);
            expireText = expireDate.toLocaleDateString('tr-TR') + ' ' + expireDate.toLocaleTimeString('tr-TR');
            if (new Date() > expireDate) {
                isExpired = true;
                expireText += " (Süresi Doldu)";
            }
        }

        const limitText = share.downloads_remained === -1 ? "Limitsiz" : share.downloads_remained;
        const isLimitReached = share.downloads_remained === 0;
        const fileName = share.files ? share.files.filename : "[Silinmiş Dosya]";
        const senderName = share.sender ? share.sender.username : "Bilinmeyen";
        const isDisabled = isExpired || isLimitReached || !share.files;
        let statusClass = isDisabled ? 'status-expired' : 'status-active';

        tr.innerHTML = `
            <td>${fileName}</td>
            <td>${senderName}</td>
            <td class="${isExpired ? 'status-expired' : ''}">${expireText}</td>
            <td class="${isLimitReached ? 'status-expired' : ''}">${limitText}</td>
            <td>
                <button class="btn-download" data-id="${share.id}" ${isDisabled ? 'disabled' : ''}>
                    ${isDisabled ? 'Erişim Yok' : 'İndir'}
                </button>
            </td>
        `;

        if (!isDisabled) {
            tr.querySelector('.btn-download').addEventListener('click', () => handleSharedDownload(share));
        }

        sharedFileList.appendChild(tr);
    });
}

async function handleSharedDownload(shareData) {
    const btn = document.querySelector(`button[data-id="${shareData.id}"]`);
    const originalText = btn.textContent;

    try {
        const password = prompt("Paylaşılan dosyayı çözmek için KENDİ giriş şifrenizi girin:");
        if (!password) return;

        btn.textContent = "İndiriliyor...";
        btn.disabled = true;

        const { data: { user } } = await supabase.auth.getUser();

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('encrypted_private_key')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('Profil bilgileri alınamadı. Lütfen tekrar giriş yapın.');
        }

        if (!profile.encrypted_private_key) {
            throw new Error('Şifreleme anahtarınız bulunamadı. Lütfen hesabınızı kontrol edin.');
        }

        const { data: fileBlob, error: dlErr } = await supabase
            .storage
            .from('file_manager')
            .download(shareData.files.filepath);

        if (dlErr) throw dlErr;

        btn.textContent = "Çözülüyor...";

        const mixedMetadata = {
            encryption_key: shareData.encrypted_key_for_receiver,
            encryption_iv: shareData.files.encryption_iv,
            mime_type: shareData.files.mime_type
        };

        const decryptedBlob = await decryptFile(
            fileBlob,
            mixedMetadata,
            profile.encrypted_private_key,
            password
        );

        const url = window.URL.createObjectURL(decryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = shareData.files.filename;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (shareData.downloads_remained > 0) {
            const newRemaining = shareData.downloads_remained - 1;

            const { error: updateError } = await supabase
                .from('file_shares')
                .update({ downloads_remained: newRemaining })
                .eq('id', shareData.id);

            if (!updateError) {
                shareData.downloads_remained = newRemaining;
                await fetchSharedFiles();
            }
        }

        btn.textContent = "Tamamlandı";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error(error);
        alert("İndirme başarısız: " + error.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}