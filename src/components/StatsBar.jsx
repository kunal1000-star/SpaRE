import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Layers, 
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp 
} from 'lucide-react';
import { TOPIC_STATUS } from '../types';

export default function StatsBar({
  todayTotal,
  todayCompleted,
  totalActiveTopics,
  maintenanceCount,
  rolloverNotification,
  onDismissRollover,
  heavyLoadDays = []
}) {
  const completionPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 100;
  const isAllDone = todayTotal > 0 && todayCompleted === todayTotal;
  const hasHeavyLoad = heavyLoadDays.length > 0;

  return (
    <div className="space-y-3 mb-6 animate-slide-up">
      {/* Rollover Alert Banner with Frosted Glass & Pulse Ring */}
      {rolloverNotification && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl glass-panel border border-blue-500/40 text-blue-200 text-xs shadow-lg shadow-blue-500/10 animate-pop-in">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <span>
              <strong>Midnight Auto-Rollover:</strong> {rolloverNotification.count} missed topic(s) automatically shifted by +1 day so you never lose revision intervals!
            </span>
          </div>
          <button 
            onClick={onDismissRollover}
            className="text-slate-400 hover:text-white text-xs underline ml-3 shrink-0 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Heavy Load Warning Badge with Amber Glass */}
      {hasHeavyLoad && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl glass-panel border border-amber-500/40 text-amber-200 text-xs shadow-lg shadow-amber-500/10 animate-pop-in">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>
              <strong>Heavy Load Warning:</strong> {heavyLoadDays[0]?.date} has {heavyLoadDays[0]?.count} topics scheduled (≥ 8 topics recommended threshold).
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-400/90 hidden sm:inline px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            Tip: Focus on Core Quota
          </span>
        </div>
      )}

      {/* Main Glass Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Today's Progress Card */}
        <div className="glass-card p-5 rounded-3xl relative overflow-hidden group">
          {/* Subtle Ambient Glow inside card */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${isAllDone ? 'text-emerald-400 animate-bounce' : 'text-blue-400'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Today's Progress
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
              {todayCompleted} / {todayTotal} ({completionPercentage}%)
            </span>
          </div>

          {/* Animated Glowing Progress Bar */}
          <div className="w-full bg-zinc-950/80 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out relative light-sweep ${
                isAllDone 
                  ? 'bg-gradient-to-r from-zinc-200 via-white to-zinc-300 shadow-md shadow-white/30' 
                  : 'bg-gradient-to-r from-zinc-500 via-zinc-300 to-white shadow-md shadow-white/20'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>{Math.max(0, todayTotal - todayCompleted)} remaining today</span>
            {isAllDone && todayTotal > 0 && (
              <span className="text-emerald-400 flex items-center space-x-1 font-semibold animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>All done for today!</span>
              </span>
            )}
          </div>
        </div>

        {/* Active Topics Breakdown Card */}
        <div className="glass-card p-5 rounded-3xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Library
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{totalActiveTopics}</span>
              <span className="text-xs text-slate-400">topics in system</span>
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-4 space-y-1.5">
            <div className="text-[11px] text-slate-400 flex items-center justify-end space-x-1">
              <span>Core Quota:</span>
              <span className="font-bold text-white font-mono bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                {totalActiveTopics - maintenanceCount}
              </span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center justify-end space-x-1">
              <span>30d Maint:</span>
              <span className="font-bold font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                {maintenanceCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
