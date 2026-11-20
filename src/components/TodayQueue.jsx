import React, { useState, useMemo } from 'react';
import { CheckCircle2, Plus, Calendar } from 'lucide-react';
import TopicCard from './TopicCard';
import { CATEGORIES, getCategoryMeta } from '../types';
import { getCurrentPendingMilestone } from '../engine/scheduler';

export default function TodayQueue({
  topics, todayStr, onRevised, onNotRevised, onDelete, onViewDetails, onOpenAddModal, onOpenCalendar, onEditTopic, onRestartSpacedRepetition, customCategories = {}
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  const dueTopics = useMemo(() => topics.filter(t => {
    if (t.status === 'ARCHIVED') return false;
    const p = getCurrentPendingMilestone(t);
    return p && p.scheduled_date <= todayStr;
  }), [topics, todayStr]);

  const availableSubjects = useMemo(() => Array.from(new Set(dueTopics.map(t => t.subject).filter(Boolean))), [dueTopics]);

  const allCategoryKeys = useMemo(() => {
    const defaultKeys = Object.values(CATEGORIES);
    const customKeys = Object.keys(customCategories);
    // Also include any category present in topics that might not be in config
    const topicCats = new Set();
    dueTopics.forEach(t => {
      if (Array.isArray(t.categories)) t.categories.forEach(c => topicCats.add(c));
      else if (t.category) topicCats.add(t.category);
    });
    return Array.from(new Set([...defaultKeys, ...customKeys, ...topicCats]));
  }, [customCategories, dueTopics]);

  const filteredTopics = useMemo(() => dueTopics.filter(t => {
    if (selectedCategory !== 'ALL') {
      const cats = Array.isArray(t.categories) && t.categories.length > 0 ? t.categories : [t.category];
      if (!cats.includes(selectedCategory)) return false;
    }
    if (selectedSubject !== 'ALL' && t.subject !== selectedSubject) return false;
    return true;
  }), [dueTopics, selectedCategory, selectedSubject]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: dueTopics.length };
    allCategoryKeys.forEach(cat => {
      counts[cat] = dueTopics.filter(t => {
        const cats = Array.isArray(t.categories) && t.categories.length > 0 ? t.categories : [t.category];
        return cats.includes(cat);
      }).length;
    });
    return counts;
  }, [dueTopics, allCategoryKeys]);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[{ key: 'ALL', label: 'All Due' }, ...allCategoryKeys.map(c => ({ key: c, label: getCategoryMeta(c, customCategories).badge }))].map(({ key, label }) => {
            const meta = key !== 'ALL' ? getCategoryMeta(key, customCategories) : null;
            const isSelected = selectedCategory === key;
            const count = categoryCounts[key] || 0;
            return (
              <button key={key} onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center space-x-1.5 glass-btn transition-all ${
                  isSelected
                    ? key === 'ALL' ? 'bg-white text-black font-extrabold shadow-md shadow-white/20' : `${meta.bgLight} border shadow-md`
                    : 'glass-panel text-zinc-400 hover:text-white hover:border-white/15'
                }`}>
                <span>{label}</span>
                <span className={`px-1.5 rounded-full text-[9px] font-mono font-bold ${isSelected ? (key === 'ALL' ? 'bg-black/15 text-black' : 'bg-white/20 text-white') : 'bg-zinc-800 text-zinc-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {availableSubjects.length > 1 && (
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            className="glass-input rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none cursor-pointer">
            <option value="ALL">All Subjects</option>
            {availableSubjects.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
          </select>
        )}
      </div>

      {/* Cards grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredTopics.map((topic, i) => (
            <div key={topic.topic_id} style={{ animationDelay: `${i * 30}ms` }} className="animate-slide-up smooth-item">
              <TopicCard 
                topic={topic} 
                currentMilestone={getCurrentPendingMilestone(topic)} 
                onRevised={onRevised} 
                onNotRevised={onNotRevised} 
                onDelete={onDelete} 
                onViewDetails={onViewDetails} 
                onEditTopic={onEditTopic}
                onRestartSpacedRepetition={onRestartSpacedRepetition}
                isDueToday 
                customCategories={customCategories}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-modal rounded-2xl p-8 text-center max-w-md mx-auto my-6 space-y-4 relative overflow-hidden border border-white/[0.08] animate-pop-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/15 animate-float-slow">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1 relative">
            <h3 className="text-lg font-extrabold text-white">{dueTopics.length === 0 ? "All Caught Up!" : 'No topics here'}</h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">{dueTopics.length === 0 ? 'No revisions pending for today. Add new topics or check upcoming days.' : 'Try a different filter.'}</p>
          </div>
          <div className="flex items-center justify-center gap-2 relative">
            <button onClick={onOpenAddModal} className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] shadow-md shadow-white/15 flex items-center space-x-1.5 active:scale-95 glass-btn">
              <Plus className="w-3.5 h-3.5" /><span>Add Topic</span>
            </button>
            <button onClick={onOpenCalendar} className="px-4 py-2 rounded-xl glass-panel text-zinc-200 font-bold text-[11px] flex items-center space-x-1.5 active:scale-95 glass-btn">
              <Calendar className="w-3.5 h-3.5 text-zinc-300" /><span>Upcoming</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
