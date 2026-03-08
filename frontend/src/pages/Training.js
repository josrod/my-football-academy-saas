import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Dumbbell, Plus, Loader2, Users, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Training() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [form, setForm] = useState({ title: '', team_id: '', date: '', start_time: '16:00', end_time: '17:30', location: 'Main Field', type: 'regular' });

  useEffect(() => {
    Promise.all([
      api.get(`/api/training?team_id=${teamFilter}`),
      api.get('/api/teams')
    ]).then(([s, t]) => { setSessions(s); setTeams(t); }).catch(console.error).finally(() => setLoading(false));
  }, [teamFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const s = await api.post('/api/training', form);
      setSessions([s, ...sessions]);
      setShowCreate(false);
    } catch (err) { console.error(err); }
  };

  const viewAttendance = async (sid) => {
    setSelectedSession(sid);
    const detail = await api.get(`/api/training/${sid}`);
    setSessionDetail(detail);
  };

  return (
    <div data-testid="training-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('training.title')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('training.sessions')}</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-training-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
          <Plus size={16} /> {t('training.newSession')}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} data-testid="training-team-filter"
          className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-training-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">New Training Session</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Session Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} required className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions list */}
          <div className="space-y-3" data-testid="training-sessions-list">
            {sessions.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => viewAttendance(s.id)}
                className={`bg-zinc-900/50 border rounded-xl p-5 cursor-pointer transition-all ${
                  selectedSession === s.id ? 'border-primary/50 bg-primary/5' : 'border-zinc-800 hover:border-zinc-700'
                }`} data-testid={`training-session-${i}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-white">{s.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'tactical' ? 'bg-blue-500/10 text-blue-400' : s.type === 'physical' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {s.type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> {s.date} {s.start_time}-{s.end_time}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {s.location}</span>
                  {s.team_name && <span className="flex items-center gap-1"><Users size={12} /> {s.team_name}</span>}
                </div>
                {s.total_attendance > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(s.present_count / s.total_attendance) * 100}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400">{s.present_count}/{s.total_attendance}</span>
                  </div>
                )}
              </motion.div>
            ))}
            {sessions.length === 0 && <p className="text-center py-10 text-sm text-zinc-500">No training sessions</p>}
          </div>

          {/* Attendance detail */}
          <div>
            {sessionDetail ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sticky top-6" data-testid="attendance-detail">
                <h3 className="font-heading text-lg font-semibold text-white uppercase mb-1">{sessionDetail.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{sessionDetail.date} &middot; {sessionDetail.team?.name || ''}</p>
                <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Attendance ({sessionDetail.attendance?.length || 0})</h4>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {sessionDetail.attendance?.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-950 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-white">{a.player_name || 'Player'}</span>
                      <span className={`flex items-center gap-1 text-xs ${a.status === 'present' ? 'text-green-400' : a.status === 'late' ? 'text-amber-400' : 'text-red-400'}`}>
                        {a.status === 'present' ? <CheckCircle2 size={13} /> : a.status === 'late' ? <AlertCircle size={13} /> : <XCircle size={13} />}
                        {a.status}
                      </span>
                    </div>
                  ))}
                  {(!sessionDetail.attendance || sessionDetail.attendance.length === 0) && (
                    <p className="text-sm text-zinc-500 text-center py-4">No attendance recorded</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-xl p-12 text-center">
                <Dumbbell size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Select a session to view attendance</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
