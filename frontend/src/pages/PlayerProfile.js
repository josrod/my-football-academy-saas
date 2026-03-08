import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Loader2, User, BarChart3, HeartPulse, Swords, Dumbbell, Search, Star } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'metrics', label: 'Metrics', icon: BarChart3 },
  { key: 'medical', label: 'Medical', icon: HeartPulse },
  { key: 'matches', label: 'Matches', icon: Swords },
  { key: 'training', label: 'Training', icon: Dumbbell },
  { key: 'scouting', label: 'Scouting', icon: Search },
];

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get(`/api/players/${id}`).then(setPlayer).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!player) return <p className="text-center py-20 text-zinc-500">Player not found</p>;

  const age = player.date_of_birth ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000) : '—';
  const latestMetric = player.metrics?.[0];
  const radarData = latestMetric ? [
    { attr: 'Speed', val: latestMetric.speed || 0 },
    { attr: 'Stamina', val: latestMetric.stamina || 0 },
    { attr: 'Strength', val: latestMetric.strength || 0 },
    { attr: 'Agility', val: latestMetric.agility || 0 },
    { attr: 'Technique', val: latestMetric.technique || 0 },
    { attr: 'Passing', val: latestMetric.passing || 0 },
    { attr: 'Shooting', val: latestMetric.shooting || 0 },
    { attr: 'Dribbling', val: latestMetric.dribbling || 0 },
  ] : [];

  const totalAttendance = player.attendance?.length || 0;
  const presentCount = player.attendance?.filter(a => a.status === 'present').length || 0;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return (
    <div data-testid="player-profile-page">
      <Link to="/players" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-6 transition-colors" data-testid="back-to-players">
        <ArrowLeft size={14} /> Back to Players
      </Link>

      {/* Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6" data-testid="player-header">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl font-heading font-bold text-primary">
            {player.jersey_number || '—'}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-bold text-white uppercase">
              {player.first_name} {player.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">{player.position}</span>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">{player.category}</span>
              <span className={`text-xs px-2.5 py-1 rounded-md ${player.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {player.status}
              </span>
              {player.team && <span className="text-xs text-zinc-400">{player.team.name}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div><p className="font-heading text-2xl font-bold text-white">{age}</p><p className="text-xs text-zinc-500 uppercase">Age</p></div>
            <div><p className="font-heading text-2xl font-bold text-white">{player.height || '—'}</p><p className="text-xs text-zinc-500 uppercase">cm</p></div>
            <div><p className="font-heading text-2xl font-bold text-white">{player.weight || '—'}</p><p className="text-xs text-zinc-500 uppercase">kg</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2" data-testid="player-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} data-testid={`tab-${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wide font-semibold rounded-md transition-all whitespace-nowrap ${
              tab === key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-info">
              <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Player Information</h3>
              <div className="space-y-3">
                {[
                  ['Date of Birth', player.date_of_birth],
                  ['Preferred Foot', player.preferred_foot],
                  ['Jersey Number', player.jersey_number],
                  ['Email', player.email || '—'],
                  ['Phone', player.phone || '—'],
                  ['Parent', player.parent_name || '—'],
                  ['Parent Email', player.parent_email || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-zinc-800/50">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{k}</span>
                    <span className="text-sm text-zinc-300">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            {radarData.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-radar-chart">
                <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Performance Radar</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="attr" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#52525b', fontSize: 10 }} />
                    <Radar name="Skill" dataKey="val" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-stats-summary">
              <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Stats Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-primary">{attendanceRate}%</p>
                  <p className="text-xs text-zinc-500 mt-1">Attendance Rate</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-blue-400">{player.match_stats?.length || 0}</p>
                  <p className="text-xs text-zinc-500 mt-1">Matches Played</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-amber-400">{player.match_stats?.reduce((s, m) => s + (m.goals || 0), 0) || 0}</p>
                  <p className="text-xs text-zinc-500 mt-1">Goals</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-emerald-400">{player.match_stats?.reduce((s, m) => s + (m.assists || 0), 0) || 0}</p>
                  <p className="text-xs text-zinc-500 mt-1">Assists</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'metrics' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-metrics-tab">
            <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Performance Metrics</h3>
            {player.metrics?.length > 0 ? (
              <div className="space-y-4">
                {player.metrics.map((m, i) => (
                  <div key={i} className="bg-zinc-950 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-3">{m.date}</p>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                      {['speed', 'stamina', 'strength', 'agility', 'technique', 'passing', 'shooting', 'dribbling'].map(attr => (
                        <div key={attr} className="text-center">
                          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-semibold text-white">
                            {m[attr]?.toFixed?.(1) || '—'}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1 capitalize">{attr}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No metrics recorded</p>}
          </div>
        )}

        {tab === 'medical' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-medical-tab">
            <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Medical Records</h3>
            {player.injuries?.length > 0 ? (
              <div className="space-y-3">
                {player.injuries.map((inj, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-start gap-4">
                    <HeartPulse size={18} className={inj.status === 'active' ? 'text-red-400' : 'text-zinc-500'} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{inj.type}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{inj.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                        <span>Date: {inj.date}</span>
                        {inj.expected_return && <span>Expected return: {inj.expected_return}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-md ${inj.status === 'active' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      {inj.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No injuries recorded</p>}
          </div>
        )}

        {tab === 'matches' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-matches-tab">
            <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Match History</h3>
            {player.match_stats?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-zinc-800">
                    <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">Date</th>
                    <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Mins</th>
                    <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Goals</th>
                    <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Assists</th>
                    <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Rating</th>
                  </tr></thead>
                  <tbody>
                    {player.match_stats.map((ms, i) => (
                      <tr key={i} className="border-b border-zinc-800/50">
                        <td className="px-4 py-3 text-sm text-zinc-400">{ms.date}</td>
                        <td className="px-4 py-3 text-sm text-white text-center">{ms.minutes_played}'</td>
                        <td className="px-4 py-3 text-sm text-white text-center">{ms.goals}</td>
                        <td className="px-4 py-3 text-sm text-white text-center">{ms.assists}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${ms.rating >= 7 ? 'text-primary' : ms.rating >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{ms.rating}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-zinc-500">No match data</p>}
          </div>
        )}

        {tab === 'training' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-training-tab">
            <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Training Attendance</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-950 rounded-lg p-4 text-center">
                <p className="font-heading text-2xl font-bold text-white">{totalAttendance}</p>
                <p className="text-xs text-zinc-500">Total Sessions</p>
              </div>
              <div className="bg-zinc-950 rounded-lg p-4 text-center">
                <p className="font-heading text-2xl font-bold text-primary">{presentCount}</p>
                <p className="text-xs text-zinc-500">Present</p>
              </div>
              <div className="bg-zinc-950 rounded-lg p-4 text-center">
                <p className="font-heading text-2xl font-bold text-amber-400">{attendanceRate}%</p>
                <p className="text-xs text-zinc-500">Rate</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'scouting' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="player-scouting-tab">
            <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Scouting Reports</h3>
            {player.evaluations?.length > 0 ? (
              <div className="space-y-4">
                {player.evaluations.map((ev, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-white">{ev.evaluator_name}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-md ${ev.recommendation === 'star_potential' ? 'bg-amber-500/10 text-amber-400' : ev.recommendation === 'promote' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {ev.recommendation?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      {['technical', 'tactical', 'physical', 'mental', 'overall'].map(k => (
                        <div key={k} className="text-center">
                          <p className="text-lg font-bold text-white">{ev[k]}</p>
                          <p className="text-[10px] text-zinc-500 capitalize">{k}</p>
                        </div>
                      ))}
                    </div>
                    {ev.notes && <p className="text-xs text-zinc-400 mt-2 border-t border-zinc-800 pt-3">{ev.notes}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No scouting reports</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
