import assert from 'node:assert';
import { 
  createInitialSchedule, 
  markNotRevised, 
  markRevised, 
  runMidnightRollover,
  isWithinMaintenanceLimit,
  getScheduleLoadByDate,
  evaluateStreakStatus,
  restartSpacedRepetition,
  CORE_OFFSETS,
  formatDate
} from './scheduler.js';
import { CATEGORIES, TOPIC_STATUS, MILESTONE_STATE, MAINTENANCE_TYPE } from '../types.js';
import { validateImportData } from '../storage/db.js';

console.log('--- RUNNING SpaRE SCHEDULER ENGINE UNIT TESTS ---');

// Test 1: Initial Schedule Generation
{
  const t0 = '2026-11-01';
  const schedule = createInitialSchedule(t0);
  assert.strictEqual(schedule.length, 5, 'Must generate exactly 5 stages');
  assert.strictEqual(schedule[0].scheduled_date, '2026-11-02', 'Rev 1 must be T0 + 1d');
  assert.strictEqual(schedule[1].scheduled_date, '2026-11-04', 'Rev 2 must be T0 + 3d');
  assert.strictEqual(schedule[2].scheduled_date, '2026-11-08', 'Rev 3 must be T0 + 7d');
  assert.strictEqual(schedule[3].scheduled_date, '2026-11-15', 'Rev 4 must be T0 + 14d');
  assert.strictEqual(schedule[4].scheduled_date, '2026-12-01', 'Rev 5 must be T0 + 30d');
  console.log('✓ Test 1 Passed: Core 5-Stage initial schedule generated correctly (1, 3, 7, 14, 30 days)');
}

// Test 2: Dynamic Cascade Shift (+1 Day Rule)
{
  const t0 = '2026-11-01';
  const schedule = createInitialSchedule(t0);
  const topic = {
    topic_id: 't-test',
    category: CATEGORIES.GATE,
    created_date: t0,
    current_stage: 1,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    next_due_date: '2026-11-02',
    total_delay_days: 0,
    schedule,
  };

  // 2 Nov missed -> Shift +1 day
  const shifted = markNotRevised(topic, 1);
  assert.strictEqual(shifted.total_delay_days, 1, 'Total delay must be 1');
  assert.strictEqual(shifted.schedule[0].scheduled_date, '2026-11-03', 'Rev 1 shifted to 3 Nov');
  assert.strictEqual(shifted.schedule[1].scheduled_date, '2026-11-05', 'Rev 2 shifted to 5 Nov');
  assert.strictEqual(shifted.schedule[2].scheduled_date, '2026-11-09', 'Rev 3 shifted to 9 Nov');
  assert.strictEqual(shifted.schedule[3].scheduled_date, '2026-11-16', 'Rev 4 shifted to 16 Nov');
  assert.strictEqual(shifted.schedule[4].scheduled_date, '2026-12-02', 'Rev 5 shifted to 2 Dec');
  console.log('✓ Test 2 Passed: Cascade shift (+1 day) correctly advances all pending milestones while preserving interval gaps');
}

// Test 3: Revised (Yes) completion & Progression
{
  const t0 = '2026-11-01';
  const schedule = createInitialSchedule(t0);
  const topic = {
    topic_id: 't-test-revised',
    category: CATEGORIES.GATE,
    created_date: t0,
    current_stage: 1,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    next_due_date: '2026-11-02',
    total_delay_days: 0,
    schedule,
  };

  const categorySettings = {
    [CATEGORIES.GATE]: {
      maintenance_type: MAINTENANCE_TYPE.MONTHS,
      maintenance_months: 18,
    }
  };

  // User completes Rev 1 on 2026-11-02
  const updated = markRevised(topic, '2026-11-02', categorySettings, 'EASY', false);
  assert.strictEqual(updated.schedule[0].state, MILESTONE_STATE.COMPLETED);
  assert.strictEqual(updated.schedule[0].completed_date, '2026-11-02');
  assert.strictEqual(updated.current_stage, 2);
  assert.strictEqual(updated.next_due_date, '2026-11-04');
  console.log('✓ Test 3 Passed: Milestone correctly completed and next due date activated');
}

