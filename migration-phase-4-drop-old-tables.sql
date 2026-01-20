-- ============================================
-- MIGRATION PHASE 4: DROP OLD JIRA TABLES
-- ⚠️ WARNING: THIS WILL PERMANENTLY DELETE DATA ⚠️
--
-- ONLY RUN THIS AFTER:
-- 1. Running phases 1, 2, and 3
-- 2. Verifying data was migrated correctly
-- 3. Creating a full database backup
-- 4. Testing the application with new tables
-- ============================================

-- BACKUP REMINDER
-- Run this command before executing this script:
-- sqlite3 your-database.db ".backup backup-before-drop-$(date +%Y%m%d-%H%M%S).db"

-- Drop task-related tables (in order of dependencies)
DROP TABLE IF EXISTS task_history;
DROP TABLE IF EXISTS task_attachments;
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS time_logs;
DROP TABLE IF EXISTS subtasks;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS task_labels;
DROP TABLE IF EXISTS tasks;

-- Drop sprint and epic tables
DROP TABLE IF EXISTS saved_filters;
DROP TABLE IF EXISTS sprints;
DROP TABLE IF EXISTS epics;

-- Drop board configurations (Jira-specific)
DROP TABLE IF EXISTS board_configs;

-- Optional: Drop labels if not reusing for decisions/songs
-- Uncomment the line below if you want to drop labels table
-- DROP TABLE IF EXISTS labels;

-- Update projects table to remove reference to dropped board_configs
-- Note: In SQLite, we can't drop columns easily, so we'll just set them to NULL
UPDATE projects SET board_config_id = NULL WHERE board_config_id IS NOT NULL;

-- Verification queries - run these to confirm tables are dropped
-- SELECT name FROM sqlite_master WHERE type='table' AND name IN (
--   'task_history', 'task_attachments', 'task_comments', 'time_logs',
--   'subtasks', 'task_dependencies', 'task_labels', 'tasks',
--   'saved_filters', 'sprints', 'epics', 'board_configs'
-- );
-- Expected result: No rows (empty result set)
