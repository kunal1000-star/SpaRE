import { neon } from '@neondatabase/serverless';
import { DEFAULT_CUSTOM_CATEGORIES } from '../types.js';

const DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_kD7gbqN4uKnQ@ep-wandering-band-bdibtiqf-pooler.c-8.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

let directSql = null;
let currentActiveUserId = 'default_user';

export function setActiveUserId(userId) {
  currentActiveUserId = userId || 'default_user';
}

export function getActiveUserId() {
  return currentActiveUserId;
}

export function getDirectNeonSql() {
  if (!directSql) {
    const url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATABASE_URL) 
      ? import.meta.env.VITE_DATABASE_URL 
      : DEFAULT_NEON_URL;
    directSql = neon(url);
  }
  return directSql;
}

export async function checkDirectNeonHealth() {
  try {
    const sql = getDirectNeonSql();
    const start = performance.now();
    const res = await sql.query('SELECT NOW() as current_time, current_database() as db_name, version()');
    const latency = Math.max(1, Math.round(performance.now() - start));
    return {
      connected: true,
      status: 'ok',
      neonDatabase: 'connected',
      database: res[0]?.db_name || 'neondb',
      latency: `${latency}ms`,
      branch: 'production',
      region: 'AWS us-east-2',
      pooled: true,
      provider: 'Neon Serverless PostgreSQL (Direct Cloud Sync)',
      services: {
        postgres: 'online',
        auth: 'online',
        aiGateway: 'online',
      }
    };
  } catch (err) {
    return {
      connected: false,
      status: 'offline',
      neonDatabase: 'disconnected',
      error: err.message,
      provider: 'Local Storage Fallback'
    };
  }
}

