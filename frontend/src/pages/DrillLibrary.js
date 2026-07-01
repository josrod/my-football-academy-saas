import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Loader2, Plus, Search, Clock, Users, Dumbbell, Target, Shield, Heart, Flame, ChevronDown, X, Trash2, BookOpen, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_META = {
  technical: { icon: Target, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  tactical: { icon: Shield, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  physical: { icon: Flame, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  goalkeeper: { icon: Heart, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  warmup: { icon: Dumbbell, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
};

const DIFFICULTY_COLOR = {
  beginner: 'text-green-400 bg-green-500/10',
  intermediate: 'text-amber-400 bg-amber-500/10',
  advanced: 'text-red-400 bg-red-500/10',
};

function DrillCard({ drill, onClick, onDelete, isOwn }) {
  const { t } = useTranslation();
  const meta = CATEGORY_META[drill.category] || CATEGORY_META.technical;
  const Icon = meta.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(drill)}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all cursor-pointer group"
      data-testid={`drill-card-${drill.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg border ${meta.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${DIFFICULTY_COLOR[drill.difficulty] || ''}`}>
            {t(`drills.${drill.difficulty}`)}
          </span>
          {isOwn && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(drill.id); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-primary transition-colors">{drill.name}</h3>
      <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{drill.description}</p>
      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><Clock size={10} /> {drill.duration_minutes} min</span>
        <span className="flex items-center gap-1"><Users size={10} /> {drill.min_players}-{drill.max_players}</span>
        <span className={`px-1.5 py-0.5 rounded border ${meta.color} text-[9px] uppercase font-semibold`}>
          {t(`drills.cat_${drill.category}`)}
        </span>
      </div>
    </motion.div>
  );
}

function DrillDetail({ drill, onClose }) {
  const { t } = useTranslation();
  if (!drill) return null;
  const meta = CATEGORY_META[drill.category] || CATEGORY_META.technical;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} data-testid="drill-detail-modal">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${meta.color}`}>
              <meta.icon size={18} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white">{drill.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${DIFFICULTY_COLOR[drill.difficulty]}`}>
                  {t(`drills.${drill.difficulty}`)}
                </span>
                <span className="text-xs text-zinc-500">{t(`drills.cat_${drill.category}`)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <p className="text-sm text-zinc-300 leading-relaxed">{drill.description}</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: t('drills.duration'), value: `${drill.duration_minutes} min`, icon: Clock },
              { label: t('drills.players'), value: `${drill.min_players}-${drill.max_players}`, icon: Users },
              { label: t('drills.minAge'), value: `${drill.min_age}+`, icon: Dumbbell },
              { label: t('drills.category'), value: t(`drills.cat_${drill.category}`), icon: meta.icon },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-800/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-center">
                <s.icon size={14} className="text-zinc-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-white">{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Equipment */}
          {drill.equipment?.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">{t('drills.equipment')}</h3>
              <div className="flex flex-wrap gap-2">
                {drill.equipment.map((eq, i) => (
                  <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700">{eq}</span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {drill.instructions?.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">{t('drills.instructions')}</h3>
              <ol className="space-y-2">
                {drill.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">
                      {i + 1}
                    </span>
                    <span className="text-sm text-zinc-300 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tags */}
          {drill.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {drill.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/50 border border-zinc-800 px-2 py-0.5 rounded">
                  <Tag size={8} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DrillLibrary() {
  const { t } = useTranslation();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: 'technical', difficulty: 'intermediate',
    duration_minutes: 15, min_players: 4, max_players: 16, min_age: 8,
    equipment: '', instructions: '', tags: ''
  });

  const fetchDrills = () => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (difficultyFilter) params.set('difficulty', difficultyFilter);
    if (search) params.set('search', search);
    api.get(`/api/drills?${params}`).then(setDrills).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrills(); }, [categoryFilter, difficultyFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchDrills();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      duration_minutes: parseInt(form.duration_minutes),
      min_players: parseInt(form.min_players),
      max_players: parseInt(form.max_players),
      min_age: parseInt(form.min_age),
      equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean),
      instructions: form.instructions.split('\n').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      const created = await api.post('/api/drills', data);
      setDrills(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', category: 'technical', difficulty: 'intermediate', duration_minutes: 15, min_players: 4, max_players: 16, min_age: 8, equipment: '', instructions: '', tags: '' });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/drills/${id}`);
    setDrills(prev => prev.filter(d => d.id !== id));
  };

  const categories = ['technical', 'tactical', 'physical', 'goalkeeper', 'warmup'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="drill-library-page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('drills.library')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('drills.title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('drills.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="create-drill-btn"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
          <Plus size={16} /> {t('drills.createDrill')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('drills.searchPlaceholder')}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
            data-testid="drill-search-input" />
        </form>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter('')}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${!categoryFilter ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
            data-testid="filter-all">{t('drills.all')}</button>
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            return (
              <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  categoryFilter === cat ? `${meta.color}` : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`} data-testid={`filter-${cat}`}>
                <meta.icon size={12} /> {t(`drills.cat_${cat}`)}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {difficulties.map(d => (
            <button key={d} onClick={() => setDifficultyFilter(difficultyFilter === d ? '' : d)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                difficultyFilter === d ? DIFFICULTY_COLOR[d] + ' border-current' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`} data-testid={`filter-${d}`}>
              {t(`drills.${d}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6">
            <form onSubmit={handleCreate} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4" data-testid="create-drill-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.drillName')}</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" data-testid="drill-name-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.category')}</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" data-testid="drill-category-select">
                      {categories.map(c => <option key={c} value={c}>{t(`drills.cat_${c}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.difficultyLabel')}</label>
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" data-testid="drill-difficulty-select">
                      {difficulties.map(d => <option key={d} value={d}>{t(`drills.${d}`)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.descLabel')}</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" data-testid="drill-desc-input" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.duration')} (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.minPlayersLabel')}</label>
                  <input type="number" value={form.min_players} onChange={e => setForm({ ...form, min_players: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.maxPlayersLabel')}</label>
                  <input type="number" value={form.max_players} onChange={e => setForm({ ...form, max_players: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.minAge')}</label>
                  <input type="number" value={form.min_age} onChange={e => setForm({ ...form, min_age: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.instructionsLabel')}</label>
                <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={4}
                  placeholder={t('drills.instructionsPlaceholder')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500" data-testid="drill-instructions-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.equipmentLabel')}</label>
                  <input value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} placeholder="cones, balls, bibs"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase mb-1 block">{t('drills.tagsLabel')}</label>
                  <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="passing, warm-up, speed"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800">{t('common.cancel')}</button>
                <button type="submit" data-testid="save-drill-btn"
                  className="px-6 py-2 bg-primary text-black text-xs font-bold uppercase rounded-lg hover:bg-primary/90">{t('common.save')}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-6 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><BookOpen size={12} /> {drills.length} {t('drills.exercises')}</span>
        {categoryFilter && <span className="bg-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">{t(`drills.cat_${categoryFilter}`)} <button onClick={() => setCategoryFilter('')}><X size={10} /></button></span>}
        {difficultyFilter && <span className="bg-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">{t(`drills.${difficultyFilter}`)} <button onClick={() => setDifficultyFilter('')}><X size={10} /></button></span>}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {drills.map(d => (
          <DrillCard key={d.id} drill={d} onClick={setSelectedDrill} onDelete={handleDelete}
            isOwn={d.club_id !== 'global'} />
        ))}
      </div>

      {drills.length === 0 && (
        <div className="text-center py-20 text-zinc-500 text-sm">{t('drills.noDrills')}</div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDrill && <DrillDetail drill={selectedDrill} onClose={() => setSelectedDrill(null)} />}
      </AnimatePresence>
    </div>
  );
}
