import { addDays, subDays } from 'date-fns';
import { CATEGORIES, TOPIC_STATUS, MILESTONE_STATE, MAINTENANCE_TYPE, DEFAULT_CUSTOM_CATEGORIES } from '../types.js';
import { createInitialSchedule, formatDate } from '../engine/scheduler.js';

const STORAGE_KEYS = {
  TOPICS: 'spare_topics_v1',
  SETTINGS: 'spare_category_settings_v1',
  STREAK: 'spare_streak_v1',
  LAST_LOGIN: 'spare_last_login_date_v1',
  CUSTOM_CATEGORIES: 'spare_custom_categories_v1',
};

export const DEFAULT_CATEGORY_SETTINGS = {
  [CATEGORIES.COLLEGE]: {
    category_id: CATEGORIES.COLLEGE,
    maintenance_type: MAINTENANCE_TYPE.MONTHS,
    maintenance_months: 4,
    maintenance_days: 120,
    target_end_date: null,
    is_paused: false,
  },
  [CATEGORIES.GATE]: {
    category_id: CATEGORIES.GATE,
    maintenance_type: MAINTENANCE_TYPE.MONTHS,
    maintenance_months: 18,
    maintenance_days: 540,
    target_end_date: null,
    is_paused: false,
  },
  [CATEGORIES.SELF]: {
    category_id: CATEGORIES.SELF,
    maintenance_type: MAINTENANCE_TYPE.INFINITE,
    maintenance_months: 12,
    maintenance_days: 365,
    target_end_date: null,
    is_paused: false,
  },
  'Nvidia': {
    category_id: 'Nvidia',
    maintenance_type: MAINTENANCE_TYPE.INFINITE,
    maintenance_months: 6,
    maintenance_days: 180,
    target_end_date: null,
    is_paused: false,
  },
  'AMD': {
    category_id: 'AMD',
    maintenance_type: MAINTENANCE_TYPE.INFINITE,
    maintenance_months: 6,
    maintenance_days: 180,
    target_end_date: null,
    is_paused: false,
  },
};

export const generateSampleTopics = () => [];

export const loadTopics = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPICS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => !t.topic_id?.startsWith('sample-') && !t.topic_id?.startsWith('topic-sim-'));
  } catch (err) {
    console.error('Failed to load topics from storage', err);
    return [];
  }
};

export const saveTopics = (topics) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  } catch (err) {
    console.error('Failed to save topics to storage', err);
  }
};

export const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_CATEGORY_SETTINGS);
      return DEFAULT_CATEGORY_SETTINGS;
    }
    return { ...DEFAULT_CATEGORY_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings', err);
    return DEFAULT_CATEGORY_SETTINGS;
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
};

export const loadCustomCategories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (!raw) return { ...DEFAULT_CUSTOM_CATEGORIES };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CUSTOM_CATEGORIES, ...(parsed || {}) };
  } catch (e) {
    return { ...DEFAULT_CUSTOM_CATEGORIES };
  }
};

export const saveCustomCategories = (cats) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save custom categories', e);
  }
};

export const loadStreak = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (!raw) return { count: 0, lastRevisedDate: null };
    const parsed = JSON.parse(raw);
    return {
      count: typeof parsed?.count === 'number' ? parsed.count : 0,
      lastRevisedDate: parsed?.lastRevisedDate || null,
    };
  } catch (e) {
    return { count: 0, lastRevisedDate: null };
  }
};

export const saveStreak = (streakData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streakData));
  } catch (e) {
    console.error('Failed to save streak', e);
  }
};

export const exportDataAsJSON = (topics, settings) => {
  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    topics,
    settings,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SpaRE_backup_${formatDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateImportData = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.topics)) return false;
  if (data.topics.length === 0) return true; // valid empty backup

  for (const t of data.topics) {
    if (!t || typeof t !== 'object') return false;
    if (!t.topic_id || typeof t.topic_id !== 'string') return false;
    if (!t.title || typeof t.title !== 'string') return false;
    if (!t.category) return false;
    if (!Array.isArray(t.schedule) || t.schedule.length === 0) return false;
    for (const m of t.schedule) {
      if (!m || typeof m !== 'object' || !m.scheduled_date || !m.state) {
        return false;
      }
    }
  }
  return true;
};
