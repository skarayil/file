import supabase from '../api/supabase.js';

const SESSION_LOG_KEY = 'sftp_session_logs';

export function initSessionLog() {
    if (!sessionStorage.getItem(SESSION_LOG_KEY)) {
        sessionStorage.setItem(SESSION_LOG_KEY, JSON.stringify([]));
    }
}

function getClientIP() {
    return 'local';
}

export function addSessionLog(action, details = {}) {
    const logs = JSON.parse(sessionStorage.getItem(SESSION_LOG_KEY) || '[]');
    const entry = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toISOString(),
        action,
        ip: getClientIP(),
        ...details
    };
    logs.unshift(entry);
    if (logs.length > 200) logs.splice(200);
    sessionStorage.setItem(SESSION_LOG_KEY, JSON.stringify(logs));
    return entry;
}

export function getSessionLogs() {
    return JSON.parse(sessionStorage.getItem(SESSION_LOG_KEY) || '[]');
}

export async function persistLog(userId, action, details = {}) {
    const entry = addSessionLog(action, { userId, ...details });

    try {
        await supabase.from('activity_logs').insert({
            user_id: userId,
            action,
            details: JSON.stringify(details),
            ip_address: getClientIP(),
            created_at: entry.timestamp
        });
    } catch (e) {
        console.warn('Log persist error (non-critical):', e.message);
    }

    return entry;
}

export function formatLogEntry(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString('tr-TR');
    const date = new Date(entry.timestamp).toLocaleDateString('tr-TR');
    const ip = entry.ip || '-';
    const user = entry.username || entry.userId?.slice(0, 8) || 'unknown';
    const detail = entry.filename ? ` "${entry.filename}"` : (entry.directory ? ` [${entry.directory}]` : '');
    return `[${date} ${time}] ${ip} - ${user} ${entry.action}${detail}`;
}

export const LOG_ACTIONS = {
    LOGIN: 'USER LOGIN',
    LOGOUT: 'USER LOGOUT',
    UPLOAD: 'PUT',
    DOWNLOAD: 'GET',
    DELETE: 'DELETE',
    MKDIR: 'MKD',
    CD: 'CWD',
    MOVE: 'RNTO',
    SHARE: 'SHARE',
    CONNECT: 'CONNECT',
    ERROR: 'ERROR'
};
