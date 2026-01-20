-- ============================================
-- MIGRATION PHASE 2: ALTER EXISTING TABLES
-- Adds new columns to projects and songs tables
-- Safe to run - only adds columns, doesn't drop anything
-- ============================================

-- Extend songs table with new Music OS fields
ALTER TABLE songs ADD COLUMN phase TEXT DEFAULT 'concepting';
ALTER TABLE songs ADD COLUMN confidence INTEGER DEFAULT 50;
ALTER TABLE songs ADD COLUMN stability_score INTEGER DEFAULT 50;
ALTER TABLE songs ADD COLUMN last_major_change INTEGER;
ALTER TABLE songs ADD COLUMN narrative_role TEXT;
ALTER TABLE songs ADD COLUMN artistic_intent TEXT;
ALTER TABLE songs ADD COLUMN emotional_target TEXT;
ALTER TABLE songs ADD COLUMN reference_tracks_ids TEXT;
ALTER TABLE songs ADD COLUMN stagnant_since INTEGER;

-- Extend projects table for album-centric workflow
ALTER TABLE projects ADD COLUMN artistic_intent TEXT;
ALTER TABLE projects ADD COLUMN emotional_arc TEXT;
ALTER TABLE projects ADD COLUMN narrative_theme TEXT;
ALTER TABLE projects ADD COLUMN song_count_target INTEGER;
ALTER TABLE projects ADD COLUMN budget_ceiling REAL;
ALTER TABLE projects ADD COLUMN timeline_text TEXT;
ALTER TABLE projects ADD COLUMN self_assessment_criteria TEXT;
ALTER TABLE projects ADD COLUMN target_audience TEXT;
ALTER TABLE projects ADD COLUMN genre_boundaries TEXT;
ALTER TABLE projects ADD COLUMN instrumental_palette TEXT;
ALTER TABLE projects ADD COLUMN collaborators TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_songs_phase ON songs(phase);
CREATE INDEX IF NOT EXISTS idx_songs_confidence ON songs(confidence);
CREATE INDEX IF NOT EXISTS idx_songs_narrative_role ON songs(narrative_role);