// TOPICS & MILESTONES DIRECT
export async function fetchDirectTopics(userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const topicsRows = await sql.query(`
    SELECT id, title, category, categories, subject, notes, difficulty, importance, last_difficulty,
           maintenance_interval_days, maintenance_ended,
           TO_CHAR(created_date, 'YYYY-MM-DD') as created_date,
           current_stage, status, 
           TO_CHAR(next_due_date, 'YYYY-MM-DD') as next_due_date,
           total_delay_days, 
           TO_CHAR(last_action_date, 'YYYY-MM-DD') as last_action_date
    FROM topics
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);

  const milestonesRows = await sql.query(`
    SELECT topic_id, stage_number, is_booster, label,
           TO_CHAR(scheduled_date, 'YYYY-MM-DD') as scheduled_date,
           TO_CHAR(completed_date, 'YYYY-MM-DD') as completed_date,
           state, difficulty, order_index
    FROM milestones
    ORDER BY order_index ASC
  `);

  const milestonesMap = {};
  for (const m of milestonesRows) {
    if (!milestonesMap[m.topic_id]) milestonesMap[m.topic_id] = [];
    milestonesMap[m.topic_id].push({
      stage_number: m.stage_number,
      is_booster: m.is_booster,
      label: m.label,
      scheduled_date: m.scheduled_date,
      completed_date: m.completed_date,
      state: m.state,
      difficulty: m.difficulty,
    });
  }

  return topicsRows.map((t) => ({
    topic_id: t.id,
    title: t.title,
    category: t.category,
    categories: Array.isArray(t.categories) && t.categories.length > 0 ? t.categories : [t.category],
    subject: t.subject,
    notes: t.notes || '',
    difficulty: t.difficulty || 'Medium',
    importance: t.importance || 'Medium',
    last_difficulty: t.last_difficulty || null,
    maintenance_interval_days: t.maintenance_interval_days || 30,
    maintenance_ended: Boolean(t.maintenance_ended),
    created_date: t.created_date,
    current_stage: t.current_stage,
    status: t.status,
    next_due_date: t.next_due_date,
    total_delay_days: t.total_delay_days,
    last_action_date: t.last_action_date,
    schedule: milestonesMap[t.id] || [],
  }));
}

export async function saveDirectTopic(topic, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const {
    topic_id,
    title,
    category = 'College',
    categories = [category],
    subject,
    notes = '',
    difficulty = 'Medium',
    importance = 'Medium',
    last_difficulty = null,
    maintenance_interval_days = 30,
    maintenance_ended = false,
    created_date,
    current_stage = 1,
    status = 'QUOTA_ACTIVE',
    next_due_date,
    total_delay_days = 0,
    last_action_date = null,
    schedule = [],
  } = topic;

  // Ensure categories is a valid string array
  const catsArray = Array.isArray(categories) && categories.length > 0 
    ? categories 
    : [category || 'GATE'];

  // Normalize status to match PostgreSQL CHECK constraint ('QUOTA_ACTIVE', 'MAINTENANCE', 'ARCHIVED')
  const validStatus = (status === 'ACTIVE' || !status) 
    ? 'QUOTA_ACTIVE' 
    : (['QUOTA_ACTIVE', 'MAINTENANCE', 'ARCHIVED'].includes(status) ? status : 'QUOTA_ACTIVE');

  // Normalize last_difficulty
  const normLastDiff = last_difficulty 
    ? (['EASY', 'MEDIUM', 'HARD'].includes(String(last_difficulty).toUpperCase()) ? String(last_difficulty).toUpperCase() : null)
    : null;

  await sql.query(`
    INSERT INTO topics (
      id, user_id, title, category, categories, subject, notes, difficulty, importance, last_difficulty,
      maintenance_interval_days, maintenance_ended, created_date, current_stage, status, next_due_date,
      total_delay_days, last_action_date, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      categories = EXCLUDED.categories,
      subject = EXCLUDED.subject,
      notes = EXCLUDED.notes,
      difficulty = EXCLUDED.difficulty,
      importance = EXCLUDED.importance,
      last_difficulty = EXCLUDED.last_difficulty,
      maintenance_interval_days = EXCLUDED.maintenance_interval_days,
      maintenance_ended = EXCLUDED.maintenance_ended,
      current_stage = EXCLUDED.current_stage,
      status = EXCLUDED.status,
      next_due_date = EXCLUDED.next_due_date,
      total_delay_days = EXCLUDED.total_delay_days,
      last_action_date = EXCLUDED.last_action_date,
      updated_at = NOW()
  `, [
    topic_id, userId, title, category, catsArray, subject, notes, difficulty, importance, normLastDiff,
    maintenance_interval_days, Boolean(maintenance_ended), created_date, current_stage, validStatus, next_due_date,
    total_delay_days, last_action_date
  ]);

  await sql.query('DELETE FROM milestones WHERE topic_id = $1', [topic_id]);

  if (Array.isArray(schedule) && schedule.length > 0) {
    const valuePlaceholders = [];
    const values = [];
    let pIdx = 1;

    for (let idx = 0; idx < schedule.length; idx++) {
      const m = schedule[idx];
      const rawDiff = m.difficulty ? String(m.difficulty).toUpperCase() : null;
      const validDiff = ['EASY', 'MEDIUM', 'HARD'].includes(rawDiff) ? rawDiff : null;
      const validState = (m.state === 'COMPLETED' || m.completed_date) ? 'COMPLETED' : 'PENDING';

      valuePlaceholders.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7}, $${pIdx + 8})`);
      values.push(
        topic_id,
        m.stage_number || (idx + 1),
        Boolean(m.is_booster),
        m.label || `Stage ${m.stage_number || (idx + 1)}`,
        m.scheduled_date,
        m.completed_date || null,
        validState,
        validDiff,
        idx
      );
      pIdx += 9;
    }

    await sql.query(`
      INSERT INTO milestones (
        topic_id, stage_number, is_booster, label, scheduled_date, completed_date, state, difficulty, order_index
      ) VALUES ${valuePlaceholders.join(', ')}
    `, values);
  }

  return { success: true, topic_id };
}

