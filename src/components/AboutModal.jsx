import React from 'react';
import { 
  X, 
  Brain, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    { day: 'Day 1', label: 'Rev 1', desc: 'First encounter reinforcement — halts rapid initial forgetting decay', color: 'from-blue-500 to-cyan-400' },
    { day: 'Day 3', label: 'Rev 2', desc: 'Consolidates short-term neural pathways into intermediate memory', color: 'from-cyan-400 to-teal-400' },
    { day: 'Day 7', label: 'Rev 3', desc: 'Weekly retrieval practice — forces active recall', color: 'from-teal-400 to-emerald-400' },
    { day: 'Day 14', label: 'Rev 4', desc: 'Bi-weekly retention check — strengthens long-term storage', color: 'from-emerald-400 to-amber-400' },
    { day: 'Day 30', label: 'Rev 5', desc: 'Milestone mastery — permanent synaptic encoding achieved', color: 'from-amber-400 to-orange-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="glass-modal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-white/10 animate-modal-pop relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#090D1A] rounded-[14px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">About SpaRE</h2>
              <p className="text-[11px] text-slate-400">Spaced Revision Engine & Cognitive Scheduling Mechanics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors glass-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto relative z-10 text-slate-300 text-xs leading-relaxed">
          {/* Scientific Foundation */}
          <div className="glass-panel p-4 rounded-2xl border border-blue-500/20 space-y-2 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Ebbinghaus Forgetting Curve Science</span>
            </div>
            <p className="text-slate-300">
              Without active repetition, the human brain forgets up to <strong>70% of new information within 24–48 hours</strong>. 
              <strong> SpaRE</strong> computes mathematically precise interval schedules to prompt recall right at the verge of forgetting, 
              flattening the forgetting curve into permanent long-term retention.
            </p>
          </div>

          {/* Core Spaced Formula */}
          <div className="space-y-3">
            {/* Visual Formula Card matching user's original badge */}
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs tracking-wider uppercase">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>SPACED FORMULA</span>
                </div>
                <div className="text-sm font-bold text-white font-mono tracking-tight">
                  Core: <span className="text-blue-400">1</span> &bull; <span className="text-blue-400">3</span> &bull; <span className="text-blue-400">7</span> &bull; <span className="text-blue-400">14</span> &bull; <span className="text-blue-400">30d</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Followed by <span className="text-emerald-400 font-semibold">30-day maintenance</span>
                </div>
              </div>

              <div className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-[#090D18] border border-amber-500/30 text-center shadow-inner">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  CASCADE
                </div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">
                  +1d Shift
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>The Core 5-Step Formula</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                1 &bull; 3 &bull; 7 &bull; 14 &bull; 30 Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {steps.map((s, idx) => (
                <div key={idx} className="glass-panel p-3 rounded-xl border border-white/[0.06] text-center space-y-1 hover:border-white/20 transition-all">
                  <div className={`text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                    {s.label}
                  </div>
                  <div className="text-sm font-extrabold text-white font-mono">{s.day}</div>
                  <p className="text-[10px] text-slate-400 line-clamp-3 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Intelligent Scheduling Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cascade +1d Shift */}
            <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>Dynamic Cascade Shift (+1d)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Missed a day or need extra time? SpaRE shifts all subsequent pending milestones forward by <strong>+1 day</strong>. 
                Interval gaps (e.g. 7 days between Rev 3 and Rev 4) are strictly preserved so you never suffer from compressed study load.
              </p>
            </div>

            {/* 30-Day Maintenance */}
            <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>30-Day Maintenance Lifespan</span>
              </div>
              <p className="text-[11px] text-slate-400">
                After completing Rev 5 (Day 30), topics don't disappear. They transition into recurring 30-day maintenance checks 
                based on your track lifespan (e.g. 4 months for College, 18 months for GATE, or infinite for Self-study).
              </p>
            </div>

            {/* Booster Revisions */}
            <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Booster Revisions (⭐)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Struggled with a concept? Mark it as <strong>Hard</strong> to insert an immediate booster revision 2–3 days later, 
                without disrupting the dates of your future milestones.
              </p>
            </div>
          </div>

          {/* Cloud Sync info */}
          <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-white font-bold text-xs">Offline-First + Realtime Cloud Sync</p>
                <p className="text-[10px] text-slate-400">Works 100% offline in your browser and automatically syncs with secure Cloud Database.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              v1.0 Production
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between bg-black/20">
          <span className="text-[10px] text-slate-500 font-mono">SpaRE &bull; Spaced Revision Engine</span>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 glass-btn"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
