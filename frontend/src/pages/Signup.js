import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, clubName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 font-body" data-testid="signup-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Shield size={20} className="text-black" />
            </div>
            <span className="font-heading text-xl font-bold text-white uppercase">AcademyOS</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">Create Account</h1>
          <p className="text-sm text-zinc-400 mt-2">Set up your academy in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="signup-form">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400" data-testid="signup-error">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[13px] font-medium text-zinc-300 mb-2">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} data-testid="signup-name-input"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="Your full name" required />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-300 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="signup-email-input"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="you@email.com" required />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-300 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="signup-password-input"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-300 mb-2">Club Name</label>
            <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} data-testid="signup-club-input"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="Your academy name" required />
          </div>
          <button type="submit" disabled={loading} data-testid="signup-submit-button"
            className="w-full bg-primary text-black font-semibold text-xs uppercase tracking-wide py-3.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create Academy
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" data-testid="goto-login-link" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
