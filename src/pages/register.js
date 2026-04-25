import supabase from '../api/supabase.js';
import { generateEncryptedKeys } from '../core/cryptoUtils.js';
import { setSessionKey } from '../core/keyManager.js';

const registerForm = document.getElementById('signupForm');
const resultDiv    = document.getElementById('result');
const mfaSetupSection = document.getElementById('mfaSetupSection');
const mfaQrImg     = document.getElementById('mfaQrCode');
const mfaVerifyInput = document.getElementById('mfaVerifyCode');
const mfaVerifyBtn = document.getElementById('mfaVerifyBtn');
const mfaSkipBtn   = document.getElementById('mfaSkipBtn');

let _pendingUser = null;

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username        = document.getElementById('username').value.trim();
    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn       = registerForm.querySelector('button[type="submit"]');

    if (password !== confirmPassword) { setResult('Şifreler eşleşmiyor.', 'error'); return; }
    if (password.length < 8)         { setResult('Şifre en az 8 karakter olmalıdır.', 'error'); return; }
    if (!username)                    { setResult('Kullanıcı adı boş olamaz.', 'error'); return; }

    setUIState(submitBtn, true, 'Kayıt yapılıyor...');
    setResult('Hesap oluşturuluyor...', 'info');

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });

        if (authError) { setResult('Kayıt hatası: ' + authError.message, 'error'); setUIState(submitBtn, false, 'Kayıt Ol'); return; }
        
        if (!authData || !authData.user) {
            setResult('Kayıt başarısız: Bu e-posta kullanımda olabilir veya sistem hatası.', 'error');
            setUIState(submitBtn, false, 'Kayıt Ol');
            return;
        }

        const userId = authData.user.id;
        _pendingUser = { userId, password, username };

        setResult('Şifreleme anahtarları üretiliyor...', 'info');

        const keys = await generateEncryptedKeys(password);

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ username, public_key: keys.publicKey, encrypted_private_key: keys.encryptedPrivateKey })
            .eq('id', userId);

        if (profileError) throw profileError;

        setSessionKey(userId, { password });
        sessionStorage.setItem('temp_session_pwd', password);

        setResult('Hesap başarıyla oluşturuldu! Sisteme giriş yapılıyor...', 'success');
        registerForm.reset();
        
        // MFA'yı tamamen atla ve doğrudan ana sayfaya yönlendir
        setTimeout(() => { window.location.href = 'index.html'; }, 800);

    } catch (err) {
        setResult('Kayıt/Kriptografik hata: ' + err.message, 'error');
        setUIState(submitBtn, false, 'Kayıt Ol');
    }
});

async function offerMfaSetup(userId) {
    try {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (error || !data?.totp?.qr_code) throw error || new Error('QR alınamadı');

        if (mfaQrImg) mfaQrImg.src = data.totp.qr_code;
        if (mfaSetupSection) mfaSetupSection.style.display = 'block';

        mfaVerifyBtn?.addEventListener('click', async () => {
            const code = mfaVerifyInput?.value.trim();
            if (!code) return;
            const { data: chal } = await supabase.auth.mfa.challenge({ factorId: data.id });
            const { error: vErr } = await supabase.auth.mfa.verify({ factorId: data.id, challengeId: chal.id, code });
            if (vErr) { setResult('MFA doğrulama hatası: ' + vErr.message, 'error'); return; }
            setResult('MFA etkinleştirildi! Yönlendiriliyorsunuz...', 'success');
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        });

        mfaSkipBtn?.addEventListener('click', () => {
            setResult('MFA atlandı. Giriş sayfasına yönlendiriliyorsunuz...', 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        });
    } catch {
        setResult('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    }
}

function setUIState(btn, disabled, text) {
    btn.disabled = disabled;
    btn.textContent = text;
}

function setResult(msg, type) {
    resultDiv.textContent = msg;
    resultDiv.className = type;
}