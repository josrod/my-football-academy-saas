import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Megaphone, Plus, Loader2, Trash2, AlertTriangle, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Announcements() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [translating, setTranslating] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', target: 'all' });

  useEffect(() => {
    api.get('/api/announcements').then(setAnnouncements).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const a = await api.post('/api/announcements', form);
      setAnnouncements([a, ...announcements]);
      setShowCreate(false);
      setForm({ title: '', content: '', priority: 'normal', target: 'all' });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/announcements/${id}`);
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleTranslate = async (ann) => {
    setTranslating(ann.id);
    try {
      const res = await api.post(`/api/announcements/${ann.id}/translate`, {});
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, translations: res.translations } : a));
    } catch (e) { console.error(e); }
    setTranslating(null);
  };

  const getLocalizedContent = (ann) => {
    const lang = i18n.language;
    if (ann.translations && ann.translations[lang]) {
      return { title: ann.translations[lang].title, content: ann.translations[lang].content };
    }
    return { title: ann.title, content: ann.content };
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'coach';

  return (
    <div data-testid="announcements-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('announcements.title')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('announcements.feed')}</h1>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(!showCreate)} data-testid="add-announcement-button"
            className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all">
            <Plus size={16} /> {t('announcements.postUpdate')}
          </button>
        )}
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm" data-testid="create-announcement-form">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-4">New Announcement</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input placeholder="Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea placeholder="Write your announcement..." required value={form.content} onChange={e => setForm({...form, content: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary h-32 resize-none" />
            <div className="grid grid-cols-2 gap-4">
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="low">Low Priority</option>
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
              </select>
              <select value={form.target} onChange={e => setForm({...form, target: e.target.value})}
                className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All</option>
                <option value="coaches">Coaches Only</option>
                <option value="parents">Parents Only</option>
                <option value="players">Players Only</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-black text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90">Post</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-800 text-white text-xs uppercase font-semibold px-6 py-2.5 rounded-md hover:bg-zinc-700">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4" data-testid="announcements-list">
          {announcements.map((a, i) => {
            const localized = getLocalizedContent(a);
            const hasTranslations = !!a.translations;
            return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all" data-testid={`announcement-${i}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Megaphone size={18} className={a.priority === 'high' ? 'text-red-400' : a.priority === 'low' ? 'text-zinc-500' : 'text-primary'} />
                  <div>
                    <h3 className="text-base font-semibold text-white">{localized.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{a.author_name} ({a.author_role}) &middot; {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-md ${a.priority === 'high' ? 'bg-red-500/10 text-red-400' : a.priority === 'low' ? 'bg-zinc-800 text-zinc-500' : 'bg-primary/10 text-primary'}`}>
                    {a.priority}
                  </span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md">{a.target}</span>
                  {isAdmin && !hasTranslations && (
                    <button onClick={() => handleTranslate(a)} disabled={translating === a.id}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                      data-testid={`translate-announcement-${i}`}>
                      {translating === a.id ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                      {translating === a.id ? 'AI...' : 'Translate'}
                    </button>
                  )}
                  {hasTranslations && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-md" data-testid={`translated-badge-${i}`}>
                      7 langs
                    </span>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(a.id)} className="text-zinc-500 hover:text-red-400 transition-colors" data-testid={`delete-announcement-${i}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed pl-[30px]">{localized.content}</p>
            </motion.div>
            );
          })}
          {announcements.length === 0 && <p className="text-center py-10 text-sm text-zinc-500">{t('announcements.noAnnouncements')}</p>}
        </div>
      )}
    </div>
  );
}
