import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  Cpu, 
  Target, 
  ExternalLink, 
  Plus, 
  Check, 
  Sparkles, 
  Link as LinkIcon, 
  Flame, 
  Clock, 
  Save,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  MinusCircle,
  Video,
  FileText,
  Globe,
  Copy,
  Calendar,
  History,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { CATEGORIES, DEFAULT_CUSTOM_CATEGORIES, TRACK_COLOR_PALETTE, getPaletteColorForName, normalizeSyllabusTracks } from '../types';
import { 
  fetchSyllabusFromNeon, 
  saveSyllabusToNeon, 
  fetchSubjectResources, 
  saveSubjectResource, 
  deleteSubjectResource 
} from '../storage/api';
import ConfirmationModal from './ConfirmationModal';

export default function SyllabusModal({ 
  isOpen, 
  onClose, 
  onQuickAddTopic, 
  onSyllabusChange, 
  topics = [], 
  syllabusList: propSyllabusList = [],
  onUpdateTopic,
  customCategories = {},
  onUpdateCustomCategories
}) {
  const [activeTab, setActiveTab] = useState('matrix'); // Default to 'matrix' so user immediately sees their syllabus
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Editable Syllabus state
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [syllabusList, setSyllabusList] = useState(() => {
    if (Array.isArray(propSyllabusList) && propSyllabusList.length > 0) {
      return propSyllabusList;
    }
    return [];
  });

  const isInitialMount = useRef(true);

  // Keep syllabusList in sync with parent App prop
  useEffect(() => {
    if (isOpen && Array.isArray(propSyllabusList)) {
      setSyllabusList(propSyllabusList);
    }
  }, [isOpen, propSyllabusList]);

  // Accordion Expand/Collapse State (Chapters/Topics collapsed by default, click to expand)
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  const isSubjectExpanded = (sIdx) => {
    if (searchQuery.trim()) return true; // Auto-expand when searching
    return !!expandedSubjects[sIdx];
  };

  const toggleSubjectExpanded = (sIdx) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [sIdx]: !prev[sIdx]
    }));
  };

  const toggleChapterExpanded = (key) => {
    setExpandedChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allSubjectsExpanded = useMemo(() => {
    if (!syllabusList || syllabusList.length === 0) return false;
    return syllabusList.every((_, idx) => expandedSubjects[idx]);
  }, [syllabusList, expandedSubjects]);

  const toggleAllSubjects = () => {
    if (allSubjectsExpanded) {
      setExpandedSubjects({});
    } else {
      const all = {};
      syllabusList.forEach((_, idx) => {
        all[idx] = true;
      });
      setExpandedSubjects(all);
    }
  };

  // Adding Subject Form State
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState(CATEGORIES.GATE);
  const [newSubjectCollege, setNewSubjectCollege] = useState('');
  const [newSubjectGate, setNewSubjectGate] = useState('');
  const [newSubjectCompany, setNewSubjectCompany] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(TRACK_COLOR_PALETTE[0].color);

  const allCategoryKeys = useMemo(() => {
    const defaultKeys = Object.values(CATEGORIES);
    const customKeys = Object.keys({ ...DEFAULT_CUSTOM_CATEGORIES, ...(customCategories || {}) });
    return Array.from(new Set([...defaultKeys, ...customKeys]));
  }, [customCategories]);

  // Editing state for subject & module
  const [editingSubject, setEditingSubject] = useState(null); // { subjectIndex, data }
  const [editingModule, setEditingModule] = useState(null); // { subjectIndex, moduleIndex, data }
  const [isAddingModuleToSubject, setIsAddingModuleToSubject] = useState(null); // subjectIndex
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleCollege, setNewModuleCollege] = useState('');
  const [newModuleGate, setNewModuleGate] = useState('');
  const [newModuleCompany, setNewModuleCompany] = useState('');

  // Subject & Chapter Resources Hub State
  const [resourcesList, setResourcesList] = useState(() => {
    try {
      const local = localStorage.getItem('spare_subject_resources_v2');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // Topic Revision Dates & Long-Press Inspection State
  const [historyInspectData, setHistoryInspectData] = useState(null); // { sub, mod, topic }
  const [longPressActiveKey, setLongPressActiveKey] = useState(null);
  const pressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  // Helper to match a syllabus chapter/module with a scheduled SpaRE topic
  const findMatchingTopic = (sub, mod) => {
    if (!topics || topics.length === 0 || !mod?.title) return null;
    const modTitle = mod.title.trim().toLowerCase();
    const subName = (sub?.subject || '').trim().toLowerCase();

    // 1. Exact match subject + title
    let match = topics.find(t => 
      (t.subject || '').trim().toLowerCase() === subName &&
      (t.title || '').trim().toLowerCase() === modTitle
    );
    if (match) return match;

    // 2. Exact match title
    match = topics.find(t => (t.title || '').trim().toLowerCase() === modTitle);
    if (match) return match;

    // 3. Substring match on subject + title
    match = topics.find(t => 
      (t.subject || '').trim().toLowerCase() === subName &&
      ((t.title || '').trim().toLowerCase().includes(modTitle) || modTitle.includes((t.title || '').trim().toLowerCase()))
    );
    if (match) return match;

    // 4. Any topic title substring match
    match = topics.find(t => 
      (t.title || '').trim().toLowerCase().includes(modTitle) || modTitle.includes((t.title || '').trim().toLowerCase())
    );
    return match || null;
  };

  // Helper to format ISO/date string into readable format (e.g. 18 Nov 2026)
  const formatHistoryDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Helper to calculate delay or early completion
  const getDelayDescription = (completedDateStr, scheduledDateStr) => {
    if (!completedDateStr || !scheduledDateStr) return null;
    try {
      const compParts = String(completedDateStr).split('-');
      const schedParts = String(scheduledDateStr).split('-');
      if (compParts.length === 3 && schedParts.length === 3) {
        const compDate = new Date(parseInt(compParts[0], 10), parseInt(compParts[1], 10) - 1, parseInt(compParts[2], 10));
        const schedDate = new Date(parseInt(schedParts[0], 10), parseInt(schedParts[1], 10) - 1, parseInt(schedParts[2], 10));
        const diffDays = Math.round((compDate.getTime() - schedDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0) return { text: '✓ Exact on schedule', type: 'ontime' };
        if (diffDays < 0) return { text: `⚡ ${Math.abs(diffDays)}d early`, type: 'early' };
        return { text: `⚠️ +${diffDays}d delay`, type: 'delay' };
      }
    } catch {}
    return null;
  };

  // Long press handlers for chapter cards
  const handleChapterPressStart = (sub, mod, matchingTopic, key) => {
    isLongPressTriggeredRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    setLongPressActiveKey(key);
    pressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(50); } catch {}
      }
      setHistoryInspectData({ sub, mod, topic: matchingTopic });
      setLongPressActiveKey(null);
    }, 450);
  };

  const handleChapterPressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setLongPressActiveKey(null);
  };
  const [selectedResourceSubject, setSelectedResourceSubject] = useState('ALL');
  const [selectedResourceType, setSelectedResourceType] = useState('ALL');
  const [resourceSearch, setResourceSearch] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [copiedResourceId, setCopiedResourceId] = useState(null);
  // Inline resource form: { subjectIdx, moduleIdx } or null
  const [inlineResourceKey, setInlineResourceKey] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    subject: '',
    chapter_topic: '',
    type: 'youtube', // 'youtube' | 'notion' | 'article' | 'practice' | 'other'
    title: '',
    url: '',
    notes: '',
  });

  // Sync resources with Neon DB when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSubjectResources().then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setResourcesList(data);
          try {
            localStorage.setItem('spare_subject_resources_v2', JSON.stringify(data));
          } catch (e) {}
        }
      }).catch(err => console.warn('Could not fetch subject resources:', err));
    }
  }, [isOpen]);

  // Sync syllabus with Neon database on mount (Purging any mock data)
  useEffect(() => {
    try {
      const legacy = localStorage.getItem('spare_custom_syllabus_v1');
      if (legacy && (legacy.includes('Virtual Memory') || legacy.includes('Demand paging') || legacy.includes('Operating Systems'))) {
        localStorage.removeItem('spare_custom_syllabus_v1');
      }
    } catch (e) {}

    fetchSyllabusFromNeon().then((neonData) => {
      if (neonData && Array.isArray(neonData)) {
        const clean = normalizeSyllabusTracks(
          neonData.filter(s => s.subject !== 'Operating Systems' || !s.modules?.some(m => m.id === 'os-1'))
        );
        if (clean.length > 0) {
          setSyllabusList(clean);
          try {
            localStorage.setItem('spare_custom_syllabus_v2', JSON.stringify(clean));
          } catch (e) {}
        }
      }
    }).catch(() => {});
  }, []);

  // Sync syllabus to localStorage and Neon only on user edits
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem('spare_custom_syllabus_v2', JSON.stringify(syllabusList));
    } catch (e) {}
    saveSyllabusToNeon(syllabusList).catch(() => {});
    if (onSyllabusChange) onSyllabusChange(syllabusList);
  }, [syllabusList]);

  if (!isOpen) return null;

  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return;

    let subject = resourceForm.subject.trim();
    if (!subject) {
      subject = syllabusList[0]?.subject || 'General';
    }

    const resId = editingResource?.id || `res-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newRes = {
      id: resId,
      subject,
      chapter_topic: resourceForm.chapter_topic.trim() || 'General / Whole Subject',
      type: resourceForm.type || 'youtube',
      title: resourceForm.title.trim(),
      url: resourceForm.url.trim(),
      notes: resourceForm.notes.trim(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = editingResource 
      ? resourcesList.map(r => r.id === editingResource.id ? newRes : r)
      : [newRes, ...resourcesList];

    setResourcesList(updatedList);
    try {
      localStorage.setItem('spare_subject_resources_v2', JSON.stringify(updatedList));
    } catch (e) {}

    try {
      await saveSubjectResource(newRes);
    } catch (err) {
      console.warn('Could not save resource to Neon:', err);
    }

    setIsAddingResource(false);
    setEditingResource(null);
    setResourceForm({
      subject: syllabusList[0]?.subject || '',
      chapter_topic: '',
      type: 'youtube',
      title: '',
      url: '',
      notes: '',
    });
  };

  const handleDeleteResource = async (id) => {
    setConfirmConfig({
      title: 'Delete Resource Link?',
      message: 'Kya aap is resource link ko delete karna chahte hain?',
      subMessage: 'Ye link aapke resource hub se permanently remove ho jayega.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        const filtered = resourcesList.filter(r => r.id !== id);
        setResourcesList(filtered);
        try {
          localStorage.setItem('spare_subject_resources_v2', JSON.stringify(filtered));
        } catch (e) {}
        try {
          await deleteSubjectResource(id);
        } catch (err) {
          console.warn('Could not delete resource from Neon:', err);
        }
      }
    });
  };

  const handleCopyUrl = (id, url) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedResourceId(id);
      setTimeout(() => setCopiedResourceId(null), 2000);
    }
  };

  const handleResetSyllabus = () => {
    setConfirmConfig({
      title: 'Clear Entire Syllabus?',
      message: 'Kya aap saare subjects aur chapters ko syllabus se delete karna chahte hain?',
      subMessage: 'Aapka custom syllabus completely reset ho jayega aur Cloud database se clean sync hoga.',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        setSyllabusList([]);
        localStorage.removeItem('spare_custom_syllabus_v1');
        localStorage.removeItem('spare_custom_syllabus_v2');
        saveSyllabusToNeon([]).catch(() => {});
        setConfirmConfig(null);
      }
    });
  };

  // Add new Subject
  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const assignedColor = newSubjectColor || getPaletteColorForName(newSubjectName.trim()).color;
    const newSub = {
      subject: newSubjectName.trim(),
      category: '',
      categories: [],
      color: assignedColor,
      collegeRelevance: '',
      gateWeight: '',
      companyRelevance: '',
      overlapLevel: 'Custom',
      modules: [],
    };
    setSyllabusList(prev => {
      const next = [...prev, newSub];
      setExpandedSubjects(exp => ({ ...exp, [next.length - 1]: true }));
      return next;
    });
    setNewSubjectName('');
    setNewSubjectCollege('');
    setNewSubjectGate('');
    setNewSubjectCompany('');
    setNewSubjectColor(TRACK_COLOR_PALETTE[0].color);
    setIsAddingSubject(false);
  };

  const handleSaveSubjectEdit = (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    const { subjectIndex, data } = editingSubject;
    setSyllabusList(prev => {
      const updated = [...prev];
      updated[subjectIndex] = {
        ...updated[subjectIndex],
        subject: data.subject.trim(),
        color: data.color,
        collegeRelevance: (data.collegeRelevance || '').trim(),
        gateWeight: (data.gateWeight || '').trim(),
        companyRelevance: (data.companyRelevance || '').trim(),
      };
      return updated;
    });
    setEditingSubject(null);
  };

  // Delete an entire Subject
  const handleDeleteSubject = (subjectIdx, subjectTitle) => {
    setConfirmConfig({
      title: 'Delete Entire Subject?',
      message: `Kya aap subject "${subjectTitle}" aur uske saare chapters ko syllabus se delete karna chahte hain?`,
      subMessage: 'Is subject ke saare chapters permanently remove ho jayenge.',
      confirmText: 'Delete Subject',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        setSyllabusList(prev => prev.filter((_, idx) => idx !== subjectIdx));
        setConfirmConfig(null);
      }
    });
  };

  // 1-Click remove college focus from a module (Post-Semester cleanup)
  const handleUnlinkCollegeFromModule = (subjectIdx, moduleIdx, moduleTitle = 'this chapter') => {
    setConfirmConfig({
      title: 'Unlink College Track?',
      message: `Kya aap "${moduleTitle}" se College track unlink karna chahte hain?`,
      subMessage: 'Semester khatam hone ke baad is chapter ka College requirement remove ho jayega aur sirf GATE/Prep focus rahega.',
      confirmText: 'Yes, Unlink College',
      cancelText: 'Cancel',
      type: 'unlink',
      onConfirm: () => {
        setSyllabusList(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          next[subjectIdx].modules[moduleIdx].collegeFocus = '';
          return next;
        });
        setConfirmConfig(null);
      }
    });
  };

  // Delete a module completely (e.g. purely college topic)
  const handleDeleteModule = (subjectIdx, moduleIdx, title) => {
    setConfirmConfig({
      title: 'Delete Chapter from Syllabus?',
      message: `Kya aap chapter "${title}" ko syllabus se delete karna chahte hain?`,
      subMessage: 'Yeh chapter syllabus matrix se permanently remove ho jayega.',
      confirmText: 'Delete Chapter',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        setSyllabusList(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          next[subjectIdx].modules.splice(moduleIdx, 1);
          return next;
        });
        if (editingModule?.subjectIndex === subjectIdx && editingModule?.moduleIndex === moduleIdx) {
          setEditingModule(null);
        }
        setConfirmConfig(null);
      }
    });
  };

  // Save edited module
  const handleSaveModuleEdit = (e) => {
    e.preventDefault();
    if (!editingModule) return;
    const { subjectIndex, moduleIndex, data } = editingModule;

    // Check if college focus is unlinked during edit
    const originalCollege = syllabusList[subjectIndex]?.modules[moduleIndex]?.collegeFocus;
    const isUnlinkingCollege = Boolean(originalCollege && !data.collegeFocus?.trim());

    setConfirmConfig({
      title: isUnlinkingCollege ? 'Unlink College & Save Edits?' : 'Save Chapter Edits?',
      message: isUnlinkingCollege
        ? `Aapne is chapter se College focus remove kiya hai. Kya aap changes save karna chahte hain?`
        : `Kya aap chapter "${data.title}" ke updated details aur track notes save karna chahte hain?`,
      subMessage: isUnlinkingCollege ? 'College focus detach ho jayega.' : 'Updated syllabus information preserve rahegi.',
      confirmText: 'Save Changes',
      cancelText: 'Keep Editing',
      type: isUnlinkingCollege ? 'unlink' : 'info',
      onConfirm: () => {
        setSyllabusList(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          next[subjectIndex].modules[moduleIndex] = { ...data };
          return next;
        });

        // If this module corresponds to an active topic in SpaRE, sync its maintenance settings immediately
        if (onUpdateTopic && Array.isArray(topics)) {
          const matchingTopic = topics.find(t => t.title?.toLowerCase().trim() === data.title?.toLowerCase().trim());
          if (matchingTopic) {
            onUpdateTopic({
              ...matchingTopic,
              maintenance_interval_days: data.maintenance_interval_days || 30,
              maintenance_ended: Boolean(data.maintenance_ended),
            });
          }
        }

        setEditingModule(null);
        setConfirmConfig(null);
      }
    });
  };

  // Add new module to a subject
  const handleCreateModule = (subjectIdx) => {
    if (!newModuleTitle.trim()) return;
    const newMod = {
      id: `mod-${Date.now()}`,
      title: newModuleTitle.trim(),
      collegeFocus: newModuleCollege.trim(),
      gateFocus: newModuleGate.trim(),
      companyFocus: newModuleCompany.trim(),
    };

    setSyllabusList(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[subjectIdx].modules.push(newMod);
      return next;
    });

    setExpandedSubjects(exp => ({ ...exp, [subjectIdx]: true }));

    setNewModuleTitle('');
    setNewModuleCollege('');
    setNewModuleGate('');
    setNewModuleCompany('');
    setIsAddingModuleToSubject(null);
  };

  const handleTopicAdd = (sub, mod) => {
    const cats = new Set();
    if (mod.gateFocus) cats.add(CATEGORIES.GATE);
    if (mod.collegeFocus) cats.add(CATEGORIES.COLLEGE);

    // Dynamic track detection from companyFocus, module, and subject
    const customKeys = Object.keys({ ...DEFAULT_CUSTOM_CATEGORIES, ...(customCategories || {}) });
    if (mod.companyFocus) {
      let matchedCustom = false;
      customKeys.forEach(key => {
        if (mod.companyFocus.toLowerCase().includes(key.toLowerCase())) {
          cats.add(key);
          matchedCustom = true;
        }
      });
      // Fallback: If companyFocus exists but didn't match a specific key, add it directly if short or fallback to default custom
      if (!matchedCustom && mod.companyFocus.trim() && mod.companyFocus.trim().length <= 25) {
        cats.add(mod.companyFocus.trim());
      } else if (!matchedCustom && customKeys.length > 0) {
        cats.add(customKeys[0]);
      }
    }

    // Check if module or subject explicitly specifies categories
    if (Array.isArray(mod.categories)) {
      mod.categories.forEach(c => cats.add(c));
    } else if (mod.category) {
      cats.add(mod.category);
    }
    if (Array.isArray(sub.categories)) {
      sub.categories.forEach(c => cats.add(c));
    } else if (sub.category) {
      cats.add(sub.category);
    }

    const catArray = Array.from(cats);

    const lines = [];
    if (mod.collegeFocus) lines.push(`🎓 College: ${mod.collegeFocus}`);
    if (mod.gateFocus) lines.push(`⚡ GATE: ${mod.gateFocus}`);
    if (mod.companyFocus) lines.push(`🚀 Company/Track: ${mod.companyFocus}`);

    onQuickAddTopic({
      title: mod.title,
      category: catArray[0] || CATEGORIES.GATE,
      categories: catArray.length > 0 ? catArray : [CATEGORIES.GATE],
      subject: sub.subject,
      maintenance_interval_days: mod.maintenance_interval_days || 30,
      maintenance_ended: Boolean(mod.maintenance_ended),
      notes: lines.join('\n'),
    });
    onClose();
  };

  const filteredSyllabus = syllabusList.map((sub, sIdx) => {
    const mods = sub.modules || [];
    const matchedMods = mods.map((m, mIdx) => ({ ...m, originalModuleIdx: mIdx, originalSubjectIdx: sIdx }))
      .filter(m => 
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.collegeFocus && m.collegeFocus.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.gateFocus && m.gateFocus.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.companyFocus && m.companyFocus.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    return { ...sub, originalSubjectIdx: sIdx, modules: matchedMods };
  }).filter(sub => 
    !searchQuery 
      ? true 
      : (sub.modules.length > 0 || sub.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="glass-modal w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-white/10 animate-modal-pop relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-400 p-[1.5px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#090D1A] rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>Multi-Track Syllabus Alignment</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Editable &bull; Post-Semester Cleanup
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Edit, add, or unlink College topics once semester exams finish</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors glass-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative w-44 sm:w-60">
              <input
                type="text"
                placeholder="Search subjects & chapters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full glass-input rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {syllabusList.length > 0 && (
              <button
                type="button"
                onClick={toggleAllSubjects}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-[11px] font-semibold flex items-center space-x-1 glass-btn active:scale-95 transition-all"
                title={allSubjectsExpanded ? 'Collapse all subjects' : 'Expand all subjects'}
              >
                {allSubjectsExpanded ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expand All</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddingSubject(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs flex items-center space-x-1 shrink-0 shadow-md shadow-white/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto relative z-10 text-slate-300 text-xs">
          <div className="space-y-4 animate-fade-in">

              {/* Add New Subject Form */}
              {isAddingSubject && (
                <form onSubmit={handleCreateSubject} className="glass-panel p-4 rounded-2xl border border-white/20 bg-zinc-900/95 space-y-3 animate-pop-in">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Add New Subject</span>
                    </span>
                    <button type="button" onClick={() => setIsAddingSubject(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Subject Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics, Operating Systems, Computer Architecture..."
                      value={newSubjectName}
                      onChange={e => setNewSubjectName(e.target.value)}
                      className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* 25-Color Swatch Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[9px] uppercase font-semibold text-slate-400">
                        🎨 Subject Color Theme
                      </label>
                      <span className="text-[10px] text-zinc-300 font-mono">
                        {TRACK_COLOR_PALETTE.find(c => c.color === newSubjectColor)?.name || 'Custom'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] max-h-24 overflow-y-auto custom-scrollbar">
                      {TRACK_COLOR_PALETTE.map((item) => {
                        const isSelected = newSubjectColor === item.color;
                        return (
                          <button
                            key={item.color}
                            type="button"
                            onClick={() => setNewSubjectColor(item.color)}
                            title={item.name}
                            className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center ${
                              isSelected
                                ? 'scale-110 ring-2 ring-white shadow-md'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: item.color }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.06]">
                    <button type="button" onClick={() => setIsAddingSubject(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white glass-btn">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-md shadow-white/20 active:scale-95">Create Subject</button>
                  </div>
                </form>
              )}

              {/* Subject Edit Form (Inline Overlay) */}
              {editingSubject && (
                <form onSubmit={handleSaveSubjectEdit} className="glass-panel p-4 rounded-2xl border border-white/20 bg-zinc-900/95 space-y-3 animate-pop-in">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Edit Subject: {editingSubject.data.subject}</span>
                    </span>
                    <button type="button" onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Subject Name *</label>
                    <input
                      type="text"
                      required
                      value={editingSubject.data.subject}
                      onChange={e => setEditingSubject({
                        ...editingSubject,
                        data: { ...editingSubject.data, subject: e.target.value }
                      })}
                      className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* 25-Color Swatch Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[9px] uppercase font-semibold text-slate-400">
                        🎨 Subject Color Theme
                      </label>
                      <span className="text-[10px] text-zinc-300 font-mono">
                        {TRACK_COLOR_PALETTE.find(c => c.color === editingSubject.data.color)?.name || 'Custom'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] max-h-24 overflow-y-auto custom-scrollbar">
                      {TRACK_COLOR_PALETTE.map((item) => {
                        const isSelected = editingSubject.data.color === item.color;
                        return (
                          <button
                            key={item.color}
                            type="button"
                            onClick={() => setEditingSubject({
                              ...editingSubject,
                              data: { ...editingSubject.data, color: item.color }
                            })}
                            title={item.name}
                            className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center ${
                              isSelected
                                ? 'scale-110 ring-2 ring-white shadow-md'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: item.color }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.06]">
                    <button type="button" onClick={() => setEditingSubject(null)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white glass-btn">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-md shadow-white/20 active:scale-95">Save Subject</button>
                  </div>
                </form>
              )}

              {/* Module Edit Modal (Inline Overlay) */}
              {editingModule && (
                <form onSubmit={handleSaveModuleEdit} className="glass-panel p-4 rounded-2xl border border-white/20 bg-zinc-900/95 space-y-3 animate-pop-in">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Edit Chapter: {editingModule.data.title}</span>
                    </span>
                    <button type="button" onClick={() => setEditingModule(null)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Chapter Title *</label>
                    <input
                      type="text"
                      required
                      value={editingModule.data.title}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        data: { ...editingModule.data, title: e.target.value }
                      })}
                      className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(editingModule.subjectIndex, editingModule.moduleIndex, editingModule.data.title)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Chapter</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingModule(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white glass-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-md shadow-white/20 active:scale-95"
                      >
                        Save Chapter
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Empty State */}
              {filteredSyllabus.length === 0 && !isAddingSubject && (
                <div className="py-12 px-6 text-center space-y-3 glass-panel rounded-2xl border border-white/[0.06]">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">No subjects in your syllabus yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Zero fake or mock data. Add your actual subjects and chapters to align them between College, GATE, and Target Companies.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubject(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 hover:opacity-90 transition-opacity active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Subject</span>
                  </button>
                </div>
              )}

              {/* Subject Modules List */}
              <div className="space-y-4">
                {filteredSyllabus.map((sub) => {
                  const sIdx = sub.originalSubjectIdx;
                  const isExpanded = isSubjectExpanded(sIdx);
                  const moduleCount = sub.modules?.length || 0;

                  return (
                    <div key={sIdx} className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-3 transition-all">
                      {/* Subject Accordion Header (Click to Expand / Collapse) */}
                      <div 
                        onClick={() => toggleSubjectExpanded(sIdx)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 cursor-pointer group select-none hover:bg-white/[0.02] p-1.5 -m-1.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" 
                              style={{ backgroundColor: sub.color || getPaletteColorForName(sub.subject).color }} 
                            />
                            <span className="group-hover:text-amber-300 transition-colors">{sub.subject}</span>
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400">
                            {moduleCount} {moduleCount === 1 ? 'chapter' : 'chapters'}
                          </span>
                        </div>

                        {/* Subject Action Buttons */}
                        <div className="flex items-center space-x-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setEditingSubject({
                              subjectIndex: sIdx,
                              data: {
                                subject: sub.subject,
                                color: sub.color || getPaletteColorForName(sub.subject).color,
                                collegeRelevance: sub.collegeRelevance === 'College Track' ? '' : (sub.collegeRelevance || ''),
                                gateWeight: sub.gateWeight === 'GATE Track' ? '' : (sub.gateWeight || ''),
                                companyRelevance: sub.companyRelevance === 'Company Prep' ? '' : (sub.companyRelevance || ''),
                              }
                            })}
                            title="Edit Subject details, weightage & theme"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSubjects(prev => ({ ...prev, [sIdx]: true }));
                              setIsAddingModuleToSubject(isAddingModuleToSubject === sIdx ? null : sIdx);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 text-[10px] font-bold flex items-center space-x-1 glass-btn active:scale-95"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                            <span>Add Chapter</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sIdx, sub.subject)}
                            title="Delete entire subject"
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subject Expanded Content (Only visible when Subject is Expanded) */}
                      {isExpanded && (
                        <div className="space-y-3 pt-1 animate-fade-in">
                          {/* Add Chapter Form (Only visible when user clicks "+ Add Chapter") */}
                          {isAddingModuleToSubject === sIdx && (
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5 animate-pop-in">
                              <span className="text-xs font-bold text-white block">Add New Chapter to {sub.subject}</span>
                              <input
                                type="text"
                                placeholder="Chapter title (e.g. Linear Algebra, Processes)..."
                                value={newModuleTitle}
                                onChange={e => setNewModuleTitle(e.target.value)}
                                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                                autoFocus
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingModuleToSubject(null);
                                    setNewModuleTitle('');
                                  }}
                                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCreateModule(sIdx)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                  Save Chapter
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Empty Chapters State */}
                          {sub.modules.length === 0 && isAddingModuleToSubject !== sIdx && (
                            <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-500">
                              No chapters yet in this subject. Click <strong className="text-emerald-400">"Add Chapter"</strong> above to add one.
                            </div>
                          )}

                          {/* Modules / Chapters Accordion List */}
                          <div className="grid grid-cols-1 gap-2.5">
                            {sub.modules.map((mod) => {
                              const mIdx = mod.originalModuleIdx;
                              const hasCollege = !!mod.collegeFocus;
                              const matchingTopic = findMatchingTopic(sub, mod);
                              const completedMilestones = matchingTopic?.schedule?.filter(m => m.state === 'COMPLETED' || m.completed_date) || [];
                              const chapterKey = `${sIdx}_${mIdx}`;
                              const isChapterOpen = !!expandedChapters[chapterKey] || (searchQuery.trim().length > 0);
                              const isBeingPressed = longPressActiveKey === chapterKey;

                              const modResources = resourcesList.filter(r =>
                                r.subject?.toLowerCase() === sub.subject?.toLowerCase() &&
                                (r.chapter_topic?.toLowerCase() === mod.title?.toLowerCase() ||
                                 r.chapter_topic === 'General / Whole Subject' && false)
                              );
                              const isInlineOpen = inlineResourceKey === chapterKey;

                              const getTypeBadge = (type) => {
                                switch (type) {
                                  case 'youtube': return { label: 'YT', icon: Video, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
                                  case 'notion': return { label: 'Notion', icon: FileText, color: 'text-zinc-200', bg: 'bg-white/10 border-white/20' };
                                  case 'article': return { label: 'Article', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
                                  case 'practice': return { label: 'PYQ', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
                                  default: return { label: 'Link', icon: LinkIcon, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' };
                                }
                              };

                              return (
                                <div 
                                  key={mod.id || mIdx} 
                                  onTouchStart={() => handleChapterPressStart(sub, mod, matchingTopic, chapterKey)}
                                  onTouchEnd={handleChapterPressEnd}
                                  onTouchCancel={handleChapterPressEnd}
                                  onMouseDown={() => handleChapterPressStart(sub, mod, matchingTopic, chapterKey)}
                                  onMouseUp={handleChapterPressEnd}
                                  onMouseLeave={handleChapterPressEnd}
                                  onClick={() => {
                                    if (isLongPressTriggeredRef.current) {
                                      isLongPressTriggeredRef.current = false;
                                      return;
                                    }
                                    toggleChapterExpanded(chapterKey);
                                  }}
                                  className={`p-3 rounded-xl border transition-all space-y-2 select-none relative cursor-pointer ${
                                    isBeingPressed 
                                      ? 'bg-white/[0.08] border-white/40 scale-[0.99] shadow-lg ring-2 ring-white/20' 
                                      : isChapterOpen
                                        ? 'bg-white/[0.04] border-white/20 shadow-md'
                                        : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/10'
                                  }`}
                                >
                                  {/* Chapter Header Line */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                      {/* Chapter Accordion Chevron */}
                                      <div className="p-0.5 text-slate-400">
                                        {isChapterOpen ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                        )}
                                      </div>

                                      <span className="text-xs font-bold text-slate-100">{mod.title}</span>

                                      {/* Quick Revision Dates Badge */}
                                      {matchingTopic ? (
                                        completedMilestones.length > 0 ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setHistoryInspectData({ sub, mod, topic: matchingTopic });
                                            }}
                                            className="px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono flex items-center space-x-1 active:scale-95 transition-all shadow-sm"
                                            title="Click or Long-Press to view revision dates"
                                          >
                                            <History className="w-2.5 h-2.5" />
                                            <span className="font-bold">{completedMilestones.length} Revs Done</span>
                                            <span className="text-[8px] text-emerald-500/80">(Dates)</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setHistoryInspectData({ sub, mod, topic: matchingTopic });
                                            }}
                                            className="px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-mono flex items-center space-x-1 active:scale-95 transition-all"
                                            title="Click or Long-Press to view schedule details"
                                          >
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>Scheduled</span>
                                          </button>
                                        )
                                      ) : (
                                        <span className="text-[8px] font-mono text-zinc-500 bg-white/[0.02] px-1.5 py-0.2 rounded border border-white/[0.04]">
                                          Hold to inspect
                                        </span>
                                      )}

                                      {mod.collegeFocus && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                          +College
                                        </span>
                                      )}

                                      {/* Maintenance status badge */}
                                      {mod.maintenance_ended ? (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                          🛑 Maint Ended
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                          🔁 +{mod.maintenance_interval_days || 30}d
                                        </span>
                                      )}

                                      {/* Resource Count Badge when chapter is collapsed */}
                                      {!isChapterOpen && modResources.length > 0 && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center space-x-1">
                                          <LinkIcon className="w-2.5 h-2.5" />
                                          <span>{modResources.length} {modResources.length === 1 ? 'link' : 'links'}</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-1.5 self-end sm:self-auto" onClick={e => e.stopPropagation()}>
                                      {/* Quick Unlink College Button */}
                                      {hasCollege && (
                                        <button
                                          type="button"
                                          onClick={() => handleUnlinkCollegeFromModule(sIdx, mIdx, mod.title)}
                                          className="px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[9px] font-semibold flex items-center space-x-1 active:scale-95"
                                          title="Remove College focus (Post-Semester cleanup)"
                                        >
                                          <MinusCircle className="w-2.5 h-2.5" />
                                          <span>Unlink College</span>
                                        </button>
                                      )}

                                      {/* View Revision Dates History Button */}
                                      <button
                                        type="button"
                                        onClick={() => setHistoryInspectData({ sub, mod, topic: matchingTopic })}
                                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-emerald-400 transition-colors"
                                        title="View all revision dates & history (or Long-press chapter)"
                                      >
                                        <History className="w-3 h-3" />
                                      </button>

                                      {/* Edit Button */}
                                      <button
                                        type="button"
                                        onClick={() => setEditingModule({
                                          subjectIndex: sIdx,
                                          moduleIndex: mIdx,
                                          data: { ...mod }
                                        })}
                                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-amber-300 transition-colors"
                                        title="Edit Chapter details"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>

                                      {/* Delete Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteModule(sIdx, mIdx, mod.title)}
                                        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                                        title="Delete Chapter from syllabus"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Chapter Expanded Details (Only shown when this chapter is expanded) */}
                                  {isChapterOpen && (
                                    <div className="space-y-2 pt-2 border-t border-white/[0.05] animate-fade-in" onClick={e => e.stopPropagation()}>
                                      {(mod.collegeFocus || mod.gateFocus || mod.companyFocus) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                                          {mod.collegeFocus && (
                                            <div className="p-2 rounded-lg border bg-sky-500/5 border-sky-500/10">
                                              <span className="text-sky-400 font-semibold block">🎓 College:</span>
                                              <span className="text-slate-400">{mod.collegeFocus}</span>
                                            </div>
                                          )}
                                          {mod.gateFocus && (
                                            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                              <span className="text-amber-400 font-semibold block">⚡ GATE:</span>
                                              <span className="text-slate-400">{mod.gateFocus}</span>
                                            </div>
                                          )}
                                          {mod.companyFocus && (
                                            <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                              <span className="text-emerald-400 font-semibold block">🚀 Nvidia:</span>
                                              <span className="text-slate-400">{mod.companyFocus}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* ── Inline Resources Section ── */}
                                      <div className="pt-1 space-y-2">
                                        {/* Resource list */}
                                        {modResources.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5">
                                            {modResources.map(res => {
                                              const badge = getTypeBadge(res.type);
                                              const IconComp = badge.icon;
                                              const isCopied = copiedResourceId === res.id;
                                              return (
                                                <div key={res.id} className={`flex items-center space-x-1 px-2 py-1 rounded-lg border ${badge.bg} group`}>
                                                  <IconComp className={`w-3 h-3 shrink-0 ${badge.color}`} />
                                                  <a
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-slate-200 hover:text-white max-w-[120px] truncate"
                                                    title={res.title}
                                                  >
                                                    {res.title}
                                                  </a>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleCopyUrl(res.id, res.url); }}
                                                    className="p-0.5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingResource(res);
                                                      setResourceForm({
                                                        subject: res.subject,
                                                        chapter_topic: res.chapter_topic || '',
                                                        type: res.type || 'youtube',
                                                        title: res.title,
                                                        url: res.url,
                                                        notes: res.notes || '',
                                                      });
                                                      setInlineResourceKey(chapterKey);
                                                      setIsAddingResource(false);
                                                    }}
                                                    className="p-0.5 text-slate-500 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Edit2 className="w-2.5 h-2.5" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteResource(res.id); }}
                                                    className="p-0.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Add Resource toggle button */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isInlineOpen) {
                                              setInlineResourceKey(null);
                                              setEditingResource(null);
                                              setResourceForm({ subject: '', chapter_topic: '', type: 'youtube', title: '', url: '', notes: '' });
                                            } else {
                                              setInlineResourceKey(chapterKey);
                                              setEditingResource(null);
                                              setResourceForm({
                                                subject: sub.subject,
                                                chapter_topic: mod.title,
                                                type: 'youtube',
                                                title: '',
                                                url: '',
                                                notes: '',
                                              });
                                            }
                                          }}
                                          className="text-[10px] text-zinc-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-colors"
                                        >
                                          <LinkIcon className="w-3 h-3" />
                                          <span>{isInlineOpen ? 'Cancel' : `+ Add Resource Link (${modResources.length})`}</span>
                                        </button>

                                        {/* Inline Resource Form */}
                                        {isInlineOpen && (
                                          <form
                                            onSubmit={handleSaveResource}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-3 rounded-xl border border-white/15 bg-zinc-900/90 space-y-2.5 animate-pop-in"
                                          >
                                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                                              <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                                                <Sparkles className="w-3 h-3 text-zinc-300" />
                                                <span>{editingResource ? 'Edit Resource' : `Add Resource — ${mod.title}`}</span>
                                              </span>
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setInlineResourceKey(null); setEditingResource(null); }}
                                                className="text-zinc-400 hover:text-white"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>

                                            {/* Resource Type */}
                                            <div className="flex flex-wrap gap-1">
                                              {[
                                                { id: 'youtube', label: '🎥 YouTube', icon: Video },
                                                { id: 'notion', label: '📝 Notion', icon: FileText },
                                                { id: 'article', label: '📄 Article', icon: Globe },
                                                { id: 'practice', label: '🧪 Practice', icon: Target },
                                                { id: 'other', label: '🔗 Other', icon: LinkIcon },
                                              ].map(t => (
                                                <button
                                                  key={t.id}
                                                  type="button"
                                                  onClick={() => setResourceForm({ ...resourceForm, type: t.id })}
                                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                    resourceForm.type === t.id
                                                      ? 'bg-white text-black border-white shadow-sm'
                                                      : 'bg-white/[0.03] text-zinc-400 hover:text-white border-white/[0.08]'
                                                  }`}
                                                >
                                                  {t.label}
                                                </button>
                                              ))}
                                            </div>

                                            {/* Title & URL Inputs */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              <div>
                                                <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Title *</label>
                                                <input
                                                  type="text"
                                                  required
                                                  placeholder="e.g. 3B1B Linear Algebra Ep 1..."
                                                  value={resourceForm.title}
                                                  onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                                                  className="w-full glass-input rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                                                  autoFocus
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">URL *</label>
                                                <input
                                                  type="url"
                                                  required
                                                  placeholder="https://youtube.com/..."
                                                  value={resourceForm.url}
                                                  onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                                                  className="w-full glass-input rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                                                />
                                              </div>
                                            </div>

                                            {/* Notes */}
                                            <div>
                                              <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Notes <span className="text-zinc-500 lowercase">(optional)</span></label>
                                              <input
                                                type="text"
                                                placeholder="e.g. Covers eigenvalues, watch at 1.5x..."
                                                value={resourceForm.notes}
                                                onChange={e => setResourceForm({ ...resourceForm, notes: e.target.value })}
                                                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                                              />
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-1">
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setInlineResourceKey(null); setEditingResource(null); }}
                                                className="px-3 py-1 text-[11px] text-zinc-400 hover:text-white"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="submit"
                                                onClick={() => setInlineResourceKey(null)}
                                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] flex items-center space-x-1 shadow-md active:scale-95 transition-all"
                                              >
                                                <Save className="w-3 h-3" />
                                                <span>{editingResource ? 'Update' : 'Save Link'}</span>
                                              </button>
                                            </div>
                                          </form>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between bg-black/20">
          <span className="text-[10px] text-slate-500 font-mono">SpaRE &bull; Multi-Track Alignment Matrix</span>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95 glass-btn"
          >
            Close
          </button>
        </div>

        {/* Revision Dates & History Modal (Triggered on Long-Press or History Click) */}
        {historyInspectData && (() => {
          const inspectSub = historyInspectData.sub;
          const inspectMod = historyInspectData.mod;
          const inspectTopic = historyInspectData.topic;
          const completedMilestones = inspectTopic?.schedule?.filter(m => m.state === 'COMPLETED' || m.completed_date) || [];
          const pendingMilestones = inspectTopic?.schedule?.filter(m => m.state !== 'COMPLETED' && !m.completed_date) || [];
          const nextDueMilestone = pendingMilestones[0];

          return (
            <div 
              className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in"
              onClick={() => setHistoryInspectData(null)}
            >
              <div 
                className="glass-modal w-full max-w-xl rounded-3xl border border-white/20 bg-zinc-950/95 shadow-2xl overflow-hidden animate-modal-pop text-zinc-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/[0.08] flex items-start justify-between gap-3 bg-gradient-to-b from-white/[0.04] to-transparent">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/20 shadow-sm flex items-center space-x-1"
                        style={{ backgroundColor: inspectSub.color || getPaletteColorForName(inspectSub.subject).color }}
                      >
                        <span>{inspectSub.subject}</span>
                      </span>
                      {inspectTopic ? (
                        completedMilestones.length > 0 ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{completedMilestones.length} Revisions Logged</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span>Scheduled in SpaRE</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          ⚠️ Unscheduled Chapter
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white tracking-tight pt-1">
                      {inspectMod.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 flex items-center space-x-1">
                      <History className="w-3 h-3 text-zinc-400" />
                      <span>Complete Spaced Repetition History & Dates Log</span>
                    </p>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setHistoryInspectData(null)}
                    className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">Total Revs</span>
                      <span className="text-base font-extrabold text-emerald-400">{completedMilestones.length}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">First Studied (T0)</span>
                      <span className="text-xs font-bold text-zinc-200">{formatHistoryDate(inspectTopic?.created_date) || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">Next Due</span>
                      <span className="text-xs font-bold text-zinc-200">
                        {nextDueMilestone ? formatHistoryDate(nextDueMilestone.scheduled_date) : (inspectTopic ? 'All Done' : 'Unscheduled')}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">Cycle</span>
                      <span className="text-xs font-bold text-zinc-200">
                        +{inspectTopic?.maintenance_interval_days || inspectMod.maintenance_interval_days || 30}d Recur
                      </span>
                    </div>
                  </div>

                  {/* SECTION 1: Completed Revision Dates (Jitne bhi din revise kiya) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-white flex items-center space-x-1.5 uppercase tracking-wide">
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Completed Revision Dates Log ({completedMilestones.length})</span>
                      </h4>
                      {completedMilestones.length > 0 && (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {completedMilestones.length} of {inspectTopic?.schedule?.length || 5} Milestones
                        </span>
                      )}
                    </div>

                    {completedMilestones.length > 0 ? (
                      <div className="space-y-2">
                        {completedMilestones.map((m, idx) => {
                          const delayInfo = getDelayDescription(m.completed_date || m.scheduled_date, m.scheduled_date);
                          return (
                            <div 
                              key={idx} 
                              className="p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                  {idx + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-xs font-bold text-white">{m.label || `Revision #${m.stage_number || idx + 1}`}</span>
                                    {delayInfo && (
                                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                                        delayInfo.type === 'ontime' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                          : delayInfo.type === 'early' 
                                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      }`}>
                                        {delayInfo.text}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                                    <span className="flex items-center space-x-1 text-emerald-400 font-mono font-semibold">
                                      <Calendar className="w-3 h-3 text-emerald-400" />
                                      <span>Revised: {formatHistoryDate(m.completed_date || m.scheduled_date)}</span>
                                    </span>
                                    {m.scheduled_date && (
                                      <span className="text-[10px] text-zinc-500 font-mono">
                                        (Target: {formatHistoryDate(m.scheduled_date)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Difficulty Rating Pill */}
                              <div className="flex items-center space-x-2 self-end sm:self-auto">
                                {m.difficulty ? (
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold border ${
                                    String(m.difficulty).toUpperCase().includes('EASY') 
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : String(m.difficulty).toUpperCase().includes('HARD')
                                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  }`}>
                                    {String(m.difficulty).toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-white/[0.02]">
                                    ✓ Marked Done
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : inspectTopic ? (
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center space-y-1.5">
                        <Clock className="w-5 h-5 text-zinc-500 mx-auto" />
                        <p className="text-xs text-zinc-300 font-semibold">Abhi tak koi revision complete nahi hui hai</p>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                          Jab aap is topic ko "Revised" mark karenge, to wo exact date yahan automatically save ho jayegi.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* SECTION 2: Upcoming Scheduled Milestones */}
                  {pendingMilestones.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <h4 className="text-xs font-extrabold text-white flex items-center space-x-1.5 uppercase tracking-wide">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Upcoming Revision Schedule ({pendingMilestones.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pendingMilestones.slice(0, 4).map((m, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-zinc-200 block">{m.label || `Rev #${m.stage_number || idx + 1}`}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">Due: {formatHistoryDate(m.scheduled_date)}</span>
                            </div>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Stage {m.stage_number || idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}



                  {/* Chapter Focus Details */}
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5 text-[10px]">
                    <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Chapter Syllabus Focus:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                        <span className="text-sky-400 font-semibold block">🎓 College:</span>
                        <span className="text-zinc-400">{inspectMod.collegeFocus || '(Semester Over)'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                        <span className="text-amber-400 font-semibold block">⚡ GATE:</span>
                        <span className="text-zinc-400">{inspectMod.gateFocus || '-'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                        <span className="text-emerald-400 font-semibold block">🚀 Nvidia/Sys:</span>
                        <span className="text-zinc-400">{inspectMod.companyFocus || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-black/40">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    💡 Hold chapter card anytime to open revision dates
                  </span>
                  <button 
                    type="button"
                    onClick={() => setHistoryInspectData(null)}
                    className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
