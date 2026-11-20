-- ==============================================================================
-- SpaRE (Spaced Revision Engine) — PostgreSQL Schema for Neon
-- ==============================================================================

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL DEFAULT 'default_user',
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    categories TEXT[],
    subject VARCHAR(150) NOT NULL,
    notes TEXT,
    created_date DATE NOT NULL,
    current_stage INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'QUOTA_ACTIVE' CHECK (status IN ('QUOTA_ACTIVE', 'MAINTENANCE', 'ARCHIVED')),
    next_due_date DATE,
    total_delay_days INT NOT NULL DEFAULT 0,
    last_action_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Milestones Table (Stages 1..5, Boosters, Maintenance cycles)
CREATE TABLE IF NOT EXISTS milestones (
    id BIGSERIAL PRIMARY KEY,
    topic_id VARCHAR(100) NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    stage_number INT NOT NULL,
    is_booster BOOLEAN NOT NULL DEFAULT FALSE,
    label VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    state VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING', 'COMPLETED')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', NULL)),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Category Settings Table
CREATE TABLE IF NOT EXISTS category_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL DEFAULT 'default_user',
    category_id VARCHAR(100) NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL DEFAULT 'MONTHS' CHECK (maintenance_type IN ('MONTHS', 'DAYS', 'TARGET_DATE', 'INFINITE')),
    maintenance_months INT DEFAULT 6,
    maintenance_days INT DEFAULT 180,
    target_end_date DATE,
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_category UNIQUE (user_id, category_id)
);

-- 4. User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id VARCHAR(100) PRIMARY KEY DEFAULT 'default_user',
    count INT NOT NULL DEFAULT 0,
    last_revised_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast queries in Neon serverless
CREATE INDEX IF NOT EXISTS idx_topics_user_status ON topics (user_id, status);
CREATE INDEX IF NOT EXISTS idx_topics_next_due ON topics (next_due_date);
CREATE INDEX IF NOT EXISTS idx_milestones_topic_order ON milestones (topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_milestones_sched_date ON milestones (scheduled_date, state);

-- Function & Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_topics_updated_at ON topics;
CREATE TRIGGER trigger_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON category_settings;
CREATE TRIGGER trigger_settings_updated_at
BEFORE UPDATE ON category_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
