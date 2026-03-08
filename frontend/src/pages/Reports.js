import React, { useEffect, useState } from 'react';
import api from '../api';
import { FileBarChart, Loader2, Users, Shield, Dumbbell, Swords, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  return (
    <div data-testid="reports-page">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Analytics</p>
        <h1 className="font-heading text-3xl font-bold text-white uppercase tracking-tight">Reports & Insights</h1>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Players', value: data?.total_players || 0, icon: Users, color: 'text-primary' },
          { label: 'Active Players', value: data?.active_players || 0, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Injured', value: data?.injured_players || 0, icon: Shield, color: 'text-red-400' },
          { label: 'Teams', value: data?.total_teams || 0, icon: Shield, color: 'text-amber-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <s.icon size={18} className={`${s.color} mb-3`} />
            <p className="font-heading text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 uppercase mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players by category */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="report-category-chart">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-6">Players by Category</h3>
          {data?.players_by_category?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.players_by_category} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {data.players_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-zinc-500">No data</p>}
        </div>

        {/* Attendance trend */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="report-attendance-chart">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-6">Attendance Trend</h3>
          {data?.attendance_rates?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.attendance_rates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="rate" name="Attendance %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-zinc-500">No data</p>}
        </div>
      </div>
    </div>
  );
}