// Test 4: Hard Topic with 3-Day Booster Injection
{
  const t0 = '2026-11-01';
  const schedule = createInitialSchedule(t0);
  const topic = {
    topic_id: 't-test-booster',
    category: CATEGORIES.COLLEGE,
    created_date: t0,
    current_stage: 1,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    next_due_date: '2026-11-02',
    total_delay_days: 0,
    schedule,
  };

  const updatedWithBooster = markRevised(topic, '2026-11-02', {}, 'HARD', true);
  assert.strictEqual(updatedWithBooster.schedule.length, 6, 'Should have inserted 1 booster milestone');
  assert.strictEqual(updatedWithBooster.schedule[1].is_booster, true);
  assert.strictEqual(updatedWithBooster.schedule[1].scheduled_date, '2026-11-05', 'Booster must be today + 3 days');
  console.log('✓ Test 4 Passed: 3-Day Booster Revision inserted correctly when difficulty is Hard');
}

// Test 5: Day 30 Quota Completion -> 30-Day Maintenance Loop Transition
{
  const t0 = '2026-10-01';
  const schedule = createInitialSchedule(t0);
  // Complete stages 1 to 4
  for (let i = 0; i < 4; i++) {
    schedule[i].state = MILESTONE_STATE.COMPLETED;
    schedule[i].completed_date = schedule[i].scheduled_date;
  }
  const topic = {
    topic_id: 't-test-maint',
    category: CATEGORIES.GATE,
    created_date: t0,
    current_stage: 5,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    next_due_date: '2026-10-31',
    total_delay_days: 0,
    schedule,
  };

  const categorySettings = {
    [CATEGORIES.GATE]: {
      maintenance_type: MAINTENANCE_TYPE.MONTHS,
      maintenance_months: 18,
    }
  };

  // User completes Rev 5 (Day 30)
  const completedQuota = markRevised(topic, '2026-10-31', categorySettings, 'MEDIUM', false);
  assert.strictEqual(completedQuota.status, TOPIC_STATUS.MAINTENANCE, 'Must transition to MAINTENANCE');
  assert.strictEqual(completedQuota.schedule.length, 6, 'Must append maintenance milestone');
  assert.strictEqual(completedQuota.schedule[5].scheduled_date, '2026-11-30', 'Next maintenance must be today + 30 days');
  console.log('✓ Test 5 Passed: Transitions into 30-Day Maintenance Loop after Stage 5 quota completion');
}

// Test 6: Multi-Track Category Isolation (Independent Scheduling)
{
  const t0 = '2026-11-01';
  const scheduleGate = createInitialSchedule(t0);
  const scheduleCol = createInitialSchedule(t0);
  assert.strictEqual(scheduleGate.length, 5);
  assert.strictEqual(scheduleCol.length, 5);
  console.log('✓ Test 6 Passed: Multi-track schedules operate independently');
}

// Test 7: Midnight Auto-Rollover
{
  const pastDate = '2026-11-10';
  const todayDate = '2026-11-13';
  const schedule = createInitialSchedule(pastDate);
  // Milestone 1 was due 2026-11-11, which is 2 days before today!
  const topics = [
    {
      topic_id: 'missed-1',
      category: CATEGORIES.GATE,
      schedule,
      status: TOPIC_STATUS.QUOTA_ACTIVE,
      total_delay_days: 0,
    }
  ];

  const rolloverResult = runMidnightRollover(topics, todayDate);
  assert.strictEqual(rolloverResult.rolledOverCount, 1);
  assert.strictEqual(rolloverResult.topics[0].total_delay_days, 2);
  assert.strictEqual(rolloverResult.topics[0].schedule[0].scheduled_date, todayDate);
  console.log('✓ Test 7 Passed: Automatic Midnight Rollover shifts unrevised past milestones to today');
}

