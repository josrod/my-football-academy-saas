import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Loader2, ChevronLeft, ChevronRight, Save, Trash2, Plus, Clock, Target, Shield, Flame, Heart, Dumbbell, X, CalendarDays, GripVertical } from 'lucide-react';
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
    </div>
  );
}
