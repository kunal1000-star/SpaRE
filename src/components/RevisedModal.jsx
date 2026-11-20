import React, { useState } from 'react';
import { CheckCircle2, Smile, Meh, Frown, Zap, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCurrentPendingMilestone } from '../engine/scheduler';
import { getCategoryMeta } from '../types';

export default function RevisedModal({ isOpen, topic, onClose, onConfirmRevised, customCategories = {} }) {
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [addBooster, setAddBooster] = useState(false);

  if (!isOpen || !topic) return null;
  const currentMilestone = getCurrentPendingMilestone(topic);
  const isFinalQuotaStage = currentMilestone?.stage_number === 5;

  const handleDifficultySelect = (diff) => {
    setDifficulty(diff);
    setAddBooster(diff === 'HARD');
  };

  const handleConfirm = () => {
    try {
      confetti({ particleCount: isFinalQuotaStage ? 120 : 40, spread: isFinalQuotaStage ? 80 : 50, origin: { y: 0.65 } });
    } catch {}
    onConfirmRevised({ topic, difficulty, addBooster });
    onClose();
  };

  const diffOptions = [
    { key: 'EASY', icon: Smile, label: 'Easy', sub: 'Sharp recall', color: 'emerald' },
    { key: 'MEDIUM', icon: Meh, label: 'Medium', sub: 'Took effort', color: 'blue' },
    { key: 'HARD', icon: Frown, label: 'Hard', sub: 'Almost forgot', color: 'rose' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="glass-modal w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 animate-modal-pop border border-white/10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/15">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mark Revised</h3>
              <p className="text-[10px] text-slate-400 font-mono">{currentMilestone?.label || `Stage ${topic.current_stage}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 glass-btn"><X className="w-4 h-4" /></button>
        </div>

        {/* Topic capsule */}
        <div className="glass-panel p-2.5 rounded-xl border border-white/[0.06]">
          <div className="flex items-center space-x-1.5 flex-wrap mb-1">
            {(Array.isArray(topic.categories) && topic.categories.length > 0 ? topic.categories : [topic.category || 'GATE']).map(cat => {
              const meta = getCategoryMeta(cat, customCategories);
              return (
                <span key={cat} className={`text-[9px] font-bold px-1.5 py-px rounded border ${meta.bgLight}`}>
                  {meta.badge}
                </span>
              );
            })}
            <span className="text-[9px] text-zinc-400">· {topic.subject}</span>
          </div>
          <p className="text-[12px] font-semibold text-slate-100 leading-snug">{topic.title}</p>
        </div>

        {isFinalQuotaStage && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center space-x-2 text-[11px] text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Milestone!</strong> Completing Stage 5 enters the <strong>30-Day Maintenance Loop</strong>.</span>
          </div>
        )}

        {/* Difficulty */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Recall Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {diffOptions.map(({ key, icon: Icon, label, sub, color }) => (
              <button key={key} type="button" onClick={() => handleDifficultySelect(key)}
                className={`p-2.5 rounded-xl border text-center glass-btn transition-all ${
                  difficulty === key ? `bg-${color}-500/20 border-${color}-500 text-${color}-300 font-bold shadow-md shadow-${color}-500/15 scale-[1.03]` : 'glass-panel text-slate-400 hover:text-white hover:border-white/15'
                }`}>
                <Icon className={`w-4 h-4 mx-auto mb-0.5 text-${color}-400`} />
                <span className="text-[11px] block">{label}</span>
                <span className="text-[9px] text-slate-400 block font-normal">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Booster */}
        <div className={`p-2.5 rounded-xl border transition-all ${addBooster ? 'bg-indigo-950/35 border-indigo-500/40 text-indigo-200 shadow-md shadow-indigo-500/15' : 'glass-panel text-slate-400'}`}>
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input type="checkbox" checked={addBooster} onChange={e => setAddBooster(e.target.checked)} className="mt-0.5 rounded text-indigo-600 w-3.5 h-3.5 cursor-pointer" />
            <div>
              <span className="text-[11px] font-bold flex items-center space-x-1 text-indigo-300"><Zap className="w-3.5 h-3.5 text-amber-400" /><span>3-Day Booster (+3d)</span></span>
              <p className="text-[10px] text-slate-400 leading-tight">Quick reinforcement in 3 days. Recommended for Hard topics.</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-1">
          <button onClick={onClose} className="px-3 py-2 text-[11px] font-semibold text-slate-400 hover:text-white glass-btn">Cancel</button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[11px] shadow-md shadow-emerald-600/25 active:scale-95 glass-btn light-sweep">
            Confirm Revised
          </button>
        </div>
      </div>
    </div>
  );
}
