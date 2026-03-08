import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Plus, Loader2, Calendar, Trophy, Dumbbell, ChevronRight, Check, Clock, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_MAP = {
  active: { icon: PlayCircle, cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  completed: { icon: Check, cls: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30' },
  upcoming: { icon: Clock, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export default function Seasons() {
  const { t } = useTranslation();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', description: '', status: 'upcoming' });

  useEffect(() => {
    api.get('/api/seasons').then(setSeasons).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const ns = await api.post('/api/seasons', form);
      setSeasons([ns, ...seasons]);
      setShowCreate(false);
      setForm({ name: '', start_date: '', end_date: '', description: '', status: 'upcoming' });
    } catch (err) { console.error(err); }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/api/seasons/${id}`, { status: 'active' });
      const updated = await api.get('/api/seasons');
      setSeasons(updated);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/seasons/${id}`);
      setSeasons(seasons.filter(s => s.id !== id));
    } catch (err) { console.error(err); }
  };

  const inputCls = "bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary";

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="seasons-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('seasons.title')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('seasons.management')}</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-season-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
          <Plus size={16} /> {t('seasons.addSeason')}
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-season-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">{t('seasons.newSeason')}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder={t('seasons.seasonName')} required value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} className={inputCls} data-testid="season-name-input" />
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls} data-testid="season-status-select">
              <option value="upcoming">{t('seasons.upcoming')}</option>
              <option value="active">{t('seasons.active')}</option>
              <option value="completed">{t('seasons.completed')}</option>
            </select>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{t('seasons.startDate')}</label>
              <input type="date" required value={form.start_date}
                onChange={e => setForm({...form, start_date: e.target.value})} className={inputCls + ' w-full'} data-testid="season-start-date-input" />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">{t('seasons.endDate')}</label>
              <input type="date" required value={form.end_date}
                onChange={e => setForm({...form, end_date: e.target.value})} className={inputCls + ' w-full'} data-testid="season-end-date-input" />
            </div>
            <div className="md:col-span-2">
              <textarea placeholder={t('common.description')} value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className={inputCls + ' w-full h-20 resize-none'} data-testid="season-description-input" />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" data-testid="season-create-submit"
                className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90">{t('common.save')}</button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">{t('common.cancel')}</button>
            </div>
          </form>
        </motion.div>
      )}

      {seasons.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={36} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">{t('seasons.noSeasons')}</p>
        </div>
      ) : (
        <div className="space-y-4" data-testid="seasons-list">
          {seasons.map((season, i) => {
            const st = STATUS_MAP[season.status] || STATUS_MAP.upcoming;
            const Icon = st.icon;
            const stats = season.stats || {};
            return (
              <motion.div key={season.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group"
                data-testid={`season-card-${i}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${st.cls}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <Link to={`/seasons/${season.id}`}
                          className="font-heading text-xl font-bold text-white uppercase hover:text-primary transition-colors"
                          data-testid={`season-link-${i}`}>
                          {season.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500">{season.start_date}</span>
                          <span className="text-xs text-zinc-600">&rarr;</span>
                          <span className="text-xs text-zinc-500">{season.end_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${st.cls}`}>
                        {t(`seasons.${season.status}`)}
                      </span>
                      {season.status !== 'active' && (
                        <button onClick={() => handleActivate(season.id)} data-testid={`activate-season-${i}`}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-medium">
                          {t('seasons.setActive')}
                        </button>
                      )}
                      <button onClick={() => handleDelete(season.id)} data-testid={`delete-season-${i}`}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium">
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                  {season.description && (
                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{season.description}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-950/50 rounded-lg px-4 py-3 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy size={12} className="text-primary" />
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{t('seasons.matchesPlayed')}</span>
                      </div>
                      <span className="text-lg font-heading font-bold text-white">{stats.matches || 0}</span>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg px-4 py-3 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Dumbbell size={12} className="text-primary" />
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{t('seasons.trainingSessions')}</span>
                      </div>
                      <span className="text-lg font-heading font-bold text-white">{stats.training_sessions || 0}</span>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg px-4 py-3 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{t('seasons.record')}</span>
                      </div>
                      <span className="text-lg font-heading font-bold text-white">
                        <span className="text-green-400">{stats.wins || 0}</span>
                        <span className="text-zinc-600 mx-1">-</span>
                        <span className="text-zinc-400">{stats.draws || 0}</span>
                        <span className="text-zinc-600 mx-1">-</span>
                        <span className="text-red-400">{stats.losses || 0}</span>
                      </span>
                    </div>
                    <Link to={`/seasons/${season.id}`}
                      className="bg-zinc-950/50 rounded-lg px-4 py-3 border border-zinc-800/50 flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-primary hover:border-primary/30 transition-all">
                      {t('seasons.viewDetails')} <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