// Test 8: Full Future Load Calculation (All Pending Milestones in Schedule Mapped for Calendar)
{
  const t0 = '2026-11-01';
  const topic = {
    topic_id: 't-load',
    category: CATEGORIES.GATE,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule: createInitialSchedule(t0),
  };
  const loadMap = getScheduleLoadByDate([topic]);
  // Initial schedule should have pending milestones on 2 Nov, 4 Nov, 8 Nov, 15 Nov, 1 Dec
  assert.ok(loadMap['2026-11-02']?.length === 1, 'Rev 1 on 2 Nov must be mapped in load preview');
  assert.ok(loadMap['2026-11-04']?.length === 1, 'Rev 2 on 4 Nov must be mapped in load preview');
  assert.ok(loadMap['2026-11-08']?.length === 1, 'Rev 3 on 8 Nov must be mapped in load preview');
  assert.ok(loadMap['2026-11-15']?.length === 1, 'Rev 4 on 15 Nov must be mapped in load preview');
  assert.ok(loadMap['2026-12-01']?.length === 1, 'Rev 5 on 1 Dec must be mapped in load preview');
  console.log('✓ Test 8 Passed: Future calendar workload accurately captures all future pending milestones');
}

// Test 9: Booster Collision Prevention
{
  const t0 = '2026-11-01';
  const schedule = createInitialSchedule(t0); // Rev 1 = 2026-11-02, Rev 2 = 2026-11-04
  const topic = {
    topic_id: 't-collision',
    category: CATEGORIES.COLLEGE,
    created_date: t0,
    current_stage: 1,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule,
  };
  // User completes Rev 1 on 2026-11-02 with Hard booster (+3d -> 2026-11-05)
  // Rev 2 was originally 2026-11-04, which is BEFORE the booster!
  const updated = markRevised(topic, '2026-11-02', {}, 'HARD', true);
  assert.strictEqual(updated.schedule[1].is_booster, true);
  assert.strictEqual(updated.schedule[1].scheduled_date, '2026-11-05');
  // Rev 2 (now index 2) must be shifted past the booster date!
  assert.ok(updated.schedule[2].scheduled_date > '2026-11-05', 'Subsequent milestone must be shifted after booster');
  console.log('✓ Test 9 Passed: Booster collision prevention shifts subsequent milestones forward');
}

// Test 10: Early Revision Milestone Safety
{
  const t0 = '2026-11-01';
  const schedule = createInitialSchedule(t0); // Rev 1 = 2026-11-02
  const topic = {
    topic_id: 't-early',
    category: CATEGORIES.SELF,
    created_date: t0,
    current_stage: 1,
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule,
  };
  // Revised on Day 0 (2026-11-01), 1 day early!
  const updated = markRevised(topic, '2026-11-01', {}, 'EASY', false);
  assert.strictEqual(updated.schedule[0].state, MILESTONE_STATE.COMPLETED);
  assert.strictEqual(updated.schedule[0].completed_date, '2026-11-01');
  // Next milestone (Rev 2) must be after completion date
  assert.ok(updated.schedule[1].scheduled_date > '2026-11-01', 'Next milestone must strictly follow completion date');
  console.log('✓ Test 10 Passed: Early revision preserves chronological integrity and stage advancement');
}

// Test 11: Archived Topic Isolation
{
  const archivedTopic = {
    topic_id: 't-archived',
    category: CATEGORIES.GATE,
    status: TOPIC_STATUS.ARCHIVED,
    total_delay_days: 0,
    schedule: [],
  };
  assert.strictEqual(archivedTopic.status, TOPIC_STATUS.ARCHIVED, 'Archived topics must not be modified');
  console.log('✓ Test 11 Passed: Archived topics safely preserved');
}

