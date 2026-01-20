-- ============================================
-- MIGRATION VERIFICATION QUERIES
-- Use these to check migration status and data integrity
-- ============================================

-- ============================================
-- CHECK NEW TABLES EXIST
-- ============================================

SELECT 'Checking new tables exist...' as status;
SELECT name, type FROM sqlite_master
WHERE type='table'
AND name IN (
  'style_parameters',
  'song_versions',
  'song_sections',
  'section_templates',
  'decisions',
  'section_priorities',
  'notes',
  'creative_sessions',
  'momentum_metrics'
)
ORDER BY name;
-- Expected: 9 rows

-- ============================================
-- CHECK NEW COLUMNS ADDED TO EXISTING TABLES
-- ============================================

SELECT 'Checking songs table new columns...' as status;
PRAGMA table_info(songs);
-- Look for: phase, confidence, stability_score, narrative_role, artistic_intent, etc.

SELECT 'Checking projects table new columns...' as status;
PRAGMA table_info(projects);
-- Look for: artistic_intent, emotional_arc, narrative_theme, etc.

-- ============================================
-- COUNT MIGRATED DATA
-- ============================================

SELECT 'Counting migrated data...' as status;
SELECT
  'Notes' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT created_by) as unique_creators
FROM notes
UNION ALL
SELECT
  'Decisions' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT proposed_by) as unique_creators
FROM decisions
UNION ALL
SELECT
  'Creative Sessions' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT created_by_id) as unique_creators
FROM creative_sessions
UNION ALL
SELECT
  'Song Versions' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT uploaded_by) as unique_creators
FROM song_versions
UNION ALL
SELECT
  'Song Sections' as table_name,
  COUNT(*) as row_count,
  NULL as unique_creators
FROM song_sections;

-- ============================================
-- CHECK DATA QUALITY
-- ============================================

SELECT 'Checking songs with new field values...' as status;
SELECT
  COUNT(*) as total_songs,
  COUNT(CASE WHEN phase IS NOT NULL THEN 1 END) as songs_with_phase,
  COUNT(CASE WHEN confidence IS NOT NULL THEN 1 END) as songs_with_confidence,
  COUNT(CASE WHEN artistic_intent IS NOT NULL THEN 1 END) as songs_with_intent
FROM songs;

SELECT 'Checking projects/albums with new fields...' as status;
SELECT
  COUNT(*) as total_projects,
  COUNT(CASE WHEN artistic_intent IS NOT NULL THEN 1 END) as projects_with_intent,
  COUNT(CASE WHEN emotional_arc IS NOT NULL THEN 1 END) as projects_with_arc
FROM projects;

-- ============================================
-- SAMPLE MIGRATED DATA
-- ============================================

SELECT 'Sample notes...' as status;
SELECT
  id,
  note_type,
  SUBSTR(content, 1, 50) as content_preview,
  created_by,
  datetime(created_at, 'unixepoch') as created_date
FROM notes
LIMIT 5;

SELECT 'Sample decisions...' as status;
SELECT
  id,
  decision_type,
  SUBSTR(question, 1, 50) as question_preview,
  status,
  confidence,
  datetime(proposed_at, 'unixepoch') as proposed_date
FROM decisions
LIMIT 5;

SELECT 'Sample creative sessions...' as status;
SELECT
  id,
  SUBSTR(pre_session_intent, 1, 50) as intent_preview,
  post_session_momentum,
  datetime(date, 'unixepoch') as session_date
FROM creative_sessions
LIMIT 5;

-- ============================================
-- CHECK RELATIONSHIPS & FOREIGN KEYS
-- ============================================

SELECT 'Checking decisions linked to songs...' as status;
SELECT
  COUNT(*) as total_decisions,
  COUNT(CASE WHEN song_id IS NOT NULL THEN 1 END) as linked_to_song,
  COUNT(CASE WHEN audio_proof_id IS NOT NULL THEN 1 END) as with_audio_proof
FROM decisions;

