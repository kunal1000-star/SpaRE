import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Trash2, Clock, Calendar, Repeat, Archive, Zap, ChevronDown, ChevronUp, Edit2, RotateCcw, Check, MoreVertical, Filter, Layers, Sparkles } from 'lucide-react';
import { CATEGORIES, getCategoryMeta, TOPIC_STATUS, MILESTONE_STATE } from '../types';
import { formatDisplayDate, formatDate, getCurrentPendingMilestone } from '../engine/scheduler';
import TrackNotesView from './TrackNotesView';

export default function AllTopicsView({ topics, todayStr = formatDate(new Date()), onRevised, onNotRevised, onDelete, onViewDetails, onEditTopic, onRestartSpacedRepetition, customCategories = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTouchStart = (topicId) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveActionMenuId(topicId);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 380);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const allCategoryKeys = useMemo(() => {
    const defaultKeys = Object.values(CATEGORIES);
    const customKeys = Object.keys(customCategories);
    const topicCats = new Set();
    topics.forEach(t => {
      if (Array.isArray(t.categories)) t.categories.forEach(c => topicCats.add(c));
      else if (t.category) topicCats.add(t.category);
    });
    return Array.from(new Set([...defaultKeys, ...customKeys, ...topicCats]));
  }, [customCategories, topics]);

  const filteredTopics = useMemo(() => topics.filter(t => {
    if (filterCategory !== 'ALL') {
      const cats = Array.isArray(t.categories) && t.categories.length > 0 ? t.categories : [t.category];
      if (!cats.includes(filterCategory)) return false;
    }
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q) && !(t.notes && t.notes.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [topics, filterCategory, filterStatus, searchQuery]);

  return (
    <div className="space-y-3.5 animate-slide-up">
      {/* Controls */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col md:flex-row gap-2.5 items-center justify-between border border-white/[0.06] relative z-40">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" placeholder="Search topics, subjects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-xl pl-8 pr-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none" />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto relative z-50">
          {/* Custom Modern Category Dropdown Filter */}
          <div className="relative z-50" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryOpen(prev => !prev);
                setIsStatusOpen(false);
              }}
              className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center space-x-2 transition-all shadow-sm ${
                isCategoryOpen 
                  ? 'bg-zinc-800 border-white/30 text-white shadow-md' 
                  : filterCategory !== 'ALL'
                  ? 'bg-zinc-900/90 border-white/20 text-white'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              {filterCategory === 'ALL' ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>All Categories</span>
                </>
              ) : (
                <>
                  <span 
                    className="w-2 h-2 rounded-full shadow-sm"
                    style={{ backgroundColor: getCategoryMeta(filterCategory, customCategories).color || '#38BDF8' }}
                  />
                  <span>{getCategoryMeta(filterCategory, customCategories).badge}</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Custom Category Popover Menu */}
            {isCategoryOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 z-[100] min-w-[200px] max-h-72 overflow-y-auto overscroll-contain custom-scrollbar rounded-2xl bg-[#0b0c10] border border-white/20 p-1.5 shadow-2xl shadow-black animate-pop-in space-y-0.5"
                onWheel={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-semibold">
                  Filter by Track
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('ALL');
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-between transition-colors ${
                    filterCategory === 'ALL' 
                      ? 'bg-white/15 text-white font-bold' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span>All Categories</span>
                  </div>
                  {filterCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-white" />}
                </button>

                <div className="border-t border-white/[0.08] my-1" />

                {allCategoryKeys.map(c => {
                  const meta = getCategoryMeta(c, customCategories);
                  const isSelected = filterCategory === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setFilterCategory(c);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-between transition-colors ${
                        isSelected 
                          ? 'bg-white/15 text-white font-bold' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: meta.color || '#38BDF8' }}
                        />
                        <span className="truncate">{meta.label || meta.badge}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Modern Status Dropdown Filter */}
          <div className="relative z-50" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsStatusOpen(prev => !prev);
                setIsCategoryOpen(false);
              }}
              className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center space-x-2 transition-all shadow-sm ${
                isStatusOpen 
                  ? 'bg-zinc-800 border-white/30 text-white shadow-md' 
                  : filterStatus !== 'ALL'
                  ? 'bg-zinc-900/90 border-white/20 text-white'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              {filterStatus === 'ALL' && (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>All Statuses</span>
                </>
              )}
              {filterStatus === TOPIC_STATUS.QUOTA_ACTIVE && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  <span>Core Quota</span>
                </>
              )}
              {filterStatus === TOPIC_STATUS.MAINTENANCE && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                  <span>Maintenance</span>
                </>
              )}
              {filterStatus === TOPIC_STATUS.ARCHIVED && (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-500 shadow-sm" />
                  <span>Archived</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isStatusOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Custom Status Popover Menu */}
            {isStatusOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 z-[100] min-w-[220px] max-h-72 overflow-y-auto overscroll-contain custom-scrollbar rounded-2xl bg-[#0b0c10] border border-white/20 p-1.5 shadow-2xl shadow-black animate-pop-in space-y-0.5"
                onWheel={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-semibold">
                  Filter by Repetition Stage
                </div>

                {[
                  { id: 'ALL', label: 'All Statuses', sub: 'Entire topic database', color: 'bg-zinc-400', icon: Sparkles },
                  { id: TOPIC_STATUS.QUOTA_ACTIVE, label: 'Core Quota', sub: '1-3-7-14-30d learning cycle', color: 'bg-emerald-400', icon: Zap },
                  { id: TOPIC_STATUS.MAINTENANCE, label: 'Maintenance', sub: 'Recurring 30d retention loop', color: 'bg-amber-400', icon: Repeat },
                  { id: TOPIC_STATUS.ARCHIVED, label: 'Archived', sub: 'Semester coursework completed', color: 'bg-zinc-500', icon: Archive }
                ].map(item => {
                  const isSelected = filterStatus === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFilterStatus(item.id);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-[11px] font-medium flex items-center justify-between transition-colors text-left ${
                        isSelected 
                          ? 'bg-white/15 text-white font-bold' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${item.color}`} />
                        <div>
                          <span className="block font-bold text-zinc-100">{item.label}</span>
                          <span className="text-[9px] text-zinc-400 block leading-tight">{item.sub}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5 relative z-0">
        {filteredTopics.length > 0 ? filteredTopics.map((topic, index) => {
          const currentPending = getCurrentPendingMilestone(topic);
          const allCategories = Array.isArray(topic.categories) && topic.categories.length > 0 
            ? topic.categories 
            : [topic.category || 'College'];
          const isMaintenance = topic.status === TOPIC_STATUS.MAINTENANCE;
          const isArchived = topic.status === TOPIC_STATUS.ARCHIVED;
          const isDelayed = (topic.total_delay_days || 0) > 0;
          const isExpanded = expandedTopicId === topic.topic_id;
          const isDueToday = Boolean(currentPending && currentPending.scheduled_date <= todayStr);

          return (
            <div key={topic.topic_id} style={{ animationDelay: `${index * 25}ms` }} className="glass-card rounded-2xl overflow-hidden animate-slide-up smooth-item">
              <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5">
                    {allCategories.map(cat => {
                      const meta = getCategoryMeta(cat, customCategories);
                      return (
                        <span key={cat} className={`text-[9px] font-bold px-2 py-px rounded border ${meta.bgLight}`}>
                          {meta.badge}
                        </span>
                      );
                    })}
                    <span className="text-[9px] font-medium px-1.5 py-px rounded bg-white/[0.04] text-slate-300 border border-white/[0.05]">{topic.subject}</span>
                    
                    {/* Difficulty Badge */}
                    {topic.difficulty && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-px rounded border ${
                        topic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        topic.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {topic.difficulty}
                      </span>
                    )}

                    {/* Importance Badge */}
                    {topic.importance && topic.importance !== 'Low' && (
                      <span className={`text-[9px] font-semibold px-1.5 py-px rounded border ${
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
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-px rounded border flex items-center space-x-1 ${
                            isEasy ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                            isHard ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                            'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            <span>{isEasy ? '✓' : isHard ? '⚠️' : '~'}</span>
                            <span>Last: {diff}</span>
                          </span>
                        );
                      })()
                    )}

                    {isMaintenance && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center shadow-sm">
                        <Repeat className="w-3 h-3 mr-1 text-emerald-400" />
                        🔁 Maintenance (+{topic.maintenance_interval_days || 30}d)
                      </span>
                    )}
                    {isArchived && <span className="text-[9px] font-bold px-1.5 py-px rounded bg-slate-800 text-slate-400 border border-white/[0.05] flex items-center"><Archive className="w-2.5 h-2.5 mr-0.5" />Archived</span>}
                    {isDelayed && <span className="text-[9px] font-mono px-1.5 py-px rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">+{topic.total_delay_days}d</span>}
                  </div>
                  <h4 className="text-[13px] font-bold text-white leading-snug truncate">{topic.title}</h4>
                  {topic.notes && (
                    <div className="mt-1.5 w-full max-w-xl">
                      <TrackNotesView notes={topic.notes} compact={true} />
                    </div>
                  )}
                </div>

                {/* Step dots */}
                <div className="flex items-center space-x-0.5 shrink-0 overflow-x-auto max-w-[200px] py-1">
                  {topic.schedule?.map((m, idx) => {
                    const done = m.state === MILESTONE_STATE.COMPLETED;
                    const cur = m.state === MILESTONE_STATE.PENDING && !topic.schedule.slice(0, idx).some(p => p.state === MILESTONE_STATE.PENDING);
                    const label = m.is_booster ? '⭐' : m.stage_number > 5 ? `M${m.stage_number - 5}` : ['1d','3d','7d','14d','30d'][m.stage_number - 1] || `${m.stage_number}d`;
                    return (
                      <div key={idx} className="flex items-center" title={`${m.label} • ${formatDisplayDate(m.scheduled_date)}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-mono font-bold ${
                          done ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : cur ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/40 radar-ring' : 'bg-white/[0.04] text-slate-500 border border-white/[0.05]'
                        }`}>{label}</div>
                        {idx < topic.schedule.length - 1 && <div className={`w-1 h-px ${done ? 'bg-emerald-500/50' : 'bg-white/[0.06]'}`} />}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-white/[0.06] relative">
                  {currentPending && (
                    <div className="text-right mr-1 hidden sm:block">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Due</span>
                      <span className="text-[11px] font-mono font-semibold text-zinc-300">{formatDisplayDate(currentPending.scheduled_date)}</span>
                    </div>
                  )}

                  {isArchived ? (
                    <span className="text-[11px] font-semibold text-zinc-400 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.06]">Archived</span>
                  ) : isDueToday ? (
                    <button 
                      onClick={() => onRevised(topic)} 
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 active:scale-95 transition-all glass-btn light-sweep"
                      title="Mark topic as revised today"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Revised</span>
                    </button>
                  ) : currentPending ? (
                    <span className="text-[11px] font-semibold text-zinc-400 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.06] flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Upcoming</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/25">Completed</span>
                  )}

                  {/* Expand Milestones Chevron */}
                  <button 
                    onClick={() => setExpandedTopicId(isExpanded ? null : topic.topic_id)} 
                    className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 glass-btn transition-colors"
                    title={isExpanded ? 'Collapse Milestones' : 'Expand Milestones'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Long-Press & More Options Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onTouchStart={() => handleTouchStart(topic.topic_id)}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={() => handleTouchStart(topic.topic_id)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                      onClick={() => setActiveActionMenuId(activeActionMenuId === topic.topic_id ? null : topic.topic_id)}
                      className={`p-2 rounded-xl transition-all glass-btn ${
                        activeActionMenuId === topic.topic_id 
                          ? 'bg-white text-black shadow-lg scale-105' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                      title="Long-press or click for Edit, Restart, Delete"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Animated 3-Option Popover (Edit, Restart, Delete) */}
                    {activeActionMenuId === topic.topic_id && (
                      <div 
                        className="absolute right-0 bottom-full sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-10 mb-2 sm:mb-0 rounded-2xl glass-modal border border-white/20 shadow-2xl p-1.5 flex items-center space-x-1 z-30 animate-modal-pop backdrop-blur-2xl bg-zinc-950/95"
                        onMouseLeave={() => setActiveActionMenuId(null)}
                      >
                        {onEditTopic && (
                          <button 
                            type="button"
                            onClick={() => { setActiveActionMenuId(null); onEditTopic(topic); }} 
                            className="px-2.5 py-1.5 rounded-xl text-zinc-300 hover:text-amber-300 hover:bg-amber-500/15 flex items-center space-x-1.5 text-xs font-semibold transition-all active:scale-95" 
                            title="Edit Topic & Tracks"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit</span>
                          </button>
                        )}
                        {onRestartSpacedRepetition && (
                          <button 
                            type="button"
                            onClick={() => { setActiveActionMenuId(null); onRestartSpacedRepetition(topic); }} 
                            className="px-2.5 py-1.5 rounded-xl text-zinc-300 hover:text-cyan-300 hover:bg-cyan-500/15 flex items-center space-x-1.5 text-xs font-semibold transition-all active:scale-95" 
                            title="Restart Spaced Repetition (Day 1-30)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Restart</span>
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => { setActiveActionMenuId(null); onDelete(topic.topic_id); }} 
                          className="px-2.5 py-1.5 rounded-xl text-zinc-300 hover:text-rose-400 hover:bg-rose-500/15 flex items-center space-x-1.5 text-xs font-semibold transition-all active:scale-95"
                          title="Delete Topic"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded milestones & notes */}
              {isExpanded && (
                <div className="px-4 py-3 bg-black/30 border-t border-white/[0.06] animate-slide-up space-y-3">
                  {topic.notes && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Track Notes:</span>
                      <TrackNotesView notes={topic.notes} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Milestones</span>
                      <span className="text-[10px] text-slate-400 font-mono">Started: {formatDisplayDate(topic.created_date)}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(topic.schedule || []).map((m, mIdx) => {
                      const done = m.state === MILESTONE_STATE.COMPLETED;
                      return (
                        <div key={mIdx} className={`p-2.5 rounded-xl border text-[11px] space-y-0.5 ${done ? 'bg-emerald-950/15 border-emerald-500/25' : 'glass-panel'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{m.label}{m.is_booster ? ' ⭐' : ''}</span>
                            <span className={`text-[9px] font-mono px-1.5 rounded font-bold ${done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{done ? 'DONE' : 'PENDING'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Sched: <span className="font-mono text-slate-200">{formatDisplayDate(m.scheduled_date)}</span></div>
                          {done && m.completed_date && <div className="text-[9px] text-emerald-400/80">Done: {formatDisplayDate(m.completed_date)} {m.difficulty ? `(${m.difficulty})` : ''}</div>}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-[11px]">No topics match your filters.</div>
        )}
      </div>
    </div>
  );
}
