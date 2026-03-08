import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-body" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <img src="/icon.svg" alt="AcademyOS" className="w-9 h-9 rounded-md" />
            <span className="font-heading text-xl font-bold text-white uppercase">AcademyOS</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-zinc-400 mt-2">{t('auth.signInDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400" data-testid="login-error">{error}</div>
          )}
          <div>
            <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('common.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email-input"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="admin@academy.com" required />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password-input"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all pr-10"
                placeholder={t('auth.enterPassword')} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} data-testid="login-submit-button"
            className="w-full bg-primary text-black font-semibold text-xs uppercase tracking-wide py-3.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {t('auth.signInBtn')}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-8">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" data-testid="goto-signup-link" className="text-primary hover:underline">{t('auth.createOne')}</Link>
        </p>

        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">{t('auth.demoCredentials')}</p>
          <div className="space-y-1 text-xs text-zinc-400">
            <p>Admin: <span className="text-zinc-300">admin@academy.com</span> / <span className="text-zinc-300">admin123</span></p>
            <p>Coach: <span className="text-zinc-300">carlos@academy.com</span> / <span className="text-zinc-300">coach123</span></p>
            <p>Parent: <span className="text-zinc-300">parent@academy.com</span> / <span className="text-zinc-300">parent123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
