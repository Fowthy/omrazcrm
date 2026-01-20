# Database Migration Guide: Jira Clone → Music OS

This guide walks you through migrating your omrazcrm database from a Jira-clone task management system to a music-native creative operating system.

## Overview

The migration is broken into 4 phases for safety and reversibility:

1. **Phase 1**: Create new tables (safe, no data loss)
2. **Phase 2**: Alter existing tables (safe, only adds columns)
3. **Phase 3**: Migrate data from old to new tables (safe, copies data)
4. **Phase 4**: Drop old Jira tables (⚠️ DESTRUCTIVE)

## Prerequisites

- [ ] Full database backup created
- [ ] Development/staging environment for testing
- [ ] Understanding of your current data volume
- [ ] SQLite command line tools or database GUI

## Quick Start (All Phases)

If you want to run all migrations at once (after testing in staging):

```bash
# Create backup first!
sqlite3 your-database.db ".backup backup-$(date +%Y%m%d-%H%M%S).db"

# Run complete migration
sqlite3 your-database.db < sql-migrations.sql
```

## Recommended: Phased Approach

### Step 1: Backup Your Database

```bash
# SQLite backup
sqlite3 path/to/database.db ".backup backup-before-migration.db"

# Alternative: Copy file
cp path/to/database.db path/to/database-backup-$(date +%Y%m%d).db
```

### Step 2: Phase 1 - Create New Tables

This phase creates all new Music OS tables without touching existing data.

```bash
sqlite3 your-database.db < migration-phase-1-create-tables.sql
```

**What this does:**
- Creates `style_parameters` table
- Creates `song_versions` table
- Creates `song_sections` table
- Creates `section_templates` table with default templates
- Creates `decisions` table
- Creates `section_priorities` table
- Creates `notes` table
- Creates `creative_sessions` table
- Creates `momentum_metrics` table
- Creates indexes for performance

**Verify:**
```sql
SELECT name FROM sqlite_master
WHERE type='table'
AND name IN ('style_parameters', 'song_versions', 'song_sections', 'decisions', 'notes', 'creative_sessions', 'momentum_metrics');
```

Expected: 7 rows

### Step 3: Phase 2 - Alter Existing Tables

This phase adds new columns to `songs` and `projects` tables.

```bash
sqlite3 your-database.db < migration-phase-2-alter-tables.sql
```

**What this does:**
- Adds Music OS fields to `songs` table (phase, confidence, stability_score, etc.)
- Adds album-centric fields to `projects` table (artistic_intent, emotional_arc, etc.)
- Creates indexes on new columns

**Verify:**
```sql
PRAGMA table_info(songs);
PRAGMA table_info(projects);
```

Check for new columns like `phase`, `confidence`, `artistic_intent`, etc.

### Step 4: Phase 3 - Migrate Data

This phase copies data from old Jira tables to new Music OS tables.

```bash
sqlite3 your-database.db < migration-phase-3-migrate-data.sql
```

**What this does:**
- Migrates `comments` → `notes`
- Migrates `epics` → `songs` (selective)
- Migrates `task_comments` → `notes`
- Migrates suitable `tasks` → `decisions`
- Migrates `task_attachments` → decision audio proofs
- Migrates `rehearsals` → `creative_sessions`
- Sets default confidence and phase values for existing songs

**Verify:**
```sql
-- Check notes migrated
SELECT COUNT(*) FROM notes;

-- Check decisions created
SELECT COUNT(*) FROM decisions;

-- Check creative sessions
SELECT COUNT(*) FROM creative_sessions;

-- Sample some migrated data
SELECT * FROM notes LIMIT 5;
SELECT * FROM decisions LIMIT 5;
```

### Step 5: Test Your Application

Before dropping old tables, thoroughly test the application:

- [ ] Can view albums (projects)?
- [ ] Can view songs with new fields?
- [ ] Can see migrated notes?
- [ ] Can see migrated decisions?
- [ ] Can see creative sessions?
- [ ] All critical workflows work?

### Step 6: Phase 4 - Drop Old Tables (⚠️ DESTRUCTIVE)

**⚠️ WARNING: This permanently deletes old Jira tables!**

Only proceed if:
- [ ] Phases 1-3 completed successfully
- [ ] Application tested and working
- [ ] Fresh backup created
- [ ] You're absolutely sure

```bash
# Create one more backup
sqlite3 your-database.db ".backup backup-before-drop-$(date +%Y%m%d-%H%M%S).db"

# Drop old tables
sqlite3 your-database.db < migration-phase-4-drop-old-tables.sql
```

