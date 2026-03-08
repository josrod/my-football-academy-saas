import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Shield, Plus, Users, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Teams() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'U12', description: '', color: '#22c55e' });

  useEffect(() => {
    api.get('/api/teams').then(setTeams).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const t = await api.post('/api/teams', form);
      t.player_count = 0;
      setTeams([...teams, t]);
      setShowCreate(false);
      setForm({ name: '', category: 'U12', description: '', color: '#22c55e' });
    } catch (err) { console.error(err); }
  };

  return (
    <div data-testid="teams-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('teams.title')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('teams.management')}</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-team-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
          <Plus size={16} /> {t('teams.addTeam')}
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-team-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">{t('teams.newTeam')}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Team Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option>U10</option><option>U12</option><option>U14</option><option>U16</option><option>U18</option>
            </select>
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary md:col-span-2" />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90">Save</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="teams-grid">
          {teams.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/teams/${t.id}`} data-testid={`team-card-${i}`}
                className="block bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.color}20` }}>
                    <Shield size={20} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{t.name}</h3>
                    <p className="text-xs text-zinc-500">{t.category}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-400">{t.player_count} {t('teams.players')}</span>
                </div>
              </Link>
            </motion.div>
          ))}
          {teams.length === 0 && <p className="col-span-full text-center py-10 text-sm text-zinc-500">{t('teams.noTeams')}</p>}
        </div>
      )}
    </div>
  );
}