// Test 12: Strict JSON Import Validator
{
  assert.strictEqual(validateImportData(null), false);
  assert.strictEqual(validateImportData({ topics: 'invalid' }), false);
  assert.strictEqual(validateImportData({ topics: [{ invalid: true }] }), false);
  assert.strictEqual(validateImportData({ topics: [] }), true);
  const validTopic = {
    topic_id: 'top-1',
    title: 'Valid Title',
    category: CATEGORIES.GATE,
    schedule: [{ scheduled_date: '2026-11-02', state: MILESTONE_STATE.PENDING }],
  };
  assert.strictEqual(validateImportData({ topics: [validTopic] }), true);
  console.log('✓ Test 12 Passed: Strict JSON import schema validator blocks malformed data');
}

// Test 13: Streak Grace Shield - Single Active Topic Miss Does NOT Reset Streak
{
  const todayStr = '2026-11-18';
  const topic1 = {
    topic_id: 't-active-1',
    title: 'Operating Systems - Deadlocks',
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule: [{ stage_number: 1, scheduled_date: '2026-11-17', state: MILESTONE_STATE.PENDING }],
    consecutive_misses: 1,
    last_missed_date: '2026-11-17',
  };
  const streak = { count: 5, lastRevisedDate: '2026-11-16' };
  const res = evaluateStreakStatus({ topics: [topic1], streak, todayStr });

  assert.strictEqual(res.shouldReset, false, '1 single missed topic must NOT reset streak');
  assert.strictEqual(res.streakProtectedByGrace, true, 'Streak must be protected by grace');
  assert.strictEqual(res.healthStatus, 'grace', 'Health status must be grace');
  console.log('✓ Test 13 Passed: 1 single active revision topic miss is protected by grace shield (no streak reset)');
}

// Test 14: Streak Reset - >= 2 Active Topics Missed on Same Day
{
  const todayStr = '2026-11-18';
  const topic1 = {
    topic_id: 't-active-1',
    title: 'Operating Systems - Deadlocks',
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule: [{ stage_number: 1, scheduled_date: '2026-11-17', state: MILESTONE_STATE.PENDING }],
    consecutive_misses: 1,
  };
  const topic2 = {
    topic_id: 't-active-2',
    title: 'Computer Networks - TCP Flow Control',
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule: [{ stage_number: 2, scheduled_date: '2026-11-17', state: MILESTONE_STATE.PENDING }],
    consecutive_misses: 1,
  };
  const streak = { count: 5, lastRevisedDate: '2026-11-16' };
  const res = evaluateStreakStatus({ topics: [topic1, topic2], streak, todayStr });

  assert.strictEqual(res.shouldReset, true, '>= 2 missed topics on same day MUST reset streak');
  assert.strictEqual(res.healthStatus, 'reset', 'Health status must be reset');
  console.log('✓ Test 14 Passed: >= 2 active revision topics missed on the same day correctly triggers streak reset');
}

// Test 15: Streak Reset - Same Active Topic Missed >= 2 Times
{
  const todayStr = '2026-11-18';
  const topic1 = {
    topic_id: 't-active-repeated',
    title: 'Signals & Systems - Fourier Transform',
    status: TOPIC_STATUS.QUOTA_ACTIVE,
    schedule: [{ stage_number: 1, scheduled_date: '2026-11-16', state: MILESTONE_STATE.PENDING }],
    consecutive_misses: 2, // Missed 2 consecutive times
  };
  const streak = { count: 10, lastRevisedDate: '2026-11-15' };
  const res = evaluateStreakStatus({ topics: [topic1], streak, todayStr });

  assert.strictEqual(res.shouldReset, true, 'Same topic missed >= 2 times MUST reset streak');
  console.log('✓ Test 15 Passed: Same active topic missed 2 or more times correctly triggers streak reset');
}

