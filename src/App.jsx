import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import TodayQueue from './components/TodayQueue';
import AllTopicsView from './components/AllTopicsView';
import CalendarTimelineView from './components/CalendarTimelineView';
import AddTopicModal from './components/AddTopicModal';
import RevisedModal from './components/RevisedModal';
import SettingsModal from './components/SettingsModal';
import TopicDetailsModal from './components/TopicDetailsModal';
import EditTopicModal from './components/EditTopicModal';
import AuthModal from './components/AuthModal';
import AboutModal from './components/AboutModal';
import SyllabusModal from './components/SyllabusModal';
import FloatingAddButton from './components/FloatingAddButton';
import ConfirmationModal from './components/ConfirmationModal';
import LoginPage from './components/LoginPage';
import { Brain } from 'lucide-react';
import { getCurrentSession, signOutUser } from './storage/auth';

import { 
  loadTopics, 
  saveTopics, 
  loadSettings, 
  saveSettings, 
  loadStreak, 
  saveStreak, 
  loadCustomCategories, 
  saveCustomCategories, 
  generateSampleTopics,
  DEFAULT_CATEGORY_SETTINGS 
} from './storage/db';

import { 
  formatDate, 
  markNotRevised, 
  markRevised, 
  runMidnightRollover, 
  createInitialSchedule, 
  getCurrentPendingMilestone, 
  getScheduleLoadByDate, 
  parseDateSafe, 
  evaluateStreakStatus, 
  restartSpacedRepetition 
} from './engine/scheduler';
import { differenceInCalendarDays, subDays } from 'date-fns';

import { TOPIC_STATUS, MILESTONE_STATE, normalizeSyllabusTracks, DEFAULT_CUSTOM_CATEGORIES } from './types';
import { 
  checkNeonHealth, 
  fetchTopicsFromNeon, 
  fetchSettingsFromNeon, 
  fetchStreakFromNeon, 
  fetchCategoriesFromNeon, 
  fetchSyllabusFromNeon, 
  saveTopicToNeon, 
  updateTopicInNeon, 
  deleteTopicFromNeon, 
  clearAllTopicsFromNeon, 
  saveSettingsToNeon, 
  saveStreakToNeon, 
  saveCategoriesToNeon,
  setActiveUserId
} from './storage/api';

