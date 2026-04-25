import supabase from '../api/supabase.js';
import { generateEncryptedKeys } from '../core/cryptoUtils.js';
import { setSessionKey } from '../core/keyManager.js';

const loginForm   = document.getElementById('loginForm');
const resultDiv   = document.getElementById('result');
const mfaSection  = document.getElementById('mfaSection');
const mfaInput    = document.getElementById('mfaCode');
const mfaBtn      = document.getElementById('mfaConfirmBtn');

let _pendingSession = null;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    setUIState(submitBtn, true, 'Doğrulanıyor...');
    setResult('', '');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setResult('Giriş hatası: ' + error.message, 'error');
            setUIState(submitBtn, false, 'Giriş Yap');
            return;
        }

        if (!data || !data.user) {
            setResult('Giriş başarısız: Kullanıcı bulunamadı veya onaylanmamış.', 'error');
            setUIState(submitBtn, false, 'Giriş Yap');
            return;
        }

        // MFA kontrolünü tamamen atla ve doğrudan ana sayfaya yönlendir
        await finalizeLogin(data.user, password);
        setUIState(submitBtn, false, 'Giriş Yap');

    } catch (err) {
        setResult('Sistem hatası: ' + err.message, 'error');
        setUIState(submitBtn, false, 'Giriş Yap');
    }
});

if (mfaBtn) {
    mfaBtn.addEventListener('click', async () => {
        const code = mfaInput.value.trim();
        if (!code || code.length < 6) { setResult('Geçerli bir doğrulama kodu girin.', 'error'); return; }

        setUIState(mfaBtn, true, 'Doğrulanıyor...');

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: await getFirstFactorId()
        });

        if (challengeError) { setResult(challengeError.message, 'error'); setUIState(mfaBtn, false, 'Onayla'); return; }

        const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
            factorId: await getFirstFactorId(),
            challengeId: challengeData.id,
            code
        });

        if (verifyError) { setResult('MFA kodu hatalı: ' + verifyError.message, 'error'); setUIState(mfaBtn, false, 'Onayla'); return; }

        const { data: { user } } = await supabase.auth.getUser();
        await finalizeLogin(user, _pendingSession?.password);
        setUIState(mfaBtn, false, 'Onayla');
    });
}

async function getFirstFactorId() {
    const { data } = await supabase.auth.mfa.listFactors();
    return data?.totp?.[0]?.id;
}

async function finalizeLogin(user, password) {
    if (password) {
        sessionStorage.setItem('temp_session_pwd', password);
        setSessionKey(user.id, { password });
    }
    setResult('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
}

function showMfaSection() {
    if (mfaSection) mfaSection.style.display = 'block';
    setResult('MFA doğrulaması gerekiyor. Authenticator uygulamanızdan kodu girin.', 'info');
}

function setUIState(btn, disabled, text) {
    btn.disabled = disabled;
    btn.textContent = text;
}

function setResult(msg, type) {
    resultDiv.textContent = msg;
    resultDiv.className = type;
}
