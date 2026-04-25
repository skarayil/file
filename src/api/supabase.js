function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

class MockStorage {
    constructor() { this.store = {}; }
    
    from(bucket) {
        return {
            upload: async (path, fileBlob) => {
                await delay(200);
                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onload = () => {
                        let b = JSON.parse(localStorage.getItem('mock_storage_' + bucket) || '{}');
                        b[path] = reader.result;
                        localStorage.setItem('mock_storage_' + bucket, JSON.stringify(b));
                        resolve({ data: { path }, error: null });
                    };
                    reader.readAsDataURL(fileBlob);
                });
            },
            download: async (path) => {
                await delay(100);
                let b = JSON.parse(localStorage.getItem('mock_storage_' + bucket) || '{}');
                const dataUrl = b[path];
                if (!dataUrl) return { data: null, error: new Error('File not found') };
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                return { data: blob, error: null };
            },
            remove: async (paths) => {
                await delay(100);
                let b = JSON.parse(localStorage.getItem('mock_storage_' + bucket) || '{}');
                paths.forEach(p => delete b[p]);
                localStorage.setItem('mock_storage_' + bucket, JSON.stringify(b));
                return { data: true, error: null };
            }
        };
    }
}

class MockQuery {
    constructor(table, action, payload) {
        this.table = table;
        this.action = action; // 'select', 'insert', 'update', 'delete'
        this.payload = payload;
        this.filters = [];
        this.orderRule = null;
        this.limitRule = null;
        this.isSingle = false;
        this.countData = false;
    }
    
    eq(col, val) { this.filters.push(row => row[col] === val); return this; }
    order(col, opt) { this.orderRule = { col, asc: opt?.ascending !== false }; return this; }
    limit(n) { this.limitRule = n; return this; }
    single() { this.isSingle = true; return this; }
    
    async then(resolve) {
        await delay(50);
        let tableData = JSON.parse(localStorage.getItem('mock_db_' + this.table) || '[]');
        
        if (this.action === 'insert') {
            const newItem = { id: Date.now().toString(), created_at: new Date().toISOString(), ...this.payload };
            tableData.push(newItem);
            localStorage.setItem('mock_db_' + this.table, JSON.stringify(tableData));
            resolve({ data: [newItem], error: null });
            return;
        }
        
        if (this.action === 'delete') {
            const beforeLen = tableData.length;
            tableData = tableData.filter(row => !this.filters.every(f => f(row)));
            localStorage.setItem('mock_db_' + this.table, JSON.stringify(tableData));
            resolve({ data: null, error: null });
            return;
        }
        
        if (this.action === 'update') {
            tableData = tableData.map(row => {
                if (this.filters.every(f => f(row))) {
                    return { ...row, ...this.payload };
                }
                return row;
            });
            localStorage.setItem('mock_db_' + this.table, JSON.stringify(tableData));
            resolve({ data: null, error: null });
            return;
        }
        
        // select
        let result = tableData.filter(row => this.filters.every(f => f(row)));
        
        if (this.orderRule) {
            result.sort((a, b) => {
                const va = a[this.orderRule.col]; const vb = b[this.orderRule.col];
                if (va < vb) return this.orderRule.asc ? -1 : 1;
                if (va > vb) return this.orderRule.asc ? 1 : -1;
                return 0;
            });
        }
        
        if (this.countData) {
            resolve({ data: [], count: result.length, error: null });
            return;
        }
        
        if (this.limitRule) result = result.slice(0, this.limitRule);
        
        if (this.isSingle) {
            resolve({ data: result.length ? result[0] : null, error: result.length ? null : new Error('No rows') });
            return;
        }
        
        resolve({ data: result, error: null });
    }
}

const mockSupabase = {
    auth: {
        async signUp({ email, password, options }) {
            await delay(300);
            const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            if (users.find(u => u.email === email)) return { error: new Error('Email exists') };
            const user = { id: Date.now().toString(), email, password };
            users.push(user);
            localStorage.setItem('mock_users', JSON.stringify(users));
            
            const username = options?.data?.username || 'User';
            let profiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
            profiles.push({ id: user.id, username, public_key: null, encrypted_private_key: null });
            localStorage.setItem('mock_db_profiles', JSON.stringify(profiles));
            
            localStorage.setItem('mock_session', JSON.stringify(user));
            return { data: { user, session: {} }, error: null };
        },
        async signInWithPassword({ email, password }) {
            await delay(300);
            const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) return { data: null, error: new Error('Geçersiz kimlik bilgileri') };
            localStorage.setItem('mock_session', JSON.stringify(user));
            return { data: { user, session: {} }, error: null };
        },
        async getUser() {
            const u = localStorage.getItem('mock_session');
            return { data: { user: u ? JSON.parse(u) : null }, error: null };
        },
        async signOut() {
            localStorage.removeItem('mock_session');
            return { error: null };
        },
        mfa: {
            async challenge() { return { data: { id: 'mfa123' }, error: null }; },
            async verify() { return { data: {}, error: null }; },
            async listFactors() { return { data: { totp: [] }, error: null }; },
            async enroll() { return { data: { totp: { qr_code: '' }, id: 'mfa123' }, error: null }; }
        }
    },
    from(table) {
        return {
            select: (cols, opts) => {
                const q = new MockQuery(table, 'select', null);
                if (opts?.count === 'exact') q.countData = true;
                return q;
            },
            insert: (payload) => new MockQuery(table, 'insert', payload),
            update: (payload) => new MockQuery(table, 'update', payload),
            delete: () => new MockQuery(table, 'delete', null)
        };
    },
    storage: new MockStorage()
};

export async function signOutUser() {
    mockSupabase.auth.signOut();
    window.location.href = 'login.html';
}

try {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) logoutBtn.addEventListener('click', signOutUser);
} catch (_) {}

export default mockSupabase;
