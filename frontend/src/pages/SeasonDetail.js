import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { ArrowLeft, Loader2, Trophy, Dumbbell, Target, TrendingUp, Calendar, Check, Clock, PlayCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const STATUS_MAP = {
  active: { icon: PlayCircle, cls: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Active' },
  completed: { icon: Check, cls: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30', label: 'Completed' },
  upcoming: { icon: Clock, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Upcoming' },
};

export default function SeasonDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get(`/api/seasons/${id}`).then(setSeason).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!season) return <p className="text-center py-20 text-zinc-500">{t('seasons.noSeasons')}</p>;

  const stats = season.stats || {};
  const st = STATUS_MAP[season.status] || STATUS_MAP.upcoming;
  const StIcon = st.icon;

  // Build team match record for chart
  const teamMap = {};
  (season.teams || []).forEach(tm => { teamMap[tm.id] = tm.name; });
  const teamMatchData = {};
  (season.matches || []).filter(m => m.status === 'completed').forEach(m => {
    const tname = teamMap[m.team_id] || m.team_id;
    if (!teamMatchData[tname]) teamMatchData[tname] = { name: tname, wins: 0, draws: 0, losses: 0 };
    if ((m.home_score || 0) > (m.away_score || 0)) teamMatchData[tname].wins++;
    else if ((m.home_score || 0) < (m.away_score || 0)) teamMatchData[tname].losses++;
    else teamMatchData[tname].draws++;
  });
  const chartData = Object.values(teamMatchData);

  const TABS = [
    { key: 'overview', label: t('seasons.overview') },
    { key: 'matches', label: t('nav.matches') },
    { key: 'training', label: t('nav.training') },
  ];

  return (
    <div data-testid="season-detail-page">
      <Link to="/seasons" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-6 transition-colors" data-testid="back-to-seasons">
        <ArrowLeft size={14} /> {t('seasons.backToSeasons')}
      </Link>

      {/* Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6" data-testid="season-header">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${st.cls}`}>
              <StIcon size={24} />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-white uppercase">{season.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-zinc-500">{season.start_date} &rarr; {season.end_date}</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${st.cls}`}>
                  {t(`seasons.${season.status}`)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {season.description && <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{season.description}</p>}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: t('seasons.totalMatches'), value: stats.total_matches, icon: Trophy, color: 'text-primary' },
          { label: t('seasons.wins'), value: stats.wins, icon: TrendingUp, color: 'text-green-400' },
          { label: t('seasons.draws'), value: stats.draws, icon: Target, color: 'text-zinc-400' },
          { label: t('seasons.losses'), value: stats.losses, icon: Target, color: 'text-red-400' },
          { label: t('seasons.trainingSessions'), value: stats.total_training, icon: Dumbbell, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4" data-testid={`season-stat-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className={s.color} />
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-heading font-bold text-white">{s.value || 0}</p>
          </motion.div>
        ))}
      </div>

      {/* Goals summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{t('seasons.goalsFor')}</p>
          <p className="text-3xl font-heading font-bold text-green-400">{stats.goals_for || 0}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{t('seasons.goalsAgainst')}</p>
          <p className="text-3xl font-heading font-bold text-red-400">{stats.goals_against || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 mb-6" data-testid="season-tabs">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} data-testid={`season-tab-${tb.key}`}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
              tab === tb.key ? 'bg-primary text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div data-testid="season-overview-tab">
          {chartData.length > 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white uppercase mb-4">{t('seasons.teamPerformance')}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="wins" fill="#22c55e" name={t('seasons.wins')} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="draws" fill="#71717a" name={t('seasons.draws')} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="losses" fill="#ef4444" name={t('seasons.losses')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 text-sm">{t('common.noData')}</div>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden" data-testid="season-matches-tab">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.date')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('teams.title')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('matches.opponent')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.type')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('seasons.result')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.status')}</th>
            </tr></thead>
            <tbody>
              {(season.matches || []).map((m, i) => (
                <tr key={m.id || i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-zinc-400">{m.date}</td>
                  <td className="px-5 py-3 text-sm text-white">{teamMap[m.team_id] || '-'}</td>
                  <td className="px-5 py-3 text-sm text-zinc-300">{m.opponent}</td>
                  <td className="px-5 py-3"><span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">{m.type}</span></td>
                  <td className="px-5 py-3 text-sm font-mono">
                    {m.status === 'completed' ? (
                      <span className={
                        (m.home_score || 0) > (m.away_score || 0) ? 'text-green-400' :
                        (m.home_score || 0) < (m.away_score || 0) ? 'text-red-400' : 'text-zinc-400'
                      }>{m.home_score} - {m.away_score}</span>
                    ) : <span className="text-zinc-600">-</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                      m.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{m.status === 'completed' ? t('seasons.completed') : t('seasons.upcoming')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!season.matches || season.matches.length === 0) && (
            <p className="text-center py-10 text-sm text-zinc-500">{t('matches.noMatches')}</p>
          )}
        </div>
      )}

      {tab === 'training' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden" data-testid="season-training-tab">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.date')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('training.sessionTitle')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.type')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.location')}</th>
              <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">{t('common.time')}</th>
            </tr></thead>
            <tbody>
              {(season.training_sessions || []).map((ts, i) => (
                <tr key={ts.id || i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-zinc-400">{ts.date}</td>
                  <td className="px-5 py-3 text-sm text-white">{ts.title}</td>
                  <td className="px-5 py-3"><span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">{ts.type}</span></td>
                  <td className="px-5 py-3 text-sm text-zinc-400">{ts.location}</td>
                  <td className="px-5 py-3 text-sm text-zinc-400 font-mono">{ts.start_time} - {ts.end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!season.training_sessions || season.training_sessions.length === 0) && (
            <p className="text-center py-10 text-sm text-zinc-500">{t('training.noSessions')}</p>
          )}
        </div>
      )}
    </div>
  );
}
