import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Loader2, ChevronLeft, ChevronRight, Save, Trash2, Plus, Clock, Target, Shield, Flame, Heart, Dumbbell, X, CalendarDays, GripVertical, Copy, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CAT_ICON = { technical: Target, tactical: Shield, physical: Flame, goalkeeper: Heart, warmup: Dumbbell };
const CAT_COLOR = {
  technical: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  tactical: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  physical: 'bg-red-500/10 border-red-500/30 text-red-400',
  goalkeeper: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  warmup: 'bg-green-500/10 border-green-500/30 text-green-400',
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d;
}

function DrillPill({ drill, onRemove, draggable }) {
  const Icon = CAT_ICON[drill.category] || Target;
  const color = CAT_COLOR[drill.category] || CAT_COLOR.technical;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...drill, _from: 'plan' }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div draggable={draggable} onDragStart={handleDragStart}
      className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 text-xs group transition-all ${color} cursor-grab active:cursor-grabbing`}
      data-testid={`plan-drill-${drill.id || drill.drill_id}`}>
      <Icon size={11} className="flex-shrink-0" />
      <span className="truncate flex-1 font-medium">{drill.name}</span>
      <span className="text-[9px] opacity-60">{drill.duration_minutes}m</span>
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all flex-shrink-0">
          <X size={11} />
        </button>
      )}
    </div>
  );
}

function DayColumn({ dayIndex, dayDate, drills, onAddDrill, onRemoveDrill, dayLabel, t }) {
  const isToday = new Date().toDateString() === dayDate.toDateString();
  const totalMin = drills.reduce((s, d) => s + (d.duration_minutes || 0), 0);

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const drill = JSON.parse(e.dataTransfer.getData('application/json'));
      onAddDrill(dayIndex, drill);
    } catch {}
  };

  return (
    <div className={`flex flex-col rounded-xl border transition-colors ${
      isToday ? 'border-primary/30 bg-primary/[0.02]' : 'border-zinc-800 bg-zinc-900/30'
    }`} onDragOver={handleDragOver} onDrop={handleDrop} data-testid={`day-column-${dayIndex}`}>
      {/* Day Header */}
      <div className={`px-3 py-2.5 border-b text-center ${isToday ? 'border-primary/20 bg-primary/5' : 'border-zinc-800'}`}>
        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isToday ? 'text-primary' : 'text-zinc-500'}`}>{dayLabel}</p>
        <p className={`text-sm font-mono ${isToday ? 'text-white font-bold' : 'text-zinc-400'}`}>
          {dayDate.getDate()}/{dayDate.getMonth() + 1}
        </p>
      </div>

      {/* Drills area */}
      <div className="flex-1 p-2 space-y-1.5 min-h-[140px]">
        {drills.map((drill, i) => (
          <DrillPill key={`${drill.drill_id || drill.id}-${i}`} drill={drill} draggable
            onRemove={() => onRemoveDrill(dayIndex, i)} />
        ))}
        {drills.length === 0 && (
          <div className="flex items-center justify-center h-full text-[10px] text-zinc-600 italic">
            {t('planner.dropHere')}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-800/50 flex items-center justify-between">
        <span className="text-[9px] text-zinc-500 flex items-center gap-1">
          <Clock size={9} /> {totalMin}m
        </span>
        <span className="text-[9px] text-zinc-500">{drills.length} {t('drills.exercises')}</span>
      </div>
    </div>
  );
}