export async function deleteDirectTopic(topicId) {
  const sql = getDirectNeonSql();
  await sql.query('DELETE FROM milestones WHERE topic_id = $1', [topicId]);
  await sql.query('DELETE FROM topics WHERE id = $1', [topicId]);
  return { success: true, topicId };
}

// SETTINGS & STREAK DIRECT
export async function fetchDirectSettings(userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const rows = await sql.query(`
    SELECT category_id, maintenance_type, maintenance_months, maintenance_days, 
           TO_CHAR(target_end_date, 'YYYY-MM-DD') as target_end_date, is_paused 
    FROM category_settings 
    WHERE user_id = $1
  `, [userId]);
  const map = {};
  for (const r of rows) {
    map[r.category_id] = {
      category_id: r.category_id,
      maintenance_type: r.maintenance_type,
      maintenance_months: r.maintenance_months,
      maintenance_days: r.maintenance_days,
      target_end_date: r.target_end_date,
      is_paused: Boolean(r.is_paused),
    };
  }
  return map;
}

export async function saveDirectSettings(settings, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const entries = Object.entries(settings || {});
  
  for (const [catId, cfg] of entries) {
    const maintenance_type = cfg.maintenance_type || (cfg.maintenance_months ? 'MONTHS' : 'INFINITE');
    const maintenance_months = parseInt(cfg.maintenance_months || cfg.defaultMaintenanceMonths, 10) || 4;
    const maintenance_days = parseInt(cfg.maintenance_days, 10) || (maintenance_months * 30);
    const target_end_date = cfg.target_end_date || null;
    const is_paused = Boolean(cfg.is_paused);

    await sql.query(`
      INSERT INTO category_settings (
        user_id, category_id, maintenance_type, maintenance_months, maintenance_days, target_end_date, is_paused, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW()
      )
      ON CONFLICT (user_id, category_id) DO UPDATE SET
        maintenance_type = EXCLUDED.maintenance_type,
        maintenance_months = EXCLUDED.maintenance_months,
        maintenance_days = EXCLUDED.maintenance_days,
        target_end_date = EXCLUDED.target_end_date,
        is_paused = EXCLUDED.is_paused,
        updated_at = NOW()
    `, [userId, catId, maintenance_type, maintenance_months, maintenance_days, target_end_date, is_paused]);
  }

  // Clean up any deleted custom category settings (never delete default categories)
  const protectedCategories = ['College', 'GATE', 'Self', 'Nvidia', 'AMD'];
  const allActiveOrProtected = Array.from(new Set([...protectedCategories, ...Object.keys(settings || {})]));
  if (allActiveOrProtected.length > 0) {
    const placeholders = allActiveOrProtected.map((_, i) => `$${i + 2}`).join(', ');
    await sql.query(`DELETE FROM category_settings WHERE user_id = $1 AND category_id NOT IN (${placeholders})`, [userId, ...allActiveOrProtected]);
  }

  return { success: true };
}

export async function fetchDirectStreak(userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const rows = await sql.query(`
    SELECT count, TO_CHAR(last_revised_date, 'YYYY-MM-DD') as last_revised_date
    FROM user_streaks
    WHERE user_id = $1
  `, [userId]);
  if (rows.length === 0) return { count: 0, lastRevisedDate: null };
  return { count: rows[0].count || 0, lastRevisedDate: rows[0].last_revised_date };
}

export async function saveDirectStreak(streak, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  await sql.query(`
    INSERT INTO user_streaks (user_id, count, last_revised_date, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      count = EXCLUDED.count,
      last_revised_date = EXCLUDED.last_revised_date,
      updated_at = NOW()
  `, [userId, streak.count || 0, streak.lastRevisedDate || null]);
  return { success: true };
}

