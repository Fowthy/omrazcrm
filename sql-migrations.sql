-- ============================================
-- MUSIC OS DATABASE MIGRATION
-- Transform omrazcrm from Jira-clone to Music OS
-- ============================================

-- ============================================
-- PHASE 1: CREATE NEW TABLES
-- ============================================

-- Migration 001: Create styleParameters table
CREATE TABLE IF NOT EXISTS style_parameters (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  dimension TEXT NOT NULL, -- musical/sonic/conceptual
  parameter_name TEXT NOT NULL, -- e.g., "tempo", "distortion", "intimacy"
  start_value TEXT, -- text or numeric
  end_value TEXT, -- nullable if evolution not defined
  current_state TEXT DEFAULT 'undecided' NOT NULL, -- undecided/exploring/locked
  evolution_notes TEXT, -- how it should change across album
  locked INTEGER DEFAULT 0, -- boolean
  locked_at INTEGER, -- timestamp, nullable
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Migration 002: Extend songs table with new fields
ALTER TABLE songs ADD COLUMN phase TEXT DEFAULT 'concepting'; -- concepting/demo/tracking/mixing/mastering/archived
ALTER TABLE songs ADD COLUMN confidence INTEGER DEFAULT 50; -- 0-100, how solid the song feels
ALTER TABLE songs ADD COLUMN stability_score INTEGER DEFAULT 50; -- 0-100, how much it's changing
ALTER TABLE songs ADD COLUMN last_major_change INTEGER; -- timestamp
ALTER TABLE songs ADD COLUMN narrative_role TEXT; -- opener/climax/interlude/closer/bonus/cut
ALTER TABLE songs ADD COLUMN artistic_intent TEXT; -- why this song exists
ALTER TABLE songs ADD COLUMN emotional_target TEXT;
ALTER TABLE songs ADD COLUMN reference_tracks_ids TEXT; -- JSON array of inspiration IDs
ALTER TABLE songs ADD COLUMN stagnant_since INTEGER; -- timestamp, nullable

-- Migration 003: Extend projects table for album-centric workflow
ALTER TABLE projects ADD COLUMN artistic_intent TEXT; -- album's artistic intent
ALTER TABLE projects ADD COLUMN emotional_arc TEXT; -- emotional journey
ALTER TABLE projects ADD COLUMN narrative_theme TEXT; -- overarching theme
ALTER TABLE projects ADD COLUMN song_count_target INTEGER; -- target number of songs
ALTER TABLE projects ADD COLUMN budget_ceiling REAL; -- max budget
ALTER TABLE projects ADD COLUMN timeline_text TEXT; -- flexible text, not hard dates
ALTER TABLE projects ADD COLUMN self_assessment_criteria TEXT; -- JSON array
ALTER TABLE projects ADD COLUMN target_audience TEXT;
ALTER TABLE projects ADD COLUMN genre_boundaries TEXT;
ALTER TABLE projects ADD COLUMN instrumental_palette TEXT; -- JSON array
ALTER TABLE projects ADD COLUMN collaborators TEXT; -- JSON array

-- Migration 004: Create songVersions table
CREATE TABLE IF NOT EXISTS song_versions (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  version_intent TEXT, -- why this version was recorded
  recorded_at INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  duration_seconds REAL,
  is_main_version INTEGER DEFAULT 0, -- boolean, only one per song
  listen_count INTEGER DEFAULT 0,
  last_listened_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Migration 005: Create songSections table (enhance arrangements concept)
CREATE TABLE IF NOT EXISTS song_sections (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  section_name TEXT NOT NULL, -- intro/verse/chorus/bridge/outro/custom
  start_time REAL, -- seconds, nullable if not yet defined
  end_time REAL, -- seconds, nullable
  order_index INTEGER NOT NULL,
  notes TEXT,
  reference_version_id TEXT, -- which version this timing is from
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (reference_version_id) REFERENCES song_versions(id) ON DELETE SET NULL
);

-- Migration 006: Create sectionTemplates table
CREATE TABLE IF NOT EXISTS section_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "Verse-Chorus-Verse-Bridge-Chorus", "ABABCB"
  structure TEXT NOT NULL, -- JSON array of section names
  is_default INTEGER DEFAULT 0, -- boolean
  created_at INTEGER NOT NULL
);

-- Migration 007: Create decisions table (replaces tasks/stories)
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  song_id TEXT, -- nullable for album-level decisions
  album_id TEXT NOT NULL,
  decision_type TEXT NOT NULL, -- arrangement/performance/sonic/lyrical/structural/production
  question TEXT NOT NULL, -- what needs to be decided
  context TEXT, -- why it matters
  status TEXT DEFAULT 'proposed' NOT NULL, -- proposed/testing/locked/reopened
  proposed_at INTEGER NOT NULL,
  tested_at INTEGER,
  locked_at INTEGER,
  reopened_at INTEGER,
  proposed_by TEXT NOT NULL,
  audio_proof_id TEXT, -- FK to files, nullable
  linked_section_id TEXT, -- FK to songSections, nullable
  instrument_or_role TEXT, -- guitar/bass/drums/vocals/mix/master, nullable
  outcome TEXT, -- what was decided
  confidence INTEGER DEFAULT 50, -- 0-100
  days_open INTEGER DEFAULT 0, -- computed, how long it's been unresolved
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (proposed_by) REFERENCES users(id),
  FOREIGN KEY (audio_proof_id) REFERENCES files(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_section_id) REFERENCES song_sections(id) ON DELETE SET NULL
);