export default function WeeklyTrainingPlanner() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [drills, setDrills] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [days, setDays] = useState([[], [], [], [], [], [], []]);
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [drillFilter, setDrillFilter] = useState('');
  const [dupOpen, setDupOpen] = useState(false);
  const [dupTeam, setDupTeam] = useState('');
  const [dupWeek, setDupWeek] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [saveTplName, setSaveTplName] = useState('');
  const [saveTplDesc, setSaveTplDesc] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);

  const DAY_LABELS = [
    t('planner.mon'), t('planner.tue'), t('planner.wed'),
    t('planner.thu'), t('planner.fri'), t('planner.sat'), t('planner.sun')
  ];

  useEffect(() => {
    Promise.all([api.get('/api/teams'), api.get('/api/drills')])
      .then(([t, d]) => { setTeams(t); setDrills(d); if (t.length) setSelectedTeam(t[0].id); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadPlans = useCallback(async () => {
    if (!selectedTeam) return;
    const plans = await api.get(`/api/training-plans?team_id=${selectedTeam}&week_start=${weekStart}`);
    setSavedPlans(plans);
    if (plans.length > 0) {
      const plan = plans[0];
      setPlanId(plan.id);
      setPlanName(plan.name || '');
      setDays(plan.days || [[], [], [], [], [], [], []]);
    } else {
      setPlanId(null);
      setPlanName('');
      setDays([[], [], [], [], [], [], []]);
    }
  }, [selectedTeam, weekStart]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleAddDrill = (dayIdx, drill) => {
    setDays(prev => {
      const next = prev.map(d => [...d]);
      next[dayIdx].push({
        drill_id: drill.id || drill.drill_id,
        name: drill.name,
        category: drill.category,
        duration_minutes: drill.duration_minutes,
        difficulty: drill.difficulty,
      });
      return next;
    });
  };

  const handleRemoveDrill = (dayIdx, drillIdx) => {
    setDays(prev => {
      const next = prev.map(d => [...d]);
      next[dayIdx].splice(drillIdx, 1);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedTeam) return;
    setSaving(true);
    try {
      if (planId) {
        await api.put(`/api/training-plans/${planId}`, { days, name: planName });
      } else {
        const res = await api.post('/api/training-plans', { team_id: selectedTeam, week_start: weekStart, name: planName, days });
        setPlanId(res.id);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!planId) return;
    await api.delete(`/api/training-plans/${planId}`);
    setPlanId(null);
    setPlanName('');
    setDays([[], [], [], [], [], [], []]);
  };

  const handleDuplicate = async () => {
    if (!planId) return;
    setDuplicating(true);
    try {
      const res = await api.post(`/api/training-plans/${planId}/duplicate`, {
        target_team_id: dupTeam || selectedTeam,
        target_week_start: dupWeek || weekStart,
      });
      setDupOpen(false);
      setSelectedTeam(res.team_id);
      setWeekStart(res.week_start);
    } catch (e) { console.error(e); }
    setDuplicating(false);
  };

  const openTemplates = async () => {
    setTplOpen(true);
    if (templates.length) return;
    setTplLoading(true);
    try {
      const data = await api.get('/api/training-plan-templates');
      setTemplates(data);
    } catch (e) { console.error(e); }
    setTplLoading(false);
  };

  const applyTemplate = (tpl) => {
    setDays(tpl.days.map(d => [...d]));
    setPlanName(tpl.name);
    setPlanId(null);
    setTplOpen(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!saveTplName.trim()) return;
    setSavingTpl(true);
    try {
      const res = await api.post('/api/training-plan-templates/custom', {
        name: saveTplName.trim(),
        description: saveTplDesc.trim(),
        days,
      });
      setTemplates(prev => [...prev, res]);
      setSaveTplOpen(false);
      setSaveTplName('');
      setSaveTplDesc('');
    } catch (e) { console.error(e); }
    setSavingTpl(false);
  };

  const handleDeleteTemplate = async (tplId) => {
    try {
      await api.delete(`/api/training-plan-templates/custom/${tplId}`);
      setTemplates(prev => prev.filter(t => t.id !== tplId));
    } catch (e) { console.error(e); }
  };

  const navigateWeek = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const totalDrills = days.flat().length;
  const totalMinutes = days.flat().reduce((s, d) => s + (d.duration_minutes || 0), 0);
  const filteredDrills = drillFilter ? drills.filter(d => d.category === drillFilter) : drills;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="weekly-planner-page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('planner.subtitle')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('planner.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openTemplates} data-testid="templates-btn"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition-colors">
            <LayoutTemplate size={13} /> {t('planner.templates')}
          </button>
          {totalDrills > 0 && (
            <button onClick={() => { setSaveTplName(planName || ''); setSaveTplDesc(''); setSaveTplOpen(true); }} data-testid="save-as-template-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors">
              <Plus size={13} /> {t('planner.saveAsTemplate')}
            </button>
          )}
          {planId && (
            <button onClick={() => { setDupTeam(selectedTeam); setDupWeek(''); setDupOpen(true); }} data-testid="duplicate-plan-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 transition-colors">
              <Copy size={13} /> {t('planner.duplicate')}
            </button>
          )}
          {planId && (
            <button onClick={handleDelete} data-testid="delete-plan-btn"
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
              <Trash2 size={13} /> {t('common.delete')}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} data-testid="save-plan-btn"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-black text-xs font-bold uppercase rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {t('common.save')}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} data-testid="planner-team-select"
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50">
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg px-1 py-1">
          <button onClick={() => navigateWeek(-1)} className="p-1.5 hover:bg-zinc-800 rounded transition-colors" data-testid="prev-week-btn">
            <ChevronLeft size={16} className="text-zinc-400" />
          </button>
          <div className="px-3 flex items-center gap-2">
            <CalendarDays size={14} className="text-primary" />
            <span className="text-sm text-white font-mono">
              {addDays(weekStart, 0).toLocaleDateString()} — {addDays(weekStart, 6).toLocaleDateString()}
            </span>
          </div>
          <button onClick={() => navigateWeek(1)} className="p-1.5 hover:bg-zinc-800 rounded transition-colors" data-testid="next-week-btn">
            <ChevronRight size={16} className="text-zinc-400" />
          </button>
        </div>

        <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder={t('planner.planName')}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 w-48"
          data-testid="plan-name-input" />

        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Target size={11} /> {totalDrills} {t('drills.exercises')}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {totalMinutes} min</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left: Drill Palette */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sticky top-4">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">{t('planner.drillPalette')}</h3>

            <div className="flex flex-wrap gap-1 mb-3">
              <button onClick={() => setDrillFilter('')}
                className={`text-[9px] px-2 py-1 rounded transition-colors ${!drillFilter ? 'bg-primary/20 text-primary' : 'text-zinc-500 hover:bg-zinc-800'}`}>{t('drills.all')}</button>
              {Object.keys(CAT_COLOR).map(cat => (
                <button key={cat} onClick={() => setDrillFilter(drillFilter === cat ? '' : cat)}
                  className={`text-[9px] px-2 py-1 rounded transition-colors ${drillFilter === cat ? CAT_COLOR[cat] : 'text-zinc-500 hover:bg-zinc-800'}`}>
                  {t(`drills.cat_${cat}`)}
                </button>
              ))}
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredDrills.map(drill => {
                const Icon = CAT_ICON[drill.category] || Target;
                const handleDragStart = (e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(drill));
                  e.dataTransfer.effectAllowed = 'copy';
                };
                return (
                  <div key={drill.id} draggable onDragStart={handleDragStart}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-grab active:cursor-grabbing transition-colors group"
                    data-testid={`palette-drill-${drill.id}`}>
                    <GripVertical size={10} className="text-zinc-700 group-hover:text-zinc-500 flex-shrink-0" />
                    <Icon size={10} className="flex-shrink-0" />
                    <span className="truncate flex-1">{drill.name}</span>
                    <span className="text-[9px] text-zinc-600">{drill.duration_minutes}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Week Grid */}
        <div className="flex-1 grid grid-cols-7 gap-2" data-testid="week-grid">
          {DAY_LABELS.map((label, i) => (
            <DayColumn key={i} dayIndex={i} dayDate={addDays(weekStart, i)}
              drills={days[i] || []} dayLabel={label}
              onAddDrill={handleAddDrill} onRemoveDrill={handleRemoveDrill} t={t} />
          ))}
        </div>
      </div>

      {/* Templates Modal */}
      <AnimatePresence>
        {tplOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setTplOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()} data-testid="templates-modal">
              <h3 className="text-lg font-bold text-white mb-1">{t('planner.templatesTitle')}</h3>
              <p className="text-xs text-zinc-400 mb-5">{t('planner.templatesDesc')}</p>
              {tplLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {templates.filter(t => !t.custom).map(tpl => {
                    const TplIcon = CAT_ICON[tpl.icon] || LayoutTemplate;
                    const totalDrillsCount = tpl.days.flat().length;
                    const totalMin = tpl.days.flat().reduce((s, d) => s + (d.duration_minutes || 0), 0);
                    const activeDays = tpl.days.filter(d => d.length > 0).length;
                    return (
                      <button key={tpl.id} onClick={() => applyTemplate(tpl)} data-testid={`template-${tpl.id}`}
                        className="w-full flex items-start gap-3 p-4 rounded-xl border border-zinc-800 hover:border-primary/30 hover:bg-primary/[0.03] text-left transition-all group">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <TplIcon size={16} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{tpl.name}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{tpl.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                            <span>{activeDays} {t('planner.daysActive')}</span>
                            <span>{totalDrillsCount} {t('drills.exercises')}</span>
                            <span>{totalMin} min</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {templates.some(t => t.custom) && (
                    <>
                      <div className="flex items-center gap-2 pt-3 pb-1">
                        <div className="h-px flex-1 bg-zinc-800" />
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{t('planner.myTemplates')}</span>
                        <div className="h-px flex-1 bg-zinc-800" />
                      </div>
                      {templates.filter(t => t.custom).map(tpl => {
                        const totalDrillsCount = tpl.days.flat().length;
                        const totalMin = tpl.days.flat().reduce((s, d) => s + (d.duration_minutes || 0), 0);
                        const activeDays = tpl.days.filter(d => d.length > 0).length;
                        return (
                          <div key={tpl.id} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all group">
                            <button onClick={() => applyTemplate(tpl)} className="flex items-start gap-3 flex-1 text-left" data-testid={`template-custom-${tpl.id}`}>
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <LayoutTemplate size={16} className="text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{tpl.name}</p>
                                {tpl.description && <p className="text-[11px] text-zinc-500 mt-0.5">{tpl.description}</p>}
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                                  <span>{activeDays} {t('planner.daysActive')}</span>
                                  <span>{totalDrillsCount} {t('drills.exercises')}</span>
                                  <span>{totalMin} min</span>
                                </div>
                              </div>
                            </button>
                            <button onClick={() => handleDeleteTemplate(tpl.id)} data-testid={`delete-template-${tpl.id}`}
                              className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button onClick={() => setTplOpen(false)} data-testid="tpl-close-btn"
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-lg transition-colors">
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save as Template Modal */}
      <AnimatePresence>
        {saveTplOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSaveTplOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()} data-testid="save-template-modal">
              <h3 className="text-lg font-bold text-white mb-1">{t('planner.saveAsTemplateTitle')}</h3>
              <p className="text-xs text-zinc-400 mb-5">{t('planner.saveAsTemplateDesc')}</p>

              <label className="block text-xs text-zinc-400 mb-1">{t('common.name')}</label>
              <input value={saveTplName} onChange={e => setSaveTplName(e.target.value)} data-testid="tpl-name-input"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white mb-4 focus:outline-none focus:border-primary/50"
                placeholder={t('planner.templateNamePlaceholder')} />

              <label className="block text-xs text-zinc-400 mb-1">{t('common.description')}</label>
              <input value={saveTplDesc} onChange={e => setSaveTplDesc(e.target.value)} data-testid="tpl-desc-input"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white mb-6 focus:outline-none focus:border-primary/50"
                placeholder={t('planner.templateDescPlaceholder')} />

              <div className="flex gap-2 justify-end">
                <button onClick={() => setSaveTplOpen(false)} data-testid="save-tpl-cancel-btn"
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-lg transition-colors">
                  {t('common.cancel')}
                </button>
                <button onClick={handleSaveAsTemplate} disabled={savingTpl || !saveTplName.trim()} data-testid="save-tpl-confirm-btn"
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50">
                  {savingTpl ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate Modal */}
      <AnimatePresence>
        {dupOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDupOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()} data-testid="duplicate-modal">
              <h3 className="text-lg font-bold text-white mb-1">{t('planner.duplicateTitle')}</h3>
              <p className="text-xs text-zinc-400 mb-5">{t('planner.duplicateDesc')}</p>

              <label className="block text-xs text-zinc-400 mb-1">{t('planner.targetTeam')}</label>
              <select value={dupTeam} onChange={e => setDupTeam(e.target.value)} data-testid="dup-team-select"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white mb-4 focus:outline-none focus:border-primary/50">
                {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
              </select>

              <label className="block text-xs text-zinc-400 mb-1">{t('planner.targetWeek')}</label>
              <input type="date" value={dupWeek} onChange={e => setDupWeek(e.target.value)} data-testid="dup-week-input"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white mb-6 focus:outline-none focus:border-primary/50" />

              <div className="flex gap-2 justify-end">
                <button onClick={() => setDupOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-lg transition-colors" data-testid="dup-cancel-btn">
                  {t('common.cancel')}
                </button>
                <button onClick={handleDuplicate} disabled={duplicating} data-testid="dup-confirm-btn"
                  className="flex items-center gap-1.5 px-5 py-2 bg-cyan-500 text-black text-xs font-bold rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50">
                  {duplicating ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />} {t('planner.duplicate')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
