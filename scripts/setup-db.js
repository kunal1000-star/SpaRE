import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Client } from '@neondatabase/serverless';

// Load .env.local first, fallback to .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('\n❌ ERROR: DATABASE_URL is missing in your .env / .env.local file!');
  process.exit(1);
}

async function runSetup() {
  console.log('🚀 Connecting to Neon Lakebase PostgreSQL (Direct Connection)...');
  const client = new Client(dbUrl);
  
  try {
    await client.connect();
    const testResult = await client.query('SELECT NOW() as now, current_database() as db;');
    console.log(`✅ Connected successfully to database: "${testResult.rows[0].db}" at ${testResult.rows[0].now}`);

    console.log('\n📄 Reading and applying db/schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ All tables (topics, milestones, category_settings, user_streaks) and triggers created!');

    console.log('\n🌱 Applying seed data from db/seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✅ Default settings & sample topics seeded successfully!');

    console.log('\n🎉 NEON DATABASE SETUP COMPLETE! Your SpaRE app is ready to use Neon.\n');
  } catch (error) {
    console.error('\n❌ Database setup encountered an error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSetup();