// SYLLABUS DIRECT
export async function fetchDirectSyllabus(userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const rows = await sql.query("SELECT syllabus_data FROM user_syllabus WHERE user_id = $1", [userId]);
  if (rows.length === 0 || !rows[0].syllabus_data) return [];
  const data = rows[0].syllabus_data;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function saveDirectSyllabus(syllabus, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  await sql.query(`
    INSERT INTO user_syllabus (user_id, syllabus_data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      syllabus_data = EXCLUDED.syllabus_data,
      updated_at = NOW()
  `, [userId, JSON.stringify(syllabus)]);
  return { success: true };
}

// CATEGORIES DIRECT
export async function fetchDirectCategories(userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const rows = await sql.query("SELECT categories FROM user_categories WHERE user_id = $1", [userId]);
  if (rows.length === 0 || !rows[0].categories) return { ...DEFAULT_CUSTOM_CATEGORIES };
  const data = rows[0].categories;
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  return { ...DEFAULT_CUSTOM_CATEGORIES, ...(parsed || {}) };
}

export async function saveDirectCategories(categories, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  await sql.query(`
    INSERT INTO user_categories (user_id, categories, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      categories = EXCLUDED.categories,
      updated_at = NOW()
  `, [userId, JSON.stringify(categories)]);
  return { success: true };
}

// SUBJECT & CHAPTER RESOURCES DIRECT
export async function fetchDirectResources(subject = null, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  let query = "SELECT id, subject, chapter_topic, type, title, url, notes, updated_at FROM subject_resources WHERE user_id = $1";
  const params = [userId];
  if (subject && subject !== 'ALL') {
    query += " AND LOWER(subject) = LOWER($2)";
    params.push(subject);
  }
  query += " ORDER BY updated_at DESC";
  return await sql.query(query, params);
}

export async function saveDirectResource(res, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  const { id, subject, chapter_topic = '', type, title, url, notes = '' } = res;
  await sql.query(`
    INSERT INTO subject_resources (id, user_id, subject, chapter_topic, type, title, url, notes, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (id) DO UPDATE SET
      subject = EXCLUDED.subject,
      chapter_topic = EXCLUDED.chapter_topic,
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      url = EXCLUDED.url,
      notes = EXCLUDED.notes,
      updated_at = NOW()
  `, [id, userId, subject, chapter_topic, type, title, url, notes]);
  return { success: true, id };
}

export async function deleteDirectResource(id, userId = getActiveUserId()) {
  const sql = getDirectNeonSql();
  await sql.query("DELETE FROM subject_resources WHERE id = $1 AND user_id = $2", [id, userId]);
  return { success: true, id };
}

// USER PROFILE DIRECT
export async function updateDirectUserProfile({ userId, name, email }) {
  const sql = getDirectNeonSql();
  const targetId = userId || getActiveUserId();
  if (!targetId || targetId === 'default_user') {
    return { success: false, error: 'User ID is required to update profile' };
  }

  // Check if target user exists by ID or email in neon_auth.user
  const existing = await sql.query(
    'SELECT id, name, email FROM neon_auth.user WHERE id = $1 OR email = $2 LIMIT 1',
    [targetId, email || '']
  );

  if (existing.length === 0) {
    return { success: false, error: 'User not found in authentication records' };
  }

  const actualUserId = existing[0].id;
  const updates = [];
  const params = [actualUserId];

  if (name !== undefined) {
    params.push(name.trim());
    updates.push(`name = $${params.length}`);
  }

  if (email !== undefined && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    // Check if new email is already taken by another user
    const emailConflict = await sql.query(
      'SELECT id FROM neon_auth.user WHERE LOWER(email) = LOWER($1) AND id != $2 LIMIT 1',
      [cleanEmail, actualUserId]
    );
    if (emailConflict.length > 0) {
      return { success: false, error: 'This email is already in use by another account.' };
    }
    params.push(cleanEmail);
    updates.push(`email = $${params.length}`);
  }

  if (updates.length === 0) {
    return { success: true, user: existing[0] };
  }

  updates.push('"updatedAt" = NOW()');

  const query = `
    UPDATE neon_auth.user 
    SET ${updates.join(', ')} 
    WHERE id = $1 
    RETURNING id, name, email
  `;

  const updatedRows = await sql.query(query, params);
  const updatedUser = updatedRows[0];

  return { success: true, user: updatedUser };
}
