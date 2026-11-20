import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Clock, 
  Database, 
  Cloud, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Tag, 
  Sparkles,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { 
  CATEGORIES, 
  DEFAULT_CATEGORY_CONFIG, 
  DEFAULT_CUSTOM_CATEGORIES,
  MAINTENANCE_TYPE, 
  CUSTOM_CATEGORY_PALETTES, 
  getCategoryMeta 
} from '../types';
import { exportDataAsJSON, validateImportData } from '../storage/db';
import ConfirmationModal from './ConfirmationModal';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings, 
  customCategories = {}, 
  onUpdateCustomCategories, 
  topics, 
  streak, 
  neonStatus, 
  onImportData,
  currentUser = null,
  onUpdateUser = null
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localCustomCats, setLocalCustomCats] = useState(() => ({ ...DEFAULT_CUSTOM_CATEGORIES, ...(customCategories || {}) }));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [expandedTracks, setExpandedTracks] = useState(() => new Set());

  // Personal Info Form State
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' | 'cloud'

  // Sync state with parent props when modal opens or saved props change
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings || {});
      setLocalCustomCats({ ...DEFAULT_CUSTOM_CATEGORIES, ...(customCategories || {}) });
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatDesc('');
      setCategoryError('');
    }
  }, [isOpen, settings, customCategories, currentUser]);

  useEffect(() => {
    if (isOpen) {
      setExpandedTracks(new Set());
    }
  }, [isOpen]);

  // New Category Form State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(CUSTOM_CATEGORY_PALETTES[0]);
  const [newCatMonths, setNewCatMonths] = useState(6);
  const [newCatType, setNewCatType] = useState(MAINTENANCE_TYPE.MONTHS);

  if (!isOpen) return null;

  const isNeonConnected = neonStatus?.connected || neonStatus?.neonDatabase === 'connected';

  // Check if user has unsaved draft modifications in this session
  const hasUnsavedChanges = 
    JSON.stringify(localSettings) !== JSON.stringify(settings) || 
    JSON.stringify(localCustomCats) !== JSON.stringify(customCategories);

  const handleDiscard = () => {
    // Reset local state back to saved Neon state and close
    setLocalSettings(settings || {});
    setLocalCustomCats(customCategories || {});
    setIsAddingCategory(false);
    onClose();
  };

  const handleCategoryChange = (catId, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {
          category_id: catId,
          maintenance_type: MAINTENANCE_TYPE.MONTHS,
          maintenance_months: 6,
          maintenance_days: 180,
          target_end_date: null,
          is_paused: false,
        }),
        [field]: value
      }
    }));
  };

  const toggleTrackExpanded = (catId) => {
    setExpandedTracks(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    setCategoryError('');
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (DEFAULT_CATEGORY_CONFIG[trimmed] || localCustomCats[trimmed]) {
      setCategoryError(`A track named "${trimmed}" already exists.`);
      return;
    }

    const createdCat = {
      id: trimmed,
      label: trimmed,
      badge: trimmed,
      color: selectedPalette.color,
      bgLight: selectedPalette.bgLight,
      borderColor: selectedPalette.borderColor,
      accentColor: `text-[${selectedPalette.color}]`,
      defaultMaintenanceMonths: newCatMonths,
      description: newCatDesc.trim() || `${trimmed} preparation track`,
      sampleSubjects: [],
    };

    // Staged in local draft state only — NOT persisted until user clicks Save
    const nextCustomCats = { ...localCustomCats, [trimmed]: createdCat };
    setLocalCustomCats(nextCustomCats);

    const nextSettings = {
      ...localSettings,
      [trimmed]: {
        category_id: trimmed,
        maintenance_type: newCatType,
        maintenance_months: newCatMonths,
        maintenance_days: newCatMonths * 30,
        target_end_date: null,
        is_paused: false,
      }
    };
    setLocalSettings(nextSettings);

    setNewCatName('');
    setNewCatDesc('');
    setIsAddingCategory(false);
  };

  const handleDeleteCustomCategory = (catId) => {
    setConfirmConfig({
      title: 'Delete Custom Category?',
      message: `Kya aap custom category "${catId}" delete karna chahte hain?`,
      subMessage: 'Note: Yeh change tabhi apply hoga jab aap "Save Changes" par click karenge.',
      confirmText: 'Remove Track',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        // Staged in local draft state only
        const nextCats = { ...localCustomCats };
        delete nextCats[catId];
        setLocalCustomCats(nextCats);

        const nextSettings = { ...localSettings };
        delete nextSettings[catId];
        setLocalSettings(nextSettings);

        setConfirmConfig(null);
      }
    });
  };

  const handleSave = () => {
    // Commit draft changes directly to Neon Database & App state
    if (onUpdateSettings) {
      onUpdateSettings(localSettings);
    }
    if (onUpdateCustomCategories) {
      onUpdateCustomCategories(localCustomCats);
    }
    setSaveSuccess(true);
    setTimeout(() => { 
      setSaveSuccess(false); 
      onClose(); 
    }, 450);
  };

  const handleImportFile = (e) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!validateImportData(parsed)) { setImportError('Invalid backup file.'); return; }
        onImportData(parsed); onClose();
      } catch (err) { setImportError('Failed to parse JSON.'); }
    };
    reader.readAsText(file);
  };

  // Combine default categories and custom categories
  const allCategoryKeys = [
    ...Object.values(CATEGORIES),
    ...Object.keys(localCustomCats).filter(k => !Object.values(CATEGORIES).includes(k))
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={handleDiscard}
    >
      <div 
        className="glass-modal w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-4 border border-white/10 animate-modal-pop relative" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white">Settings & Preferences</h2>
                {hasUnsavedChanges && activeTab === 'tracks' && (
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Draft Unsaved
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Manage account, tracks lifespan, cloud sync & backups</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleDiscard} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 glass-btn"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-5 pt-3 border-b border-white/[0.06] flex items-center space-x-2 bg-white/[0.01]">
          <button
            type="button"
            onClick={() => setActiveTab('tracks')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'tracks'
                ? 'border-amber-400 text-white shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Tracks & Quotas</span>
            {hasUnsavedChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'cloud'
                ? 'border-blue-400 text-white shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Cloud & Backups</span>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* TAB 1: Custom Tracks & Categories Section */}
          {activeTab === 'tracks' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Categories & Tracks Lifespan</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Configure maintenance loops, infinite retention, or exam targets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center space-x-1.5 glass-btn active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Track</span>
                </button>
              </div>

              {/* Form to Add New Category */}
              {isAddingCategory && (
                <form onSubmit={handleCreateCategory} className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3.5 animate-pop-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Create New Preparation Track</span>
                    </span>
                    <button type="button" onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {categoryError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center space-x-1.5 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{categoryError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-1">Track Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AI / ML, Distributed Systems..."
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Core concepts, projects & low-level coding"
                        value={newCatDesc}
                        onChange={e => setNewCatDesc(e.target.value)}
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Color Palette Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[9px] uppercase font-semibold text-slate-400">
                        Color Theme ({CUSTOM_CATEGORY_PALETTES.length} High-Contrast Accents)
                      </label>
                      <span className="text-[10px] text-amber-300 font-mono">
                        {selectedPalette?.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] max-h-24 overflow-y-auto custom-scrollbar">
                      {CUSTOM_CATEGORY_PALETTES.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPalette(p)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            selectedPalette.id === p.id ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          style={{ backgroundColor: p.color }}
                          title={p.label}
                        >
                          {selectedPalette.id === p.id && <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
                    >
                      Save Track
                    </button>
                  </div>
                </form>
              )}

              {/* List of all categories with customizable lifespans */}
              <div className="space-y-2.5">
                {allCategoryKeys.map(cat => {
                  const meta = getCategoryMeta(cat, localCustomCats);
                  const config = localSettings[cat] || {
                    category_id: cat,
                    maintenance_type: MAINTENANCE_TYPE.MONTHS,
                    maintenance_months: meta.defaultMaintenanceMonths || 6,
                    maintenance_days: (meta.defaultMaintenanceMonths || 6) * 30,
                    target_end_date: null,
                  };
                  const isCustom = !Object.values(CATEGORIES).includes(cat);
                  const isExpanded = expandedTracks.has(cat);
                  const summary = config.maintenance_type === MAINTENANCE_TYPE.INFINITE
                    ? 'Infinite ∞'
                    : config.maintenance_type === MAINTENANCE_TYPE.TARGET_DATE
                    ? (config.target_end_date ? `Target: ${config.target_end_date}` : 'Target Date')
                    : `${config.maintenance_months || 6} months`;

                  return (
                    <div key={cat} className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden transition-colors">
                      {/* Level 1: Collapsed track header — click to expand */}
                      <div className="flex items-center justify-between gap-2 p-3.5">
                        <button
                          type="button"
                          onClick={() => toggleTrackExpanded(cat)}
                          aria-expanded={isExpanded}
                          className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${meta.bgLight}`}>
                              {meta.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{meta.description}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-[9px] font-mono font-bold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                              {summary}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomCategory(cat)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Delete Custom Track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Levels 2 & 3: mode selector + selected mode details */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-2.5 border-t border-white/[0.05] space-y-2.5 animate-fade-in">
                          {/* Level 2: Lifespan Mode Selector */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { type: MAINTENANCE_TYPE.MONTHS, label: 'Custom Months' },
                              { type: MAINTENANCE_TYPE.TARGET_DATE, label: 'Target Date' },
                              { type: MAINTENANCE_TYPE.INFINITE, label: 'Infinite (∞)' },
                            ].map(({ type, label }) => (
                              <button 
                                key={type} 
                                type="button" 
                                onClick={() => handleCategoryChange(cat, 'maintenance_type', type)}
                                className={`py-1.5 px-2 rounded-xl border text-[10px] font-semibold glass-btn transition-all ${
                                  config.maintenance_type === type 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-bold' 
                                    : 'glass-panel text-slate-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Level 3: Detail for the selected mode */}
                          {config.maintenance_type === MAINTENANCE_TYPE.MONTHS && (
                            <div className="flex items-center space-x-2 text-[11px] text-slate-300 pt-0.5">
                              <span>Maintenance Duration:</span>
                              <input 
                                type="number" 
                                min="1" 
                                max="120" 
                                value={config.maintenance_months || 6}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  handleCategoryChange(cat, 'maintenance_months', val);
                                  handleCategoryChange(cat, 'maintenance_days', val * 30);
                                }}
                                className="w-16 glass-input rounded-lg px-2 py-0.5 text-[11px] text-white font-mono text-center focus:outline-none" 
                              />
                              <span>months (~{(config.maintenance_months || 6) * 30} days after Rev 5)</span>
                            </div>
                          )}

                          {config.maintenance_type === MAINTENANCE_TYPE.TARGET_DATE && (
                            <div className="flex items-center space-x-2 text-[11px] text-slate-300 pt-0.5">
                              <span>Target Exam / End Date:</span>
                              <input 
                                type="date" 
                                value={config.target_end_date || ''} 
                                onChange={e => handleCategoryChange(cat, 'target_end_date', e.target.value)}
                                className="glass-input rounded-lg px-2 py-0.5 text-[11px] text-white focus:outline-none cursor-pointer" 
                              />
                            </div>
                          )}

                          {config.maintenance_type === MAINTENANCE_TYPE.INFINITE && (
                            <div className="text-[10px] text-emerald-400 font-mono">
                              ∞ Topics in this track will stay in 30-day maintenance forever without auto-archiving.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Cloud Database & Backup */}
          {activeTab === 'cloud' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cloud Sync Architecture</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Realtime server synchronization and manual backup snapshots
                  </p>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isNeonConnected 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  {isNeonConnected ? '● Connected' : '○ Offline / Local'}
                </span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Cloud Realtime Auto-Sync</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">All topics, revisions & streak sync automatically to the cloud in real time.</p>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-Sync Active</span>
                </div>
              </div>

              {/* Backup & Recovery */}
              <div className="pt-2 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manual Snapshots & Restore</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => exportDataAsJSON(topics, localSettings)}
                    className="p-3.5 rounded-2xl glass-panel hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all flex flex-col items-center text-center space-y-1.5 glass-btn active:scale-95 cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-bold">Export Backup</span>
                    <span className="text-[10px] text-slate-400">Download snapshot (.json)</span>
                  </button>
                  <label className="p-3.5 rounded-2xl glass-panel hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all flex flex-col items-center text-center space-y-1.5 cursor-pointer glass-btn active:scale-95">
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold">Import Backup</span>
                    <span className="text-[10px] text-slate-400">Restore snapshot (.json)</span>
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
                {importError && (
                  <p className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    {importError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between">
          <div className="text-[10px] text-zinc-400 font-mono">
            {hasUnsavedChanges ? (
              <span className="text-amber-400">● Unsaved edits staged</span>
            ) : (
              <span className="text-zinc-500">Synced with Cloud</span>
            )}
          </div>
          <div className="flex items-center space-x-2.5">
            <button 
              type="button" 
              onClick={handleDiscard} 
              className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white glass-btn transition-colors"
            >
              {hasUnsavedChanges ? 'Discard' : 'Close'}
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={saveSuccess}
              className={`px-4 py-1.5 rounded-xl text-white font-bold text-[11px] shadow-md flex items-center space-x-1.5 active:scale-95 glass-btn transition-all ${
                saveSuccess 
                  ? 'bg-emerald-600 shadow-emerald-500/25' 
                  : hasUnsavedChanges
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 ring-1 ring-blue-400/30'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white border border-white/10'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved to Cloud!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>

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
