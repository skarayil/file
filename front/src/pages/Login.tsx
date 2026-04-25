/**
 * Login.tsx
 * 
 * User login page.
 * Handles user authentication via email and password using useAuthStore.
 * Redirects to dashboard upon successful login.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { success, error } = await login(formData.email, formData.password);
    setIsLoading(false);

    if (success) {
      toast.success(t('auth.login.success'));
      navigate('/dashboard');
    } else {
      toast.error(error || t('auth.login.failed'));
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('auth.login.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t('auth.login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  placeholder="ornek@email.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t('auth.login.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="••••••••"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive font-medium">{errors.password}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>

          <div className="text-center text-sm">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('auth.login.register')}
            </Link>
          </div>

          <div className="px-8 text-center text-xs text-muted-foreground">
            <p>Test Hesapları:</p>
            <p>user@example.com / user123</p>
          </div>
        </div>
      </div>

      {/* Right Side - Branding/Logo */}
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-muted text-foreground overflow-hidden border-l border-border/50">
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-20" />
        <div className="relative z-10 flex flex-col items-center p-12 text-center max-w-lg">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 rotate-3 transition-transform hover:rotate-6 duration-300">
            <Shield className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-foreground">SecureShare</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Güvenli, hızlı ve kolay dosya paylaşımı için modern çözümünüz.
            Tüm dosyalarınız tek bir yerde, her an elinizin altında.
          </p>
        </div>
      </div>
    </div>
  );
}
