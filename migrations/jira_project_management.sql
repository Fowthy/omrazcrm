-- ============================================
-- JIRA-LIKE PROJECT MANAGEMENT SYSTEM MIGRATION
-- ============================================

-- Create Board Configurations table (must be before projects due to reference)
CREATE TABLE IF NOT EXISTS board_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'kanban', -- kanban, scrum, timeline, calendar
  columns TEXT NOT NULL, -- JSON: [{ id, name, status, color, limit }]
  swimlanes TEXT, -- JSON: { groupBy: 'assignee' | 'priority' | 'epic' }
  project_id TEXT, -- Reference to projects - no FK to avoid circular dependency
  is_default INTEGER DEFAULT 0,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Add new fields to projects table
ALTER TABLE projects ADD COLUMN key TEXT;
ALTER TABLE projects ADD COLUMN start_date INTEGER;
ALTER TABLE projects ADD COLUMN completed_date INTEGER;
ALTER TABLE projects ADD COLUMN budget REAL;
ALTER TABLE projects ADD COLUMN spent_budget REAL DEFAULT 0;
ALTER TABLE projects ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN default_assignee_id TEXT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN lead_id TEXT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN board_config_id TEXT REFERENCES board_configs(id);

-- Create unique index on project key
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_key ON projects(key);

-- Create Epics table
CREATE TABLE IF NOT EXISTS epics (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- planning, in_progress, completed, on_hold, cancelled
  color TEXT DEFAULT '#8B5CF6',
  start_date INTEGER,
  target_date INTEGER,
  completed_date INTEGER,
  progress INTEGER DEFAULT 0,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by_id TEXT NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_epics_project_id ON epics(project_id);
CREATE INDEX IF NOT EXISTS idx_epics_status ON epics(status);

-- Create Sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- planning, active, completed
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by_id TEXT NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON sprints(start_date, end_date);

-- Add new fields to tasks table
ALTER TABLE tasks ADD COLUMN key TEXT;
ALTER TABLE tasks ADD COLUMN type TEXT NOT NULL DEFAULT 'task'; -- story, task, bug, recording, mixing, mastering, writing, marketing, video, live_show
ALTER TABLE tasks ADD COLUMN story_points INTEGER;
ALTER TABLE tasks ADD COLUMN time_estimate INTEGER;
ALTER TABLE tasks ADD COLUMN time_spent INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN start_date INTEGER;
ALTER TABLE tasks ADD COLUMN completed_date INTEGER;
ALTER TABLE tasks ADD COLUMN epic_id TEXT REFERENCES epics(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN parent_task_id TEXT; -- Self-reference (no FK to avoid circular dependency)
ALTER TABLE tasks ADD COLUMN reporter_id TEXT NOT NULL REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;

-- Create unique index on task key
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_key ON tasks(key);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_epic_id ON tasks(epic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- Create Labels table
CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#gray',
  description TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, -- null = global label
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_labels_project_id ON labels(project_id);

-- Create Task Labels junction table (many-to-many)
CREATE TABLE IF NOT EXISTS task_labels (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_labels_unique ON task_labels(task_id, label_id);

-- Create Task Dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'blocks', -- blocks, is_blocked_by, relates_to
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Create Time Logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  time_spent INTEGER NOT NULL, -- Minutes
  description TEXT,
  logged_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);

-- Create Project Members table
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- project_lead, developer, designer, qa, musician, engineer, producer
  joined_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_members_unique ON project_members(project_id, user_id);

-- Create Saved Filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filter_config TEXT NOT NULL, -- JSON: { status: [], priority: [], assignee: [], etc. }
  is_public INTEGER DEFAULT 0,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, -- null = global
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_project_id ON saved_filters(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_created_by ON saved_filters(created_by_id);

-- Create Task Comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  parent_id TEXT, -- For threaded comments
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_id);

-- Create Task Attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_file_id ON task_attachments(file_id);

-- Create Task History table (audit log)
CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  field TEXT NOT NULL, -- status, assignee, priority, etc.
  old_value TEXT,
  new_value TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);

-- ============================================
-- DATA MIGRATION HELPERS
-- ============================================

-- Generate keys for existing projects (if any)
-- UPDATE projects SET key = UPPER(SUBSTR(REPLACE(name, ' ', ''), 1, 3)) WHERE key IS NULL;

-- Generate keys for existing tasks (if any)
-- UPDATE tasks SET key = 'TASK-' || id WHERE key IS NULL;

-- Set default reporter_id for existing tasks (use created_by_id)
-- UPDATE tasks SET reporter_id = created_by_id WHERE reporter_id IS NULL;
