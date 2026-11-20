import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  // 1. Delete all sample topics
  await sql`DELETE FROM milestones WHERE topic_id LIKE 'sample-%'`;
  await sql`DELETE FROM topics WHERE id LIKE 'sample-%'`;
  console.log('Deleted sample topics from Neon DB');

  // 2. Reset user streak to 0
  await sql`
    INSERT INTO user_streaks (user_id, count, last_revised_date, updated_at)
    VALUES ('default_user', 0, NULL, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET count = 0, last_revised_date = NULL, updated_at = NOW()
  `;
  console.log('Reset streak in Neon DB to 0');

  const topics = await sql`SELECT id, title FROM topics`;
  const streaks = await sql`SELECT * FROM user_streaks`;
  console.log('Remaining topics in DB:', topics);
  console.log('Current streaks in DB:', streaks);
}

run().catch(console.error);
