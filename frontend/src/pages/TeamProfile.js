import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Shield, Users, Dumbbell, Swords, Loader2 } from 'lucide-react';

export default function TeamProfile() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/teams/${id}`).then(setTeam).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!team) return <p className="text-center py-20 text-zinc-500">Team not found</p>;

  return (
    <div data-testid="team-profile-page">
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Teams
      </Link>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${team.color}20` }}>
            <Shield size={28} style={{ color: team.color }} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-white uppercase">{team.name}</h1>
            <p className="text-sm text-zinc-400 mt-1">{team.category} &middot; {team.players?.length || 0} players</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="team-roster">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary" />
            <h3 className="font-heading text-lg font-semibold text-white uppercase">Roster</h3>
          </div>
          {team.players?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">#</th>
                  <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">Name</th>
                  <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">Position</th>
                  <th className="text-left text-xs text-zinc-500 uppercase px-4 py-2">Status</th>
                </tr></thead>
                <tbody>
                  {team.players.map((p, i) => (
                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="px-4 py-3 text-sm text-zinc-400 font-mono">{p.jersey_number || '-'}</td>
                      <td className="px-4 py-3">
                        <Link to={`/players/${p.id}`} className="text-sm text-white hover:text-primary transition-colors">{p.first_name} {p.last_name}</Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{p.position}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-zinc-500">No players assigned</p>}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="team-training-history">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell size={18} className="text-amber-400" />
              <h3 className="font-heading text-base font-semibold text-white uppercase">Recent Training</h3>
            </div>
            {team.training_sessions?.length > 0 ? (
              <div className="space-y-2">
                {team.training_sessions.map((s, i) => (
                  <div key={i} className="bg-zinc-950 rounded-lg p-3">
                    <p className="text-sm text-white">{s.title}</p>
                    <p className="text-xs text-zinc-500">{s.date} &middot; {s.start_time}-{s.end_time}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No training sessions</p>}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="team-matches-history">
            <div className="flex items-center gap-2 mb-4">
              <Swords size={18} className="text-blue-400" />
              <h3 className="font-heading text-base font-semibold text-white uppercase">Recent Matches</h3>
            </div>
            {team.matches?.length > 0 ? (
              <div className="space-y-2">
                {team.matches.map((m, i) => (
                  <Link key={i} to={`/matches/${m.id}`} className="block bg-zinc-950 rounded-lg p-3 hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">vs {m.opponent}</p>
                      {m.home_score !== null && <span className="text-sm font-semibold text-white">{m.home_score}-{m.away_score}</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{m.date} &middot; {m.status}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-zinc-500">No matches</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