SELECT 'Checking notes distribution...' as status;
SELECT
  COUNT(CASE WHEN album_id IS NOT NULL THEN 1 END) as album_notes,
  COUNT(CASE WHEN song_id IS NOT NULL THEN 1 END) as song_notes,
  COUNT(CASE WHEN section_id IS NOT NULL THEN 1 END) as section_notes
FROM notes;

-- ============================================
-- CHECK FOR ORPHANED DATA
-- ============================================

SELECT 'Checking for orphaned decisions (invalid album_id)...' as status;
SELECT COUNT(*) as orphaned_decisions
FROM decisions d
WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = d.album_id);

SELECT 'Checking for orphaned notes (invalid song_id)...' as status;
SELECT COUNT(*) as orphaned_notes
FROM notes n
WHERE n.song_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM songs s WHERE s.id = n.song_id);

-- ============================================
-- VERIFY OLD TABLES STATUS
-- ============================================

SELECT 'Checking if old Jira tables still exist...' as status;
SELECT name, type FROM sqlite_master
WHERE type='table'
AND name IN (
  'task_history',
  'task_attachments',
  'task_comments',
  'time_logs',
  'subtasks',
  'task_dependencies',
  'task_labels',
  'tasks',
  'saved_filters',
  'sprints',
  'epics',
  'board_configs'
)
ORDER BY name;
-- Before Phase 4: Should show all tables
-- After Phase 4: Should be empty (0 rows)

-- ============================================
-- PERFORMANCE CHECK - VERIFY INDEXES
-- ============================================

SELECT 'Checking indexes on new tables...' as status;
SELECT name, tbl_name, sql
FROM sqlite_master
WHERE type='index'
AND tbl_name IN (
  'style_parameters',
  'song_versions',
  'song_sections',
  'decisions',
  'notes',
  'creative_sessions',
  'momentum_metrics'
)
ORDER BY tbl_name, name;

-- ============================================
-- MIGRATION STATUS SUMMARY
-- ============================================

SELECT 'MIGRATION STATUS SUMMARY' as '===================';

SELECT
  'Phase 1: New Tables' as phase,
  CASE
    WHEN (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('style_parameters', 'song_versions', 'decisions', 'notes', 'creative_sessions')) = 5
    THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as status;

SELECT
  'Phase 2: Alter Tables' as phase,
  CASE
    WHEN EXISTS (SELECT 1 FROM pragma_table_info('songs') WHERE name = 'phase')
    AND EXISTS (SELECT 1 FROM pragma_table_info('projects') WHERE name = 'artistic_intent')
    THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as status;

SELECT
  'Phase 3: Data Migration' as phase,
  CASE
    WHEN (SELECT COUNT(*) FROM notes) > 0
    OR (SELECT COUNT(*) FROM decisions) > 0
    OR (SELECT COUNT(*) FROM creative_sessions) > 0
    THEN '✅ DATA MIGRATED'
    ELSE '⚠️  NO DATA MIGRATED (may be expected if no source data)'
  END as status;

SELECT
  'Phase 4: Drop Old Tables' as phase,
  CASE
    WHEN (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('tasks', 'epics', 'sprints')) = 0
    THEN '✅ COMPLETE'
    ELSE '⏳ NOT YET RUN'
  END as status;

-- ============================================
-- DATA INTEGRITY CHECKS
-- ============================================

SELECT 'DATA INTEGRITY CHECKS' as '===================';

SELECT
  'Orphaned Decisions' as check_name,
  COUNT(*) as issue_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM decisions d
WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = d.album_id);

SELECT
  'Orphaned Notes' as check_name,
  COUNT(*) as issue_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM notes n
WHERE n.song_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM songs s WHERE s.id = n.song_id);

SELECT
  'Songs with Phase' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '⚠️  WARNING' END as status
FROM songs
WHERE phase IS NOT NULL;

SELECT
  'Songs with Confidence' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '⚠️  WARNING' END as status
FROM songs
WHERE confidence IS NOT NULL;
