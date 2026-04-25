import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { clearSessionKey } from '../core/keyManager.js';

const SUPABASE_URL = 'http://45.154.99.250:8000';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export async function signOutUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) clearSessionKey(user.id);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Çıkış hatası:', error.message);
    window.location.href = 'login.html';
}

try {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) logoutBtn.addEventListener('click', signOutUser);
} catch (_) {}

export default supabase;