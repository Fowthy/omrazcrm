-- ============================================
-- MIGRATION PHASE 3: MIGRATE EXISTING DATA
-- Copies data from old Jira tables to new Music OS tables
-- Safe to run - only copies data, doesn't delete anything
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
  'note_' || c.id as id,
  NULL as album_id,
  c.song_id,
  'text' as note_type,
  c.content,
  c.timestamp,
  c.user_id,
  c.created_at,
  CASE WHEN c.resolved = 1 THEN 1 ELSE 0 END as is_archived
FROM comments c
WHERE c.song_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM notes n WHERE n.id = 'note_' || c.id);

-- Migrate epics to songs (selective - only music-related ones)
-- Only migrate epics that don't already exist as songs
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
  'song_from_epic_' || e.id as id,
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
  CASE
    WHEN e.status = 'planning' THEN 'concepting'
    WHEN e.status = 'in_progress' THEN 'demo'
    WHEN e.status = 'completed' THEN 'mastering'
    ELSE 'concepting'
  END as phase,
  30 as confidence,
  50 as stability_score
FROM epics e
WHERE e.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM songs s WHERE s.id = 'song_from_epic_' || e.id);

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
  'note_task_' || tc.id as id,
  t.project_id as album_id,
  t.song_id,
  'text' as note_type,
  tc.content,
  tc.user_id,
  tc.created_at,
  0 as is_archived
FROM task_comments tc
JOIN tasks t ON tc.task_id = t.id
WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.id = 'note_task_' || tc.id);

-- Migrate suitable tasks to decisions
-- Only migrate tasks that seem like creative decisions (recording, mixing, writing types)
INSERT INTO decisions (
  id,
  song_id,
  album_id,
  decision_type,
  question,
  context,
  status,
  proposed_at,
  locked_at,
  proposed_by,
  outcome,
  confidence,
  created_at,
  updated_at
)
SELECT
  'decision_' || t.id as id,
  t.song_id,
  t.project_id as album_id,
  CASE
    WHEN t.type = 'recording' THEN 'performance'
    WHEN t.type = 'mixing' THEN 'sonic'
    WHEN t.type = 'mastering' THEN 'production'
    WHEN t.type = 'writing' THEN 'lyrical'
    ELSE 'arrangement'
  END as decision_type,
  t.title as question,
  t.description as context,
  CASE
    WHEN t.status = 'done' THEN 'locked'
    WHEN t.status = 'in_progress' THEN 'testing'
    WHEN t.status = 'review' THEN 'testing'
    ELSE 'proposed'
  END as status,
  COALESCE(t.start_date, t.created_at) as proposed_at,
  t.completed_date as locked_at,
  t.reporter_id as proposed_by,
  CASE WHEN t.status = 'done' THEN 'Completed: ' || COALESCE(t.description, t.title) ELSE NULL END as outcome,
  CASE
    WHEN t.status = 'done' THEN 80
    WHEN t.status = 'in_progress' THEN 50
    ELSE 30
  END as confidence,
  t.created_at,
  t.updated_at
FROM tasks t
WHERE t.type IN ('recording', 'mixing', 'mastering', 'writing')
  AND t.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM decisions d WHERE d.id = 'decision_' || t.id);

-- Migrate task attachments to decision audio proofs (only audio files)
UPDATE decisions
SET audio_proof_id = (
  SELECT ta.file_id
  FROM task_attachments ta
  JOIN files f ON ta.file_id = f.id
  JOIN tasks t ON ta.task_id = t.id
  WHERE decisions.id = 'decision_' || t.id
    AND f.type = 'audio'
  LIMIT 1
)
WHERE audio_proof_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM task_attachments ta
    JOIN files f ON ta.file_id = f.id
    JOIN tasks t ON ta.task_id = t.id
    WHERE decisions.id = 'decision_' || t.id
      AND f.type = 'audio'
  );

-- Migrate rehearsals to creative sessions
INSERT INTO creative_sessions (
  id,
  album_id,
  date,
  start_time,
  end_time,
  pre_session_intent,
  post_session_reflection,
  participants,
  created_at,
  updated_at,
  created_by_id
)
SELECT
  'session_' || r.id as id,
  COALESCE(
    (SELECT p.id FROM projects p WHERE p.type IN ('album', 'ep', 'single') LIMIT 1),
    (SELECT p.id FROM projects p LIMIT 1)
  ) as album_id,
  r.scheduled_at as date,
  r.scheduled_at as start_time,
  r.end_time,
  r.goals as pre_session_intent,
  r.notes as post_session_reflection,
  (
    SELECT json_group_array(ra.user_id)
    FROM rehearsal_attendees ra
    WHERE ra.rehearsal_id = r.id
  ) as participants,
  r.created_at,
  r.updated_at,
  r.created_by_id
FROM rehearsals r
WHERE NOT EXISTS (SELECT 1 FROM creative_sessions cs WHERE cs.id = 'session_' || r.id);

-- Update songs confidence based on status
UPDATE songs
SET confidence = CASE
  WHEN status = 'released' THEN 90
  WHEN status = 'mastering' THEN 80
  WHEN status = 'mixing' THEN 70
  WHEN status = 'recording' THEN 60
  WHEN status = 'writing' THEN 40
  WHEN status = 'idea' THEN 20
  ELSE 50
END
WHERE confidence = 50; -- Only update default values

-- Update songs phase to match status
UPDATE songs
SET phase = CASE
  WHEN status = 'released' THEN 'mastering'
  WHEN status = 'mastering' THEN 'mastering'
  WHEN status = 'mixing' THEN 'mixing'
  WHEN status = 'recording' THEN 'tracking'
  WHEN status = 'writing' THEN 'demo'
  WHEN status = 'idea' THEN 'concepting'
  ELSE 'concepting'
END
WHERE phase = 'concepting'; -- Only update default values
