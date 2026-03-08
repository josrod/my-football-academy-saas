import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Swords, Loader2, MapPin, Clock, Trophy } from 'lucide-react';

export default function MatchReport() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/matches/${id}`).then(setMatch).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!match) return <p className="text-center py-20 text-zinc-500">Match not found</p>;

  return (
    <div data-testid="match-report-page">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Matches
      </Link>

      {/* Match header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-6 text-center" data-testid="match-header">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">{match.type} &middot; {match.date}</p>
        <div className="flex items-center justify-center gap-8">
          <div>
            <p className="font-heading text-xl font-bold text-white uppercase">{match.team?.name || 'Team'}</p>
          </div>
          {match.home_score !== null ? (
            <div className="bg-zinc-950 rounded-xl px-8 py-4">
              <span className="font-heading text-4xl font-bold text-white">{match.home_score} - {match.away_score}</span>
            </div>
          ) : (
            <div className="bg-zinc-950 rounded-xl px-8 py-4">
              <span className="font-heading text-2xl font-bold text-zinc-500">vs</span>
            </div>
          )}
          <div>
            <p className="font-heading text-xl font-bold text-white uppercase">{match.opponent}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Clock size={12} /> {match.time}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {match.location}</span>
          <span className={`px-2.5 py-1 rounded-md ${match.status === 'completed' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {match.status}
          </span>
        </div>
      </div>

      {/* Player stats */}
      {match.player_stats?.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="match-player-stats">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">Player Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">Player</th>
                <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">Position</th>
                <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Mins</th>
                <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Goals</th>
                <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Assists</th>
                <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">YC</th>
                <th className="text-center text-xs text-zinc-500 uppercase px-4 py-2">Rating</th>
              </tr></thead>
              <tbody>
                {match.player_stats.map((ps, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-sm text-white">{ps.player_name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{ps.position}</td>
                    <td className="px-4 py-3 text-sm text-white text-center">{ps.minutes_played}'</td>
                    <td className="px-4 py-3 text-sm text-white text-center font-semibold">
                      {ps.goals > 0 ? <span className="text-primary">{ps.goals}</span> : '0'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-center">{ps.assists}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {ps.yellow_cards > 0 ? <span className="inline-block w-3 h-4 bg-amber-400 rounded-sm" /> : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${ps.rating >= 7 ? 'text-primary' : ps.rating >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                        {ps.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {match.notes && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mt-6">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-2">Notes</h3>
          <p className="text-sm text-zinc-400">{match.notes}</p>
        </div>
      )}
    </div>
  );
}
