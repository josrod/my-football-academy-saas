import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import FootballPitch, { pitchToSvg, PITCH_WIDTH, PITCH_RATIO } from '../components/FootballPitch';
import { motion } from 'framer-motion';
import { Loader2, Save, Trash2, RotateCcw, Users, ChevronDown, Plus, GripVertical } from 'lucide-react';

const FORMATION_COLORS = {
  GK: '#f59e0b', LB: '#3b82f6', CB: '#3b82f6', RB: '#3b82f6',
  LWB: '#3b82f6', RWB: '#3b82f6', CDM: '#8b5cf6', CM: '#8b5cf6',
  CAM: '#8b5cf6', LM: '#8b5cf6', RM: '#8b5cf6', LW: '#ef4444',
  RW: '#ef4444', ST: '#ef4444', CF: '#ef4444',
};

function PlayerDot({ pos, index, isSelected, onSelect, onDrag, svgRef, pitchW }) {
  const ph = pitchW * PITCH_RATIO;
  const { x, y } = pitchToSvg(pos.x, pos.y, pitchW);
  const color = FORMATION_COLORS[pos.role] || '#22c55e';
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    startPos.current = pt.matrixTransform(svg.getScreenCTM().inverse());
    onSelect(index);

    const handleMouseMove = (e2) => {
      if (!isDragging.current) return;
      const pt2 = svg.createSVGPoint();
      pt2.x = e2.clientX; pt2.y = e2.clientY;
      const svgP = pt2.matrixTransform(svg.getScreenCTM().inverse());
      const newXPct = Math.max(2, Math.min(98, ((svgP.x - 20) / (pitchW - 40)) * 100));
      const newYPct = Math.max(2, Math.min(98, ((svgP.y - 20) / (ph - 40)) * 100));
      onDrag(index, Math.round(newXPct), Math.round(newYPct));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <g onMouseDown={handleMouseDown} style={{ cursor: 'grab' }} data-testid={`formation-player-${index}`}>
      <circle cx={x} cy={y} r={isSelected ? 18 : 15} fill={color} fillOpacity={0.25}
        stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 2.5 : 1.5} />
      <circle cx={x} cy={y} r={8} fill={color} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="7" fontWeight="bold" style={{ pointerEvents: 'none' }}>
        {pos.jersey_number || ''}
      </text>
      <text x={x} y={y + 22} textAnchor="middle" fill="white" fontSize="8"
        fontWeight="600" style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        {pos.player_name ? pos.player_name.split(' ').pop() : pos.role}
      </text>
    </g>
  );
}

