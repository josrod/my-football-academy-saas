import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../api';
import {
  LayoutDashboard, Users, Shield, Dumbbell, Swords, CalendarDays,
  Search, FileBarChart, Megaphone, Settings, LogOut, Menu, X, Eye, Globe, Bell, Trophy, Crosshair,
  Sun, Moon, GitCompare, Brain, BookOpen
} from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'EN', nameKey: 'common.english' },
  { code: 'es', label: 'ES', nameKey: 'common.spanish' },
  { code: 'de', label: 'DE', nameKey: 'common.german' },
  { code: 'fr', label: 'FR', nameKey: 'common.french' },
  { code: 'pt', label: 'PT', nameKey: 'common.portuguese' },
  { code: 'it', label: 'IT', nameKey: 'common.italian' },
  { code: 'ar', label: 'AR', nameKey: 'common.arabic' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = React.useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const notifs = await api.get('/api/notifications');
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread, location.pathname]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://') + `/api/ws/${token}`;
    let ws;
    let reconnectTimer;
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'notification') {
              setUnreadCount(prev => prev + 1);
            }
          } catch {}
        };
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 5000); };
        ws.onerror = () => { ws.close(); };
      } catch {}
    };
    connect();
    // Ping to keep alive
    const pingInterval = setInterval(() => { if (ws?.readyState === 1) ws.send('ping'); }, 30000);
    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(pingInterval);
      if (ws) ws.close();
    };
  }, []);

  const NAV_ITEMS = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/players', label: t('nav.players'), icon: Users },
    { path: '/teams', label: t('nav.teams'), icon: Shield },
    { path: '/training', label: t('nav.training'), icon: Dumbbell },
    { path: '/drills', label: t('nav.drills'), icon: BookOpen },
    { path: '/matches', label: t('nav.matches'), icon: Swords },
    { path: '/formations', label: t('nav.formations'), icon: Crosshair },
    { path: '/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { path: '/scouting', label: t('nav.scouting'), icon: Search },
    { path: '/reports', label: t('nav.reports'), icon: FileBarChart },
    { path: '/seasons', label: t('nav.seasons'), icon: Trophy },
    { path: '/compare-players', label: t('nav.comparePlayers'), icon: GitCompare },
    { path: '/ai-insights', label: t('nav.aiInsights'), icon: Brain },
    { path: '/announcements', label: t('nav.announcements'), icon: Megaphone },
    { path: '/notifications', label: t('common.notifications'), icon: Bell, badge: unreadCount },
    { path: '/parent-portal', label: t('nav.parentPortal'), icon: Eye },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const switchLang = async (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
    // Persist language preference to backend
    try {
      const api = (await import('../api')).default;
      await api.put('/api/user/language', { language: code });
    } catch {}
  };

  const currentLang = LANGS.find(l => l.code === i18n.language?.substring(0, 2)) || LANGS[0];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-body" data-testid="app-layout">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0 h-screen z-50" data-testid="sidebar">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
          <img src="/icon.svg" alt="AcademyOS" className="w-8 h-8 rounded-md" />
          <span className="font-heading text-lg font-bold tracking-tight text-white uppercase">AcademyOS</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link key={path} to={path}
                data-testid={`nav-${path.replace('/', '').replace('/', '-')}`}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
                  active
                    ? 'text-primary bg-primary/10 border-l-2 border-primary'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}>
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-black text-[10px] font-bold px-1" data-testid="notification-badge">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle + Language Switcher */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <button onClick={toggleTheme} data-testid="theme-toggle"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors mb-1">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}</span>
          </button>
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} data-testid="language-switcher"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <Globe size={14} />
              <span>{t('common.language')}: {currentLang.label}</span>
            </button>
            {langOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl z-50">
                {LANGS.map(lang => (
                  <button key={lang.code} onClick={() => switchLang(lang.code)}
                    data-testid={`lang-${lang.code}`}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                      currentLang.code === lang.code ? 'text-primary bg-primary/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}>
                    <span className="font-mono text-[10px] opacity-60">{lang.label}</span>
                    <span>{t(lang.nameKey)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.role || 'admin'}</p>
            </div>
          </div>
          <button onClick={handleLogout} data-testid="logout-button"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-md transition-colors">
            <LogOut size={14} />
            <span>{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="AcademyOS" className="w-7 h-7 rounded-md" />
          <span className="font-heading text-base font-bold text-white uppercase">AcademyOS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="text-zinc-400 hover:text-white px-2">
              <Globe size={18} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl z-50 max-h-72 overflow-y-auto">
                {LANGS.map(lang => (
                  <button key={lang.code} onClick={() => switchLang(lang.code)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs ${
                      currentLang.code === lang.code ? 'text-primary bg-primary/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}>
                    <span className="font-mono text-[10px] opacity-60">{lang.label}</span>
                    <span>{t(lang.nameKey)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle" className="text-zinc-400 hover:text-white">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 w-64 h-full bg-zinc-950 border-r border-zinc-800 pt-16 z-50 overflow-y-auto">
            <nav className="px-3 py-2 space-y-1">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${
                      active ? 'text-primary bg-primary/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <Icon size={18} /><span>{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-zinc-800 mt-4">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 rounded-md">
                <LogOut size={14} /><span>{t('nav.signOut')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 overflow-y-auto h-screen bg-background">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
