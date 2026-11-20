import React, { useState } from 'react';
import { 
  Check, CheckCircle, Clock, ExternalLink, BookOpen, Calendar, 
  MoreVertical, Trash2, ChevronRight, Zap, Repeat, Edit2, RotateCcw
} from 'lucide-react';
import { CATEGORY_CONFIG, TOPIC_STATUS, MILESTONE_STATE, getCategoryMeta } from '../types';
import { formatDisplayDate } from '../engine/scheduler';
import TrackNotesView from './TrackNotesView';

export default function TopicCard({
  topic, currentMilestone, onRevised, onNotRevised, onDelete, onViewDetails, onEditTopic, onRestartSpacedRepetition, isDueToday = true, customCategories = {}
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [animatingAction, setAnimatingAction] = useState(null);

  const allCategories = Array.isArray(topic.categories) && topic.categories.length > 0 
    ? topic.categories 
    : [topic.category || 'College'];

  const primaryCategory = allCategories[0];
  const primaryMeta = getCategoryMeta(primaryCategory, customCategories);
  const isMaintenance = topic.status === TOPIC_STATUS.MAINTENANCE;
  const isDelayed = (topic.total_delay_days || 0) > 0;
  const isUrlNote = topic.notes && (topic.notes.startsWith('http://') || topic.notes.startsWith('https://'));

  const stripeBackground = allCategories.length > 1
    ? `linear-gradient(to right, ${allCategories.map(c => getCategoryMeta(c, customCategories).color).join(', ')})`
    : primaryMeta.color;

  const handleRevisedClick = () => {
    setAnimatingAction('revised');
    setTimeout(() => { onRevised(topic); setAnimatingAction(null); }, 200);
  };
  const handleNotRevisedClick = () => {
    setAnimatingAction('delayed');
    setTimeout(() => { onNotRevised(topic); setAnimatingAction(null); }, 200);
  };

  return (
    <div className={`group relative glass-card rounded-2xl overflow-hidden transition-all duration-200 ${
      animatingAction === 'revised' ? 'scale-[1.02] ring-2 ring-emerald-500/60 shadow-xl shadow-emerald-500/20' 
      : animatingAction === 'delayed' ? 'scale-[0.98] ring-2 ring-amber-500/60 opacity-80'
      : isDueToday ? 'hover:border-white/30' : 'opacity-85 hover:opacity-100'
    }`}>
      {/* Category accent stripe */}
      <div className="h-[3px] w-full" style={{ background: stripeBackground, boxShadow: `0 0 10px ${primaryMeta.color}60` }} />

      <div className="p-3.5">
        {/* Prominent Maintenance Mode Banner on top of Topic */}
        {isMaintenance && !topic.maintenance_ended && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold mb-2.5 shadow-sm">
            <div className="flex items-center space-x-1.5 truncate">
              <Repeat className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">🔁 MAINTENANCE MODE • Cycle #{Math.max(1, (topic.current_stage || 6) - 5)} (+{topic.maintenance_interval_days || 30}d)</span>
            </div>
            {onRestartSpacedRepetition && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRestartSpacedRepetition(topic); }}
                title="Dimaag se udh gaya? Restart spaced repetition from Day 1"
                className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-semibold flex items-center space-x-1 transition-all active:scale-95 ml-1 shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Restart Day 1</span>
              </button>
            )}
          </div>
        )}

        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center flex-wrap gap-1.5">
            {allCategories.map(cat => {
              const meta = getCategoryMeta(cat, customCategories);
              return (
                <span key={cat} className={`text-[10px] font-bold px-2 py-px rounded-md border ${meta.bgLight}`}>
                  {meta.badge}
                </span>
              );
            })}
            <span className="text-[10px] font-medium px-1.5 py-px rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.06]">{topic.subject}</span>
            {/* Difficulty Badge */}
            {topic.difficulty && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-px rounded-md border ${
                topic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                topic.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {topic.difficulty}
              </span>
            )}

            {/* Importance Badge */}
            {topic.importance && topic.importance !== 'Low' && (
              <span className={`text-[10px] font-semibold px-1.5 py-px rounded-md border ${
                topic.importance === 'High' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}>
                {topic.importance === 'High' ? '🔥 High' : 'Medium'}
              </span>
            )}

            {/* Latest Revision Rating Badge */}
            {(topic.last_difficulty || [...(topic.schedule || [])].reverse().find(m => m.state === 'COMPLETED' && m.difficulty)?.difficulty) && (
              (() => {
                const diff = topic.last_difficulty || [...(topic.schedule || [])].reverse().find(m => m.state === 'COMPLETED' && m.difficulty)?.difficulty;
                const isEasy = diff === 'Easy';
                const isHard = diff === 'Hard';
                return (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-px rounded-md border flex items-center space-x-1 ${
                    isEasy ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                    isHard ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse' :
                    'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    <span>{isEasy ? '✓' : isHard ? '⚠️' : '~'}</span>
                    <span>Last: {diff}</span>
                  </span>
                );
              })()
            )}

            {topic.maintenance_ended ? (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-px rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center">
                <CheckCircle className="w-2.5 h-2.5 mr-1 text-rose-400" />
                Mastered (Maint Ended)
              </span>
            ) : (
              <span className={`text-[10px] font-mono font-semibold px-1.5 py-px rounded-md flex items-center ${
                isMaintenance ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
              }`}>
                {isMaintenance ? <Repeat className="w-2.5 h-2.5 mr-1" /> : <Zap className="w-2.5 h-2.5 mr-1 text-amber-400" />}
                {isMaintenance 
                  ? `Maint #${Math.max(1, (topic.current_stage || 6) - 5)} (+${topic.maintenance_interval_days || 30}d)`
                  : currentMilestone?.label || `Stage ${topic.current_stage}`}
              </span>
            )}
            {isDelayed && (
              <span className="text-[10px] font-mono px-1.5 py-px rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center">
                <Clock className="w-2.5 h-2.5 mr-0.5 text-rose-400" />+{topic.total_delay_days}d
              </span>
            )}
          </div>
          {/* Menu */}
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors glass-btn">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-7 w-44 glass-modal rounded-xl shadow-2xl z-20 py-1 animate-modal-pop border border-white/10" onMouseLeave={() => setShowOptions(false)}>
                {onEditTopic && (
                  <button onClick={() => { setShowOptions(false); onEditTopic(topic); }} className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:bg-white/10 flex items-center space-x-2">
                    <Edit2 className="w-3 h-3 text-amber-400" /><span>Edit Topic & Tracks</span>
                  </button>
                )}
                <button onClick={() => { setShowOptions(false); onViewDetails(topic); }} className="w-full text-left px-3 py-1.5 text-[11px] text-slate-200 hover:bg-white/10 flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-blue-400" /><span>View Timeline</span>
                </button>
                {onRestartSpacedRepetition && (
                  <button 
                    onClick={() => { setShowOptions(false); onRestartSpacedRepetition(topic); }} 
                    className="w-full text-left px-3 py-1.5 text-[11px] text-cyan-300 hover:bg-cyan-500/10 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-3 h-3 text-cyan-400" /><span>Restart Spaced Revision</span>
                  </button>
                )}
                <button onClick={() => { setShowOptions(false); onDelete(topic.topic_id); }} className="w-full text-left px-3 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2">
                  <Trash2 className="w-3 h-3" /><span>Delete Topic</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-bold text-zinc-100 group-hover:text-white transition-colors mb-1.5 leading-snug">{topic.title}</h3>

        {/* Notes rendered in structured Track Boxes */}
        {topic.notes && (
          <div className="mb-3">
            <TrackNotesView notes={topic.notes} compact={true} />
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono mb-1">
            <span>
              {topic.maintenance_ended
                ? 'Mastery Achieved (Maintenance Finished)'
                : isMaintenance 
                ? `Maintenance Cycle #${Math.max(1, (topic.current_stage || 6) - 5)} (+${topic.maintenance_interval_days || 30}d)` 
                : `Stage ${Math.min(5, topic.current_stage || 1)}/5`}
            </span>
            <span className="text-zinc-300 font-bold">Due: {formatDisplayDate(currentMilestone?.scheduled_date)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            {topic.schedule?.map((m, idx) => {
              const isCompleted = m.state === MILESTONE_STATE.COMPLETED;
              const isCurrent = m.state === MILESTONE_STATE.PENDING && !topic.schedule.slice(0, idx).some(p => p.state === MILESTONE_STATE.PENDING);
              const label = m.is_booster ? '⭐' : m.stage_number > 5 ? `M${m.stage_number - 5}` : ['1d','3d','7d','14d','30d'][m.stage_number - 1] || `${m.stage_number}d`;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center" title={`${m.label}: ${formatDisplayDate(m.scheduled_date)}`}>
                  <div className={`w-full h-1.5 rounded-full transition-all ${
                    isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/40'
                    : isCurrent ? 'bg-white shadow-sm shadow-white/50 radar-ring' : 'bg-white/[0.06]'
                  }`} />
                  <span className={`text-[8px] mt-1 font-mono ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-white font-bold' : 'text-zinc-600'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {isDueToday ? (
          <div className="pt-2.5 border-t border-white/[0.06]">
            <button 
              onClick={handleRevisedClick} 
              disabled={!!animatingAction}
              className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-md shadow-emerald-600/25 active:scale-95 glass-btn light-sweep"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark as Revised</span>
            </button>
          </div>
        ) : (
          <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1"><Calendar className="w-3 h-3 text-zinc-400" /><span>Next: {formatDisplayDate(currentMilestone?.scheduled_date)}</span></span>
            <button onClick={() => onViewDetails(topic)} className="text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center space-x-0.5 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 glass-btn">
              <span>Details</span><ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
