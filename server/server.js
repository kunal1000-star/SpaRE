import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { sql, checkDatabaseConnection } from './db.js';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

// Health Check with all Neon Services status
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const authUrl = process.env.NEON_AUTH_BASE_URL;
  const aiGatewayUrl = process.env.NEON_AI_GATEWAY_BASE_URL;
  const functionSuffix = process.env.NEON_FUNCTION_HOST_SUFFIX;

  res.json({
    status: 'ok',
    neonDatabase: dbStatus.connected ? 'connected' : 'disconnected',
    services: {
      postgres: dbStatus.connected ? 'online' : 'offline',
      auth: authUrl ? 'online' : 'offline',
      aiGateway: aiGatewayUrl ? 'online' : 'offline',
      functions: functionSuffix ? 'online' : 'offline',
    },
    details: dbStatus
  });
});

// Detailed Neon Services Metadata Endpoint
app.get('/api/neon/services', async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const branch = process.env.NEON_BRANCH || 'production';
  const branchId = process.env.NEON_BRANCH_ID;
  const functionHostSuffix = process.env.NEON_FUNCTION_HOST_SUFFIX;
  const helloUrl = functionHostSuffix ? `https://${branchId}-hello${functionHostSuffix}/` : null;

  res.json({
    branch,
    branchId,
    services: {
      postgres: {
        status: dbStatus.connected ? 'online' : 'offline',
        database: dbStatus.data?.db_name || 'neondb',
        pooled: !!process.env.DATABASE_URL,
        unpooled: !!process.env.DATABASE_URL_UNPOOLED,
      },
      auth: {
        status: process.env.NEON_AUTH_BASE_URL ? 'online' : 'offline',
        baseUrl: process.env.NEON_AUTH_BASE_URL,
        jwksUrl: process.env.NEON_AUTH_JWKS_URL,
      },
      functions: {
        status: helloUrl ? 'online' : 'offline',
        helloUrl,
      },
      aiGateway: {
        status: process.env.NEON_AI_GATEWAY_BASE_URL ? 'online' : 'offline',
        baseUrl: process.env.NEON_AI_GATEWAY_BASE_URL,
        hasToken: !!process.env.NEON_AI_GATEWAY_TOKEN,
      },
    }
  });
});

