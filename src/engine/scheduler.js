import { addDays, addMonths, differenceInCalendarDays, format, parseISO, isAfter, isBefore } from 'date-fns';
import { TOPIC_STATUS, MILESTONE_STATE, MAINTENANCE_TYPE } from '../types.js';

export const CORE_OFFSETS = [1, 3, 7, 14, 30];

export const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return format(date, 'yyyy-MM-dd');
};

export const parseDateSafe = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date() : dateStr;
  try {
    const d = parseISO(String(dateStr));
    if (isNaN(d.getTime())) {
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    }
    return d;
  } catch (e) {
    return new Date();
  }
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = parseDateSafe(dateStr);
    return format(d, 'dd MMM yyyy');
  } catch (e) {
    return dateStr;
  }
};

/**
 * Creates the initial 5-stage core spaced revision schedule (1, 3, 7, 14, 30 days)
 * @param {string} t0DateStr - YYYY-MM-DD
 * @returns {Array} schedule array
 */
export const createInitialSchedule = (t0DateStr) => {
  const t0 = parseDateSafe(t0DateStr);
  return CORE_OFFSETS.map((offset, index) => {
    const targetDate = addDays(t0, offset);
    return {
      stage_number: index + 1,
      is_booster: false,
      label: `Rev ${index + 1} (Day ${offset})`,
      scheduled_date: formatDate(targetDate),
      completed_date: null,
      state: MILESTONE_STATE.PENDING,
      difficulty: null,
    };
  });
};

/**
 * Checks if a topic's next maintenance date exceeds the category settings limit
 */
export const isWithinMaintenanceLimit = (topic, nextMaintDateStr, categorySettings) => {
  if (!categorySettings) return true;
  const config = categorySettings[topic.category];
  if (!config) return true;

  if (config.maintenance_type === MAINTENANCE_TYPE.INFINITE) {
    return true;
  }

  const nextMaintDate = parseDateSafe(nextMaintDateStr);
  const createdDate = parseDateSafe(topic.created_date);

  if (config.maintenance_type === MAINTENANCE_TYPE.TARGET_DATE) {
    if (!config.target_end_date) return true;
    const targetDate = parseDateSafe(config.target_end_date);
    return !isAfter(nextMaintDate, targetDate);
  }

  if (config.maintenance_type === MAINTENANCE_TYPE.MONTHS) {
    const limitDate = addMonths(createdDate, config.maintenance_months || 6);
    return !isAfter(nextMaintDate, limitDate);
  }

  if (config.maintenance_type === MAINTENANCE_TYPE.DAYS) {
    const limitDate = addDays(createdDate, config.maintenance_days || 180);
    return !isAfter(nextMaintDate, limitDate);
  }

  return true;
};

/**
 * Finds the currently active pending milestone
 */
export const getCurrentPendingMilestone = (topic) => {
  if (!topic.schedule || topic.schedule.length === 0) return null;
  return topic.schedule.find((m) => m.state === MILESTONE_STATE.PENDING) || null;
};

/**
 * Get next due date for topic
 */
export const getNextDueDate = (topic) => {
  const current = getCurrentPendingMilestone(topic);
  return current ? current.scheduled_date : null;
};

/**
 * Handles "Not Revised" action (or missed day)
 * Shifts current pending milestone AND ALL remaining future pending milestones by `daysLate` (+1 day default)
 */
export const markNotRevised = (topic, daysLate = 1) => {
  if (!topic?.schedule || topic.schedule.length === 0) return topic;
  const updatedSchedule = topic.schedule.map((milestone) => {
    if (milestone.state === MILESTONE_STATE.PENDING) {
      const currentDate = parseDateSafe(milestone.scheduled_date);
      const newDate = addDays(currentDate, daysLate);
      return {
        ...milestone,
        scheduled_date: formatDate(newDate),
      };
    }
    return milestone;
  });

  const nextDue = updatedSchedule.find((m) => m.state === MILESTONE_STATE.PENDING)?.scheduled_date || null;

  return {
    ...topic,
    total_delay_days: (topic.total_delay_days || 0) + daysLate,
    consecutive_misses: (topic.consecutive_misses || 0) + 1,
    last_missed_date: formatDate(new Date()),
    next_due_date: nextDue,
    schedule: updatedSchedule,
    last_action_date: formatDate(new Date()),
  };
};

