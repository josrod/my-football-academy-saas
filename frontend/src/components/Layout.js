import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Shield, Dumbbell, Swords, CalendarDays,
  Search, FileBarChart, Megaphone, Settings, LogOut, Menu, X, Eye, ChevronDown
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/players', label: 'Players', icon: Users },
  { path: '/teams', label: 'Teams', icon: Shield },
  { path: '/training', label: 'Training', icon: Dumbbell },
  { path: '/matches', label: 'Matches', icon: Swords },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/scouting', label: 'Scouting', icon: Search },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/parent-portal', label: 'Parent Portal', icon: Eye },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-body" data-testid="app-layout">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0 h-screen z-50" data-testid="sidebar">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Shield size={18} className="text-black" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-white uppercase">AcademyOS</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
                  active
                    ? 'text-primary bg-primary/10 border-l-2 border-primary'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

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
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-md transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Shield size={14} className="text-black" />
          </div>
          <span className="font-heading text-base font-bold text-white uppercase">AcademyOS</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle" className="text-zinc-400 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
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
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${
                      active ? 'text-primary bg-primary/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-zinc-800 mt-4">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 rounded-md">
                <LogOut size={14} /><span>Sign Out</span>
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
