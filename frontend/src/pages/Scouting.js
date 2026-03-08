import React, { useEffect, useState } from 'react';
import api from '../api';
import { Search, Plus, Loader2, Star, TrendingUp } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function Scouting() {
  const [evaluations, setEvaluations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ player_id: '', technical: 5, tactical: 5, physical: 5, mental: 5, overall: 5, notes: '', recommendation: 'monitor' });

  useEffect(() => {
    Promise.all([
      api.get('/api/scouting'),
      api.get('/api/players')
    ]).then(([e, p]) => { setEvaluations(e); setPlayers(p); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const ev = await api.post('/api/scouting', form);
      const player = players.find(p => p.id === form.player_id);
      if (player) {
        ev.player_name = `${player.first_name} ${player.last_name}`;
        ev.position = player.position;
        ev.category = player.category;
      }
      setEvaluations([ev, ...evaluations]);
      setShowCreate(false);
      setForm({ player_id: '', technical: 5, tactical: 5, physical: 5, mental: 5, overall: 5, notes: '', recommendation: 'monitor' });
    } catch (err) { console.error(err); }
  };

  const recColors = { star_potential: 'text-amber-400 bg-amber-500/10', promote: 'text-green-400 bg-green-500/10', develop: 'text-blue-400 bg-blue-500/10', monitor: 'text-zinc-400 bg-zinc-800' };

  return (
    <div data-testid="scouting-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Scouting</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">Player Evaluations</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-evaluation-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
          <Plus size={16} /> New Evaluation
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-evaluation-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">New Evaluation</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={form.player_id} onChange={e => setForm({...form, player_id: e.target.value})} required
                className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select Player</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.category})</option>)}
              </select>
              <select value={form.recommendation} onChange={e => setForm({...form, recommendation: e.target.value})}
                className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="star_potential">Star Potential</option>
                <option value="promote">Promote</option>
                <option value="develop">Develop</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {['technical', 'tactical', 'physical', 'mental', 'overall'].map(k => (
                <div key={k}>
                  <label className="text-xs text-zinc-500 uppercase block mb-1">{k}</label>
                  <input type="range" min="1" max="10" value={form[k]} onChange={e => setForm({...form, [k]: parseInt(e.target.value)})}
                    className="w-full accent-primary" />
                  <p className="text-center text-sm font-semibold text-white">{form[k]}</p>
                </div>
              ))}
            </div>
            <textarea placeholder="Notes & observations..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none" />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90">Submit</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="evaluations-grid">
          {evaluations.map((ev, i) => {
            const radarData = [
              { attr: 'Technical', val: ev.technical },
              { attr: 'Tactical', val: ev.tactical },
              { attr: 'Physical', val: ev.physical },
              { attr: 'Mental', val: ev.mental },
            ];
            return (
              <motion.div key={ev.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all" data-testid={`evaluation-card-${i}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{ev.player_name || 'Unknown'}</p>
                    <p className="text-xs text-zinc-500">{ev.position} &middot; {ev.category}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-md ${recColors[ev.recommendation] || 'bg-zinc-800 text-zinc-400'}`}>
                    {ev.recommendation === 'star_potential' && <Star size={11} className="inline mr-1 -mt-0.5" />}
                    {ev.recommendation?.replace('_', ' ')}
                  </span>
                </div>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="attr" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar dataKey="val" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-2 px-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{ev.overall}</p>
                    <p className="text-[10px] text-zinc-500">Overall</p>
                  </div>
                  <p className="text-xs text-zinc-500">{ev.evaluator_name}</p>
                </div>
                {ev.notes && <p className="text-xs text-zinc-400 mt-3 border-t border-zinc-800 pt-3 line-clamp-2">{ev.notes}</p>}
              </motion.div>
            );
          })}
          {evaluations.length === 0 && <p className="col-span-full text-center py-10 text-sm text-zinc-500">No evaluations yet</p>}
        </div>
      )}
    </div>
  );
}
