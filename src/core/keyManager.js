const _store = new Map();

export function setSessionKey(userId, keyData) {
    _store.set(userId, { ...keyData, ts: Date.now() });
}

export function getSessionKey(userId) {
    const entry = _store.get(userId);
    if (!entry) return null;
    if (Date.now() - entry.ts > 8 * 60 * 60 * 1000) {
        _store.delete(userId);
        return null;
    }
    return entry;
}

export function clearSessionKey(userId) {
    _store.delete(userId);
    sessionStorage.removeItem('temp_session_pwd');
}

export function hasSessionKey(userId) {
    return !!getSessionKey(userId);
}

export function refreshSessionKey(userId) {
    const entry = _store.get(userId);
    if (entry) entry.ts = Date.now();
}
