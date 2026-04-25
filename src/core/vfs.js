const VFS_KEY = 'sftp_vfs';

export function initVFS(userId) {
    const key = `${VFS_KEY}_${userId}`;
    if (!localStorage.getItem(key)) {
        const root = {
            id: 'root',
            name: '/',
            type: 'directory',
            parent_id: null,
            created_at: new Date().toISOString(),
            children: []
        };
        localStorage.setItem(key, JSON.stringify({ nodes: [root] }));
    }
}

function getVFS(userId) {
    const key = `${VFS_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { nodes: [] };
}

function saveVFS(userId, vfs) {
    localStorage.setItem(`${VFS_KEY}_${userId}`, JSON.stringify(vfs));
}

export function getNode(userId, nodeId) {
    const vfs = getVFS(userId);
    return vfs.nodes.find(n => n.id === nodeId) || null;
}

export function listDirectory(userId, parentId = 'root') {
    const vfs = getVFS(userId);
    return vfs.nodes.filter(n => n.parent_id === parentId);
}

export function createDirectory(userId, name, parentId = 'root') {
    const vfs = getVFS(userId);
    const existing = vfs.nodes.find(n => n.parent_id === parentId && n.name === name && n.type === 'directory');
    if (existing) throw new Error(`Dizin zaten mevcut: ${name}`);

    const newDir = {
        id: 'dir-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        name,
        type: 'directory',
        parent_id: parentId,
        created_at: new Date().toISOString()
    };
    vfs.nodes.push(newDir);
    saveVFS(userId, vfs);
    return newDir;
}

export function createFileNode(userId, fileRecord, parentId = 'root') {
    const vfs = getVFS(userId);
    const fileNode = {
        id: 'file-' + fileRecord.id,
        name: fileRecord.filename,
        type: 'file',
        parent_id: parentId,
        file_record_id: fileRecord.id,
        created_at: fileRecord.created_at || new Date().toISOString(),
        size: fileRecord.size || 0,
        mime_type: fileRecord.mime_type
    };
    const exists = vfs.nodes.find(n => n.id === fileNode.id);
    if (!exists) {
        vfs.nodes.push(fileNode);
        saveVFS(userId, vfs);
    }
    return fileNode;
}

export function moveNode(userId, nodeId, newParentId) {
    const vfs = getVFS(userId);
    const node = vfs.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error('Node bulunamadı');
    if (isDescendant(vfs, newParentId, nodeId)) throw new Error('Döngüsel taşıma yapılamaz');
    node.parent_id = newParentId;
    saveVFS(userId, vfs);
    return node;
}

export function deleteNode(userId, nodeId) {
    const vfs = getVFS(userId);
    const descendants = getAllDescendants(vfs, nodeId);
    const idsToRemove = new Set([nodeId, ...descendants.map(n => n.id)]);
    const removed = vfs.nodes.filter(n => idsToRemove.has(n.id));
    vfs.nodes = vfs.nodes.filter(n => !idsToRemove.has(n.id));
    saveVFS(userId, vfs);
    return removed;
}

export function getBreadcrumb(userId, nodeId) {
    const vfs = getVFS(userId);
    const path = [];
    let current = vfs.nodes.find(n => n.id === nodeId);
    while (current) {
        path.unshift(current);
        if (!current.parent_id) break;
        current = vfs.nodes.find(n => n.id === current.parent_id);
    }
    return path;
}

function isDescendant(vfs, targetId, ancestorId) {
    let node = vfs.nodes.find(n => n.id === targetId);
    while (node) {
        if (node.id === ancestorId) return true;
        node = vfs.nodes.find(n => n.id === node.parent_id);
    }
    return false;
}

function getAllDescendants(vfs, nodeId) {
    const result = [];
    const children = vfs.nodes.filter(n => n.parent_id === nodeId);
    for (const child of children) {
        result.push(child);
        result.push(...getAllDescendants(vfs, child.id));
    }
    return result;
}

export function syncFilesWithVFS(userId, files) {
    initVFS(userId);
    const vfs = getVFS(userId);
    const existingFileNodeIds = new Set(vfs.nodes.filter(n => n.type === 'file').map(n => n.file_record_id));
    for (const file of files) {
        if (!existingFileNodeIds.has(file.id)) {
            createFileNode(userId, file, 'root');
        }
    }
}