/**
 * Handles "Revised (Yes)" action
 * Marks current milestone completed, handles late cascade shift if any,
 * adds booster if requested, and transitions into 30-Day Maintenance loop after Stage 5.
 */
export const markRevised = (
  topic,
  todayStr,
  categorySettings,
  difficulty = 'MEDIUM',
  addBooster = false
) => {
  const today = parseDateSafe(todayStr);
  let workingTopic = { ...topic };
  const currentPending = getCurrentPendingMilestone(workingTopic);

  if (!currentPending) return topic;

  // Check if user is completing after the scheduled date (overdue)
  const scheduledDate = parseDateSafe(currentPending.scheduled_date);
  const overdueDays = Math.max(0, differenceInCalendarDays(today, scheduledDate));

  // If completed late, shift all remaining pending milestones first to maintain true interval gaps!
  if (overdueDays > 0) {
    workingTopic = markNotRevised(workingTopic, overdueDays);
  }

  // Find index of current milestone in updated schedule
  const currentIndex = workingTopic.schedule.findIndex(
    (m) => m.state === MILESTONE_STATE.PENDING
  );

  if (currentIndex === -1) return workingTopic;

  const currentMilestone = workingTopic.schedule[currentIndex];

  // Mark current milestone as COMPLETED
  const updatedSchedule = [...workingTopic.schedule];
  updatedSchedule[currentIndex] = {
    ...currentMilestone,
    state: MILESTONE_STATE.COMPLETED,
    completed_date: todayStr,
    difficulty: difficulty,
  };

  // If booster is requested for a HARD topic, insert a booster milestone at today + 3 days
  if (addBooster) {
    const boosterDate = formatDate(addDays(today, 3));
    const boosterMilestone = {
      stage_number: currentMilestone.stage_number,
      is_booster: true,
      label: `Booster for Rev ${currentMilestone.stage_number} (+3d)`,
      scheduled_date: boosterDate,
      completed_date: null,
      state: MILESTONE_STATE.PENDING,
      difficulty: null,
    };
    // Insert immediately after current milestone
    updatedSchedule.splice(currentIndex + 1, 0, boosterMilestone);

    // Prevent collision: shift subsequent milestones so they remain strictly after the booster
    const boosterDateObj = parseDateSafe(boosterDate);
    for (let i = currentIndex + 2; i < updatedSchedule.length; i++) {
      if (updatedSchedule[i].state === MILESTONE_STATE.PENDING) {
        const schedObj = parseDateSafe(updatedSchedule[i].scheduled_date);
        if (!isAfter(schedObj, boosterDateObj)) {
          const shiftDays = differenceInCalendarDays(boosterDateObj, schedObj) + 2;
          const newSchedDate = addDays(schedObj, shiftDays);
          updatedSchedule[i] = {
            ...updatedSchedule[i],
            scheduled_date: formatDate(newSchedDate),
          };
        }
      }
    }
  }

  // Ensure subsequent milestones are not scheduled today or in the past
  for (let i = currentIndex + 1; i < updatedSchedule.length; i++) {
    if (updatedSchedule[i].state === MILESTONE_STATE.PENDING) {
      const schedObj = parseDateSafe(updatedSchedule[i].scheduled_date);
      if (!isAfter(schedObj, today)) {
        const nextMin = addDays(today, 1);
        updatedSchedule[i] = {
          ...updatedSchedule[i],
          scheduled_date: formatDate(nextMin),
        };
      }
    }
  }

  // Check if we need to enter or continue the 30-Day Maintenance Loop
  const hasRemainingMilestones = updatedSchedule.some(
    (m, idx) => idx > currentIndex && m.state === MILESTONE_STATE.PENDING
  );

  let newStatus = workingTopic.status;
  let newCurrentStage = workingTopic.current_stage;

  if (!hasRemainingMilestones) {
    if (workingTopic.maintenance_ended) {
      newStatus = TOPIC_STATUS.ARCHIVED;
    } else {
      const intervalDays = parseInt(workingTopic.maintenance_interval_days, 10) || 30;
      const nextMaintDateStr = formatDate(addDays(today, intervalDays));
      const isAllowed = isWithinMaintenanceLimit(workingTopic, nextMaintDateStr, categorySettings);

      if (isAllowed) {
        newStatus = TOPIC_STATUS.MAINTENANCE;
        const nextStageNum = currentMilestone.stage_number + 1;
        const maintCycleNum = nextStageNum >= 6 ? nextStageNum - 5 : 1;
        
        updatedSchedule.push({
          stage_number: nextStageNum,
          is_booster: false,
          label: `Maint Cycle #${maintCycleNum} (+${intervalDays}d)`,
          scheduled_date: nextMaintDateStr,
          completed_date: null,
          state: MILESTONE_STATE.PENDING,
          difficulty: null,
        });
        newCurrentStage = nextStageNum;
      } else {
        newStatus = TOPIC_STATUS.ARCHIVED;
      }
    }
  } else {
    // There are still pending milestones
    const nextPending = updatedSchedule.find((m) => m.state === MILESTONE_STATE.PENDING);
    if (nextPending) {
      newCurrentStage = nextPending.stage_number;
    }
  }

  const nextDue = updatedSchedule.find((m) => m.state === MILESTONE_STATE.PENDING)?.scheduled_date || null;

  return {
    ...workingTopic,
    consecutive_misses: 0,
    status: newStatus,
    current_stage: newCurrentStage,
    next_due_date: nextDue,
    schedule: updatedSchedule,
    last_action_date: todayStr,
  };
};