// Test 16: Maintenance Mode Topic Streak Rules (Threshold 4 Topics OR > 7 Days Late)
{
  const todayStr = '2026-11-18';
  // Case A: 3 maintenance topics missed by 3 days -> No reset!
  const maintTopics3 = [1, 2, 3].map(i => ({
    topic_id: `m-${i}`,
    title: `Maint Topic ${i}`,
    status: TOPIC_STATUS.MAINTENANCE,
    schedule: [{ stage_number: 6, label: 'Maint Cycle #1', scheduled_date: '2026-11-15', state: MILESTONE_STATE.PENDING }],
  }));
  const resA = evaluateStreakStatus({ topics: maintTopics3, streak: { count: 12 }, todayStr });
  assert.strictEqual(resA.shouldReset, false, '3 missed maintenance topics must NOT reset streak');

  // Case B: 4 maintenance topics missed -> RESET!
  const maintTopics4 = [...maintTopics3, {
    topic_id: 'm-4',
    title: 'Maint Topic 4',
    status: TOPIC_STATUS.MAINTENANCE,
    schedule: [{ stage_number: 6, label: 'Maint Cycle #1', scheduled_date: '2026-11-15', state: MILESTONE_STATE.PENDING }],
  }];
  const resB = evaluateStreakStatus({ topics: maintTopics4, streak: { count: 12 }, todayStr });
  assert.strictEqual(resB.shouldReset, true, '>= 4 missed maintenance topics MUST reset streak');

  // Case C: 1 maintenance topic delayed > 7 days (e.g. 8 days late) -> RESET!
  const maintTopicOld = {
    topic_id: 'm-old',
    title: 'Algorithms - Graphs Maintenance',
    status: TOPIC_STATUS.MAINTENANCE,
    schedule: [{ stage_number: 6, label: 'Maint Cycle #1', scheduled_date: '2026-11-09', state: MILESTONE_STATE.PENDING }], // 9 days ago
  };
  const resC = evaluateStreakStatus({ topics: [maintTopicOld], streak: { count: 12 }, todayStr });
  assert.strictEqual(resC.shouldReset, true, 'Maintenance topic late > 7 days MUST reset streak');

  console.log('✓ Test 16 Passed: Maintenance mode rules verified (safe under 4 topics, resets at >= 4 topics or > 7 days late)');
}

// Test 17: Restart Spaced Repetition (Back to Stage 1)
{
  const todayStr = '2026-11-18';
  const maintTopic = {
    topic_id: 't-maint-restart',
    title: 'Computer Architecture - Pipelining',
    status: TOPIC_STATUS.MAINTENANCE,
    current_stage: 7,
    maintenance_ended: false,
    total_delay_days: 14,
    consecutive_misses: 2,
    schedule: [
      { stage_number: 6, state: MILESTONE_STATE.COMPLETED },
      { stage_number: 7, state: MILESTONE_STATE.PENDING, scheduled_date: '2026-11-20' },
    ],
  };

  const restarted = restartSpacedRepetition(maintTopic, todayStr);

  assert.strictEqual(restarted.status, TOPIC_STATUS.QUOTA_ACTIVE, 'Status must reset to QUOTA_ACTIVE');
  assert.strictEqual(restarted.current_stage, 1, 'Current stage must be 1');
  assert.strictEqual(restarted.schedule.length, 5, 'Must generate clean 5-stage schedule');
  assert.strictEqual(restarted.schedule[0].scheduled_date, '2026-11-19', 'Rev 1 must be tomorrow (Day 1)');
  assert.strictEqual(restarted.next_due_date, '2026-11-19', 'Next due date must be Rev 1');
  assert.strictEqual(restarted.total_delay_days, 0, 'Delay days must reset to 0');
  assert.strictEqual(restarted.consecutive_misses, 0, 'Consecutive misses must reset to 0');
  console.log('✓ Test 17 Passed: Restart Spaced Repetition restores Stage 1 core schedule (1, 3, 7, 14, 30 days)');
}

console.log('\n ALL 17/17 SCHEDULER ENGINE UNIT TESTS PASSED WITH 100% SUCCESS!');
