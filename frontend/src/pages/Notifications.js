import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Send, Loader2, Check, CheckCheck, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Notifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', recipient: 'all_parents', team_id: '' });

  const isAdmin = user?.role === 'admin' || user?.role === 'coach';

  useEffect(() => {
    Promise.all([
      api.get('/api/notifications'),
      isAdmin ? api.get('/api/teams') : Promise.resolve([])
    ]).then(([n, t]) => { setNotifications(n); setTeams(t); })
      .catch(console.error).finally(() => setLoading(false));
  }, [isAdmin]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const n = await api.post('/api/notifications', form);
      setNotifications([n, ...notifications]);
      setShowForm(false);
      setForm({ subject: '', message: '', recipient: 'all_parents', team_id: '' });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleMarkRead = async (id) => {
    await api.put(`/api/notifications/${id}/read`);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await api.put('/api/notifications/read-all');
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="notifications-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('notifications.title')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">
            {isAdmin ? t('notifications.sendToParents') : t('notifications.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} data-testid="mark-all-read-btn"
              className="flex items-center gap-2 bg-zinc-800 text-zinc-300 text-xs uppercase tracking-wide font-semibold px-4 py-2.5 rounded-md hover:bg-zinc-700 transition-all">
              <CheckCheck size={14} /> {t('notifications.markAllRead')}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} data-testid="send-notification-btn"
              className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
              <Send size={14} /> {t('notifications.send')}
            </button>
          )}
        </div>
      </div>

      {sent && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary mb-4 flex items-center gap-2" data-testid="notification-sent-success">
          <Check size={16} /> {t('notifications.sentSuccess')}
        </div>
      )}

      {showForm && isAdmin && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="notification-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">{t('notifications.send')}</h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('notifications.subject')}</label>
              <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                data-testid="notification-subject-input"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('notifications.subject')} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('notifications.message')}</label>
              <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                data-testid="notification-message-input"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary h-28 resize-none"
                placeholder={t('notifications.message')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('notifications.recipient')}</label>
                <select value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })}
                  data-testid="notification-recipient-select"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="all_parents">{t('notifications.allParents')}</option>
                  <option value="team_parents">{t('notifications.teamParents')}</option>
                </select>
              </div>
              {form.recipient === 'team_parents' && (
                <div>
                  <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('teams.title')}</label>
                  <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}
                    data-testid="notification-team-select"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">--</option>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={sending} data-testid="notification-send-submit"
                className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-all disabled:opacity-50">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t('common.send')}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">
                {t('common.cancel')}
              </button>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1"><Mail size={12} /> {t('notifications.emailSimulated')}</p>
          </form>
        </motion.div>
      )}

      <div className="space-y-3" data-testid="notifications-list">
        {notifications.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={`border rounded-xl p-5 transition-all cursor-pointer ${
              n.is_read ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-900/70 border-zinc-700 hover:border-zinc-600'
            }`}
            onClick={() => !n.is_read && handleMarkRead(n.id)}
            data-testid={`notification-item-${i}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.is_read ? 'bg-zinc-800' : 'bg-primary/10'
                }`}>
                  <Bell size={14} className={n.is_read ? 'text-zinc-500' : 'text-primary'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-semibold truncate ${n.is_read ? 'text-zinc-400' : 'text-white'}`}>
                      {n.subject}
                    </h3>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className={`text-xs leading-relaxed mb-2 ${n.is_read ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>{n.sender_name}</span>
                    <span>&middot;</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                    {n.email_simulated && (
                      <>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1"><Mail size={10} /> {t('notifications.emailSimulated')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className={`text-[11px] px-2 py-0.5 rounded-md ${
                  n.is_read ? 'bg-zinc-800 text-zinc-500' : 'bg-primary/10 text-primary'
                }`}>
                  {n.is_read ? t('notifications.read') : t('notifications.unread')}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <Bell size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
