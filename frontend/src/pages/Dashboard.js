import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Users, Shield, Dumbbell, Swords, HeartPulse, TrendingUp, Megaphone, Loader2 } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

function StatCard({ icon: Icon, label, value, color = 'text-primary', link, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Link to={link || '#'} className="block bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all group" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
            <Icon size={20} className={color} />
          </div>
          <TrendingUp size={14} className="text-zinc-600" />
        </div>
        <p className="font-heading text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{label}</p>
      </Link>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white font-semibold">{p.name}: {p.value}{p.name === 'rate' ? '%' : ''}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]" data-testid="dashboard-loading">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div data-testid="dashboard-page">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Dashboard</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Here's what's happening at your academy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Players" value={data?.total_players || 0} color="text-primary" link="/players" delay={0} />
        <StatCard icon={Shield} label="Teams" value={data?.total_teams || 0} color="text-blue-400" link="/teams" delay={0.05} />
        <StatCard icon={Dumbbell} label="Upcoming Training" value={data?.upcoming_training || 0} color="text-amber-400" link="/training" delay={0.1} />
        <StatCard icon={HeartPulse} label="Injured Players" value={data?.injured_players || 0} color="text-red-400" link="/players?status=injured" delay={0.15} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard icon={Swords} label="Upcoming Matches" value={data?.upcoming_matches || 0} color="text-blue-400" link="/matches" delay={0.2} />
        <StatCard icon={Users} label="Active Players" value={data?.active_players || 0} color="text-emerald-400" link="/players" delay={0.25} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="chart-players-category">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-6">Players per Category</h3>
          {data?.players_by_category?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.players_by_category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Players" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-zinc-500">No data available</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="chart-attendance-rate">
          <h3 className="font-heading text-lg font-semibold text-white uppercase mb-6">Training Attendance Rate</h3>
          {data?.attendance_rates?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.attendance_rates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" name="Attendance %" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-zinc-500">No attendance data</p>}
        </motion.div>
      </div>

      {/* Recent Announcements */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6" data-testid="recent-announcements">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg font-semibold text-white uppercase">Recent Announcements</h3>
          <Link to="/announcements" className="text-xs text-primary hover:underline uppercase tracking-wider">View All</Link>
        </div>
        {data?.recent_announcements?.length > 0 ? (
          <div className="space-y-3">
            {data.recent_announcements.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <Megaphone size={16} className={`mt-0.5 flex-shrink-0 ${a.priority === 'high' ? 'text-red-400' : 'text-zinc-500'}`} />
                <div>
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-zinc-500">No announcements</p>}
      </motion.div>
    </div>
  );
}
