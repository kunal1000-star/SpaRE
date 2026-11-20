-- ==============================================================================
-- SpaRE — Initial Seed Data for Neon
-- ==============================================================================

-- 1. Default Settings for Tracks
INSERT INTO category_settings (user_id, category_id, maintenance_type, maintenance_months, maintenance_days, target_end_date, is_paused)
VALUES 
    ('default_user', 'College', 'MONTHS', 4, 120, NULL, FALSE),
    ('default_user', 'GATE', 'MONTHS', 18, 540, NULL, FALSE),
    ('default_user', 'Self', 'INFINITE', 12, 365, NULL, FALSE)
ON CONFLICT (user_id, category_id) DO NOTHING;

-- 2. Initial Streak (Zero for new users)
INSERT INTO user_streaks (user_id, count, last_revised_date)
VALUES ('default_user', 0, NULL)
ON CONFLICT (user_id) DO UPDATE
SET count = 0, last_revised_date = NULL;