export default function App() {
  const [todayStr, setTodayStr] = useState(() => formatDate(new Date()));
  const [neonStatus, setNeonStatus] = useState({ connected: false });

  // User & Authentication Flow State (Strict Authentication - No Guest Mode)
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Active midnight monitor: updates todayStr when calendar date changes
  useEffect(() => {
    const checkMidnight = () => {
      const current = formatDate(new Date());
      if (current !== todayStr) {
        setTodayStr(current);
      }
    };
    const timer = setInterval(checkMidnight, 30000); // Check every 30s
    window.addEventListener('focus', checkMidnight);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', checkMidnight);
    };
  }, [todayStr]);

  const [topics, setTopics] = useState(() => loadTopics());
  const [settings, setSettings] = useState(() => loadSettings());
  const [customCategories, setCustomCategories] = useState(() => loadCustomCategories());
  const [streak, setStreak] = useState(() => loadStreak());
  const [syllabusList, setSyllabusList] = useState(() => {
    try {
      const s = localStorage.getItem('spare_custom_syllabus_v2');
      return s ? normalizeSyllabusTracks(JSON.parse(s)) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState('today');

  const syllabusSubjects = useMemo(() => {
    return (syllabusList || []).map(s => s.subject).filter(Boolean);
  }, [syllabusList]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [prefilledAddTopic, setPrefilledAddTopic] = useState(null);
  const [revisedModalTopic, setRevisedModalTopic] = useState(null);
  const [detailsModalTopic, setDetailsModalTopic] = useState(null);
  const [editModalTopic, setEditModalTopic] = useState(null);
  const [appConfirmConfig, setAppConfirmConfig] = useState(null);
  const [rolloverNotification, setRolloverNotification] = useState(null);

  // Helper to completely purge in-memory and local cache when switching or signing out of accounts
  const clearLocalUserData = () => {
    setTopics([]);
    setSyllabusList([]);
    setStreak({ count: 0, lastRevisedDate: null });
    setCustomCategories({ ...DEFAULT_CUSTOM_CATEGORIES });
    setSettings({ ...DEFAULT_CATEGORY_SETTINGS });
    setPrefilledAddTopic(null);
    setDetailsModalTopic(null);
    setEditModalTopic(null);
    try {
      localStorage.removeItem('spare_topics_v1');
      localStorage.removeItem('spare_streak_v1');
      localStorage.removeItem('spare_custom_syllabus_v2');
      localStorage.removeItem('spare_custom_categories_v1');
      localStorage.removeItem('spare_category_settings_v1');
      localStorage.removeItem('spare_subject_resources_v2');
      localStorage.removeItem('spare_auth_user');
    } catch {}
  };

  // Function to load all user data from Neon Cloud DB strictly isolated per user ID
  const loadDataFromNeon = (userId = 'default_user') => {
    setActiveUserId(userId);
    checkNeonHealth().then((health) => {
      setNeonStatus(health);
      if (health?.connected || health?.neonDatabase === 'connected') {
        fetchTopicsFromNeon(userId).then((neonTopics) => {
          if (Array.isArray(neonTopics)) {
            const cleanTopics = neonTopics.filter((t) => !t.topic_id?.startsWith('sample-'));
            setTopics(cleanTopics);
            saveTopics(cleanTopics);
          } else {
            setTopics([]);
            saveTopics([]);
          }
        }).catch(err => {
          console.warn('Could not fetch topics from Neon:', err);
          setTopics([]);
          saveTopics([]);
        });

        fetchSettingsFromNeon(userId).then((neonSettings) => {
          if (neonSettings && Object.keys(neonSettings).length > 0) {
            setSettings(neonSettings);
            saveSettings(neonSettings);
          } else {
            setSettings({ ...DEFAULT_CATEGORY_SETTINGS });
            saveSettings({ ...DEFAULT_CATEGORY_SETTINGS });
          }
        }).catch(() => {
          setSettings({ ...DEFAULT_CATEGORY_SETTINGS });
        });

        fetchStreakFromNeon(userId).then((neonStreak) => {
          if (neonStreak && typeof neonStreak.count === 'number') {
            setStreak(neonStreak);
            saveStreak(neonStreak);
          } else {
            const cleanStreak = { count: 0, lastRevisedDate: null };
            setStreak(cleanStreak);
            saveStreak(cleanStreak);
          }
        }).catch(() => {
          setStreak({ count: 0, lastRevisedDate: null });
        });

        fetchCategoriesFromNeon(userId).then((neonCats) => {
          if (neonCats && typeof neonCats === 'object' && Object.keys(neonCats).length > 0) {
            setCustomCategories(neonCats);
            saveCustomCategories(neonCats);
          } else {
            setCustomCategories({ ...DEFAULT_CUSTOM_CATEGORIES });
            saveCustomCategories({ ...DEFAULT_CUSTOM_CATEGORIES });
          }
        }).catch(() => {
          setCustomCategories({ ...DEFAULT_CUSTOM_CATEGORIES });
        });

        fetchSyllabusFromNeon(userId).then((neonSyllabus) => {
          if (Array.isArray(neonSyllabus) && neonSyllabus.length > 0) {
            const clean = normalizeSyllabusTracks(
              neonSyllabus.filter(s => s.subject !== 'Operating Systems' || !s.modules?.some(m => m.id === 'os-1'))
            );
            setSyllabusList(clean);
            try {
              localStorage.setItem('spare_custom_syllabus_v2', JSON.stringify(clean));
            } catch {}
          } else {
            setSyllabusList([]);
            try {
              localStorage.removeItem('spare_custom_syllabus_v2');
            } catch {}
          }
        }).catch(() => {
          setSyllabusList([]);
        });
      }
    });
  };

  // Check Neon Auth session on mount
  useEffect(() => {
    getCurrentSession().then(user => {
      if (user) {
        setCurrentUser(user);
        const uid = user.id || user.email;
        loadDataFromNeon(uid);
      } else {
        clearLocalUserData();
      }
      setIsAuthChecking(false);
    }).catch(() => {
      clearLocalUserData();
      setIsAuthChecking(false);
    });
  }, []);

  const handleAuthSuccess = (user) => {
    clearLocalUserData();
    setCurrentUser(user);
    const uid = user?.id || user?.email || 'default_user';
    loadDataFromNeon(uid);
  };

  const handleSignOut = () => {
    setAppConfirmConfig({
      title: 'Sign Out of SpaRE?',
      message: 'Kya aap sach me apne account se logout karna chahte hain?',
      subMessage: 'Aapki saari revisions, schedules aur streak cloud me 100% safe rahenge. Aap kisi bhi device se dobara login kar sakte hain.',
      confirmText: 'Yes, Sign Out',
      cancelText: 'Stay Logged In',
      type: 'warning',
      onConfirm: async () => {
        setAppConfirmConfig(null);
        await signOutUser();
        clearLocalUserData();
        setCurrentUser(null);
        setActiveUserId('default_user');
      }
    });
  };

  // Auto-purge sample/demo topics and mock streak from local storage & state
  useEffect(() => {
    setTopics((prev) => {
      const filtered = prev.filter((t) => !t.topic_id?.startsWith('sample-') && !t.topic_id?.startsWith('topic-sim-'));
      if (filtered.length !== prev.length) {
        saveTopics(filtered);
      }
      return filtered;
    });

    setStreak((prev) => {
      if (!prev || (prev.count === 3 && (!prev.lastRevisedDate || prev.lastRevisedDate === formatDate(subDays(new Date(), 1))))) {
        const resetStreak = { count: 0, lastRevisedDate: null };
        saveStreak(resetStreak);
        return resetStreak;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const { topics: updated, rolledOverCount } = runMidnightRollover(topics, todayStr);
    if (rolledOverCount > 0) {
      setTopics(updated);
      saveTopics(updated);
      setRolloverNotification({ count: rolledOverCount });
      updated.forEach(t => {
        const oldTopic = topics.find(ot => ot.topic_id === t.topic_id);
        if (oldTopic && oldTopic.total_delay_days !== t.total_delay_days) {
          updateTopicInNeon(t).catch(err => console.warn('Could not sync rolled-over topic to Neon:', err));
        }
      });
    }
  }, [todayStr]);

  const handleUpdateTopics = (newTopics) => {
    setTopics(newTopics);
    saveTopics(newTopics);
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    saveSettingsToNeon(newSettings).catch(() => {});
  };

  const todayDueTopics = useMemo(() => {
    return topics.filter((t) => {
      if (t.status === TOPIC_STATUS.ARCHIVED) return false;
      const pending = getCurrentPendingMilestone(t);
      return pending && pending.scheduled_date <= todayStr;
    });
  }, [topics, todayStr]);

  const todayCompletedCount = useMemo(() => {
    let count = 0;
    topics.forEach((t) => {
      t.schedule?.forEach((m) => {
        if (m.state === MILESTONE_STATE.COMPLETED && m.completed_date === todayStr) {
          count++;
        }
      });
    });
    return count;
  }, [topics, todayStr]);

  const totalActiveTopics = useMemo(() => {
    return topics.filter((t) => t.status !== TOPIC_STATUS.ARCHIVED).length;
  }, [topics]);

  const maintenanceCount = useMemo(() => {
    return topics.filter((t) => t.status === TOPIC_STATUS.MAINTENANCE).length;
  }, [topics]);

  const heavyLoadDays = useMemo(() => {
    const loadMap = getScheduleLoadByDate(topics);
    const heavyDays = [];
    Object.entries(loadMap).forEach(([dateKey, items]) => {
      if (items.length >= 8) {
        heavyDays.push({ date: dateKey, count: items.length });
      }
    });
    return heavyDays;
  }, [topics]);

  const existingSubjects = useMemo(() => {
    const subs = new Set();
    topics.forEach((t) => { if (t.subject) subs.add(t.subject); });
    return Array.from(subs);
  }, [topics]);

  // Evaluate Custom Streak Status according to user rules
  const streakStatus = useMemo(() => {
    return evaluateStreakStatus({ topics, streak, todayStr });
  }, [topics, streak, todayStr]);

  // Auto-reset streak in state and Neon DB if rules are violated
  useEffect(() => {
    if (streakStatus.shouldReset && (streak?.count || 0) > 0) {
      const resetStreak = { 
        count: 0, 
        lastRevisedDate: streak.lastRevisedDate,
        lastResetReason: streakStatus.resetReason
      };
      setStreak(resetStreak);
      saveStreak(resetStreak);
      saveStreakToNeon(resetStreak).catch(() => {});
    }
  }, [streakStatus]);

  const handleRevisedClick = (topic) => setRevisedModalTopic(topic);

  const handleConfirmRevised = ({ topic, difficulty, addBooster }) => {
    const revisedTopic = markRevised(topic, todayStr, settings, difficulty, addBooster);
    const updated = {
      ...revisedTopic,
      last_difficulty: difficulty,
    };
    const nextTopics = topics.map((t) => (t.topic_id === topic.topic_id ? updated : t));
    handleUpdateTopics(nextTopics);
    updateTopicInNeon(updated).catch(() => {});

    // Calculate streak accurately with grace rule support
    if (streak.lastRevisedDate !== todayStr) {
      let nextCount = 1;
      if (streak.lastRevisedDate && (streak.count || 0) > 0) {
        const daysDiff = differenceInCalendarDays(
          parseDateSafe(todayStr),
          parseDateSafe(streak.lastRevisedDate)
        );
        if (daysDiff === 1 || streakStatus.streakProtectedByGrace) {
          nextCount = (streak.count || 0) + 1; // Consecutive day or protected by grace -> increment
        } else if (daysDiff === 0) {
          nextCount = streak.count || 1; // Already revised today
        } else {
          nextCount = 1; // Streak broken (>1 day gap without grace) -> reset to 1
        }
      }
      const nextStreak = { count: nextCount, lastRevisedDate: todayStr, lastResetReason: null };
      setStreak(nextStreak);
      saveStreak(nextStreak);
      saveStreakToNeon(nextStreak).catch(() => {});
    }
  };

  const handleNotRevised = (topic) => {
    const updated = markNotRevised(topic, 1);
    const nextTopics = topics.map((t) => (t.topic_id === topic.topic_id ? updated : t));
    handleUpdateTopics(nextTopics);
    updateTopicInNeon(updated).catch(() => {});

    // Immediate check of streak rules on manual miss
    const evalRes = evaluateStreakStatus({ topics: nextTopics, streak, todayStr });
    if (evalRes.shouldReset && (streak?.count || 0) > 0) {
      const resetStreak = { 
        count: 0, 
        lastRevisedDate: streak.lastRevisedDate,
        lastResetReason: evalRes.resetReason 
      };
      setStreak(resetStreak);
      saveStreak(resetStreak);
      saveStreakToNeon(resetStreak).catch(() => {});
    }
  };

  const handleUpdateCustomCategories = (newCats) => {
    setCustomCategories(newCats);
    saveCustomCategories(newCats);
    saveCategoriesToNeon(newCats).catch(() => {});
  };

  const handleAddTopic = ({ title, category, categories, subject, difficulty, importance, maintenance_interval_days, notes, startDate }) => {
    const schedule = createInitialSchedule(startDate);
    const cats = Array.isArray(categories) && categories.length > 0 ? categories : [category || 'GATE'];
    const newTopic = {
      topic_id: `topic-${Date.now()}`,
      title, 
      category: cats[0],
      categories: cats,
      subject, 
      difficulty: difficulty || 'Medium',
      importance: importance || 'High',
      last_difficulty: null,
      maintenance_interval_days: parseInt(maintenance_interval_days, 10) || 30,
      maintenance_ended: false,
      notes,
      created_date: startDate,
      current_stage: 1,
      status: TOPIC_STATUS.QUOTA_ACTIVE,
      next_due_date: schedule[0].scheduled_date,
      total_delay_days: 0,
      schedule,
    };
    handleUpdateTopics([newTopic, ...topics]);
    saveTopicToNeon(newTopic).catch(() => {});
  };

  const handleDeleteTopic = (topicId) => {
    const targetTopic = topics.find((t) => t.topic_id === topicId);
    const hasCollege = targetTopic && (
      (Array.isArray(targetTopic.categories) && targetTopic.categories.includes(CATEGORIES.COLLEGE)) ||
      targetTopic.category === CATEGORIES.COLLEGE
    );

    setAppConfirmConfig({
      title: 'Delete Topic from Schedule?',
      message: `Kya aap "${targetTopic?.title || 'this topic'}" ko revision schedule se delete karna chahte hain?`,
      subMessage: hasCollege 
        ? 'Is topic mein College track bhi included hai. Iska spaced cycle aur revision milestones permanently delete ho jayenge.' 
        : 'Is topic ka spaced repetition cycle aur revision history permanently remove ho jayegi.',
      confirmText: 'Delete Topic',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        handleUpdateTopics(topics.filter((t) => t.topic_id !== topicId));
        deleteTopicFromNeon(topicId).catch(() => {});
        setAppConfirmConfig(null);
      }
    });
  };

  const handleSaveTopicEdit = (updatedTopic) => {
    const nextTopics = topics.map((t) => t.topic_id === updatedTopic.topic_id ? updatedTopic : t);
    handleUpdateTopics(nextTopics);
    updateTopicInNeon(updatedTopic).catch(() => {});
  };

  const handleRestartSpacedRepetition = (topic) => {
    setAppConfirmConfig({
      title: 'Restart Spaced Repetition Cycle?',
      message: `Kya aap "${topic.title}" ka revision cycle shuru se restart karna chahte hain?`,
      subMessage: 'Topic maintenance mode se hatkar wapas Stage 1 (Day 1, 3, 7, 14, 30) spaced repetition schedule mein chala jayega.',
      confirmText: 'Restart from Day 1',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: () => {
        const updated = restartSpacedRepetition(topic, todayStr);
        const nextTopics = topics.map((t) => t.topic_id === topic.topic_id ? updated : t);
        handleUpdateTopics(nextTopics);
        updateTopicInNeon(updated).catch(() => {});
        setAppConfirmConfig(null);
        if (detailsModalTopic?.topic_id === topic.topic_id) {
          setDetailsModalTopic(null);
        }
        if (editModalTopic?.topic_id === topic.topic_id) {
          setEditModalTopic(null);
        }
      }
    });
  };

  const handleImportData = (backup) => {
    if (backup.topics) handleUpdateTopics(backup.topics);
    if (backup.settings) handleUpdateSettings(backup.settings);
  };

  // Splash Screen while validating auth state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#060709] starry-bg text-zinc-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-white via-zinc-400 to-zinc-600 p-[1.5px] shadow-2xl shadow-white/20 animate-pulse">
          <div className="w-full h-full bg-[#0B0C10] rounded-[14px] flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">SpaRE</h2>
          <p className="text-xs font-mono text-zinc-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Dedicated Login Page if user is not authenticated
  if (!currentUser) {
    return (
      <LoginPage 
        onAuthSuccess={handleAuthSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060709] starry-bg text-zinc-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background ambient vignette & starlight halo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/[0.02] blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-zinc-400/[0.02] blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-white/[0.015] blur-[150px]" />
      </div>

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenSyllabusModal={() => setIsSyllabusModalOpen(true)}
        streak={streak}
        streakStatus={streakStatus}
        todayStr={todayStr}
        todayPendingCount={todayDueTopics.length}
        neonStatus={neonStatus}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 relative z-10">
        <StatsBar
          todayTotal={todayDueTopics.length + todayCompletedCount}
          todayCompleted={todayCompletedCount}
          totalActiveTopics={totalActiveTopics}
          maintenanceCount={maintenanceCount}
          rolloverNotification={rolloverNotification}
          onDismissRollover={() => setRolloverNotification(null)}
          heavyLoadDays={heavyLoadDays}
        />

        {activeTab === 'today' && (
          <TodayQueue
            topics={topics}
            todayStr={todayStr}
            onRevised={handleRevisedClick}
            onNotRevised={handleNotRevised}
            onDelete={handleDeleteTopic}
            onViewDetails={(topic) => setDetailsModalTopic(topic)}
            onEditTopic={(topic) => setEditModalTopic(topic)}
            onRestartSpacedRepetition={handleRestartSpacedRepetition}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenCalendar={() => setActiveTab('calendar')}
            customCategories={customCategories}
          />
        )}

        {activeTab === 'topics' && (
          <AllTopicsView
            topics={topics}
            todayStr={todayStr}
            onRevised={handleRevisedClick}
            onNotRevised={handleNotRevised}
            onDelete={handleDeleteTopic}
            onViewDetails={(topic) => setDetailsModalTopic(topic)}
            onEditTopic={(topic) => setEditModalTopic(topic)}
            onRestartSpacedRepetition={handleRestartSpacedRepetition}
            customCategories={customCategories}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTimelineView
            topics={topics}
            todayStr={todayStr}
            onViewDetails={(topic) => setDetailsModalTopic(topic)}
            customCategories={customCategories}
            categorySettings={settings}
          />
        )}
      </main>

      {/* Floating Add Topic Action Button with Animations */}
      <FloatingAddButton onClick={() => setIsAddModalOpen(true)} />

      <AddTopicModal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setPrefilledAddTopic(null); }} 
        onAddTopic={handleAddTopic} 
        syllabusSubjects={syllabusSubjects}
        existingSubjects={existingSubjects} 
        syllabusList={syllabusList}
        initialData={prefilledAddTopic}
        customCategories={customCategories}
        onUpdateCustomCategories={handleUpdateCustomCategories}
        onOpenSettingsModal={() => { setIsAddModalOpen(false); setIsSettingsModalOpen(true); }}
        onOpenSyllabusModal={() => { setIsAddModalOpen(false); setIsSyllabusModalOpen(true); }}
      />
      <RevisedModal 
        isOpen={!!revisedModalTopic} 
        topic={revisedModalTopic} 
        onClose={() => setRevisedModalTopic(null)} 
        onConfirmRevised={handleConfirmRevised} 
        customCategories={customCategories}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        settings={settings} 
        onUpdateSettings={handleUpdateSettings} 
        customCategories={customCategories}
        onUpdateCustomCategories={handleUpdateCustomCategories}
        topics={topics} 
        streak={streak} 
        neonStatus={neonStatus} 
        onImportData={handleImportData} 
        currentUser={currentUser}
        onUpdateUser={(updated) => setCurrentUser(updated)}
      />
      <TopicDetailsModal 
        isOpen={!!detailsModalTopic} 
        topic={detailsModalTopic} 
        onClose={() => setDetailsModalTopic(null)} 
        customCategories={customCategories} 
        onRestartSpacedRepetition={handleRestartSpacedRepetition}
      />
      <EditTopicModal 
        isOpen={!!editModalTopic} 
        topic={editModalTopic} 
        onClose={() => setEditModalTopic(null)} 
        onSaveTopic={handleSaveTopicEdit} 
        customCategories={customCategories} 
        syllabusSubjects={syllabusSubjects}
        onRestartSpacedRepetition={handleRestartSpacedRepetition}
        onOpenSyllabusModal={() => { setEditModalTopic(null); setIsSyllabusModalOpen(true); }}
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        user={currentUser} 
        onAuthSuccess={(usr) => handleAuthSuccess(usr)} 
        onSignOut={handleSignOut} 
        onUpdateUser={(updated) => setCurrentUser(updated)}
      />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <SyllabusModal 
        isOpen={isSyllabusModalOpen} 
        onClose={() => setIsSyllabusModalOpen(false)} 
        topics={topics}
        syllabusList={syllabusList}
        customCategories={customCategories}
        onUpdateCustomCategories={handleUpdateCustomCategories}
        onUpdateTopic={handleSaveTopicEdit}
        onSyllabusChange={(newList) => setSyllabusList(newList)}
        onQuickAddTopic={(data) => {
          setPrefilledAddTopic(data);
          setIsAddModalOpen(true);
        }} 
      />

      {/* Global App Confirmation Modal */}
      {appConfirmConfig && (
        <ConfirmationModal
          isOpen={true}
          title={appConfirmConfig.title}
          message={appConfirmConfig.message}
          subMessage={appConfirmConfig.subMessage}
          confirmText={appConfirmConfig.confirmText}
          cancelText={appConfirmConfig.cancelText}
          type={appConfirmConfig.type}
          onConfirm={appConfirmConfig.onConfirm}
          onCancel={() => setAppConfirmConfig(null)}
        />
      )}
    </div>
  );
}