/**
 * Runs Automatic Midnight Rollover
 * Checks all active topics. If scheduled_date < todayStr and not completed,
 * shifts cascade automatically so topics don't get lost in the past.
 */
export const runMidnightRollover = (topics, todayStr) => {
  const today = parseDateSafe(todayStr);
  let rolledOverCount = 0;

  const updatedTopics = topics.map((topic) => {
    if (topic.status === TOPIC_STATUS.ARCHIVED) return topic;

    const currentPending = getCurrentPendingMilestone(topic);
    if (!currentPending) return topic;

    const scheduledDate = parseDateSafe(currentPending.scheduled_date);
    const overdueDays = differenceInCalendarDays(today, scheduledDate);

    if (overdueDays > 0) {
      rolledOverCount += 1;
      return markNotRevised(topic, overdueDays);
    }

    return topic;
  });

  return {
    topics: updatedTopics,
    rolledOverCount,
  };
};

/**
 * Groups scheduled topics by date for calendar & load preview.
 * Maps ALL pending milestones so future calendar dates reflect true upcoming revision workload.
 */
export const getScheduleLoadByDate = (topics) => {
  const dateMap = {};

  topics.forEach((topic) => {
    if (topic.status === TOPIC_STATUS.ARCHIVED) return;
    topic.schedule?.forEach((milestone) => {
      if (milestone.state === MILESTONE_STATE.PENDING && milestone.scheduled_date) {
        const d = milestone.scheduled_date;
        if (!dateMap[d]) dateMap[d] = [];
        dateMap[d].push({ topic, milestone });
      }
    });
  });

  return dateMap;
};

/**
 * Evaluates Streak Health & Reset Conditions according to strict user rules:
 * 
 * 1. Active Spaced-Repetition Topics:
 *    - 1 missed topic: Grace shield (Streak does NOT reset!).
 *    - Reset Condition A1: >= 2 topics missed on the same day.
 *    - Reset Condition A2: Same active topic missed >= 2 consecutive times (or delayed >= 2 days).
 * 
 * 2. Maintenance Mode Topics:
 *    - Reset Condition M1: >= 4 maintenance mode topics missed/overdue.
 *    - Reset Condition M2: Same maintenance topic delayed by > 7 days.
 * 
 * @param {Object} params
 * @param {Array} params.topics
 * @param {Object} params.streak
 * @param {string} params.todayStr - YYYY-MM-DD
 * @returns {Object}
 */
