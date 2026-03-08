import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { Search, Filter, Plus, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatus(s);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      api.get(`/api/players?search=${search}&category=${category}&status=${status}&team_id=${teamFilter}`),
      api.get('/api/teams')
    ]).then(([p, t]) => { setPlayers(p); setTeams(t); }).catch(console.error).finally(() => setLoading(false));
  }, [search, category, status, teamFilter]);

  const teamMap = {};
  teams.forEach(t => { teamMap[t.id] = t.name; });

  const [form, setForm] = useState({ first_name: '', last_name: '', date_of_birth: '', position: 'Midfielder', category: 'U12', team_id: '', jersey_number: '', preferred_foot: 'right' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newPlayer = await api.post('/api/players', { ...form, jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null });
      setPlayers([newPlayer, ...players]);
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', date_of_birth: '', position: 'Midfielder', category: 'U12', team_id: '', jersey_number: '', preferred_foot: 'right' });
    } catch (err) { console.error(err); }
  };

  return (
    <div data-testid="players-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Players</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">Player Management</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-player-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
          <Plus size={16} /> Add Player
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6" data-testid="players-filters">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} data-testid="players-search-input"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search players..." />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} data-testid="players-category-filter"
          className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Categories</option>
          <option value="U10">U10</option><option value="U12">U12</option><option value="U14">U14</option><option value="U16">U16</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} data-testid="players-status-filter"
          className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Status</option>
          <option value="active">Active</option><option value="injured">Injured</option>
        </select>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} data-testid="players-team-filter"
          className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Create form modal */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-player-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">New Player</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="First Name" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Last Name" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="date" required value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
            </select>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option>U10</option><option>U12</option><option>U14</option><option>U16</option>
            </select>
            <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input placeholder="Jersey #" type="number" value={form.jersey_number} onChange={e => setForm({...form, jersey_number: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.preferred_foot} onChange={e => setForm({...form, preferred_foot: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="right">Right</option><option value="left">Left</option><option value="both">Both</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-all">Save</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700 transition-all">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden" data-testid="players-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">#</th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Name</th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Position</th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Category</th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Team</th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5">Status</th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider font-medium px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-zinc-400 font-mono">{p.jersey_number || '-'}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/players/${p.id}`} className="text-sm font-medium text-white hover:text-primary transition-colors" data-testid={`player-link-${i}`}>
                        {p.first_name} {p.last_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">{p.position}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md font-medium">{p.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">{teamMap[p.team_id] || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : p.status === 'injured' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {p.status === 'injured' && <AlertCircle size={11} className="inline mr-1 -mt-0.5" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/players/${p.id}`} className="text-zinc-500 hover:text-white"><ChevronRight size={16} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {players.length === 0 && <p className="text-center py-10 text-sm text-zinc-500">No players found</p>}
          <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-500">{players.length} players</div>
        </div>
      )}
    </div>
  );
}
