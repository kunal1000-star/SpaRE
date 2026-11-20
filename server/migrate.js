import { sql } from './db.js';

async function migrate() {
  try {
    console.log('Running Neon migrations...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS user_categories (
        user_id VARCHAR(64) PRIMARY KEY,
        categories JSONB NOT NULL DEFAULT '["GATE", "College", "Self"]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS user_syllabus (
        user_id VARCHAR(64) PRIMARY KEY,
        syllabus_data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure categories, difficulty, importance, last_difficulty columns exist on topics
    await sql.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='topics' AND column_name='categories'
        ) THEN
          ALTER TABLE topics ADD COLUMN categories TEXT[] DEFAULT ARRAY['GATE'];
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='topics' AND column_name='difficulty'
        ) THEN
          ALTER TABLE topics ADD COLUMN difficulty VARCHAR(32) DEFAULT 'Medium';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='topics' AND column_name='importance'
        ) THEN
          ALTER TABLE topics ADD COLUMN importance VARCHAR(32) DEFAULT 'Medium';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='topics' AND column_name='last_difficulty'
        ) THEN
          ALTER TABLE topics ADD COLUMN last_difficulty VARCHAR(32);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='topics' AND column_name='maintenance_interval_days'
        ) THEN
          ALTER TABLE topics ADD COLUMN maintenance_interval_days INTEGER DEFAULT 30;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='topics' AND column_name='maintenance_ended'
        ) THEN
          ALTER TABLE topics ADD COLUMN maintenance_ended BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    console.log('Migration completed successfully!');
    const res = await sql.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='topics'");
    console.log('Topics columns:', res.map(r => `${r.column_name} (${r.data_type})`));
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
