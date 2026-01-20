-- ============================================
-- MIGRATION PHASE 1: CREATE NEW TABLES ONLY
-- Safe to run - creates new tables without dropping anything
-- ============================================

-- Create styleParameters table
CREATE TABLE IF NOT EXISTS style_parameters (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  start_value TEXT,
  end_value TEXT,
  current_state TEXT DEFAULT 'undecided' NOT NULL,
  evolution_notes TEXT,
  locked INTEGER DEFAULT 0,
  locked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create songVersions table
CREATE TABLE IF NOT EXISTS song_versions (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  version_intent TEXT,
  recorded_at INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  duration_seconds REAL,
  is_main_version INTEGER DEFAULT 0,
  listen_count INTEGER DEFAULT 0,
  last_listened_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create songSections table
CREATE TABLE IF NOT EXISTS song_sections (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  start_time REAL,
  end_time REAL,
  order_index INTEGER NOT NULL,
  notes TEXT,
  reference_version_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (reference_version_id) REFERENCES song_versions(id) ON DELETE SET NULL
);

-- Create sectionTemplates table
CREATE TABLE IF NOT EXISTS section_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  structure TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Create decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  song_id TEXT,
  album_id TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  status TEXT DEFAULT 'proposed' NOT NULL,
  proposed_at INTEGER NOT NULL,
  tested_at INTEGER,
  locked_at INTEGER,
  reopened_at INTEGER,
  proposed_by TEXT NOT NULL,
  audio_proof_id TEXT,
  linked_section_id TEXT,
  instrument_or_role TEXT,
  outcome TEXT,
  confidence INTEGER DEFAULT 50,
  days_open INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (proposed_by) REFERENCES users(id),
  FOREIGN KEY (audio_proof_id) REFERENCES files(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_section_id) REFERENCES song_sections(id) ON DELETE SET NULL
);

-- Create sectionPriorities table
CREATE TABLE IF NOT EXISTS section_priorities (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  priority_type TEXT NOT NULL,
  instrument_or_role TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES song_sections(id) ON DELETE CASCADE
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  album_id TEXT,
  song_id TEXT,
  section_id TEXT,
  note_type TEXT DEFAULT 'text' NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,
  linked_to_timestamp REAL,
  linked_to_version_id TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_archived INTEGER DEFAULT 0,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES song_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_to_version_id) REFERENCES song_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create creativeSessions table
CREATE TABLE IF NOT EXISTS creative_sessions (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  date INTEGER NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  pre_session_intent TEXT,
  pre_session_energy INTEGER,
  post_session_reflection TEXT,
  post_session_energy INTEGER,
  post_session_momentum TEXT,
  decisions_locked TEXT,
  versions_recorded TEXT,
  participants TEXT,
  stuck_points TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by_id TEXT NOT NULL,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Create momentumMetrics table
CREATE TABLE IF NOT EXISTS momentum_metrics (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  week_start INTEGER NOT NULL,
  decisions_locked INTEGER DEFAULT 0,
  versions_recorded INTEGER DEFAULT 0,
  average_energy REAL,
  average_momentum TEXT,
  songs_active INTEGER DEFAULT 0,
  songs_stagnant INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (album_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_style_parameters_album ON style_parameters(album_id);
CREATE INDEX IF NOT EXISTS idx_song_versions_song ON song_versions(song_id);
CREATE INDEX IF NOT EXISTS idx_song_versions_file ON song_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_song_sections_song ON song_sections(song_id);
CREATE INDEX IF NOT EXISTS idx_decisions_song ON decisions(song_id);
CREATE INDEX IF NOT EXISTS idx_decisions_album ON decisions(album_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_section_priorities_section ON section_priorities(section_id);
CREATE INDEX IF NOT EXISTS idx_notes_album ON notes(album_id);
CREATE INDEX IF NOT EXISTS idx_notes_song ON notes(song_id);
CREATE INDEX IF NOT EXISTS idx_notes_section ON notes(section_id);
CREATE INDEX IF NOT EXISTS idx_creative_sessions_album ON creative_sessions(album_id);
CREATE INDEX IF NOT EXISTS idx_creative_sessions_date ON creative_sessions(date);
CREATE INDEX IF NOT EXISTS idx_momentum_metrics_album ON momentum_metrics(album_id);
CREATE INDEX IF NOT EXISTS idx_momentum_metrics_week ON momentum_metrics(week_start);

-- Insert default section templates
INSERT OR IGNORE INTO section_templates (id, name, structure, is_default, created_at)
VALUES
  ('tpl_vcvcbc', 'Verse-Chorus-Verse-Chorus-Bridge-Chorus', '["Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]', 1, strftime('%s', 'now')),
  ('tpl_ivcvco', 'Intro-Verse-Chorus-Verse-Chorus-Outro', '["Intro", "Verse", "Chorus", "Verse", "Chorus", "Outro"]', 0, strftime('%s', 'now')),
  ('tpl_vvcvcbc', 'Verse-Verse-Chorus-Verse-Chorus-Bridge-Chorus', '["Verse", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]', 0, strftime('%s', 'now'));
