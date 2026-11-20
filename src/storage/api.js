/**
 * SpaRE Client API Service
 * Direct Neon Cloud Serverless Database Service.
 * Connects directly to Neon PostgreSQL over secure HTTPS without needing a local backend proxy.
 */

import {
  checkDirectNeonHealth,
  setActiveUserId,
  getActiveUserId,
  fetchDirectTopics,
  saveDirectTopic,
  deleteDirectTopic,
  fetchDirectSettings,
  saveDirectSettings,
  fetchDirectStreak,
  saveDirectStreak,
  fetchDirectCategories,
  saveDirectCategories,
  fetchDirectSyllabus,
  saveDirectSyllabus,
  fetchDirectResources,
  saveDirectResource,
  deleteDirectResource,
  updateDirectUserProfile,
} from './neonDirect';

export const checkNeonHealth = checkDirectNeonHealth;
export { setActiveUserId, getActiveUserId };
export const updateUserProfileInNeon = updateDirectUserProfile;
export const fetchTopicsFromNeon = fetchDirectTopics;
export const saveTopicToNeon = saveDirectTopic;
export const updateTopicInNeon = saveDirectTopic;
export const deleteTopicFromNeon = deleteDirectTopic;
export const fetchSettingsFromNeon = fetchDirectSettings;
export const saveSettingsToNeon = saveDirectSettings;
export const fetchStreakFromNeon = fetchDirectStreak;
export const saveStreakToNeon = saveDirectStreak;
export const fetchCategoriesFromNeon = fetchDirectCategories;
export const saveCategoriesToNeon = saveDirectCategories;
export const fetchSyllabusFromNeon = fetchDirectSyllabus;
export const saveSyllabusToNeon = saveDirectSyllabus;
export const fetchSubjectResources = fetchDirectResources;
export const saveSubjectResource = saveDirectResource;
export const deleteSubjectResource = deleteDirectResource;

export const clearAllTopicsFromNeon = async () => {
  const topics = await fetchDirectTopics();
  for (const t of topics) {
    await deleteDirectTopic(t.topic_id);
  }
  return { success: true };
};

export const syncAllToNeon = async (topics, settings, streak, categories, syllabus) => {
  for (const t of topics) {
    await saveTopicToNeon(t);
  }
  if (settings) await saveSettingsToNeon(settings);
  if (streak) await saveStreakToNeon(streak);
  if (categories) await saveCategoriesToNeon(categories);
  if (syllabus) await saveSyllabusToNeon(syllabus);
  return { success: true, count: topics.length };
};