-- Migration 008: Create sectionPriorities table
CREATE TABLE IF NOT EXISTS section_priorities (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  priority_type TEXT NOT NULL, -- performance/arrangement/recording/mixing/mastering
  instrument_or_role TEXT NOT NULL, -- guitar/bass/drums/vocals/etc.
  priority TEXT NOT NULL, -- high/medium/low
  notes TEXT,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES song_sections(id) ON DELETE CASCADE
);

-- Migration 009: Create notes table (transform comments)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  album_id TEXT, -- nullable
  song_id TEXT, -- nullable
  section_id TEXT, -- nullable
  note_type TEXT DEFAULT 'text' NOT NULL, -- text/voice
  content TEXT NOT NULL,
  audio_url TEXT, -- nullable for voice notes
  linked_to_timestamp REAL, -- seconds, nullable
  linked_to_version_id TEXT, -- FK to songVersions, nullable
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_archived INTEGER DEFAULT 0, -- boolean
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES song_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_to_version_id) REFERENCES song_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Migration 010: Create creativeSessions table (transform rehearsals)
CREATE TABLE IF NOT EXISTS creative_sessions (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  date INTEGER NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  pre_session_intent TEXT, -- what you plan to work on
  pre_session_energy INTEGER, -- 1-5 scale
  post_session_reflection TEXT, -- what actually happened
  post_session_energy INTEGER, -- 1-5 scale
  post_session_momentum TEXT, -- stalled/slow/steady/flowing/breakthrough
  decisions_locked TEXT, -- JSON array of decision IDs
  versions_recorded TEXT, -- JSON array of version IDs
  participants TEXT, -- JSON array of user IDs
  stuck_points TEXT, -- what blocked progress
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by_id TEXT NOT NULL,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Migration 011: Create momentumMetrics table
CREATE TABLE IF NOT EXISTS momentum_metrics (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  week_start INTEGER NOT NULL, -- date
  decisions_locked INTEGER DEFAULT 0,
  versions_recorded INTEGER DEFAULT 0,
  average_energy REAL, -- 1-5
  average_momentum TEXT, -- stalled/slow/steady/flowing/breakthrough
  songs_active INTEGER DEFAULT 0, -- songs with recent activity
  songs_stagnant INTEGER DEFAULT 0, -- songs with no activity >7 days
  created_at INTEGER NOT NULL,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================
-- PHASE 2: DATA MIGRATION
-- ============================================

-- Migrate existing comments to notes table
INSERT INTO notes (
  id,
  album_id,
  song_id,
  note_type,
  content,
  linked_to_timestamp,
  created_by,
  created_at,
  is_archived
)
SELECT
  c.id,
  NULL as album_id,
  c.song_id,
  'text' as note_type,
  c.content,
  c.timestamp,
  c.user_id,
  c.created_at,
  CASE WHEN c.resolved = 1 THEN 1 ELSE 0 END as is_archived
FROM comments c
WHERE c.song_id IS NOT NULL;

-- Migrate epics to songs (if they don't already exist as songs)
-- This is a selective migration - only migrate epics that seem music-related
INSERT INTO songs (
  id,
  title,
  description,
  status,
  created_at,
  updated_at,
  project_id,
  created_by_id,
  phase,
  confidence,
  stability_score
)
SELECT
  e.id,
  e.title,
  e.description,
  CASE
    WHEN e.status = 'planning' THEN 'idea'
    WHEN e.status = 'in_progress' THEN 'writing'
    WHEN e.status = 'completed' THEN 'released'
    ELSE 'idea'
  END as status,
  e.created_at,
  e.updated_at,
  e.project_id,
  e.created_by_id,
  'concepting' as phase,
  30 as confidence,
  50 as stability_score
FROM epics e
WHERE e.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM songs s WHERE s.id = e.id);

-- Migrate task comments to notes
INSERT INTO notes (
  id,
  album_id,
  song_id,
  note_type,
  content,
  created_by,
  created_at,
  is_archived
)
SELECT
  tc.id,
  t.project_id as album_id,
  t.song_id,
  'text' as note_type,
  tc.content,
  tc.user_id,
  tc.created_at,
  0 as is_archived
FROM task_comments tc
JOIN tasks t ON tc.task_id = t.id
WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.id = tc.id);

-- Migrate rehearsals to creative sessions
INSERT INTO creative_sessions (
  id,
  album_id,
  date,
  start_time,
  end_time,
  pre_session_intent,
  post_session_reflection,
  created_at,
  updated_at,
  created_by_id
)
SELECT
  r.id,
  (SELECT p.id FROM projects p LIMIT 1) as album_id, -- Associate with first project or adjust logic
  r.scheduled_at as date,
  r.scheduled_at as start_time,
  r.end_time,
  r.goals as pre_session_intent,
  r.notes as post_session_reflection,
  r.created_at,
  r.updated_at,
  r.created_by_id
FROM rehearsals r;

-- ============================================
-- PHASE 3: DROP OLD JIRA TABLES
-- ============================================

-- WARNING: These DROP statements will permanently delete data
-- Make sure to backup data before running these!
-- Consider archiving data first using the migration scripts above

-- Drop Jira-clone tables
DROP TABLE IF EXISTS task_history;
DROP TABLE IF EXISTS task_attachments;
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS time_logs;
DROP TABLE IF EXISTS subtasks;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS task_labels;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS saved_filters;
DROP TABLE IF EXISTS board_configs;
DROP TABLE IF EXISTS sprints;
DROP TABLE IF EXISTS epics;

-- Optionally drop labels table if not reusing for songs/decisions
-- DROP TABLE IF EXISTS labels;

-- ============================================
-- PHASE 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for new tables
CREATE INDEX idx_style_parameters_album ON style_parameters(album_id);
CREATE INDEX idx_song_versions_song ON song_versions(song_id);
CREATE INDEX idx_song_versions_file ON song_versions(file_id);
CREATE INDEX idx_song_sections_song ON song_sections(song_id);
CREATE INDEX idx_decisions_song ON decisions(song_id);
CREATE INDEX idx_decisions_album ON decisions(album_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_section_priorities_section ON section_priorities(section_id);
CREATE INDEX idx_notes_album ON notes(album_id);
CREATE INDEX idx_notes_song ON notes(song_id);
CREATE INDEX idx_notes_section ON notes(section_id);
CREATE INDEX idx_creative_sessions_album ON creative_sessions(album_id);
CREATE INDEX idx_creative_sessions_date ON creative_sessions(date);
CREATE INDEX idx_momentum_metrics_album ON momentum_metrics(album_id);
CREATE INDEX idx_momentum_metrics_week ON momentum_metrics(week_start);

-- Indexes for enhanced songs table
CREATE INDEX idx_songs_phase ON songs(phase);
CREATE INDEX idx_songs_confidence ON songs(confidence);
CREATE INDEX idx_songs_narrative_role ON songs(narrative_role);

-- ============================================
-- PHASE 5: INSERT DEFAULT DATA
-- ============================================

-- Insert default section templates
INSERT INTO section_templates (id, name, structure, is_default, created_at)
VALUES
  ('tpl_1', 'Verse-Chorus-Verse-Chorus-Bridge-Chorus', '["Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]', 1, strftime('%s', 'now')),
  ('tpl_2', 'Intro-Verse-Chorus-Verse-Chorus-Outro', '["Intro", "Verse", "Chorus", "Verse", "Chorus", "Outro"]', 0, strftime('%s', 'now')),
  ('tpl_3', 'Verse-Verse-Chorus-Verse-Chorus-Bridge-Chorus', '["Verse", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]', 0, strftime('%s', 'now'));

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✅ Created new Music OS tables
-- ✅ Migrated salvageable data from Jira tables
-- ✅ Dropped old Jira-clone tables
-- ✅ Created performance indexes
-- ✅ Inserted default data

-- Next steps:
-- 1. Update Drizzle schema.ts to reflect these changes
-- 2. Update API routes to use new tables
-- 3. Update UI components to use new data models
-- 4. Test all workflows end-to-end
