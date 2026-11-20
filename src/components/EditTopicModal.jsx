import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, BookOpen, Sparkles, Trash2, Tag, Search, Plus, Zap, RotateCcw, CheckCircle2, ShieldOff, Clock } from 'lucide-react';
import { CATEGORIES, DEFAULT_CUSTOM_CATEGORIES, getCategoryMeta, computeShortestUniquePrefixes } from '../types';
import TrackNotesView from './TrackNotesView';
import ConfirmationModal from './ConfirmationModal';

export default function EditTopicModal({ 
  isOpen, 
  topic, 
  onClose, 
  onSaveTopic, 
  customCategories = {},
  syllabusSubjects = [],
  onRestartSpacedRepetition,
  onOpenSyllabusModal
}) {
  const [title, setTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [subject, setSubject] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSelectingSubject, setIsSelectingSubject] = useState(false);
  const [difficulty, setDifficulty] = useState('Medium');
  const [importance, setImportance] = useState('Medium');
  const [maintenanceInterval, setMaintenanceInterval] = useState(30);
  const [maintenanceEnded, setMaintenanceEnded] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  useEffect(() => {
    if (topic && isOpen) {
      setTitle(topic.title || '');
      const cats = Array.isArray(topic.categories) && topic.categories.length > 0 
        ? topic.categories 
        : [topic.category || 'GATE'];
      setSelectedCategories(cats);
      setSubject(topic.subject || '');
      setDifficulty(topic.difficulty || 'Medium');
      setImportance(topic.importance || 'Medium');
      const interval = topic.maintenance_interval_days || 30;
      setMaintenanceInterval(interval);
      setMaintenanceEnded(Boolean(topic.maintenance_ended));
      if (![15, 30, 45, 60, 90].includes(interval)) {
        setIsCustomDays(true);
        setCustomDaysInput(String(interval));
      } else {
        setIsCustomDays(false);
        setCustomDaysInput('');
      }
      setNotes(topic.notes || '');
      setIsSelectingSubject(false);
      setSubjectSearch('');
      setEditError('');
    }
  }, [topic, isOpen]);

  const [editError, setEditError] = useState('');

  const availableSubjects = useMemo(() => {
    return Array.from(new Set([
      ...(syllabusSubjects || []),
      topic?.subject ? topic.subject : null
    ])).filter(Boolean);
  }, [syllabusSubjects, topic]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return availableSubjects;
    return availableSubjects.filter(s => 
      s.toLowerCase().includes(subjectSearch.toLowerCase().trim())
    );
  }, [availableSubjects, subjectSearch]);

  const availableTrackNames = useMemo(() => {
    return Array.from(new Set([
      ...selectedCategories,
      ...Object.values(CATEGORIES),
      ...Object.keys(customCategories)
    ]));
  }, [selectedCategories, customCategories]);

  const uniquePrefixes = useMemo(() => {
    return computeShortestUniquePrefixes(availableTrackNames);
  }, [availableTrackNames]);

  if (!isOpen || !topic) return null;

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

  const triggerRemoveCollege = () => {
    setConfirmConfig({
      title: 'Unlink College Track?',
      message: `Kya aap "${title || topic.title}" se College track unlink karna chahte hain?`,
      subMessage: 'Semester exams ke baad College track aur notes remove ho jayenge. GATE aur company prep intact rahenge.',
      confirmText: 'Yes, Unlink College',
      cancelText: 'Cancel',
      type: 'unlink',
      onConfirm: () => {
        // 1. Remove College from selected categories
        setSelectedCategories(prev => {
          const filtered = prev.filter(c => c !== CATEGORIES.COLLEGE);
          return filtered.length > 0 ? filtered : [CATEGORIES.GATE];
        });

        // 2. Remove College notes line if present
        setNotes(prev => {
          const lines = prev.split('\n');
          const filteredLines = lines.filter(l => !l.toLowerCase().includes('college') && !l.includes('🎓') && !l.trim().toLowerCase().startsWith('c.'));
          return filteredLines.join('\n');
        });
        setConfirmConfig(null);
      }
    });
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    setEditError('');

    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();

    if (!cleanTitle) {
      setEditError('Topic title cannot be empty.');
      return;
    }

    if (selectedCategories.length === 0) {
      setEditError('Please keep at least 1 category selected.');
      return;
    }

    if (!cleanSubject) {
      setEditError('Please select a valid subject.');
      return;
    }

    // Check if college was unlinked during this edit
    const hadCollege = Array.isArray(topic.categories) ? topic.categories.includes(CATEGORIES.COLLEGE) : topic.category === CATEGORIES.COLLEGE;
    const nowHasCollege = selectedCategories.includes(CATEGORIES.COLLEGE);

    const isUnlinkingCollege = hadCollege && !nowHasCollege;

    setConfirmConfig({
      title: isUnlinkingCollege ? 'Unlink College & Save Edits?' : 'Save Topic Changes?',
      message: isUnlinkingCollege 
        ? `Aapne is topic se College track hata diya hai. Kya aap is update ko save karna chahte hain?` 
        : `Kya aap "${cleanTitle}" ke updated tracks, subject aur notes save karna chahte hain?`,
      subMessage: isUnlinkingCollege ? 'College revision cycle remove ho jayegi.' : 'Updated baseline difficulty, importance aur schedule preserve rahenge.',
      confirmText: 'Save Changes',
      cancelText: 'Cancel',
      type: isUnlinkingCollege ? 'unlink' : 'info',
      onConfirm: () => {
        const finalInterval = isCustomDays && parseInt(customDaysInput, 10) > 0 
          ? parseInt(customDaysInput, 10) 
          : (parseInt(maintenanceInterval, 10) || 30);

        const updated = {
          ...topic,
          title: cleanTitle,
          category: selectedCategories[0],
          categories: selectedCategories,
          subject: subject.trim(),
          difficulty,
          importance,
          maintenance_interval_days: finalInterval,
          maintenance_ended: Boolean(maintenanceEnded),
          notes: notes.trim(),
        };

        onSaveTopic(updated);
        setConfirmConfig(null);
        onClose();
      }
    });
  };

  const triggerEndMaintenance = () => {
    setConfirmConfig({
      title: 'End Maintenance for this Topic?',
      message: `Kya aap "${title}" ka recurring maintenance loop khatam karna chahte hain?`,
      subMessage: 'Is topic ke aage aur recurring maintenance cycles generate nahi honge aur yeh topic "Mastered" declare ho jayega.',
      confirmText: 'Yes, End Maintenance',
      cancelText: 'Keep Active',
      type: 'warning',
      onConfirm: () => {
        setMaintenanceEnded(true);
        setConfirmConfig(null);
      }
    });
  };

  const allCategoryKeys = useMemo(() => {
    const keys = new Set([
      ...Object.values(CATEGORIES),
      ...Object.keys(DEFAULT_CUSTOM_CATEGORIES),
      ...Object.keys(customCategories || {})
    ]);
    if (topic?.categories && Array.isArray(topic.categories)) {
      topic.categories.forEach(c => { if (c) keys.add(c); });
    }
    if (topic?.category) {
      keys.add(topic.category);
    }
    return Array.from(keys);
  }, [customCategories, topic]);

  const hasCollegeCategory = selectedCategories.includes(CATEGORIES.COLLEGE);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="glass-modal w-full max-w-xl rounded-2xl overflow-hidden my-4 animate-modal-pop border border-white/10" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Topic & Tracks</h2>
              <p className="text-[10px] text-slate-400">Modify categories, unlink College post-semester, or update notes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 glass-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveClick} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {editError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* Quick Post-Semester Cleanup Banner */}
          {hasCollegeCategory && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-300">Semester Over?</p>
                <p className="text-[10px] text-slate-400">1-click to unlink College track and remove college notes</p>
              </div>
              <button
                type="button"
                onClick={triggerRemoveCollege}
                className="px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 text-sky-200 text-[10px] font-bold transition-all active:scale-95 shadow-sm"
              >
                Unlink College Track
              </button>
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
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-[12px] text-slate-100 focus:outline-none" 
            />
          </div>

          {/* Categories Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Categories & Tracks <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-amber-400 font-mono">
                {selectedCategories.length} selected
              </span>
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
              <span className="text-[10px] text-amber-400 font-mono">
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
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1.5">
                    <p className="text-[11px] text-amber-300 font-medium">
                      ⚠️ No subjects found in Syllabus!
                    </p>
                    {onOpenSyllabusModal && (
                      <button
                        type="button"
                        onClick={onOpenSyllabusModal}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition-colors shadow-sm"
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

          {/* Custom Recurring Maintenance Settings */}
          <div className="p-3.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Custom Maintenance Cycle</span>
              </label>

              {/* Maintenance Status Toggle */}
              {maintenanceEnded ? (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center space-x-1">
                    <ShieldOff className="w-2.5 h-2.5" />
                    <span>Maintenance Ended (Mastered)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMaintenanceEnded(false)}
                    className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold transition-colors"
                  >
                    + Restart Maintenance
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Active Recurring</span>
                  </span>
                  <button
                    type="button"
                    onClick={triggerEndMaintenance}
                    className="text-[9px] px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25 hover:bg-rose-500/25 font-bold transition-colors"
                    title="Stop future recurring maintenance for this topic"
                  >
                    End Maintenance
                  </button>
                </div>
              )}
            </div>

            {/* Custom Interval Selector */}
            {!maintenanceEnded && (
              <div className="space-y-1.5 pt-0.5">
                <p className="text-[10px] text-slate-400">
                  Fixed 30 days ki jagah apna custom recurring interval choose karein (miss hone par automatic +1d shift rahega):
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[15, 30, 45, 60, 90].map((days) => {
                    const isSelected = !isCustomDays && maintenanceInterval === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setMaintenanceInterval(days);
                          setIsCustomDays(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.03]'
                            : 'glass-panel text-slate-300 hover:text-white border-white/10 hover:border-white/20'
                        }`}
                      >
                        +{days}d
                      </button>
                    );
                  })}

                  {/* Custom Days Button & Input */}
                  <button
                    type="button"
                    onClick={() => setIsCustomDays(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      isCustomDays
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'glass-panel text-slate-300 hover:text-white border-white/10'
                    }`}
                  >
                    Custom
                  </button>

                  {isCustomDays && (
                    <div className="flex items-center space-x-1.5 animate-fade-in">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="e.g. 21"
                        value={customDaysInput}
                        onChange={(e) => setCustomDaysInput(e.target.value)}
                        className="w-20 glass-input rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-white border border-amber-500/40 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">days</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Restart Spaced Repetition if forgotten */}
            {onRestartSpacedRepetition && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Topic dimaag se poora udh chuka hai?
                </span>
                <button
                  type="button"
                  onClick={() => onRestartSpacedRepetition(topic)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>Restart Spaced Repetition (Day 1-30)</span>
                </button>
              </div>
            )}
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

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="px-3 py-2 text-[11px] font-semibold text-slate-400 hover:text-white glass-btn">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-md shadow-blue-500/25 active:scale-95 glass-btn light-sweep">
              Save Changes
            </button>
          </div>
        </form>

        {/* Confirmation Modal */}
        {confirmConfig && (
          <ConfirmationModal
            isOpen={true}
            title={confirmConfig.title}
            message={confirmConfig.message}
            subMessage={confirmConfig.subMessage}
            confirmText={confirmConfig.confirmText}
            cancelText={confirmConfig.cancelText}
            type={confirmConfig.type}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig(null)}
          />
        )}
      </div>
    </div>
  );
}
