import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Swords, Plus, Loader2, MapPin, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ team_id: '', opponent: '', date: '', time: '15:00', location: 'Home Stadium', type: 'league' });

  useEffect(() => {
    Promise.all([
      api.get(`/api/matches?team_id=${teamFilter}&status=${statusFilter}`),
      api.get('/api/teams')
    ]).then(([m, t]) => { setMatches(m); setTeams(t); }).catch(console.error).finally(() => setLoading(false));
  }, [teamFilter, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const m = await api.post('/api/matches', form);
      setMatches([m, ...matches]);
      setShowCreate(false);
    } catch (err) { console.error(err); }
  };

  return (
    <div data-testid="matches-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Matches</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">Match Center</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-match-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
          <Plus size={16} /> New Match
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-match-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">New Match</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} required
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input placeholder="Opponent" required value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="league">League</option><option value="cup">Cup</option><option value="friendly">Friendly</option><option value="tournament">Tournament</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3" data-testid="matches-list">
          {matches.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/matches/${m.id}`} data-testid={`match-card-${i}`}
                className="block bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Swords size={20} className={m.status === 'completed' ? 'text-blue-400' : 'text-zinc-500'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{m.team_name || 'Team'}</span>
                        <span className="text-xs text-zinc-500">vs</span>
                        <span className="text-sm font-medium text-white">{m.opponent}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Clock size={11} /> {m.date} {m.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {m.location}</span>
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{m.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {m.status === 'completed' && m.home_score !== null && (
                      <div className="text-center">
                        <span className="font-heading text-2xl font-bold text-white">{m.home_score} - {m.away_score}</span>
                      </div>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-md ${m.status === 'completed' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {m.status}
                    </span>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {matches.length === 0 && <p className="text-center py-10 text-sm text-zinc-500">No matches scheduled</p>}
        </div>
      )}
    </div>
  );
}
