import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Loader2, Users, CalendarDays, CheckCircle2, Megaphone, Dumbbell, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ParentPortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [players, setPlayers] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/parent/players'),
      api.get('/api/parent/schedule'),
      api.get('/api/parent/announcements')
    ]).then(([p, s, a]) => {
      setPlayers(p);
      setSchedule(s);
      setAnnouncements(a);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="parent-portal-page">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('parentPortal.title')}</p>
        <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('parentPortal.myChildren')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('parentPortal.subtitle')}</p>
      </div>

      {/* Player overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" data-testid="parent-players-list">
        {players.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center font-heading text-xl font-bold text-primary">
                {p.jersey_number || '—'}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-zinc-400">{p.position} &middot; {p.category}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 rounded-lg p-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {p.status}
                </span>
              </div>
              <div className="bg-zinc-950 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">Foot: {p.preferred_foot}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {players.length === 0 && <p className="col-span-full text-sm text-zinc-500 text-center py-8">No players linked to your account</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming schedule */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="parent-training-schedule">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell size={18} className="text-amber-400" />
              <h3 className="font-heading text-lg font-semibold text-white uppercase">Upcoming Training</h3>
            </div>
            {schedule?.training?.length > 0 ? (
              <div className="space-y-2">
                {schedule.training.slice(0, 5).map((s, i) => (
                  <div key={i} className="bg-zinc-950 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{s.title}</p>
                      <p className="text-xs text-zinc-500">{s.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-300">{s.date}</p>
                      <p className="text-xs text-zinc-500">{s.start_time}-{s.end_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No upcoming training</p>}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="parent-match-schedule">
            <div className="flex items-center gap-2 mb-4">
              <Swords size={18} className="text-blue-400" />
              <h3 className="font-heading text-lg font-semibold text-white uppercase">Upcoming Matches</h3>
            </div>
            {schedule?.matches?.length > 0 ? (
              <div className="space-y-2">
                {schedule.matches.slice(0, 5).map((m, i) => (
                  <div key={i} className="bg-zinc-950 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">vs {m.opponent}</p>
                      <p className="text-xs text-zinc-500">{m.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-300">{m.date}</p>
                      <p className="text-xs text-zinc-500">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No upcoming matches</p>}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="parent-announcements">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={18} className="text-primary" />
            <h3 className="font-heading text-lg font-semibold text-white uppercase">Announcements</h3>
          </div>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((a, i) => (
                <div key={i} className="bg-zinc-950 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">{a.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${a.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>{a.priority}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{a.content}</p>
                  <p className="text-[10px] text-zinc-600 mt-2">{a.author_name} &middot; {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-zinc-500">No announcements</p>}
        </div>
      </div>
    </div>
  );
}