// GET all topics with milestones
app.get('/api/topics', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    const topicsRows = await sql`
      SELECT id, title, category, categories, subject, notes, difficulty, importance, last_difficulty,
             TO_CHAR(created_date, 'YYYY-MM-DD') as created_date,
             current_stage, status, 
             TO_CHAR(next_due_date, 'YYYY-MM-DD') as next_due_date,
             total_delay_days, 
             TO_CHAR(last_action_date, 'YYYY-MM-DD') as last_action_date
      FROM topics
      WHERE user_id = 'default_user'
      ORDER BY created_at DESC;
    `;

    const milestonesRows = await sql`
      SELECT topic_id, stage_number, is_booster, label,
             TO_CHAR(scheduled_date, 'YYYY-MM-DD') as scheduled_date,
             TO_CHAR(completed_date, 'YYYY-MM-DD') as completed_date,
             state, difficulty, order_index
      FROM milestones
      ORDER BY order_index ASC;
    `;

    // Group milestones by topic_id
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

    const formattedTopics = topicsRows.map((t) => ({
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

    res.json(formattedTopics);
  } catch (err) {
    console.error('Error fetching topics:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST save / create topic with schedule
app.post('/api/topics', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const { 
    topic_id, 
    title, 
    category, 
    categories, 
    subject, 
    notes, 
    difficulty, 
    importance, 
    last_difficulty, 
    maintenance_interval_days, 
    maintenance_ended, 
    created_date, 
    current_stage, 
    status, 
    next_due_date, 
    total_delay_days, 
    schedule 
  } = req.body;
  const cats = Array.isArray(categories) && categories.length > 0 ? categories : [category || 'Self'];
  const primaryCat = category || cats[0];

  try {
    // Upsert topic
    await sql`
      INSERT INTO topics (
        id, user_id, title, category, categories, subject, notes, difficulty, importance, last_difficulty, 
        maintenance_interval_days, maintenance_ended, created_date, current_stage, status, next_due_date, total_delay_days
      )
      VALUES (
        ${topic_id}, 'default_user', ${title}, ${primaryCat}, ${cats}, ${subject}, ${notes || ''}, ${difficulty || 'Medium'}, ${importance || 'Medium'}, ${last_difficulty || null}, 
        ${maintenance_interval_days || 30}, ${Boolean(maintenance_ended)}, ${created_date}, ${current_stage || 1}, ${status || 'QUOTA_ACTIVE'}, ${next_due_date}, ${total_delay_days || 0}
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
        total_delay_days = EXCLUDED.total_delay_days;
    `;

    // Re-insert milestones for this topic
    if (Array.isArray(schedule) && schedule.length > 0) {
      await sql`DELETE FROM milestones WHERE topic_id = ${topic_id};`;
      for (let i = 0; i < schedule.length; i++) {
        const m = schedule[i];
        await sql`
          INSERT INTO milestones (topic_id, stage_number, is_booster, label, scheduled_date, completed_date, state, difficulty, order_index)
          VALUES (${topic_id}, ${m.stage_number}, ${m.is_booster || false}, ${m.label}, ${m.scheduled_date}, ${m.completed_date || null}, ${m.state || 'PENDING'}, ${m.difficulty || null}, ${i});
        `;
      }
    }

    res.status(201).json({ success: true, topic_id });
  } catch (err) {
    console.error('Error saving topic:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update full topic (e.g. after revised, not-revised, or track editing)
app.put('/api/topics/:id', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const topicId = req.params.id;
  const { 
    title,
    category,
    categories,
    subject,
    notes,
    difficulty,
    importance,
    last_difficulty,
    maintenance_interval_days,
    maintenance_ended,
    current_stage, 
    status, 
    next_due_date, 
    total_delay_days, 
    last_action_date, 
    schedule 
  } = req.body;

  const cats = Array.isArray(categories) && categories.length > 0 ? categories : (category ? [category] : null);
  const primaryCat = category || (cats ? cats[0] : null);

  try {
    await sql`
      UPDATE topics
      SET title = COALESCE(${title || null}, title),
          category = COALESCE(${primaryCat}, category),
          categories = COALESCE(${cats}, categories),
          subject = COALESCE(${subject || null}, subject),
          notes = COALESCE(${notes !== undefined ? notes : null}, notes),
          difficulty = COALESCE(${difficulty || null}, difficulty),
          importance = COALESCE(${importance || null}, importance),
          last_difficulty = COALESCE(${last_difficulty || null}, last_difficulty),
          maintenance_interval_days = COALESCE(${maintenance_interval_days !== undefined ? maintenance_interval_days : null}, maintenance_interval_days),
          maintenance_ended = COALESCE(${maintenance_ended !== undefined ? maintenance_ended : null}, maintenance_ended),
          current_stage = COALESCE(${current_stage !== undefined ? current_stage : null}, current_stage),
          status = COALESCE(${status || null}, status),
          next_due_date = COALESCE(${next_due_date || null}, next_due_date),
          total_delay_days = COALESCE(${total_delay_days !== undefined ? total_delay_days : null}, total_delay_days),
          last_action_date = ${last_action_date || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${topicId} AND user_id = 'default_user';
    `;

    if (Array.isArray(schedule)) {
      await sql`DELETE FROM milestones WHERE topic_id = ${topicId};`;
      for (let i = 0; i < schedule.length; i++) {
        const m = schedule[i];
        await sql`
          INSERT INTO milestones (topic_id, stage_number, is_booster, label, scheduled_date, completed_date, state, difficulty, order_index)
          VALUES (${topicId}, ${m.stage_number}, ${m.is_booster || false}, ${m.label}, ${m.scheduled_date}, ${m.completed_date || null}, ${m.state}, ${m.difficulty || null}, ${i});
        `;
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating topic:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE single topic
app.delete('/api/topics/:id', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    await sql`DELETE FROM milestones WHERE topic_id = ${req.params.id};`;
    await sql`DELETE FROM topics WHERE id = ${req.params.id} AND user_id = 'default_user';`;
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting topic:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE all topics (full reset)
app.delete('/api/topics', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    await sql`DELETE FROM milestones WHERE topic_id IN (SELECT id FROM topics WHERE user_id = 'default_user');`;
    await sql`DELETE FROM topics WHERE user_id = 'default_user';`;
    res.json({ success: true, message: 'All topics cleared from Neon' });
  } catch (err) {
    console.error('Error clearing all topics:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET category settings
app.get('/api/settings', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    const rows = await sql`
      SELECT category_id, maintenance_type, maintenance_months, maintenance_days,
             TO_CHAR(target_end_date, 'YYYY-MM-DD') as target_end_date, is_paused
      FROM category_settings
      WHERE user_id = 'default_user';
    `;

    const settingsMap = {};
    for (const r of rows) {
      settingsMap[r.category_id] = {
        category_id: r.category_id,
        maintenance_type: r.maintenance_type,
        maintenance_months: r.maintenance_months,
        maintenance_days: r.maintenance_days,
        target_end_date: r.target_end_date,
        is_paused: r.is_paused,
      };
    }
    res.json(settingsMap);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT category settings
app.put('/api/settings', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const settingsObj = req.body;
  try {
    for (const [catId, conf] of Object.entries(settingsObj)) {
      await sql`
        INSERT INTO category_settings (user_id, category_id, maintenance_type, maintenance_months, maintenance_days, target_end_date, is_paused)
        VALUES ('default_user', ${catId}, ${conf.maintenance_type}, ${conf.maintenance_months || 6}, ${conf.maintenance_days || 180}, ${conf.target_end_date || null}, ${conf.is_paused || false})
        ON CONFLICT (user_id, category_id) DO UPDATE SET
          maintenance_type = EXCLUDED.maintenance_type,
          maintenance_months = EXCLUDED.maintenance_months,
          maintenance_days = EXCLUDED.maintenance_days,
          target_end_date = EXCLUDED.target_end_date,
          is_paused = EXCLUDED.is_paused;
      `;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET streak
app.get('/api/streak', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    const rows = await sql`
      SELECT count, TO_CHAR(last_revised_date, 'YYYY-MM-DD') as last_revised_date
      FROM user_streaks
      WHERE user_id = 'default_user';
    `;
    if (rows.length > 0) {
      res.json({ count: rows[0].count, lastRevisedDate: rows[0].last_revised_date });
    } else {
      res.json({ count: 0, lastRevisedDate: null });
    }
  } catch (err) {
    console.error('Error fetching streak:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT streak
app.put('/api/streak', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const { count, lastRevisedDate } = req.body;
  try {
    await sql`
      INSERT INTO user_streaks (user_id, count, last_revised_date)
      VALUES ('default_user', ${count}, ${lastRevisedDate})
      ON CONFLICT (user_id) DO UPDATE SET
        count = EXCLUDED.count,
        last_revised_date = EXCLUDED.last_revised_date;
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating streak:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET user custom categories from Neon
app.get('/api/categories', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    const rows = await sql`SELECT categories FROM user_categories WHERE user_id = 'default_user';`;
    if (rows.length > 0 && rows[0].categories) {
      res.json(rows[0].categories);
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Error fetching categories from Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT user custom categories to Neon
app.put('/api/categories', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const categories = req.body;
  if (!categories || typeof categories !== 'object') {
    return res.status(400).json({ error: 'Expected categories object or array' });
  }
  try {
    await sql`
      INSERT INTO user_categories (user_id, categories, updated_at)
      VALUES ('default_user', ${JSON.stringify(categories)}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        categories = EXCLUDED.categories,
        updated_at = CURRENT_TIMESTAMP;
    `;
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Error saving categories to Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET custom syllabus from Neon
app.get('/api/syllabus', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    const rows = await sql`SELECT syllabus_data FROM user_syllabus WHERE user_id = 'default_user';`;
    if (rows.length > 0 && rows[0].syllabus_data) {
      res.json(rows[0].syllabus_data);
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('Error fetching syllabus from Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT custom syllabus to Neon
app.put('/api/syllabus', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const syllabusData = req.body;
  try {
    await sql`
      INSERT INTO user_syllabus (user_id, syllabus_data, updated_at)
      VALUES ('default_user', ${JSON.stringify(syllabusData)}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        syllabus_data = EXCLUDED.syllabus_data,
        updated_at = CURRENT_TIMESTAMP;
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving syllabus to Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET subject resources
app.get('/api/resources', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const { subject } = req.query;
  try {
    let rows;
    if (subject && subject !== 'ALL') {
      rows = await sql`
        SELECT id, subject, chapter_topic, type, title, url, notes, updated_at
        FROM subject_resources
        WHERE user_id = 'default_user' AND LOWER(subject) = LOWER(${subject})
        ORDER BY updated_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT id, subject, chapter_topic, type, title, url, notes, updated_at
        FROM subject_resources
        WHERE user_id = 'default_user'
        ORDER BY updated_at DESC;
      `;
    }
    res.json(rows);
  } catch (err) {
    console.error('Error fetching resources from Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST save / update subject resource
app.post('/api/resources', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const { id, subject, chapter_topic = '', type, title, url, notes = '' } = req.body;
  if (!id || !subject || !type || !title || !url) {
    return res.status(400).json({ error: 'Missing required resource fields' });
  }
  try {
    await sql`
      INSERT INTO subject_resources (id, user_id, subject, chapter_topic, type, title, url, notes, updated_at)
      VALUES (${id}, 'default_user', ${subject}, ${chapter_topic}, ${type}, ${title}, ${url}, ${notes}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        subject = EXCLUDED.subject,
        chapter_topic = EXCLUDED.chapter_topic,
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        notes = EXCLUDED.notes,
        updated_at = NOW();
    `;
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error saving resource to Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE subject resource
app.delete('/api/resources/:id', async (req, res) => {
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  const { id } = req.params;
  try {
    await sql`DELETE FROM subject_resources WHERE id = ${id} AND user_id = 'default_user';`;
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting resource from Neon:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve Single Page Application (SPA) index.html on root and all non-API GET routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

app.listen(PORT, () => {
  console.log(`📡 SpaRE Neon Backend running on http://localhost:${PORT}`);
});
