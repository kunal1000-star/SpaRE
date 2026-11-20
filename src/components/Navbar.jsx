import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Plus, 
  Settings as SettingsIcon, 
  Calendar, 
  ListFilter, 
  CheckCircle2,
  Brain,
  Database,
  User,
  Menu,
  X,
  Info,
  ChevronRight,
  ShieldCheck,
  Clock,
  GraduationCap
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenAuthModal,
  onOpenAboutModal,
  onOpenSyllabusModal,
  streak,
  streakStatus,
  todayStr,
  todayPendingCount,
  neonStatus,
  user,
  onOpenLogin
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const menuRef = useRef(null);
  const streakRef = useRef(null);

  const isNeonConnected = neonStatus?.connected || neonStatus?.neonDatabase === 'connected';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (streakRef.current && !streakRef.current.contains(e.target)) {
        setIsStreakOpen(false);
      }
    };
    if (isMenuOpen || isStreakOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isStreakOpen]);

  const handleMenuItemClick = (callback) => {
    setIsMenuOpen(false);
    if (callback) callback();
  };

  return (
    <header className="sticky top-0 z-30 glass-nav">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2.5 shrink-0 cursor-pointer group" 
            onClick={() => setActiveTab('today')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-white via-zinc-400 to-zinc-600 p-[1.5px] shadow-md shadow-white/10 group-hover:shadow-white/20 transition-all group-hover:scale-105 active:scale-95">
              <div className="w-full h-full bg-[#0B0C10] backdrop-blur-md rounded-[9px] flex items-center justify-center">
                <Brain className="w-4 h-4 text-white group-hover:text-zinc-300 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                SpaRE
              </span>
              <p className="text-[10px] text-zinc-400 font-medium leading-tight hidden sm:block">
                Spaced Revision Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            {[
              { key: 'today', icon: CheckCircle2, label: "Today's Queue", badge: todayPendingCount },
              { key: 'topics', icon: ListFilter, label: 'All Topics', badge: 0 },
              { key: 'calendar', icon: Calendar, label: 'Timeline', badge: 0 },
            ].map(({ key, icon: Icon, label, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all glass-btn ${
                  activeTab === key
                    ? 'bg-white text-black font-extrabold shadow-md shadow-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {badge > 0 && (
                  <span className={`text-[9px] px-1.5 rounded-full font-bold ${
                    activeTab === key ? 'bg-black text-white' : 'bg-white/10 text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Revision Streak with Interactive Rules Dropdown */}
            <div className="relative" ref={streakRef}>
              <button 
                type="button"
                onClick={() => setIsStreakOpen(!isStreakOpen)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  streakStatus?.healthStatus === 'reset'
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : streakStatus?.healthStatus === 'grace'
                    ? 'bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                    : streakStatus?.healthStatus === 'warning'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20'
                }`}
                title="Click to view Streak Health & Custom Reset Rules"
              >
                <Flame className={`w-3.5 h-3.5 ${streak?.count > 0 ? 'text-amber-400 fill-amber-400 animate-flame' : 'text-slate-500'}`} />
                <span className="text-[11px] font-bold font-mono">{streak?.count || 0}d</span>
                {streakStatus?.streakProtectedByGrace && (
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    🛡️ Grace
                  </span>
                )}
              </button>

              {isStreakOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-modal border border-white/10 shadow-2xl p-3.5 z-50 animate-modal-pop space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white">Revision Streak Health</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsStreakOpen(false)} 
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                    streakStatus?.healthStatus === 'reset'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : streakStatus?.healthStatus === 'grace'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>Health: {streakStatus?.healthStatus?.toUpperCase()}</span>
                      <span className="font-mono text-amber-300">{streak?.count || 0} Consecutive Days</span>
                    </div>
                    {streakStatus?.healthStatus === 'reset' && (
                      <p className="text-[10px] text-rose-300 leading-snug">
                        {streakStatus?.resetReason || streak?.lastResetReason || 'Streak reset due to rule condition.'}
                      </p>
                    )}
                    {streakStatus?.streakProtectedByGrace && (
                      <p className="text-[10px] text-sky-300 leading-snug">
                        🛡️ <strong>Grace Shield Active:</strong> 1 topic miss ho gaya, par streak protected hai! Revise tomorrow to keep it alive.
                      </p>
                    )}
                    {streakStatus?.healthStatus === 'safe' && (
                      <p className="text-[10px] text-emerald-300 leading-snug">
                        🔥 All topics on schedule. Daily consistency is intact!
                      </p>
                    )}
                  </div>

                  {/* Custom Streak Rulebook */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      📜 Custom Streak Rules
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="font-bold text-[10px] text-amber-300 flex items-center space-x-1">
                        <span>⚡ Active Topics (Core 1-30d):</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        &bull; <strong>1 topic miss:</strong> Koi dikkat nahi, streak break nahi hogi (Grace shield).<br />
                        &bull; <strong>Reset trigger:</strong> Same day pe <strong>&ge; 2 topics</strong> miss ya same topic <strong>&ge; 2 baar</strong> miss hua toh streak reset!
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="font-bold text-[10px] text-cyan-300 flex items-center space-x-1">
                        <span>🔁 Maintenance Mode Topics:</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        &bull; Reset tabhi hoga jab <strong>&ge; 4 maintenance topics</strong> overdue honge, YA koi topic <strong>&gt; 7 days</strong> late ho jaye!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Session / Sign In Button */}
            {user ? (
              <div className="flex items-center space-x-1 pl-1">
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all active:scale-95"
                  title={`Logged in as ${user.email}`}
                >
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-200 hidden sm:inline max-w-[90px] truncate">
                    {user.name ? user.name.split(' ')[0] : user.email?.split('@')[0]}
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin || onOpenAuthModal}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center space-x-1 transition-all active:scale-95 shadow-md shadow-blue-600/25 light-sweep"
                title="Sign in to your account"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Hamburger Menu Toggle Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl border text-slate-300 transition-all active:scale-95 glass-btn ${
                  isMenuOpen 
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 ring-2 ring-blue-500/20' 
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/20 hover:text-white hover:bg-white/[0.08]'
                }`}
                title="Menu (Settings, About, Sync)"
                aria-label="Toggle Navigation Menu"
              >
                {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              {/* Hamburger Dropdown Drawer */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-modal border border-white/10 shadow-2xl p-2.5 z-50 animate-modal-pop space-y-1">
                  {/* Account / User Section */}
                  <div 
                    onClick={() => handleMenuItemClick(onOpenAuthModal)}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-bold text-white truncate">
                          {user ? (user.name || user.email) : 'Sign In / Account'}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {user ? 'Cloud Sync Active' : 'Sync across devices'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>

                  <div className="h-px bg-white/[0.06] my-1" />

                  {/* Syllabus & Multi-Track Alignment */}
                  <button
                    type="button"
                    onClick={() => handleMenuItemClick(onOpenSyllabusModal)}
                    className="w-full p-2.5 rounded-xl hover:bg-amber-600/10 border border-transparent hover:border-amber-500/20 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200 group-hover:text-amber-300">
                          Syllabus & Track Matrix
                        </p>
                        <p className="text-[9px] text-slate-400">
                          College &bull; GATE &bull; Nvidia prep overlap
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Matrix
                    </span>
                  </button>

                  {/* About SpaRE & Spaced Formula */}
                  <button
                    type="button"
                    onClick={() => handleMenuItemClick(onOpenAboutModal)}
                    className="w-full p-2.5 rounded-xl hover:bg-blue-600/10 border border-transparent hover:border-blue-500/20 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200 group-hover:text-blue-300">
                          About & Spaced Formula
                        </p>
                        <p className="text-[9px] text-slate-400">
                          1 &bull; 3 &bull; 7 &bull; 14 &bull; 30d logic & science
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      Info
                    </span>
                  </button>

                  {/* Settings & Maintenance */}
                  <button
                    type="button"
                    onClick={() => handleMenuItemClick(onOpenSettingsModal)}
                    className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <SettingsIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200 group-hover:text-white">
                          Settings & Maintenance
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Lifespans, backups, data management
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </button>

                  <div className="h-px bg-white/[0.06] my-1" />

                  {/* Production Cloud Database Status Widget */}
                  <div 
                    onClick={() => handleMenuItemClick(onOpenSettingsModal)}
                    className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] hover:border-white/20 cursor-pointer transition-all space-y-1.5 group"
                    title="Click to view Cloud Database status & backups"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="relative flex items-center justify-center">
                          <Database className={`w-3.5 h-3.5 ${isNeonConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          {isNeonConnected && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white group-hover:text-zinc-200 transition-colors">
                          Cloud Database
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border flex items-center space-x-1 ${
                        isNeonConnected 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isNeonConnected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        <span>{isNeonConnected ? 'Cloud Active' : 'Offline Cache'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <span className="text-zinc-500">Region:</span>
                        <span className="text-zinc-300 font-semibold">AWS us-east-2</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="text-zinc-500">Sync:</span>
                        <span className={isNeonConnected ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                          {isNeonConnected ? '⚡ Live Cloud' : 'Local Cache'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-1.5 border-t border-white/5">
          {[
            { key: 'today', icon: CheckCircle2, label: `Today (${todayPendingCount})` },
            { key: 'topics', icon: ListFilter, label: 'All Topics' },
            { key: 'calendar', icon: Calendar, label: 'Timeline' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === key ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