**What this does:**
- Drops `task_history`
- Drops `task_attachments`
- Drops `task_comments`
- Drops `time_logs`
- Drops `subtasks`
- Drops `task_dependencies`
- Drops `task_labels`
- Drops `tasks`
- Drops `saved_filters`
- Drops `sprints`
- Drops `epics`
- Drops `board_configs`

**Verify:**
```sql
SELECT name FROM sqlite_master
WHERE type='table'
AND name IN ('tasks', 'epics', 'sprints', 'task_comments', 'task_attachments', 'board_configs');
```

Expected: 0 rows (empty result)

## Data Mapping Reference

| Old Table | New Table | Notes |
|-----------|-----------|-------|
| `epics` | `songs` | Selective migration, music-related epics only |
| `tasks` (recording/mixing/writing) | `decisions` | Only creative decision tasks |
| `task_comments` | `notes` | All task comments migrated |
| `comments` | `notes` | Song comments migrated |
| `task_attachments` (audio) | decisions.audio_proof_id | Only audio attachments |
| `rehearsals` | `creative_sessions` | All rehearsals migrated |
| `projects` | `projects` (enhanced) | Columns added, not replaced |
| `songs` | `songs` (enhanced) | Columns added, not replaced |

## What Gets Deleted (Phase 4)

The following Jira-clone concepts are removed entirely:

- ❌ Story points
- ❌ Velocity metrics
- ❌ Task dependencies
- ❌ Subtasks
- ❌ Time logs (task-level)
- ❌ Sprints
- ❌ Kanban boards
- ❌ Saved filters
- ❌ Task history/audit logs

## Rollback Plan

If something goes wrong:

```bash
# Restore from backup
cp backup-before-migration.db your-database.db

# Or with SQLite
sqlite3 your-database.db ".restore backup-before-migration.db"
```

## Post-Migration Tasks

After successful migration:

1. **Update Drizzle Schema** (`src/lib/db/schema.ts`)
   - Add new table definitions
   - Add new column definitions
   - Remove old table exports

2. **Update API Routes**
   - Remove routes for tasks, epics, sprints
   - Create routes for decisions, sessions, notes

3. **Update UI Components**
   - Remove Jira components (kanban, sprint cards, etc.)
   - Create Music OS components (audio players, timeline, etc.)

4. **Update Navigation**
   - Remove: Tasks, Backlog, Epics, Sprints, Roadmap
   - Add: Albums, Songs, Timeline, Sessions, Decisions

5. **Test Workflows**
   - Album creation
   - Song management
   - Version uploads
   - Decision lifecycle
   - Session tracking

## Troubleshooting

### "Foreign key constraint failed"
- Ensure Phase 1 runs before Phase 3
- Check that referenced tables exist

### "Table already exists"
- Safe to ignore if using `CREATE TABLE IF NOT EXISTS`
- Or drop the table and re-run

### "Duplicate key" errors in Phase 3
- Safe to ignore - means data already migrated
- Check `WHERE NOT EXISTS` clauses

### Migration seems stuck
- Check for locks on database
- Ensure no other processes accessing database
- Try running phases individually

## Verification Queries

After migration, run these to verify success:

```sql
-- Count new tables
SELECT COUNT(*) FROM sqlite_master
WHERE type='table'
AND name IN ('style_parameters', 'song_versions', 'decisions', 'notes', 'creative_sessions');
-- Expected: 5

-- Check songs have new columns
SELECT phase, confidence, narrative_role FROM songs LIMIT 1;

-- Check projects have new columns
SELECT artistic_intent, emotional_arc FROM projects LIMIT 1;

-- Count migrated data
SELECT
  (SELECT COUNT(*) FROM notes) as notes_count,
  (SELECT COUNT(*) FROM decisions) as decisions_count,
  (SELECT COUNT(*) FROM creative_sessions) as sessions_count;

-- Verify old tables gone (after Phase 4)
SELECT name FROM sqlite_master
WHERE type='table'
AND name LIKE 'task%' OR name IN ('epics', 'sprints', 'board_configs');
-- Expected: 0 rows
```

## Need Help?

- Review TODO.md for conceptual understanding
- Check existing data before migration
- Test in staging environment first
- Keep backups of every phase

## Success Criteria

✅ Migration successful when:
- All 4 phases complete without errors
- Application works with new schema
- No references to old Jira tables in code
- All critical data preserved and accessible
- Old Jira UI components removed

---

**Remember**: This is a **replacement**, not an extension. Every Jira concept must be removed to align with the creative process.
