import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Save, Loader2, Upload, Image } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/api/settings').then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/settings', {
        name: settings.name, address: settings.address, phone: settings.phone,
        email: settings.email, website: settings.website, founded_year: settings.founded_year,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload('/api/upload', file);
      await api.put('/api/settings', { logo_url: result.storage_path });
      setSettings({ ...settings, logo_url: result.storage_path });
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="settings-page">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('settings.title')}</p>
        <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('settings.clubSettings')}</h1>
      </div>

      {settings && (
        <div className="max-w-2xl">
          {/* Club Logo */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6" data-testid="club-logo-section">
            <label className="block text-[13px] font-medium text-zinc-300 mb-3">Club Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <img src={api.fileUrl(settings.logo_url)} alt="Club logo" className="w-full h-full object-cover" data-testid="club-logo-img" />
                ) : (
                  <Image size={24} className="text-zinc-600" />
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" data-testid="logo-upload-input" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="logo-upload-btn"
                  className="flex items-center gap-2 bg-zinc-800 text-zinc-300 text-xs uppercase tracking-wide font-semibold px-4 py-2.5 rounded-md hover:bg-zinc-700 transition-all disabled:opacity-50">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                <p className="text-[11px] text-zinc-500 mt-1.5">JPG, PNG, WebP (max 5MB)</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5" data-testid="settings-form">
            <div>
              <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('settings.clubName')}</label>
              <input value={settings.name || ''} onChange={e => setSettings({...settings, name: e.target.value})} data-testid="settings-name-input"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('settings.address')}</label>
              <input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('common.phone')}</label>
                <input value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('common.email')}</label>
                <input value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('settings.website')}</label>
                <input value={settings.website || ''} onChange={e => setSettings({...settings, website: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-300 mb-2">{t('settings.foundedYear')}</label>
                <input type="number" value={settings.founded_year || ''} onChange={e => setSettings({...settings, founded_year: parseInt(e.target.value) || null})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} data-testid="settings-save-button"
                className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('settings.saveChanges')}
              </button>
              {saved && <span className="text-xs text-green-400">{t('common.savedSuccess')}</span>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
