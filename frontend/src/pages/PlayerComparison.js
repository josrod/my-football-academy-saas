import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Loader2, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

function PlayerSelector({ label, selected, players, onSelect, testId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" data-testid={testId}>
      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1.5 block">{label}</label>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white hover:border-zinc-600 transition-colors">
        <span className="truncate">{selected ? `${selected.first_name} ${selected.last_name}` : 'Select...'}</span>
        <ChevronDown size={14} className="text-zinc-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {players.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors text-left">
              <span className="w-5 text-[10px] font-mono text-zinc-500">{p.jersey_number || '-'}</span>
              <span>{p.first_name} {p.last_name}</span>
              <span className="text-[10px] text-zinc-500 ml-auto">{p.position}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, val1, val2, suffix = '', higher = 'better' }) {
  const n1 = parseFloat(val1) || 0;
  const n2 = parseFloat(val2) || 0;
  const diff = higher === 'better' ? n1 - n2 : n2 - n1;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
      <span className="w-32 text-xs text-zinc-500">{label}</span>
      <span className={`w-16 text-right text-sm font-mono font-semibold ${diff > 0 ? 'text-primary' : diff < 0 ? 'text-zinc-400' : 'text-zinc-300'}`}>
        {val1}{suffix}
      </span>
      <div className="flex-1 flex items-center justify-center">
        {diff > 0 ? <TrendingUp size={12} className="text-primary" /> :
         diff < 0 ? <TrendingDown size={12} className="text-red-400" /> :
         <Minus size={12} className="text-zinc-600" />}
      </div>
      <span className={`w-16 text-left text-sm font-mono font-semibold ${diff < 0 ? 'text-primary' : diff > 0 ? 'text-zinc-400' : 'text-zinc-300'}`}>
        {val2}{suffix}
      </span>
    </div>
  );
}

export default function PlayerComparison() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState([]);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [stats1, setStats1] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/players').then(ps => { setPlayers(ps); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (p1) api.get(`/api/players/${p1.id}/stats`).then(setStats1).catch(() => setStats1(null));
    else setStats1(null);
  }, [p1]);

  useEffect(() => {
    if (p2) api.get(`/api/players/${p2.id}/stats`).then(setStats2).catch(() => setStats2(null));
    else setStats2(null);
  }, [p2]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  const radarData = (stats1 && stats2) ? [
    { stat: t('compare.speed'), p1: stats1.metrics?.speed || 0, p2: stats2.metrics?.speed || 0 },
    { stat: t('compare.stamina'), p1: stats1.metrics?.stamina || 0, p2: stats2.metrics?.stamina || 0 },
    { stat: t('compare.technique'), p1: stats1.metrics?.technique || 0, p2: stats2.metrics?.technique || 0 },
    { stat: t('compare.passing'), p1: stats1.metrics?.passing || 0, p2: stats2.metrics?.passing || 0 },
    { stat: t('compare.shooting'), p1: stats1.metrics?.shooting || 0, p2: stats2.metrics?.shooting || 0 },
    { stat: t('compare.dribbling'), p1: stats1.metrics?.dribbling || 0, p2: stats2.metrics?.dribbling || 0 },
    { stat: t('compare.strength'), p1: stats1.metrics?.strength || 0, p2: stats2.metrics?.strength || 0 },
    { stat: t('compare.agility'), p1: stats1.metrics?.agility || 0, p2: stats2.metrics?.agility || 0 },
  ] : [];

  const score1 = stats1 ? Math.round(((stats1.metrics?.speed || 0) + (stats1.metrics?.stamina || 0) + (stats1.metrics?.technique || 0) + (stats1.metrics?.passing || 0) + (stats1.metrics?.shooting || 0) + (stats1.metrics?.dribbling || 0)) / 6) : 0;
  const score2 = stats2 ? Math.round(((stats2.metrics?.speed || 0) + (stats2.metrics?.stamina || 0) + (stats2.metrics?.technique || 0) + (stats2.metrics?.passing || 0) + (stats2.metrics?.shooting || 0) + (stats2.metrics?.dribbling || 0)) / 6) : 0;

  return (
    <div data-testid="player-comparison-page">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-white uppercase">{t('compare.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('compare.subtitle')}</p>
      </div>

      {/* Player Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PlayerSelector label={t('compare.player1')} selected={p1} players={players.filter(p => p.id !== p2?.id)} onSelect={setP1} testId="player-1-selector" />
        <PlayerSelector label={t('compare.player2')} selected={p2} players={players.filter(p => p.id !== p1?.id)} onSelect={setP2} testId="player-2-selector" />
      </div>

      {p1 && p2 && stats1 && stats2 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Overall Score */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
              <p className="text-xs text-zinc-500 uppercase mb-2">{p1.first_name} {p1.last_name}</p>
              <p className={`text-4xl font-heading font-bold ${score1 >= score2 ? 'text-primary' : 'text-zinc-400'}`} data-testid="score-player1">{score1}</p>
              <p className="text-[10px] text-zinc-600 uppercase mt-1">{t('compare.overall')}</p>
            </div>
            <div className="bg-zinc-900/50 border border-primary/20 rounded-xl p-5 flex items-center justify-center">
              <span className="text-2xl font-heading font-bold text-primary">VS</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
              <p className="text-xs text-zinc-500 uppercase mb-2">{p2.first_name} {p2.last_name}</p>
              <p className={`text-4xl font-heading font-bold ${score2 >= score1 ? 'text-primary' : 'text-zinc-400'}`} data-testid="score-player2">{score2}</p>
              <p className="text-[10px] text-zinc-600 uppercase mt-1">{t('compare.overall')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5" data-testid="radar-chart-section">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('compare.radar')}</h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={`${p1.first_name}`} dataKey="p1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={`${p2.first_name}`} dataKey="p2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Match Stats Comparison */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5" data-testid="match-stats-section">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('compare.matchStats')}</h3>
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-3 px-1">
                <span className="w-32" />
                <span className="w-16 text-right font-semibold text-primary">{p1.first_name}</span>
                <span className="flex-1" />
                <span className="w-16 text-left font-semibold text-blue-400">{p2.first_name}</span>
              </div>
              <StatRow label={t('compare.goals')} val1={stats1.match_stats?.total_goals || 0} val2={stats2.match_stats?.total_goals || 0} />
              <StatRow label={t('compare.assists')} val1={stats1.match_stats?.total_assists || 0} val2={stats2.match_stats?.total_assists || 0} />
              <StatRow label={t('compare.matchesPlayed')} val1={stats1.match_stats?.matches_played || 0} val2={stats2.match_stats?.matches_played || 0} />
              <StatRow label={t('compare.avgRating')} val1={(stats1.match_stats?.avg_rating || 0).toFixed(1)} val2={(stats2.match_stats?.avg_rating || 0).toFixed(1)} />
              <StatRow label={t('compare.yellowCards')} val1={stats1.match_stats?.total_yellow_cards || 0} val2={stats2.match_stats?.total_yellow_cards || 0} higher="lower" />
              <StatRow label={t('compare.minutesPlayed')} val1={stats1.match_stats?.total_minutes || 0} val2={stats2.match_stats?.total_minutes || 0} />
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-20 text-zinc-500 text-sm" data-testid="no-players-selected">
          {t('compare.noPlayers')}
        </div>
      )}
    </div>
  );
}
