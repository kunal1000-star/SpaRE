import { Client } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const client = new Client(dbUrl);
  await client.connect();

  console.log('Altering constraints and adding categories column in Neon DB...');
  await client.query(`
    ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
    ALTER TABLE category_settings DROP CONSTRAINT IF EXISTS category_settings_category_id_check;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS categories TEXT[];
  `);
  console.log('✅ Neon DB successfully migrated for custom categories & multi-categories!');

  await client.end();
}

run().catch(console.error);
