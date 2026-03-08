import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Users, Dumbbell, Swords, CalendarDays, BarChart3, ArrowRight, CheckCircle2, Globe } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'it', label: 'IT' },
  { code: 'ar', label: 'AR' },
];

export default function Landing() {
  const { t, i18n } = useTranslation();

  const FEATURES = [
    { icon: Users, title: t('landing.feat_playerMgmt'), desc: t('landing.feat_playerMgmtDesc') },
    { icon: Shield, title: t('landing.feat_teamOrg'), desc: t('landing.feat_teamOrgDesc') },
    { icon: Dumbbell, title: t('landing.feat_training'), desc: t('landing.feat_trainingDesc') },
    { icon: Swords, title: t('landing.feat_match'), desc: t('landing.feat_matchDesc') },
    { icon: CalendarDays, title: t('landing.feat_calendar'), desc: t('landing.feat_calendarDesc') },
    { icon: BarChart3, title: t('landing.feat_reports'), desc: t('landing.feat_reportsDesc') },
  ];

  const BENEFITS = [
    t('landing.benefit1'), t('landing.benefit2'), t('landing.benefit3'),
    t('landing.benefit4'), t('landing.benefit5'), t('landing.benefit6'),
  ];

  const currentLang = i18n.language?.substring(0, 2) || 'en';

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
            {/* Language switcher */}
            <div className="flex items-center gap-1 mr-2" data-testid="landing-lang-switcher">
              <Globe size={14} className="text-zinc-500" />
              {LANGS.map(lang => (
                <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
                  data-testid={`landing-lang-${lang.code}`}
                  className={`text-xs px-2 py-1 rounded transition-colors ${currentLang === lang.code ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-white'}`}>
                  {lang.label}
                </button>
              ))}
            </div>
            <Link to="/login" data-testid="nav-login-btn" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">
              {t('landing.signIn')}
            </Link>
            <Link to="/signup" data-testid="nav-signup-btn" className="text-xs uppercase tracking-wide font-semibold bg-primary text-black px-5 py-2.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300">
              {t('landing.startFree')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-6">{t('landing.subtitle')}</p>
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-white uppercase leading-[0.95] mb-6">
              {t('landing.heroTitle1')}<br />
              {t('landing.heroTitle2')}<br />
              <span className="text-primary">{t('landing.heroTitle3')}</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">{t('landing.heroDesc')}</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/signup" data-testid="hero-get-started-btn" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold bg-primary text-black px-8 py-3.5 rounded-md hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300">
                {t('landing.startFree')} <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold bg-zinc-900 text-white px-8 py-3.5 rounded-md border border-zinc-700 hover:border-zinc-500 transition-all">
                {t('landing.signIn')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3 text-center">{t('landing.features')}</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-white uppercase mb-16">{t('landing.everythingYouNeed')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all group">
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
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-3">{t('landing.whyUs')}</p>
              <h2 className="font-heading text-3xl font-bold text-white uppercase mb-6">{t('landing.builtForReal')}</h2>
              <p className="text-zinc-400 leading-relaxed mb-8">{t('landing.builtForRealDesc')}</p>
              <Link to="/signup" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-primary hover:text-primary/80 transition-colors">
                {t('landing.getStartedToday')} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {BENEFITS.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg px-5 py-3.5">
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
          <p className="text-xs text-zinc-500">&copy; 2025 AcademyOS. {t('landing.allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
}