export default function FormationAnalysis() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [presets, setPresets] = useState({});
  const [savedFormations, setSavedFormations] = useState([]);
  const [currentFormation, setCurrentFormation] = useState('4-3-3');
  const [positions, setPositions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [formationName, setFormationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamDropdown, setTeamDropdown] = useState(false);
  const svgRef = useRef(null);
  const pitchW = PITCH_WIDTH;

  useEffect(() => {
    Promise.all([
      api.get('/api/teams'),
      api.get('/api/formations/presets'),
    ]).then(([t, p]) => {
      setTeams(t);
      setPresets(p);
      if (t.length > 0) setSelectedTeam(t[0]);
      if (p['4-3-3']) setPositions(p['4-3-3'].map(pos => ({ ...pos, player_id: null, player_name: '', jersey_number: null })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    api.get(`/api/teams/${selectedTeam.id}`).then(data => {
      setPlayers(data.players || []);
    }).catch(console.error);
    api.get(`/api/teams/${selectedTeam.id}/formations`).then(setSavedFormations).catch(console.error);
  }, [selectedTeam]);

  const applyPreset = useCallback((type) => {
    setCurrentFormation(type);
    const preset = presets[type] || [];
    setPositions(preset.map(pos => ({ ...pos, player_id: null, player_name: '', jersey_number: null })));
    setSelectedIdx(null);
  }, [presets]);

  const autoAssign = useCallback(() => {
    if (!players.length) return;
    const newPositions = [...positions];
    const available = [...players];
    const posOrder = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

    newPositions.sort((a, b) => posOrder.indexOf(a.role) - posOrder.indexOf(b.role));

    for (let i = 0; i < newPositions.length; i++) {
      const role = newPositions[i].role;
      let bestIdx = -1;
      for (let j = 0; j < available.length; j++) {
        const pp = (available[j].position || '').toLowerCase();
        const r = role.toLowerCase();
        if ((r.includes('gk') && pp.includes('goal')) ||
            ((r.includes('cb') || r.includes('lb') || r.includes('rb') || r.includes('wb')) && pp.includes('def')) ||
            ((r.includes('cm') || r.includes('cdm') || r.includes('cam') || r.includes('lm') || r.includes('rm')) && pp.includes('mid')) ||
            ((r.includes('st') || r.includes('lw') || r.includes('rw') || r.includes('cf')) && (pp.includes('for') || pp.includes('wing') || pp.includes('str')))) {
          bestIdx = j;
          break;
        }
      }
      if (bestIdx === -1 && available.length > 0) bestIdx = 0;
      if (bestIdx >= 0) {
        const p = available.splice(bestIdx, 1)[0];
        newPositions[i] = { ...newPositions[i], player_id: p.id, player_name: `${p.first_name} ${p.last_name}`, jersey_number: p.jersey_number };
      }
    }
    setPositions(newPositions);
  }, [players, positions]);

  const handleDrag = useCallback((idx, newX, newY) => {
    setPositions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], x: newX, y: newY };
      return next;
    });
  }, []);

  const assignPlayer = useCallback((playerId) => {
    if (selectedIdx === null) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    setPositions(prev => {
      const next = [...prev];
      // Remove from any other position
      for (let i = 0; i < next.length; i++) {
        if (next[i].player_id === playerId) {
          next[i] = { ...next[i], player_id: null, player_name: '', jersey_number: null };
        }
      }
      next[selectedIdx] = { ...next[selectedIdx], player_id: player.id, player_name: `${player.first_name} ${player.last_name}`, jersey_number: player.jersey_number };
      return next;
    });
  }, [selectedIdx, players]);

  const saveFormation = async () => {
    if (!selectedTeam || !formationName.trim()) return;
    setSaving(true);
    try {
      const data = { name: formationName, formation_type: currentFormation, team_id: selectedTeam.id, positions };
      const saved = await api.post(`/api/teams/${selectedTeam.id}/formations`, data);
      setSavedFormations(prev => [saved, ...prev]);
      setFormationName('');
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const loadFormation = (f) => {
    setCurrentFormation(f.formation_type);
    setPositions(f.positions || []);
    setFormationName(f.name);
  };

  const deleteFormation = async (id) => {
    await api.delete(`/api/formations/${id}`);
    setSavedFormations(prev => prev.filter(f => f.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;

  const assignedIds = positions.map(p => p.player_id).filter(Boolean);
  const unassigned = players.filter(p => !assignedIds.includes(p.id));

  return (
    <div data-testid="formation-analysis-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white uppercase">{t('formations.title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('formations.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Controls */}
        <div className="xl:col-span-1 space-y-4">
          {/* Team Selector */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">{t('formations.selectTeam')}</label>
            <div className="relative">
              <button onClick={() => setTeamDropdown(!teamDropdown)} data-testid="team-selector"
                className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white">
                <span>{selectedTeam?.name || t('formations.selectTeam')}</span>
                <ChevronDown size={14} className="text-zinc-400" />
              </button>
              {teamDropdown && (
                <div className="absolute z-20 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
                  {teams.map(tm => (
                    <button key={tm.id} onClick={() => { setSelectedTeam(tm); setTeamDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                      {tm.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preset Formations */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">{t('formations.preset')}</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(presets).map(f => (
                <button key={f} onClick={() => applyPreset(f)} data-testid={`preset-${f}`}
                  className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    currentFormation === f ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            <button onClick={autoAssign} data-testid="auto-assign-btn"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase rounded-lg hover:bg-blue-500/20 transition-colors">
              <Users size={14} /> {t('formations.autoAssign')}
            </button>
            <button onClick={() => applyPreset(currentFormation)} data-testid="reset-positions-btn"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold uppercase rounded-lg hover:bg-zinc-700 transition-colors">
              <RotateCcw size={14} /> {t('formations.resetPositions')}
            </button>
          </div>

          {/* Save */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            <input value={formationName} onChange={e => setFormationName(e.target.value)} data-testid="formation-name-input"
              placeholder={t('formations.formationName')} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50" />
            <button onClick={saveFormation} disabled={!formationName.trim() || saving} data-testid="save-formation-btn"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-black text-xs font-bold uppercase rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {t('formations.save')}
            </button>
          </div>

          {/* Saved Formations */}
          {savedFormations.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3 block">{t('formations.savedFormations')}</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedFormations.map(f => (
                  <div key={f.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                    <button onClick={() => loadFormation(f)} className="flex-1 text-left text-sm text-white hover:text-primary transition-colors">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-zinc-500 ml-2">{f.formation_type}</span>
                    </button>
                    <button onClick={() => deleteFormation(f.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Pitch */}
        <div className="xl:col-span-2">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{currentFormation}</h3>
              <span className="text-xs text-zinc-500">{t('formations.dragToMove')}</span>
            </div>
            <div className="flex justify-center" data-testid="formation-pitch">
              <FootballPitch ref={svgRef} width={pitchW}>
                {positions.map((pos, i) => (
                  <PlayerDot key={i} pos={pos} index={i} isSelected={selectedIdx === i}
                    onSelect={setSelectedIdx} onDrag={handleDrag} svgRef={svgRef} pitchW={pitchW} />
                ))}
              </FootballPitch>
            </div>
          </div>
        </div>

        {/* Right: Player Assignment */}
        <div className="xl:col-span-1">
          {selectedIdx !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-primary/20 rounded-xl p-4 mb-4">
              <h3 className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">{t('formations.selectedPosition')}</h3>
              <p className="text-lg font-bold text-white">{positions[selectedIdx]?.role}</p>
              {positions[selectedIdx]?.player_name && (
                <p className="text-sm text-zinc-400">{positions[selectedIdx].player_name} #{positions[selectedIdx].jersey_number}</p>
              )}
            </motion.div>
          )}

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">
              {t('formations.availablePlayers')} ({unassigned.length})
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {unassigned.map(p => (
                <button key={p.id} onClick={() => assignPlayer(p.id)} data-testid={`assign-player-${p.id}`}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedIdx !== null ? 'hover:bg-primary/10 hover:border-primary/20 cursor-pointer' : 'opacity-60 cursor-default'
                  } bg-zinc-800/50 border border-zinc-800`}>
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                    {p.jersey_number || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.first_name} {p.last_name}</p>
                    <p className="text-[10px] text-zinc-500">{p.position}</p>
                  </div>
                  {selectedIdx !== null && <GripVertical size={12} className="text-zinc-600" />}
                </button>
              ))}
              {unassigned.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">{t('formations.allAssigned')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
