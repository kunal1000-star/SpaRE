import React from 'react';
import { X, Calendar, BookOpen, ExternalLink, Repeat, RotateCcw, Video, FileText, Globe, Target, Link as LinkIcon } from 'lucide-react';
import { CATEGORY_CONFIG, MILESTONE_STATE, TOPIC_STATUS, getCategoryMeta } from '../types';
import { formatDisplayDate } from '../engine/scheduler';
import TrackNotesView from './TrackNotesView';

export default function TopicDetailsModal({ isOpen, topic, onClose, onRestartSpacedRepetition, customCategories = {} }) {
  if (!isOpen || !topic) return null;
  const allCats = Array.isArray(topic.categories) && topic.categories.length > 0 ? topic.categories : [topic.category || 'College'];
  const isUrl = topic.notes && (topic.notes.startsWith('http://') || topic.notes.startsWith('https://'));
  const isMaintenance = topic.status === TOPIC_STATUS.MAINTENANCE;

  const matchedResources = (() => {
    try {
      const stored = localStorage.getItem('spare_subject_resources_v2');
      if (!stored) return [];
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return [];
      const subj = (topic.subject || '').toLowerCase().trim();
      const title = (topic.title || '').toLowerCase().trim();
      return list.filter(r => {
        const rSubj = (r.subject || '').toLowerCase().trim();
        const rTopic = (r.chapter_topic || '').toLowerCase().trim();
        return (rSubj && (rSubj === subj || subj.includes(rSubj))) ||
               (rTopic && (title.includes(rTopic) || rTopic.includes(title)));
      });
    } catch {
      return [];
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-4 border border-white/10 animate-modal-pop" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-1.5">
            {allCats.map(cat => {
              const meta = getCategoryMeta(cat, customCategories);
              return (
                <span key={cat} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${meta.bgLight}`}>
                  {meta.badge}
                </span>
              );
            })}
            <span className="text-[11px] text-slate-300 font-medium">{topic.subject}</span>
            {topic.difficulty && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                topic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                topic.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {topic.difficulty}
              </span>
            )}
            {topic.importance && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                topic.importance === 'High' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}>
                {topic.importance === 'High' ? '🔥 High Yield' : topic.importance}
              </span>
            )}
            {topic.last_difficulty && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border flex items-center space-x-1 ${
                topic.last_difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                topic.last_difficulty === 'Hard' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                <span>{topic.last_difficulty === 'Easy' ? '✓' : topic.last_difficulty === 'Hard' ? '⚠️' : '~'}</span>
                <span>Last Rev: {topic.last_difficulty}</span>
              </span>
            )}
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {topic.maintenance_ended ? '🛑 Maint Ended' : `🔁 +${topic.maintenance_interval_days || 30}d Recurring`}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 glass-btn"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Prominent Maintenance Mode Banner */}
          {isMaintenance && !topic.maintenance_ended && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-300">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <span>Topic is in Maintenance Mode</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Cycle #{Math.max(1, (topic.current_stage || 6) - 5)} &bull; Recurring every +{topic.maintenance_interval_days || 30} days
                </p>
              </div>
              {onRestartSpacedRepetition && (
                <button
                  type="button"
                  onClick={() => onRestartSpacedRepetition(topic)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Spaced Revision</span>
                </button>
              )}
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold text-white mb-2">{topic.title}</h2>
            {topic.notes && (
              <div className="mb-2">
                <TrackNotesView notes={topic.notes} collapsible={false} />
              </div>
            )}
          </div>

          {/* Matched Subject & Chapter Resources */}
          {matchedResources.length > 0 && (
            <div className="space-y-1.5 glass-panel p-3 rounded-xl border border-white/[0.08]">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                <span>Subject & Topic Resources ({matchedResources.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {matchedResources.map(res => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between group text-[11px]"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {res.type === 'youtube' ? <Video className="w-3.5 h-3.5 text-red-400 shrink-0" /> :
                       res.type === 'notion' ? <FileText className="w-3.5 h-3.5 text-zinc-200 shrink-0" /> :
                       res.type === 'article' ? <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> :
                       res.type === 'practice' ? <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" /> :
                       <LinkIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                      <div className="truncate">
                        <span className="font-semibold text-white group-hover:text-zinc-200 block truncate">{res.title}</span>
                        {res.chapter_topic && <span className="text-[9px] text-zinc-400 block truncate">📌 {res.chapter_topic}</span>}
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-white shrink-0 ml-1.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 glass-panel p-3 rounded-xl border border-white/[0.06] text-center font-mono">
            <div><span className="text-[9px] uppercase font-bold text-slate-500 block">Created</span><span className="text-[11px] font-bold text-white">{formatDisplayDate(topic.created_date)}</span></div>
            <div><span className="text-[9px] uppercase font-bold text-slate-500 block">Stage</span><span className="text-[11px] font-bold text-blue-400">{topic.current_stage}</span></div>
            <div><span className="text-[9px] uppercase font-bold text-slate-500 block">Delay</span><span className={`text-[11px] font-bold ${topic.total_delay_days > 0 ? 'text-rose-400' : 'text-slate-300'}`}>+{topic.total_delay_days || 0}d</span></div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1"><Calendar className="w-3.5 h-3.5 text-blue-400" /><span>All Milestones</span></h3>
            <div className="space-y-1.5">
              {(topic.schedule || []).map((m, i) => {
                const done = m.state === MILESTONE_STATE.COMPLETED;
                return (
                  <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${done ? 'bg-emerald-950/15 border-emerald-500/25' : 'glass-panel'}`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[9px] font-bold ${done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.04] text-slate-400'}`}>{i + 1}</div>
                      <div>
                        <span className="font-bold text-white block">{m.label}{m.is_booster ? ' ⭐' : ''}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Due: {formatDisplayDate(m.scheduled_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{done ? 'Completed' : 'Pending'}</span>
                      {done && m.completed_date && <span className="text-[9px] text-slate-400 block mt-0.5">on {formatDisplayDate(m.completed_date)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-[11px] font-semibold glass-btn">Close</button>
        </div>
      </div>
    </div>
  );
}
