import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Loader2, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

export default function Reports() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard'),
      api.get('/api/players')
    ]).then(([s, p]) => { setStats(s); setPlayers(p); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const exportPlayersCSV = () => {
    setExporting('csv');
    try {
      const headers = ['First Name', 'Last Name', 'Position', 'Category', 'Status', 'Jersey #', 'Preferred Foot', 'Date of Birth'];
      const rows = players.map(p => [
        p.first_name, p.last_name, p.position, p.category,
        p.status, p.jersey_number || '', p.preferred_foot || '', p.date_of_birth || ''
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'players_report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExporting(''); }
  };

  const exportReportPDF = async () => {
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94);
      doc.text('AcademyOS Report', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      // Stats summary
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text('Overview', 14, 44);

      if (stats) {
        autoTable(doc, {
          startY: 50,
          head: [['Metric', 'Value']],
          body: [
            ['Total Players', String(stats.total_players || 0)],
            ['Active Players', String(stats.active_players || 0)],
            ['Injured Players', String(stats.injured_players || 0)],
            ['Teams', String(stats.total_teams || 0)],
            ['Upcoming Training', String(stats.upcoming_training || 0)],
          ],
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });
      }

      // Players table
      const finalY = doc.lastAutoTable?.finalY || 100;
      doc.setFontSize(14);
      doc.text('Players Roster', 14, finalY + 14);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['#', 'Name', 'Position', 'Category', 'Status']],
        body: players.slice(0, 40).map(p => [
          p.jersey_number || '-',
          `${p.first_name} ${p.last_name}`,
          p.position, p.category, p.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8 },
      });

      doc.save('academy_report.pdf');
    } catch (err) { console.error(err); }
    finally { setExporting(''); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  const statCards = stats ? [
    { label: t('reports.totalPlayers'), value: stats.total_players },
    { label: t('reports.activePlayers'), value: stats.active_players },
    { label: t('reports.injured'), value: stats.injured_players },
    { label: t('reports.teams'), value: stats.total_teams },
  ] : [];

  return (
    <div data-testid="reports-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">{t('reports.title')}</p>
          <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">{t('reports.insights')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportPlayersCSV} disabled={!!exporting} data-testid="export-csv-btn"
            className="flex items-center gap-2 bg-zinc-800 text-zinc-300 text-xs uppercase tracking-wide font-semibold px-4 py-2.5 rounded-md hover:bg-zinc-700 transition-all disabled:opacity-50">
            {exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Export CSV
          </button>
          <button onClick={exportReportPDF} disabled={!!exporting} data-testid="export-pdf-btn"
            className="flex items-center gap-2 bg-primary text-black text-xs uppercase tracking-wide font-semibold px-4 py-2.5 rounded-md hover:bg-primary/90 transition-all disabled:opacity-50">
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-heading font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="category-chart">
          <h3 className="text-sm font-semibold text-white uppercase mb-4">{t('reports.playersByCategory')}</h3>
          {stats?.players_by_category?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.players_by_category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-zinc-500 py-10 text-center">{t('common.noData')}</p>}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="attendance-chart">
          <h3 className="text-sm font-semibold text-white uppercase mb-4">{t('reports.attendanceTrend')}</h3>
          {stats?.attendance_rates?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.attendance_rates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-zinc-500 py-10 text-center">{t('common.noData')}</p>}
        </div>
      </div>
    </div>
  );
}
