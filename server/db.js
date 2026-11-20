import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ [SpaRE Neon] DATABASE_URL is not defined in .env. Please set your Neon connection string.');
}

export const sql = databaseUrl ? neon(databaseUrl) : null;

export const checkDatabaseConnection = async () => {
  if (!sql) return { connected: false, error: 'DATABASE_URL is not configured.' };
  try {
    const result = await sql`SELECT NOW() as current_time, current_database() as db_name;`;
    return { connected: true, data: result[0] };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};
