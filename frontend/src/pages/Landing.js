import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Dumbbell, Swords, CalendarDays, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Player Management', desc: 'Track development, metrics, and medical records for every player.' },
  { icon: Shield, title: 'Team Organization', desc: 'Manage squads by age category with rosters and formations.' },
  { icon: Dumbbell, title: 'Training Sessions', desc: 'Plan sessions, track attendance, and monitor progress.' },
  { icon: Swords, title: 'Match Management', desc: 'Schedule matches, record results, and analyze performance.' },
  { icon: CalendarDays, title: 'Calendar & Scheduling', desc: 'Full calendar view of all training, matches, and events.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Data-driven insights into player and team performance.' },
];

const BENEFITS = [
  'Multi-tenant architecture for clubs',
  'Real-time attendance tracking',
  'Parent portal with read-only access',
  'Scouting & talent evaluation tools',
  'Announcement & communication system',
  'Comprehensive player profiles',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-body" data-testid="landing-page">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/60 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield size={18} className="text-black" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-white uppercase">AcademyOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" data-testid="nav-login-btn" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/signup" data-testid="nav-signup-btn" className="text-xs uppercase tracking-wide font-semibold bg-primary text-black px-5 py-2.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-6">Youth Football Academy Platform</p>
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-white uppercase leading-[0.95] mb-6">
              Manage Your<br />Academy Like<br /><span className="text-primary">The Pros</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for youth football academies. Track players, manage training, communicate with parents, and develop talent — all from one dashboard.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/signup" data-testid="hero-get-started-btn" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold bg-primary text-black px-8 py-3.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300">
                Start Free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold bg-zinc-900 text-white px-8 py-3.5 rounded-md border border-zinc-700 hover:border-zinc-500 transition-all">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3 text-center">Features</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-white uppercase mb-16">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3">Why AcademyOS</p>
              <h2 className="font-heading text-3xl font-bold text-white uppercase mb-6">Built For Real Academies</h2>
              <p className="text-zinc-400 leading-relaxed mb-8">
                Designed by coaches and academy directors, AcademyOS brings together everything you need to run a professional youth football program.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-primary hover:text-primary/80 transition-colors">
                Get Started Today <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg px-5 py-3.5"
                >
                  <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{b}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <span className="font-heading text-sm font-semibold text-zinc-400 uppercase">AcademyOS</span>
          </div>
          <p className="text-xs text-zinc-500">&copy; 2025 AcademyOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
