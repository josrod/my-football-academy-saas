import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { ArrowLeft, Loader2, MapPin, Clock, Star, Flame, AlertTriangle, ArrowRightLeft, BarChart3, Users, Trophy, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import FootballPitch, { pitchToSvg, PITCH_WIDTH, PITCH_RATIO } from '../components/FootballPitch';

function StatBar({ label, home, away, homeLabel, awayLabel, suffix = '' }) {
  const max = Math.max(home, away, 1);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
        <span className="font-mono font-bold text-white">{home}{suffix}</span>
        <span className="uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="font-mono font-bold text-white">{away}{suffix}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-zinc-800 rounded-l-full overflow-hidden flex justify-end">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(home / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-primary rounded-l-full" />
        </div>
        <div className="flex-1 bg-zinc-800 rounded-r-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(away / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-red-500/70 rounded-r-full" />
        </div>
      </div>
    </div>
  );
}

function EventIcon({ type }) {
  if (type === 'goal') return <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><Flame size={12} className="text-primary" /></div>;
  if (type === 'yellow_card') return <div className="w-4 h-5 rounded-sm bg-amber-400" />;
  if (type === 'red_card') return <div className="w-4 h-5 rounded-sm bg-red-500" />;
  if (type === 'substitution') return <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center"><ArrowRightLeft size={12} className="text-blue-400" /></div>;
  return null;
}

export default function MatchReport() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats');
  const [heatmapPlayer, setHeatmapPlayer] = useState(null);
  const pitchRef = useRef(null);

  useEffect(() => {
    api.get(`/api/matches/${id}`).then(setMatch).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!match) return <p className="text-center py-20 text-zinc-500">{t('matches.matchNotFound')}</p>;

  const ts = match.team_stats || {};
  const motm = match.motm;
  const events = match.events || [];
  const summary = match.summary || {};
  const isCompleted = match.status === 'completed';
  const isWin = (match.home_score || 0) > (match.away_score || 0);
  const isDraw = (match.home_score || 0) === (match.away_score || 0);

  const TABS = isCompleted ? [
    { key: 'stats', label: t('matchAdvanced.teamStats'), icon: BarChart3 },
    { key: 'timeline', label: t('matchAdvanced.timeline'), icon: Clock },
    { key: 'heatmap', label: t('matchAdvanced.heatmap'), icon: Crosshair },
    { key: 'players', label: t('matchAdvanced.playerRatings'), icon: Users },
  ] : [];

  return (
    <div data-testid="match-report-page">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-6 transition-colors" data-testid="back-to-matches">
        <ArrowLeft size={14} /> {t('matches.backToMatches')}
      </Link>

      {/* Match Header */}
      <div className={`bg-zinc-900/50 border rounded-xl p-8 mb-6 text-center ${isCompleted ? (isWin ? 'border-green-500/20' : isDraw ? 'border-zinc-700' : 'border-red-500/20') : 'border-zinc-800'}`} data-testid="match-header">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-md uppercase">{match.type}</span>
          {match.formation && <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-md font-mono">{match.formation}</span>}
        </div>
        <p className="text-xs text-zinc-500 mb-5">{match.date} &middot; {match.time}</p>

        <div className="flex items-center justify-center gap-6 md:gap-12">
          <div className="text-center min-w-[120px]">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
              <span className="font-heading text-xl font-bold text-primary">{match.team?.name?.substring(0, 3)?.toUpperCase() || 'HOM'}</span>
            </div>
            <p className="font-heading text-lg font-bold text-white uppercase">{match.team?.name || 'Team'}</p>
          </div>

          {match.home_score !== null ? (
            <div className="relative">
              <div className="bg-zinc-950 rounded-2xl px-10 py-5 border border-zinc-800">
                <span className={`font-heading text-5xl font-bold ${isWin ? 'text-green-400' : isDraw ? 'text-white' : 'text-red-400'}`}>
                  {match.home_score}
                </span>
                <span className="text-3xl text-zinc-600 mx-3">-</span>
                <span className={`font-heading text-5xl font-bold ${!isWin && !isDraw ? 'text-green-400' : 'text-white'}`}>
                  {match.away_score}
                </span>
              </div>
              {isCompleted && (
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  isWin ? 'bg-green-500/20 text-green-400' : isDraw ? 'bg-zinc-700 text-zinc-400' : 'bg-red-500/20 text-red-400'
                }`}>{isWin ? t('matchAdvanced.win') : isDraw ? t('matchAdvanced.draw') : t('matchAdvanced.loss')}</span>
              )}
            </div>
          ) : (
            <div className="bg-zinc-950 rounded-2xl px-10 py-5 border border-zinc-800">
              <span className="font-heading text-3xl font-bold text-zinc-500">vs</span>
            </div>
          )}

          <div className="text-center min-w-[120px]">
            <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="font-heading text-xl font-bold text-red-400">{match.opponent?.substring(0, 3)?.toUpperCase() || 'OPP'}</span>
            </div>
            <p className="font-heading text-lg font-bold text-white uppercase">{match.opponent}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><MapPin size={12} /> {match.location}</span>
          {summary.players_used > 0 && <span className="flex items-center gap-1"><Users size={12} /> {summary.players_used} {t('matchAdvanced.playersUsed')}</span>}
          {summary.avg_rating > 0 && <span className="flex items-center gap-1"><Star size={12} /> {t('matchAdvanced.avgRating')}: {summary.avg_rating}</span>}
        </div>
      </div>

      {/* MOTM */}
      {motm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5 mb-6 flex items-center gap-4" data-testid="motm-card">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {motm.photo_url ? (
              <img src={api.fileUrl(motm.photo_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <Star size={20} className="text-amber-400" />
            )}
          </div>
          <div>
            <p className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold mb-0.5">{t('matchAdvanced.manOfTheMatch')}</p>
            <p className="font-heading text-lg font-bold text-white">{motm.player_name}</p>
            <p className="text-xs text-zinc-400">{motm.position} &middot; #{motm.jersey_number} &middot; {t('matchAdvanced.rating')}: <span className="text-amber-400 font-bold">{motm.rating}</span></p>
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-3 text-sm">
              {motm.goals > 0 && <span className="text-primary font-bold">{motm.goals} {t('matchAdvanced.goals')}</span>}
              {motm.assists > 0 && <span className="text-blue-400 font-bold">{motm.assists} {t('matchAdvanced.assists')}</span>}
              <span className="text-zinc-400">{motm.minutes_played}'</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      {TABS.length > 0 && (
        <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 mb-6" data-testid="match-tabs">
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} data-testid={`match-tab-${tb.key}`}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
                tab === tb.key ? 'bg-primary text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}>
              <tb.icon size={14} /> {tb.label}
            </button>
          ))}
        </div>
      )}

      {/* Team Stats Tab */}
      {tab === 'stats' && isCompleted && ts.possession && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="team-stats-section">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold text-primary uppercase">{match.team?.name}</span>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t('matchAdvanced.teamStats')}</h3>
            <span className="text-sm font-semibold text-red-400 uppercase">{match.opponent}</span>
          </div>
          <StatBar label={t('matchAdvanced.possession')} home={ts.possession} away={ts.opp_possession} suffix="%" />
          <StatBar label={t('matchAdvanced.shots')} home={ts.shots} away={ts.opp_shots} />
          <StatBar label={t('matchAdvanced.shotsOnTarget')} home={ts.shots_on_target} away={ts.opp_shots_on_target} />
          <StatBar label={t('matchAdvanced.corners')} home={ts.corners} away={ts.opp_corners} />
          <StatBar label={t('matchAdvanced.fouls')} home={ts.fouls} away={ts.opp_fouls} />
          <StatBar label={t('matchAdvanced.passAccuracy')} home={ts.pass_accuracy} away={ts.opp_pass_accuracy || 0} suffix="%" />
          <StatBar label={t('matchAdvanced.saves')} home={ts.saves} away={ts.opp_saves || 0} />
        </div>
      )}
      {tab === 'stats' && isCompleted && !ts.possession && (
        <div className="text-center py-16 text-zinc-500 text-sm">{t('common.noData')}</div>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="timeline-section">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">{t('matchAdvanced.matchEvents')}</h3>
          {events.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[27px] top-0 bottom-0 w-px bg-zinc-800" />
              {events.map((ev, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 mb-4 relative" data-testid={`event-${i}`}>
                  <div className="w-[55px] text-right flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-zinc-300">{ev.minute}'</span>
                  </div>
                  <div className="z-10 flex-shrink-0"><EventIcon type={ev.type} /></div>
                  <div className="flex-1 bg-zinc-950/50 rounded-lg px-4 py-2.5 border border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-semibold tracking-wider ${
                        ev.type === 'goal' ? 'text-primary' : ev.type === 'yellow_card' ? 'text-amber-400' : ev.type === 'red_card' ? 'text-red-400' : 'text-blue-400'
                      }`}>{ev.type === 'goal' ? t('matchAdvanced.goal') : ev.type === 'yellow_card' ? t('matchAdvanced.yellowCard') : ev.type === 'red_card' ? t('matchAdvanced.redCard') : t('matchAdvanced.substitution')}</span>
                      {ev.player_name && <span className="text-sm text-white font-medium">{ev.player_name}</span>}
                    </div>
                    {ev.detail && <p className="text-[11px] text-zinc-500 mt-0.5">{ev.detail}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-zinc-500">{t('matchAdvanced.noEvents')}</p>
          )}
        </div>
      )}

      {/* Heatmap Tab */}
      {tab === 'heatmap' && isCompleted && match.player_stats?.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="heatmap-section">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Player selector */}
            <div className="md:w-56 flex-shrink-0">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">{t('matchAdvanced.selectPlayer')}</h3>
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
                <button onClick={() => setHeatmapPlayer(null)} data-testid="heatmap-all-players"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !heatmapPlayer ? 'bg-primary/20 text-primary border border-primary/30' : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
                  }`}>
                  {t('matchAdvanced.allPlayers')}
                </button>
                {match.player_stats.map((ps, i) => (
                  <button key={i} onClick={() => setHeatmapPlayer(ps)} data-testid={`heatmap-player-${i}`}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      heatmapPlayer?.player_id === ps.player_id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
                    }`}>
                    <span className="w-5 text-[10px] font-mono text-zinc-500">{ps.jersey_number || '-'}</span>
                    <span className="truncate">{ps.player_name}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Pitch with heatmap */}
            <div className="flex-1 flex justify-center">
              <FootballPitch ref={pitchRef} width={PITCH_WIDTH}>
                <defs>
                  <radialGradient id="heat-hot">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="heat-warm">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="60%" stopColor="#22c55e" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="heat-cool">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </radialGradient>
                  <filter id="heat-blur">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                </defs>
                <g filter="url(#heat-blur)" style={{ mixBlendMode: 'screen' }}>
                  {(() => {
                    const playersToShow = heatmapPlayer ? [heatmapPlayer] : match.player_stats;
                    const zones = [];
                    playersToShow.forEach(ps => {
                      (ps.heatmap || []).forEach(z => {
                        const key = `${z.row}-${z.col}`;
                        const existing = zones.find(e => e.key === key);
                        if (existing) { existing.intensity = Math.min(1, existing.intensity + z.intensity * 0.3); }
                        else { zones.push({ ...z, key, intensity: z.intensity }); }
                      });
                    });
                    const pw = PITCH_WIDTH;
                    const ph = pw * PITCH_RATIO;
                    return zones.map((z, i) => {
                      const cx = 20 + ((z.col + 0.5) / 6) * (pw - 40);
                      const cy = 20 + ((z.row + 0.5) / 4) * (ph - 40);
                      const grad = z.intensity > 0.65 ? 'url(#heat-hot)' : z.intensity > 0.35 ? 'url(#heat-warm)' : 'url(#heat-cool)';
                      const r = 25 + z.intensity * 30;
                      return <circle key={i} cx={cx} cy={cy} r={r} fill={grad} opacity={Math.max(0.2, z.intensity)} />;
                    });
                  })()}
                </g>
                {/* Player position dots (small) */}
                {(() => {
                  const pw = PITCH_WIDTH;
                  const ph = pw * PITCH_RATIO;
                  const playersToShow = heatmapPlayer ? [heatmapPlayer] : [];
                  return playersToShow.map((ps, i) => {
                    const maxZone = (ps.heatmap || []).reduce((a, b) => (b.intensity > a.intensity ? b : a), { row: 2, col: 3, intensity: 0 });
                    const cx = 20 + ((maxZone.col + 0.5) / 6) * (pw - 40);
                    const cy = 20 + ((maxZone.row + 0.5) / 4) * (ph - 40);
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="10" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1.5" />
                        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="7" fontWeight="bold">
                          {ps.jersey_number || ''}
                        </text>
                        <text x={cx} y={cy + 18} textAnchor="middle" fill="white" fontSize="7" fontWeight="600"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                          {ps.player_name?.split(' ').pop()}
                        </text>
                      </g>
                    );
                  });
                })()}
              </FootballPitch>
            </div>
          </div>
          {heatmapPlayer && (
            <div className="mt-4 flex items-center gap-4 justify-center text-xs text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/70" /> {t('matchAdvanced.highActivity')}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500/50" /> {t('matchAdvanced.mediumActivity')}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500/30" /> {t('matchAdvanced.lowActivity')}</span>
            </div>
          )}
        </div>
      )}

      {/* Player Ratings Tab */}
      {tab === 'players' && match.player_stats?.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden" data-testid="player-stats-section">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs text-zinc-500 uppercase px-5 py-3.5 w-8">#</th>
              <th className="text-left text-xs text-zinc-500 uppercase px-5 py-3.5">{t('matchAdvanced.player')}</th>
              <th className="text-center text-xs text-zinc-500 uppercase px-3 py-3.5">{t('matchAdvanced.pos')}</th>
              <th className="text-center text-xs text-zinc-500 uppercase px-3 py-3.5">{t('matchAdvanced.mins')}</th>
              <th className="text-center text-xs text-zinc-500 uppercase px-3 py-3.5">{t('matchAdvanced.goals')}</th>
              <th className="text-center text-xs text-zinc-500 uppercase px-3 py-3.5">{t('matchAdvanced.assists')}</th>
              <th className="text-center text-xs text-zinc-500 uppercase px-3 py-3.5">{t('matchAdvanced.cards')}</th>
              <th className="text-center text-xs text-zinc-500 uppercase px-3 py-3.5">{t('matchAdvanced.rating')}</th>
            </tr></thead>
            <tbody>
              {match.player_stats.map((ps, i) => (
                <tr key={i} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${motm && motm.player_id === ps.player_id ? 'bg-amber-500/5' : ''}`}
                  data-testid={`player-stat-row-${i}`}>
                  <td className="px-5 py-3 text-xs text-zinc-500 font-mono">{ps.jersey_number || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-400 overflow-hidden flex-shrink-0">
                        {ps.photo_url ? <img src={api.fileUrl(ps.photo_url)} alt="" className="w-full h-full object-cover" /> : `${ps.player_name?.split(' ').map(n => n[0]).join('')}`}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{ps.player_name}</p>
                        {motm && motm.player_id === ps.player_id && (
                          <span className="text-[9px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1"><Star size={8} /> MOTM</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center"><span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{ps.position?.substring(0, 3)?.toUpperCase()}</span></td>
                  <td className="px-3 py-3 text-center text-sm text-zinc-300 font-mono">{ps.minutes_played}'</td>
                  <td className="px-3 py-3 text-center text-sm font-semibold">{ps.goals > 0 ? <span className="text-primary">{ps.goals}</span> : <span className="text-zinc-600">0</span>}</td>
                  <td className="px-3 py-3 text-center text-sm">{ps.assists > 0 ? <span className="text-blue-400">{ps.assists}</span> : <span className="text-zinc-600">0</span>}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {ps.yellow_cards > 0 && <div className="w-3 h-4 bg-amber-400 rounded-sm" title="Yellow card" />}
                      {ps.red_cards > 0 && <div className="w-3 h-4 bg-red-500 rounded-sm" title="Red card" />}
                      {!ps.yellow_cards && !ps.red_cards && <span className="text-zinc-600 text-sm">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-md ${
                      ps.rating >= 8 ? 'bg-green-500/15 text-green-400' :
                      ps.rating >= 7 ? 'bg-primary/15 text-primary' :
                      ps.rating >= 6 ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>{ps.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Summary row */}
          <div className="flex items-center justify-around py-4 px-5 bg-zinc-950/50 border-t border-zinc-800 text-xs">
            <span className="text-zinc-500">{t('matchAdvanced.totalGoals')}: <span className="text-primary font-bold">{summary.total_goals}</span></span>
            <span className="text-zinc-500">{t('matchAdvanced.totalAssists')}: <span className="text-blue-400 font-bold">{summary.total_assists}</span></span>
            <span className="text-zinc-500">{t('matchAdvanced.yellowCards')}: <span className="text-amber-400 font-bold">{summary.total_yellows}</span></span>
            <span className="text-zinc-500">{t('matchAdvanced.avgRating')}: <span className="text-white font-bold">{summary.avg_rating}</span></span>
          </div>
        </div>
      )}

      {/* Notes */}
      {match.notes && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mt-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">{t('common.notes')}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{match.notes}</p>
        </div>
      )}
    </div>
  );
}
