import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Brain, Loader2, RefreshCw, TrendingUp, Users, Shield, Star, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function InsightCard({ icon: Icon, title, children, color = 'primary', delay = 0 }) {
  const colors = { primary: 'border-primary/20 bg-primary/5', blue: 'border-blue-500/20 bg-blue-500/5', amber: 'border-amber-500/20 bg-amber-500/5', red: 'border-red-500/20 bg-red-500/5' };
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.1 }}
      className={`border rounded-xl p-5 ${colors[color] || colors.primary}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={`text-${color === 'primary' ? 'primary' : color + '-400'}`} />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function AIInsights() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get('/api/ai/insights').then(data => {
      setInsights(data.insights);
      setGeneratedAt(data.generated_at);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const data = await api.post('/api/ai/insights', {});
      setInsights(data.insights);
      setGeneratedAt(data.generated_at);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  const priorityColor = { high: 'text-red-400 bg-red-500/10', medium: 'text-amber-400 bg-amber-500/10', low: 'text-green-400 bg-green-500/10' };

  return (
    <div data-testid="ai-insights-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white uppercase flex items-center gap-3">
            <Sparkles size={28} className="text-primary" /> {t('aiInsights.title')}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t('aiInsights.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {generatedAt && (
            <span className="text-[10px] text-zinc-500">{t('aiInsights.lastGenerated')}: {new Date(generatedAt).toLocaleString()}</span>
          )}
          <button onClick={generate} disabled={generating} data-testid="generate-insights-btn"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black text-xs font-bold uppercase rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {generating ? t('aiInsights.generating') : insights ? t('aiInsights.regenerate') : t('aiInsights.generate')}
          </button>
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="generating-state">
          <div className="relative">
            <Brain size={48} className="text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
          </div>
          <p className="text-sm text-zinc-400">{t('aiInsights.generating')}</p>
          <p className="text-xs text-zinc-600">GPT 5.2 is analyzing your academy data...</p>
        </div>
      )}

      {!generating && !insights && (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-xl" data-testid="no-insights">
          <Brain size={48} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">{t('aiInsights.noInsights')}</p>
        </div>
      )}

      {!generating && insights && (
        <div className="space-y-6">
          {/* Overview */}
          <InsightCard icon={TrendingUp} title={t('aiInsights.overview')} color="primary" delay={0}>
            <p className="text-sm text-zinc-300 leading-relaxed">{insights.overview}</p>
            {insights.top_performer && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <Star size={12} className="text-amber-400" />
                <span className="text-amber-400 font-semibold">MVP:</span>
                <span className="text-zinc-400">{insights.top_performer}</span>
              </div>
            )}
            {insights.best_formation && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Shield size={12} className="text-blue-400" />
                <span className="text-blue-400 font-semibold">Best Formation:</span>
                <span className="text-zinc-400">{insights.best_formation}</span>
              </div>
            )}
          </InsightCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player Insights */}
            <InsightCard icon={Users} title={t('aiInsights.playerInsights')} color="blue" delay={1}>
              <div className="space-y-3">
                {(insights.player_insights || []).map((pi, i) => (
                  <div key={i} className="border-b border-zinc-800/50 pb-3 last:border-0" data-testid={`player-insight-${i}`}>
                    <p className="text-sm font-semibold text-white mb-0.5">{pi.player}</p>
                    <p className="text-xs text-zinc-400 mb-1">{pi.insight}</p>
                    {pi.recommendation && (
                      <p className="text-[11px] text-blue-400 flex items-center gap-1">
                        <ChevronRight size={10} /> {pi.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </InsightCard>

            {/* Team Insights */}
            <InsightCard icon={Shield} title={t('aiInsights.teamInsights')} color="amber" delay={2}>
              <div className="space-y-3">
                {(insights.team_insights || []).map((ti, i) => (
                  <div key={i} className="border-b border-zinc-800/50 pb-3 last:border-0" data-testid={`team-insight-${i}`}>
                    <p className="text-sm font-semibold text-white mb-0.5">{ti.topic}</p>
                    <p className="text-xs text-zinc-400">{ti.insight}</p>
                    {ti.data_point && <p className="text-[10px] text-amber-400 font-mono mt-1">{ti.data_point}</p>}
                  </div>
                ))}
              </div>
            </InsightCard>
          </div>

          {/* Recommendations */}
          <InsightCard icon={AlertTriangle} title={t('aiInsights.recommendations')} color="red" delay={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(insights.recommendations || []).map((rec, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3" data-testid={`recommendation-${i}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${priorityColor[rec.priority] || priorityColor.medium}`}>
                      {rec.priority}
                    </span>
                    <span className="text-sm font-semibold text-white">{rec.title}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{rec.description}</p>
                </div>
              ))}
            </div>
          </InsightCard>
        </div>
      )}
    </div>
  );
}