export const evaluateStreakStatus = ({ topics = [], streak = { count: 0, lastRevisedDate: null }, todayStr }) => {
  const today = parseDateSafe(todayStr);

  const activeTopics = [];
  const maintenanceTopics = [];

  topics.forEach((t) => {
    if (t.status === TOPIC_STATUS.ARCHIVED) return;
    if (t.maintenance_ended) return; // Mastered/Ended maintenance topics do not count

    const pending = getCurrentPendingMilestone(t);
    if (!pending) return;

    const isMaint = t.status === TOPIC_STATUS.MAINTENANCE || 
                    pending.stage_number > 5 || 
                    (pending.label && pending.label.toLowerCase().includes('maintenance'));

    if (isMaint) {
      maintenanceTopics.push({ topic: t, pending });
    } else {
      activeTopics.push({ topic: t, pending });
    }
  });

  const activeMissedToday = [];
  const activeRepeatedMissed = [];

  activeTopics.forEach(({ topic, pending }) => {
    const schedDate = parseDateSafe(pending.scheduled_date);
    const overdueDays = differenceInCalendarDays(today, schedDate);
    const wasMissedToday = topic.last_missed_date === todayStr;

    if (overdueDays > 0 || wasMissedToday) {
      activeMissedToday.push(topic);
    }

    const consecMisses = topic.consecutive_misses || 0;
    if (consecMisses >= 2 || overdueDays >= 2) {
      activeRepeatedMissed.push({ topic, consecMisses, overdueDays });
    }
  });

  const maintenanceMissed = [];
  const maintenanceOver7Days = [];

  maintenanceTopics.forEach(({ topic, pending }) => {
    const schedDate = parseDateSafe(pending.scheduled_date);
    const overdueDays = differenceInCalendarDays(today, schedDate);
    const wasMissedToday = topic.last_missed_date === todayStr;

    if (overdueDays > 0 || wasMissedToday) {
      maintenanceMissed.push({ topic, overdueDays });
    }

    if (overdueDays > 7) {
      maintenanceOver7Days.push({ topic, overdueDays });
    }
  });

  const activeViolated = activeMissedToday.length >= 2 || activeRepeatedMissed.length > 0;
  const maintenanceViolated = maintenanceMissed.length >= 4 || maintenanceOver7Days.length > 0;
  const shouldReset = activeViolated || maintenanceViolated;

  let resetReason = null;
  if (activeMissedToday.length >= 2) {
    resetReason = `>= 2 active revision topics missed on the same day (${activeMissedToday.length} missed)`;
  } else if (activeRepeatedMissed.length > 0) {
    const tTitle = activeRepeatedMissed[0].topic.title;
    resetReason = `Same active topic "${tTitle}" was missed 2 or more times`;
  } else if (maintenanceMissed.length >= 4) {
    resetReason = `>= 4 maintenance mode topics are overdue (${maintenanceMissed.length} overdue)`;
  } else if (maintenanceOver7Days.length > 0) {
    const mTitle = maintenanceOver7Days[0].topic.title;
    const days = maintenanceOver7Days[0].overdueDays;
    resetReason = `Maintenance topic "${mTitle}" is ${days} days late (> 7 days limit)`;
  }

  const streakProtectedByGrace = !shouldReset && activeMissedToday.length === 1 && activeRepeatedMissed.length === 0;

  let healthStatus = 'safe';
  if (shouldReset) {
    healthStatus = 'reset';
  } else if (streakProtectedByGrace) {
    healthStatus = 'grace';
  } else if (activeMissedToday.length > 0 || maintenanceMissed.length > 0) {
    healthStatus = 'warning';
  }

  return {
    shouldReset,
    resetReason,
    activeMissedToday,
    activeRepeatedMissed,
    maintenanceMissed,
    maintenanceOver7Days,
    streakProtectedByGrace,
    healthStatus,
  };
};

/**
 * Restarts spaced repetition for a topic back to Stage 1 (Core 1, 3, 7, 14, 30 days).
 * Used when a topic in maintenance mode (or any stage) was completely forgotten.
 * 
 * @param {Object} topic
 * @param {string} startDateStr - YYYY-MM-DD
 * @returns {Object} updatedTopic
 */
export const restartSpacedRepetition = (topic, startDateStr) => {
  const newSchedule = createInitialSchedule(startDateStr);
  return {
    ...topic,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    current_stage: 1,
    next_due_date: newSchedule[0]?.scheduled_date || null,
    total_delay_days: 0,
    consecutive_misses: 0,
    last_difficulty: null,
    maintenance_ended: false,
    schedule: newSchedule,
    last_action_date: startDateStr,
  };
};
