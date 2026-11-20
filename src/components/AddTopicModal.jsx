import React, { useState, useMemo, useEffect } from 'react';
import { X, BookOpen, Check, Clock, Sparkles, Plus, Search, Zap, Tag, Settings as SettingsIcon } from 'lucide-react';
import { 
  CATEGORIES, 
  DEFAULT_CATEGORY_CONFIG, 
  DEFAULT_CUSTOM_CATEGORIES,
  getCategoryMeta, 
  TOPIC_DIFFICULTY, 
  TOPIC_IMPORTANCE, 
  computeShortestUniquePrefixes
} from '../types';
import { createInitialSchedule, formatDate, formatDisplayDate } from '../engine/scheduler';
import TrackNotesView from './TrackNotesView';
import { RotateCcw } from 'lucide-react';

export default function AddTopicModal({ 
  isOpen, 
  onClose, 
  onAddTopic, 
  syllabusSubjects = [],
  existingSubjects = [], 
  syllabusList = [],
  initialData = null,
  customCategories = {},
  onOpenSettingsModal,
  onOpenSyllabusModal
}) {
  const todayStr = formatDate(new Date());
  const [title, setTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([CATEGORIES.GATE]);
  const [subject, setSubject] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSelectingSubject, setIsSelectingSubject] = useState(false);
  const [difficulty, setDifficulty] = useState('Medium');
  const [importance, setImportance] = useState('High');
  const [maintenanceInterval, setMaintenanceInterval] = useState(30);
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setFormError('');
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.categories && Array.isArray(initialData.categories)) {
        setSelectedCategories(initialData.categories);
      } else if (initialData.category) {
        setSelectedCategories([initialData.category]);
      }
      if (initialData.subject) setSubject(initialData.subject);
      if (initialData.difficulty) setDifficulty(initialData.difficulty);
      if (initialData.importance) setImportance(initialData.importance);
      if (initialData.maintenance_interval_days) setMaintenanceInterval(initialData.maintenance_interval_days);
      if (initialData.notes) setNotes(initialData.notes);
      if (initialData.startDate) setStartDate(initialData.startDate);
    }
  }, [initialData, isOpen]);

  const previewSchedule = useMemo(() => createInitialSchedule(startDate), [startDate]);

  const availableSubjects = useMemo(() => {
    const list = Array.from(new Set([
      ...(syllabusSubjects || []),
      ...(existingSubjects || [])
    ])).filter(Boolean);
    return list;
  }, [syllabusSubjects, existingSubjects]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return availableSubjects;
    return availableSubjects.filter(s => 
      s.toLowerCase().includes(subjectSearch.toLowerCase().trim())
    );
  }, [availableSubjects, subjectSearch]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();

    if (!cleanTitle) {
      setFormError('Topic title is required.');
      return;
    }

    if (selectedCategories.length === 0) {
      setFormError('Please select at least 1 category/track for this topic.');
      return;
    }

    if (!cleanSubject) {
      setFormError('Please select a subject from your syllabus or enter a valid subject.');
      return;
    }

    onAddTopic({ 
      title: cleanTitle, 
      category: selectedCategories[0], // primary for backwards compatibility
      categories: selectedCategories,  // all selected categories
      subject: cleanSubject, 
      difficulty,
      importance,
      maintenance_interval_days: parseInt(maintenanceInterval, 10) || 30,
      notes: notes.trim(), 
      startDate 
    });
    setTitle(''); 
    setSelectedCategories([CATEGORIES.GATE]); 
    setSubject(''); 
    setSubjectSearch('');
    setIsSelectingSubject(false);
    setDifficulty('Medium');
    setImportance('High');
    setNotes(''); 
    setStartDate(todayStr); 
    setFormError('');
    onClose();
  };

  const handleNotesKeyDown = (e) => {
    if (e.key === 'Enter') {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Find the current line up to the cursor
      const lastNewLine = value.lastIndexOf('\n', start - 1);
      const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
      const currentLine = value.slice(lineStart, start);

      // If current line is just "- " or "• " (empty bullet), clear it on Enter
      if (/^[-*•]\s*$/.test(currentLine)) {
        e.preventDefault();
        const updated = value.slice(0, lineStart) + value.slice(end);
        setNotes(updated);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        }, 0);
        return;
      }

      // If current line starts with "- " or "• " with text, auto-continue next line with "- "
      if (/^[-*•]\s+/.test(currentLine)) {
        e.preventDefault();
        const prefix = '- ';
        const updated = value.slice(0, start) + '\n' + prefix + value.slice(end);
        setNotes(updated);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + prefix.length;
        }, 0);
        return;
      }

      // If current line is a track prefix like "c." or "g." or "n." or "s.", auto-insert "- " on next line
      if (/^[a-zA-Z]+[.:]\s*$/.test(currentLine)) {
        e.preventDefault();
        const prefix = '- ';
        const updated = value.slice(0, start) + '\n' + prefix + value.slice(end);
        setNotes(updated);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + prefix.length;
        }, 0);
        return;
      }
    }
  };

  const insertPrefix = (prefixText) => {
    setNotes(prev => {
      const needsNewLine = prev && !prev.endsWith('\n');
      return `${prev || ''}${needsNewLine ? '\n' : ''}${prefixText}`;
    });
  };

  const allCategoryKeys = useMemo(() => {
    const keys = new Set([
      ...Object.values(CATEGORIES),
      ...Object.keys(DEFAULT_CUSTOM_CATEGORIES),
      ...Object.keys(customCategories || {})
    ]);

    // Also include any tracks/categories explicitly used in syllabus subjects or modules
    if (Array.isArray(syllabusList)) {
      syllabusList.forEach(sub => {
        if (sub?.category) keys.add(sub.category);
        if (Array.isArray(sub?.categories)) sub.categories.forEach(c => { if (c) keys.add(c); });
        if (sub?.companyRelevance) {
          const trimmed = sub.companyRelevance.trim();
          if (trimmed && trimmed.length <= 25) keys.add(trimmed);
        }
        if (Array.isArray(sub?.modules)) {
          sub.modules.forEach(mod => {
            if (mod?.category) keys.add(mod.category);
            if (Array.isArray(mod?.categories)) mod.categories.forEach(c => { if (c) keys.add(c); });
            if (mod?.companyFocus) {
              const comp = mod.companyFocus.trim();
              if (comp && comp.length <= 25) keys.add(comp);
            }
          });
        }
      });
    }

    if (initialData?.categories && Array.isArray(initialData.categories)) {
      initialData.categories.forEach(c => { if (c) keys.add(c); });
    }
    if (initialData?.category) {
      keys.add(initialData.category);
    }
    return Array.from(keys).filter(cat => String(cat).trim().toLowerCase() !== 'general');
  }, [customCategories, initialData, syllabusList]);

  const availableTrackNames = useMemo(() => {
    return Array.from(new Set([
      ...selectedCategories,
      ...allCategoryKeys
    ]));
  }, [selectedCategories, allCategoryKeys]);

  const uniquePrefixes = useMemo(() => {
    return computeShortestUniquePrefixes(availableTrackNames);
  }, [availableTrackNames]);

  // Must stay after all hooks above: returning early before a hook changes the
  // hook order between closed/open renders and crashes the whole React tree.
  if (!isOpen) return null;

  const primaryCat = selectedCategories[0] || CATEGORIES.GATE;
  const primaryMeta = getCategoryMeta(primaryCat, customCategories);
  const chips = existingSubjects || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="glass-modal w-full max-w-xl rounded-2xl overflow-hidden my-auto animate-modal-pop border border-white/10 relative z-10" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-px">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center text-blue-400 font-bold text-sm">+</div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Add New Topic</h2>
              <p className="text-[10px] text-slate-400">Initialize 5-stage spaced revision with multi-category support</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 glass-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Topic Title <span className="text-rose-400">*</span>
            </label>
            <input 
              type="text" 
              required 
              autoFocus 
              placeholder="e.g. Virtual Memory & Page Replacement..." 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-[12px] text-slate-100 placeholder:text-slate-500 focus:outline-none" 
            />
          </div>

          {/* Multiple Categories Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                Target Categories & Tracks <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {selectedCategories.length} selected
                </span>
                {onOpenSettingsModal && (
                  <button
                    type="button"
                    onClick={onOpenSettingsModal}
                    className="text-[10px] font-bold text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center space-x-1 active:scale-95 transition-all"
                    title="Add custom tracks, configure lifespan & quotas in Settings"
                  >
                    <SettingsIcon className="w-3 h-3 text-zinc-300" />
                    <span>Manage Tracks</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allCategoryKeys.map(cat => {
                const meta = getCategoryMeta(cat, customCategories);
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button 
                    key={cat} 
                    type="button" 
                    onClick={() => toggleCategory(cat)}
                    className={`text-left p-2.5 rounded-xl border glass-btn transition-all ${
                      isSelected 
                        ? `${meta.bgLight} border-2 shadow-md scale-[1.02] ring-1 ring-white/20` 
                        : 'glass-panel text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {meta.badge}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">+ Add</span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 line-clamp-1">{meta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Selection (Strictly from Syllabus) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Subject <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-amber-400/90 font-mono">
                {availableSubjects.length} in syllabus
              </span>
            </div>

            {/* If subject is selected and not changing */}
            {subject && !isSelectingSubject ? (
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">{subject}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsSelectingSubject(true); setSubjectSearch(''); }}
                  className="text-[10px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors"
                >
                  Change Subject
                </button>
              </div>
            ) : (
              /* Searchable Dropdown for Syllabus Subjects */
              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus={isSelectingSubject}
                    placeholder="Search subject from your syllabus..." 
                    value={subjectSearch} 
                    onChange={e => setSubjectSearch(e.target.value)}
                    className="w-full glass-input rounded-xl pl-8 pr-3.5 py-2 text-[12px] text-slate-100 placeholder:text-slate-500 focus:outline-none" 
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Available Subjects List */}
                {availableSubjects.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1.5 animate-fade-in">
                    <p className="text-[11px] text-amber-300 font-medium">
                      ⚠️ No subjects found in Syllabus!
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Please add your subject in the Syllabus section first so all topics remain standardized.
                    </p>
                    {onOpenSyllabusModal && (
                      <button
                        type="button"
                        onClick={onOpenSyllabusModal}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition-colors shadow-sm active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Subject in Syllabus</span>
                      </button>
                    )}
                  </div>
                ) : filteredSubjects.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0A0E1A] p-1 space-y-1 shadow-inner">
                    {filteredSubjects.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSubject(s);
                          setIsSelectingSubject(false);
                          setSubjectSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                          subject === s 
                            ? 'bg-blue-600/25 text-blue-300 border border-blue-500/30 font-bold' 
                            : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span>{s}</span>
                        </div>
                        {subject === s && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
                    <p className="text-[11px] text-slate-400">
                      No subject matching <span className="text-white font-semibold">"{subjectSearch}"</span> in Syllabus.
                    </p>
                    {onOpenSyllabusModal && (
                      <button
                        type="button"
                        onClick={onOpenSyllabusModal}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Open Syllabus to add "{subjectSearch}"</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Cancel button if subject was already selected */}
                {subject && isSelectingSubject && (
                  <button
                    type="button"
                    onClick={() => { setIsSelectingSubject(false); setSubjectSearch(''); }}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Cancel (keep "{subject}")
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Difficulty & Importance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Difficulty */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Baseline Difficulty</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Easy', label: 'Easy', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
                  { id: 'Medium', label: 'Medium', color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
                  { id: 'Hard', label: 'Hard', color: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDifficulty(opt.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      difficulty === opt.id
                        ? `${opt.color} shadow-sm ring-1 ring-white/10 scale-[1.02]`
                        : 'glass-panel text-slate-400 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Importance / Exam Priority */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Exam Importance</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Low', label: 'Low', color: 'text-slate-300 border-slate-500/40 bg-white/[0.04]' },
                  { id: 'Medium', label: 'Medium', color: 'text-blue-300 border-blue-500/40 bg-blue-500/10' },
                  { id: 'High', label: 'High 🔥', color: 'text-orange-300 border-orange-500/40 bg-orange-500/15' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setImportance(opt.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      importance === opt.id
                        ? `${opt.color} shadow-sm ring-1 ring-white/10 scale-[1.02]`
                        : 'glass-panel text-slate-400 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Recurring Maintenance Interval */}
          <div className="p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 flex items-center space-x-1">
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Custom Maintenance Cycle (Post Rev 5)</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.2 rounded border border-amber-500/20">
                +{maintenanceInterval} days recurring
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Rev 5 ke baad har kitne dino par yeh topic dubara revise karna chahte hain?
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {[15, 30, 45, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setMaintenanceInterval(days)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                    maintenanceInterval === days
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm scale-[1.02]'
                      : 'glass-panel text-slate-300 hover:text-white border-white/10'
                  }`}
                >
                  +{days}d
                </button>
              ))}
              <div className="flex items-center space-x-1 ml-1">
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="days"
                  value={maintenanceInterval}
                  onChange={(e) => setMaintenanceInterval(parseInt(e.target.value, 10) || 30)}
                  className="w-16 glass-input rounded-xl px-2 py-1 text-xs font-mono font-bold text-white border border-amber-500/30 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-mono">days</span>
              </div>
            </div>
          </div>

          {/* Multi-Track Smart Notes */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Track Notes & Points <span className="text-slate-500 lowercase">(optional)</span>
              </label>
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-[9px] text-slate-500 mr-0.5">Quick Track:</span>
                {availableTrackNames.slice(0, 6).map((catName) => {
                  const prefix = uniquePrefixes[catName] || catName.slice(0, 1).toLowerCase();
                  const meta = getCategoryMeta(catName, customCategories);
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => insertPrefix(`${prefix}.\n- `)}
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors active:scale-95 ${meta.bgLight}`}
                      title={`Insert ${catName} section with unique prefix '${prefix}.'`}
                    >
                      + {prefix}. {meta.badge}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => insertPrefix('- ')}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/10 hover:bg-white/10 font-mono transition-colors"
                >
                  + • Bullet
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="Type dynamic prefix like c. for College, g. for GATE, am. for AMD, ap. for Apple...&#10;Press Enter after '- ' for automatic bullet points!"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onKeyDown={handleNotesKeyDown}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-[12px] text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans leading-relaxed"
              />
            </div>

            {/* Live Track Box Preview */}
            {notes.trim() && (
              <div className="mt-2 space-y-1 animate-fade-in">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Live Track Boxes Preview:
                </span>
                <TrackNotesView notes={notes} compact={true} collapsible={false} />
              </div>
            )}
          </div>

          {/* First Studied Date */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              First Studied (T₀)
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-[12px] text-slate-100 focus:outline-none cursor-pointer" 
            />
          </div>

          {/* Schedule preview */}
          <div className="glass-panel rounded-xl p-3 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">5-Step Schedule</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/25">Auto</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {previewSchedule.map((m, i) => (
                <div key={i} className="bg-white/[0.03] p-1.5 rounded-lg border border-white/[0.04] text-center">
                  <span className="text-[9px] font-bold text-blue-400 block">{['R1 +1d','R2 +3d','R3 +7d','R4 +14d','R5 +30d'][i]}</span>
                  <span className="text-[10px] font-mono font-bold text-white block">{formatDisplayDate(m.scheduled_date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="px-3 py-2 text-[11px] font-semibold text-slate-400 hover:text-white glass-btn">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-md shadow-blue-500/25 active:scale-95 glass-btn light-sweep">
              Create Topic ({selectedCategories.length} Tracks)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
