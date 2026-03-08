import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../api';
import { Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'event', date: '', start_time: '09:00', end_time: '10:00', description: '' });

  useEffect(() => {
    api.get('/api/calendar').then(setEvents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const ev = await api.post('/api/calendar', form);
      setEvents([...events, {
        id: ev.id,
        title: ev.title,
        start: `${ev.date}T${ev.start_time || '09:00'}`,
        end: ev.end_time ? `${ev.date}T${ev.end_time}` : undefined,
        type: ev.type,
        color: '#f59e0b'
      }]);
      setShowCreate(false);
      setForm({ title: '', type: 'event', date: '', start_time: '09:00', end_time: '10:00', description: '' });
    } catch (err) { console.error(err); }
  };

  const calendarEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color || '#22c55e',
    borderColor: e.color || '#22c55e',
    textColor: '#000',
    extendedProps: { type: e.type }
  }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="calendar-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Calendar</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">Schedule</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-event-button"
          className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-3 h-3 rounded-full bg-[#22c55e]" /> Training
        </span>
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-3 h-3 rounded-full bg-[#3b82f6]" /> Match
        </span>
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]" /> Event
        </span>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-event-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">New Event</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Event Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="event">Event</option><option value="tournament">Tournament</option><option value="meeting">Meeting</option>
            </select>
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6" data-testid="fullcalendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
          events={calendarEvents}
          height="auto"
          aspectRatio={1.8}
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>
    </div>
  );
}
