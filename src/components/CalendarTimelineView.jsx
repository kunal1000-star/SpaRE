import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  History, 
  Eye, 
  Tag, 
  Flame,
  LayoutGrid,
  SlidersHorizontal
} from 'lucide-react';
import { 
  addDays, 
  addMonths, 
  subMonths, 
  addYears, 
  subYears, 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday as checkIsToday,
  isBefore,
  isAfter,
  parseISO
} from 'date-fns';
import { 
  formatDisplayDate, 
  parseDateSafe, 
  formatDate,
  isWithinMaintenanceLimit 
} from '../engine/scheduler';
import { getCategoryMeta, TOPIC_DIFFICULTY, TOPIC_IMPORTANCE } from '../types';
import TrackNotesView from './TrackNotesView';
import { loadSettings } from '../storage/db';

export default function CalendarTimelineView({ 
  topics = [], 
  todayStr, 
  onViewDetails, 
  customCategories = {},
  categorySettings = null
}) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'strip'
  const [currentDate, setCurrentDate] = useState(() => parseDateSafe(todayStr));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'completed' | 'scheduled' | 'maintenance'
  const [rangeDays, setRangeDays] = useState(14); // for strip view

  const today = parseDateSafe(todayStr);
  const effectiveSettings = categorySettings || loadSettings();

  // Multi-Year Projector: Collects past completed, current pending, AND projected 30-day maintenance up to 4+ years
  const { eventsByDate, monthlyStats } = useMemo(() => {
    const map = {};
    const stats = {
      total: 0,
      completed: 0,
      scheduled: 0,
      maintenance: 0,
      busiestDate: null,
      busiestCount: 0,
    };

    const addEvent = (dateKey, eventObj) => {
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(eventObj);
    };

    // 1. Scan Topics for Actual Scheduled & Completed Milestones
    topics.forEach(t => {
      if (t.status === 'ARCHIVED') return;

      const schedule = Array.isArray(t.schedule) ? t.schedule : [];
      let latestScheduledMilestone = null;

      schedule.forEach((m) => {
        // A. Past Completed Milestone (History Mode: 1-4 years ago)
        if (m.state === 'COMPLETED') {
          const compDate = m.completed_date || m.scheduled_date;
          if (compDate) {
            addEvent(compDate, {
              type: 'completed',
              dateKey: compDate,
              topic: t,
              milestone: m,
              isProjected: false,
              label: m.label || `Rev #${m.stage_number}`,
            });
          }
        } 
        // B. Pending Milestone (Core Schedule or Current Maintenance)
        else if (m.state === 'PENDING' && m.scheduled_date) {
          const isMaint = m.stage_number > 5 || m.label?.toLowerCase().includes('maint');
          addEvent(m.scheduled_date, {
            type: isMaint ? 'maintenance' : 'scheduled',
            dateKey: m.scheduled_date,
            topic: t,
            milestone: m,
            isProjected: false,
            label: m.label || `Rev #${m.stage_number}`,
          });
          latestScheduledMilestone = m;
        }
      });

      // 2. Project Recurring Maintenance for Active / Maintenance Topics up to 4+ Years Ahead
      // User can customize interval (e.g. 15d, 30d, 45d, 60d) or end maintenance when mastered
      if (t.maintenance_ended) return;

      const lastMilestoneInSchedule = schedule[schedule.length - 1];
      const anchorMilestone = latestScheduledMilestone || lastMilestoneInSchedule;

      if (anchorMilestone) {
        const anchorDateStr = anchorMilestone.scheduled_date || anchorMilestone.completed_date;
        if (anchorDateStr) {
          const anchorDate = parseDateSafe(anchorDateStr);
          const anchorStage = anchorMilestone.stage_number || 5;
          const startMaintCycleNum = anchorStage >= 5 ? (anchorStage - 5 + 1) : 1;
          const intervalDays = parseInt(t.maintenance_interval_days, 10) || 30;

          // Project up to 4+ years based on topic's custom interval
          const MAX_CYCLES = Math.min(60, Math.round((4.3 * 365) / intervalDays));

          for (let k = 1; k <= MAX_CYCLES; k++) {
            const projectedDate = addDays(anchorDate, k * intervalDays);
            const projectedDateStr = formatDate(projectedDate);

            // Check if within topic category lifespan (e.g. infinite for Self, 4 years for GATE/College)
            const isAllowed = isWithinMaintenanceLimit(t, projectedDateStr, effectiveSettings);
            if (!isAllowed) break;

            const cycleNum = startMaintCycleNum + k - 1;

            addEvent(projectedDateStr, {
              type: 'maintenance',
              dateKey: projectedDateStr,
              topic: t,
              milestone: {
                stage_number: 5 + cycleNum,
                label: `Maint Cycle #${cycleNum} (+${intervalDays}d)`,
                scheduled_date: projectedDateStr,
                state: 'PROJECTED',
                is_booster: false,
              },
              isProjected: true,
              label: `Maint Cycle #${cycleNum} (+${intervalDays}d)`,
            });
          }
        }
      }
    });

    // Compute stats for current visible month
    const visibleMonthPrefix = format(currentDate, 'yyyy-MM');
    Object.keys(map).forEach(dKey => {
      if (dKey.startsWith(visibleMonthPrefix)) {
        const events = map[dKey];
        stats.total += events.length;
        events.forEach(e => {
          if (e.type === 'completed') stats.completed++;
          else if (e.type === 'scheduled') stats.scheduled++;
          else if (e.type === 'maintenance') stats.maintenance++;
        });

        if (events.length > stats.busiestCount) {
          stats.busiestCount = events.length;
          stats.busiestDate = dKey;
        }
      }
    });

    return { eventsByDate: map, monthlyStats: stats };
  }, [topics, currentDate, effectiveSettings]);

  // Calendar Grid Days Calculation
  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(d => {
      const dKey = formatDate(d);
      const events = eventsByDate[dKey] || [];
      const hasCompleted = events.some(e => e.type === 'completed');
      const hasScheduled = events.some(e => e.type === 'scheduled');
      const hasMaintenance = events.some(e => e.type === 'maintenance');
      const isCurrentMonth = isSameMonth(d, currentDate);
      const isTodayDay = isSameDay(d, today);
      const isSelected = selectedDate === dKey;

      return {
        date: d,
        dateKey: dKey,
        dayNum: format(d, 'd'),
        isCurrentMonth,
        isToday: isTodayDay,
        isSelected,
        events,
        count: events.length,
        hasCompleted,
        hasScheduled,
        hasMaintenance,
        isHeavy: events.length >= 8,
      };
    });
  }, [currentDate, eventsByDate, today, selectedDate]);

  // Horizontal Timeline Strip Days (Alternative View)
  const stripDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < rangeDays; i++) {
      const d = addDays(today, i);
      const dKey = formatDate(d);
      const events = eventsByDate[dKey] || [];
      list.push({
        date: d,
        dateKey: dKey,
        dayName: format(d, 'EEE'),
        dayNumber: format(d, 'd'),
        monthName: format(d, 'MMM'),
        isToday: i === 0,
        count: events.length,
        isHeavy: events.length >= 8,
        events,
      });
    }
    return list;
  }, [today, rangeDays, eventsByDate]);

  // Selected Date Event Details
  const rawSelectedEvents = eventsByDate[selectedDate] || [];
  const filteredSelectedEvents = useMemo(() => {
    if (typeFilter === 'all') return rawSelectedEvents;
    return rawSelectedEvents.filter(e => e.type === typeFilter);
  }, [rawSelectedEvents, typeFilter]);

  // Relative Date Header Info
  const selectedDateObj = parseDateSafe(selectedDate);
  const isPastDate = isBefore(selectedDateObj, today) && !isSameDay(selectedDateObj, today);
  const isTodayDate = isSameDay(selectedDateObj, today);
  const isFutureDate = isAfter(selectedDateObj, today);

  // Quick Navigation Helpers
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handlePrevYear = () => setCurrentDate(prev => subYears(prev, 1));
  const handleNextYear = () => setCurrentDate(prev => addYears(prev, 1));
  const handlePrev4Years = () => setCurrentDate(prev => subYears(prev, 4));
  const handleNext4Years = () => setCurrentDate(prev => addYears(prev, 4));
  const handleJumpToToday = () => {
    const now = parseDateSafe(todayStr);
    setCurrentDate(now);
    setSelectedDate(todayStr);
  };

  const handleMonthSelect = (mIdx) => {
    const year = currentDate.getFullYear();
    setCurrentDate(new Date(year, mIdx, 1));
  };

  const handleYearSelect = (year) => {
    const month = currentDate.getMonth();
    setCurrentDate(new Date(year, month, 1));
  };

  // Generate Year Options: from -4 years before 2026 (2022) to +8 years (2034)
  const currentYearNum = currentDate.getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 2022; y <= 2035; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-4 animate-slide-up pb-10">
      {/* Top Header Card */}
      <div className="glass-panel p-4 rounded-3xl border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-[1.5px] shadow-lg shadow-blue-500/20 shrink-0">
            <div className="w-full h-full bg-[#0A0F1E] rounded-[14px] flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-white tracking-tight">Multi-Year Revision Calendar</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                Past -4y &bull; Future +4y
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Inspect historical revisions from 2–4 years ago & projected 30-day maintenance up to 4 years ahead
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Full Month Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('strip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'strip'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Timeline Strip</span>
          </button>
        </div>
      </div>

      {/* ================= CALENDAR GRID VIEW ================= */}
      {viewMode === 'calendar' && (
        <div className="space-y-3.5">
          {/* Calendar Navigation & Pickers Card */}
          <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl">
            {/* Top Nav Row: Year Jumps & Month Pickers */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: 4-Year Past Jump & 1-Year Past */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handlePrev4Years}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono font-bold flex items-center space-x-1 glass-btn active:scale-95 transition-all"
                  title="Jump 4 Years Back in History (-4y)"
                >
                  <ChevronsLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>-4y</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono font-bold flex items-center space-x-1 glass-btn active:scale-95 transition-all"
                  title="Jump 1 Year Back (-1y)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>-1y</span>
                </button>
              </div>

              {/* Center: Month Navigator & Dropdowns */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 glass-btn transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Month Dropdown */}
                <select
                  value={currentDate.getMonth()}
                  onChange={(e) => handleMonthSelect(parseInt(e.target.value, 10))}
                  aria-label="Select month"
                  className="glass-input rounded-xl px-2.5 py-1.5 text-xs font-bold text-white border border-white/15 focus:outline-none cursor-pointer bg-[#0D1326]"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx} className="bg-[#0D1326] text-white">
                      {name}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={currentYearNum}
                  onChange={(e) => handleYearSelect(parseInt(e.target.value, 10))}
                  aria-label="Select year"
                  className="glass-input rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono text-emerald-400 border border-white/15 focus:outline-none cursor-pointer bg-[#0D1326]"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className="bg-[#0D1326] text-white">
                      {y}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 glass-btn transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Right: 1-Year Next & 4-Year Next Jump */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono font-bold flex items-center space-x-1 glass-btn active:scale-95 transition-all"
                  title="Jump 1 Year Forward (+1y)"
                >
                  <span>+1y</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext4Years}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-[10px] font-mono font-bold flex items-center space-x-1 glass-btn active:scale-95 transition-all"
                  title="Jump 4 Years Forward into Future Maintenance (+4y)"
                >
                  <span>+4y</span>
                  <ChevronsRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Quick Preset Shortcut Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[10px]">
              <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                <span className="text-slate-500 mr-1 font-mono uppercase text-[9px]">History:</span>
                {[-4, -2, -1].map((offset) => {
                  const targetYear = today.getFullYear() + offset;
                  const isActive = currentYearNum === targetYear;
                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => handleYearSelect(targetYear)}
                      className={`px-2 py-0.5 rounded-lg border font-mono font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm'
                          : 'bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06]'
                      }`}
                    >
                      {offset}y ({targetYear})
                    </button>
                  );
                })}
              </div>

              {/* Instant Jump to Today */}
              <button
                type="button"
                onClick={handleJumpToToday}
                title="Jump calendar view back to today"
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold font-mono text-[10px] shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Jump to Today</span>
              </button>

              <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                <span className="text-slate-500 mr-1 font-mono uppercase text-[9px]">Maintenance:</span>
                {[1, 2, 4].map((offset) => {
                  const targetYear = today.getFullYear() + offset;
                  const isActive = currentYearNum === targetYear;
                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => handleYearSelect(targetYear)}
                      className={`px-2 py-0.5 rounded-lg border font-mono font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06]'
                      }`}
                    >
                      +{offset}y ({targetYear})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Density Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Total in Month</span>
                <span className="text-sm font-extrabold text-white font-mono">{monthlyStats.total} revisions</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 block">Past Completed</span>
                <span className="text-sm font-extrabold text-emerald-300 font-mono">{monthlyStats.completed} done</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/15 text-center">
                <span className="text-[9px] uppercase tracking-wider text-blue-400 block">Core Scheduled</span>
                <span className="text-sm font-extrabold text-blue-300 font-mono">{monthlyStats.scheduled} due</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                <span className="text-[9px] uppercase tracking-wider text-amber-400 block">30d Maintenance</span>
                <span className="text-sm font-extrabold text-amber-300 font-mono">{monthlyStats.maintenance} cycles</span>
              </div>
            </div>
          </div>

          {/* Full Monthly Grid */}
          <div className="glass-modal p-3.5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="py-1">Mon</span>
              <span className="py-1">Tue</span>
              <span className="py-1">Wed</span>
              <span className="py-1">Thu</span>
              <span className="py-1">Fri</span>
              <span className="py-1 text-amber-400/90">Sat</span>
              <span className="py-1 text-rose-400/90">Sun</span>
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarGrid.map((day) => {
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(day.dateKey)}
                    className={`min-h-[4.2rem] sm:min-h-[4.8rem] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative group ${
                      day.isSelected
                        ? 'bg-gradient-to-b from-blue-600/30 to-indigo-600/25 border-blue-400 shadow-xl shadow-blue-500/20 scale-[1.03] z-10 ring-2 ring-blue-400/40'
                        : day.isToday
                        ? 'glass-card border-indigo-400/60 ring-2 ring-indigo-500/30'
                        : day.isCurrentMonth
                        ? 'glass-panel hover:border-white/20 bg-white/[0.02]'
                        : 'bg-black/20 border-transparent opacity-35 hover:opacity-75'
                    }`}
                  >
                    {/* Top Row: Day Number & Total Pill */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-extrabold font-mono ${
                          day.isToday
                            ? 'text-white px-1.5 py-0.2 rounded-lg bg-blue-600'
                            : day.isSelected
                            ? 'text-white'
                            : day.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {day.dayNum}
                      </span>

                      {day.count > 0 && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                            day.isHeavy
                              ? 'bg-amber-500 text-slate-950 font-extrabold'
                              : day.hasCompleted && !day.hasScheduled && !day.hasMaintenance
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : day.hasMaintenance && !day.hasScheduled
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {day.count}
                        </span>
                      )}
                    </div>

                    {/* Middle: Badges indicators */}
                    <div className="space-y-0.5 mt-1 w-full overflow-hidden">
                      {/* Completed Badge */}
                      {day.hasCompleted && (
                        <div className="text-[8px] sm:text-[9px] font-mono font-semibold text-emerald-400 flex items-center space-x-0.5 truncate">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {day.events.filter(e => e.type === 'completed').length} done
                          </span>
                        </div>
                      )}

                      {/* Core Scheduled Badge */}
                      {day.hasScheduled && (
                        <div className="text-[8px] sm:text-[9px] font-mono font-semibold text-blue-300 flex items-center space-x-0.5 truncate">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {day.events.filter(e => e.type === 'scheduled').length} due
                          </span>
                        </div>
                      )}

                      {/* 30-Day Maintenance Badge */}
                      {day.hasMaintenance && (
                        <div className="text-[8px] sm:text-[9px] font-mono font-semibold text-amber-300 flex items-center space-x-0.5 truncate">
                          <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {day.events.filter(e => e.type === 'maintenance').length} maint
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Heavy Load Warning */}
                    {day.isHeavy && (
                      <div className="text-[8px] font-bold text-amber-400 flex items-center space-x-0.5 pt-0.5">
                        <AlertTriangle className="w-2 h-2 shrink-0" />
                        <span className="hidden sm:inline">Heavy</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TIMELINE STRIP VIEW ================= */}
      {viewMode === 'strip' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-white/[0.06]">
            <div>
              <h3 className="text-xs font-bold text-white">Upcoming Daily Density Strip</h3>
              <p className="text-[10px] text-slate-400">Quick day-by-day load scroller</p>
            </div>
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {[7, 14, 30, 60, 90].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRangeDays(r)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    rangeDays === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex space-x-2 min-w-max py-1 px-1">
              {stripDays.map((d) => {
                const isSelected = selectedDate === d.dateKey;
                return (
                  <button
                    key={d.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(d.dateKey)}
                    className={`w-[5.8rem] p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between glass-btn transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-600/30 to-indigo-600/20 border-blue-400 shadow-lg shadow-blue-500/20 scale-105'
                        : d.isHeavy
                        ? 'bg-amber-950/25 border-amber-500/40'
                        : d.isToday
                        ? 'glass-card border-indigo-500/40'
                        : 'glass-panel hover:border-white/15'
                    }`}
                  >
                    <div>
                      <span className={`text-[9px] font-bold block uppercase tracking-wider ${d.isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {d.isToday ? 'Today' : d.dayName}
                      </span>
                      <span className="text-sm font-extrabold text-white font-mono block">
                        {d.dayNumber} {d.monthName}
                      </span>
                    </div>

                    <div className="mt-2 w-full">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full block ${
                          d.count === 0
                            ? 'bg-white/[0.04] text-slate-500'
                            : d.isHeavy
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {d.count}
                      </span>
                      {d.isHeavy && (
                        <span className="text-[8px] font-bold text-amber-400 mt-0.5 flex items-center justify-center">
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                          Heavy
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SELECTED DATE DETAIL PANE ================= */}
      <div className="glass-modal p-5 rounded-3xl border border-white/10 shadow-2xl animate-pop-in space-y-4">
        {/* Selected Date Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Date Overview:</span>
              <span className="text-base font-extrabold text-white font-mono">
                {formatDisplayDate(selectedDate)}
              </span>

              {isTodayDate && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                  Today
                </span>
              )}
              {isPastDate && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase flex items-center space-x-1">
                  <History className="w-2.5 h-2.5" />
                  <span>Past History</span>
                </span>
              )}
              {isFutureDate && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase flex items-center space-x-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Scheduled / Maint</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              {isPastDate
                ? 'Showing revisions completed on this day in past study history'
                : isTodayDate
                ? "Showing topics scheduled for today's active revision"
                : 'Showing upcoming core revisions and projected 30-day recurring maintenance cycles'}
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] self-start sm:self-auto text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({rawSelectedEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                typeFilter === 'completed'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Completed ({rawSelectedEvents.filter(e => e.type === 'completed').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('scheduled')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                typeFilter === 'scheduled'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-blue-300'
              }`}
            >
              Core ({rawSelectedEvents.filter(e => e.type === 'scheduled').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('maintenance')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                typeFilter === 'maintenance'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              30d Maint ({rawSelectedEvents.filter(e => e.type === 'maintenance').length})
            </button>
          </div>
        </div>

        {/* Topics List for Selected Date */}
        {filteredSelectedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSelectedEvents.map(({ topic, milestone, type, isProjected, label }, idx) => {
              const allCats = Array.isArray(topic.categories) && topic.categories.length > 0 
                ? topic.categories 
                : [topic.category || 'GATE'];

              const isCompleted = type === 'completed';
              const isMaintenance = type === 'maintenance';

              return (
                <div
                  key={`${topic.topic_id}-${milestone.stage_number || idx}`}
                  className="glass-panel p-4 rounded-2xl border border-white/[0.06] hover:border-white/20 transition-all space-y-2.5 relative group"
                >
                  {/* Header: Categories & Milestone Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center flex-wrap gap-1">
                      {allCats.map((cat) => {
                        const meta = getCategoryMeta(cat, customCategories);
                        return (
                          <span
                            key={cat}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.bgLight}`}
                          >
                            {meta.badge}
                          </span>
                        );
                      })}
                      <span className="text-[10px] text-slate-400 font-semibold">{topic.subject}</span>
                    </div>

                    {/* Milestone State Tag */}
                    <div>
                      {isCompleted ? (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Revised ({milestone.difficulty || 'Done'})</span>
                        </span>
                      ) : isMaintenance ? (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center space-x-1">
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>{isProjected ? 'Projected +30d' : '30d Maint'}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Core #{milestone.stage_number}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {topic.title}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-300 mt-0.5 flex items-center space-x-1.5">
                      <span className="text-indigo-400 font-bold">{label}</span>
                      {isProjected && (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-mono">
                          Recurring 30-Day Cycle
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Difficulty & Importance Badges */}
                  <div className="flex items-center space-x-1.5 pt-0.5 text-[9px] font-bold">
                    <span className="text-slate-400">Baseline:</span>
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300 border border-white/10">
                      {topic.difficulty || 'Medium'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {topic.importance === 'High' ? '🔥 High' : topic.importance || 'Medium'}
                    </span>
                  </div>

                  {/* Track Notes / Bullet Preview */}
                  {topic.notes && (
                    <div className="pt-1">
                      <TrackNotesView notes={topic.notes} compact={true} />
                    </div>
                  )}

                  {/* View Details Action */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onViewDetails(topic)}
                      className="px-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold flex items-center space-x-1 glass-btn active:scale-95 transition-all"
                    >
                      <Eye className="w-3 h-3 text-blue-400" />
                      <span>View Topic Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 space-y-2 text-slate-400 text-xs">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-500">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-300">No revisions scheduled on this date</p>
            <p className="text-[11px] text-slate-500">
              {isPastDate
                ? 'No past completed revisions recorded on this day.'
                : 'Click another date or jump years using the top navigation buttons to inspect historical and future maintenance cycles.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
