# Migration Summary: Jira Clone → Music OS

## Quick Reference

### Files Created

1. **sql-migrations.sql** - Complete migration in one file (all phases)
2. **migration-phase-1-create-tables.sql** - Create new tables only
3. **migration-phase-2-alter-tables.sql** - Alter existing tables
4. **migration-phase-3-migrate-data.sql** - Migrate data from old to new
5. **migration-phase-4-drop-old-tables.sql** - Drop old Jira tables (⚠️ destructive)
6. **migration-verification-queries.sql** - Verify migration success
7. **MIGRATION-GUIDE.md** - Detailed migration instructions

## New Database Schema

### New Tables Created

| Table | Purpose |
|-------|---------|
| `style_parameters` | Album-level style parameters with undecided states |
| `song_versions` | Track song demos and recordings with intent |
| `song_sections` | Song structure (intro, verse, chorus, etc.) |
| `section_templates` | Reusable song structure templates |
| `decisions` | Creative decisions (replaces tasks) |
| `section_priorities` | Priority flags per section/instrument |
| `notes` | Timestamped notes (replaces comments) |
| `creative_sessions` | Creative sessions (replaces rehearsals) |
| `momentum_metrics` | Weekly momentum tracking |

### Extended Tables

**Songs table** - Added:
- `phase` (concepting/demo/tracking/mixing/mastering/archived)
- `confidence` (0-100)
- `stability_score` (0-100)
- `last_major_change` (timestamp)
- `narrative_role` (opener/climax/interlude/closer/bonus/cut)
- `artistic_intent` (text)
- `emotional_target` (text)
- `reference_tracks_ids` (JSON)
- `stagnant_since` (timestamp)

**Projects table** - Added:
- `artistic_intent` (album's purpose)
- `emotional_arc` (emotional journey)
- `narrative_theme` (overarching theme)
- `song_count_target` (target # of songs)
- `budget_ceiling` (max budget)
- `timeline_text` (flexible timeline)
- `self_assessment_criteria` (JSON)
- `target_audience` (text)
- `genre_boundaries` (text)
- `instrumental_palette` (JSON)
- `collaborators` (JSON)

### Tables Removed (Phase 4)

| Table | Reason for Removal |
|-------|-------------------|
| `tasks` | Task-centric, anti-creative |
| `subtasks` | Adds complexity, breaks flow |
| `epics` | Jira concept, data migrated to songs |
| `sprints` | Time-boxed iterations don't fit creative work |
| `task_dependencies` | Complexity trap |
| `task_labels` | Replaced by decision types |
| `task_comments` | Migrated to notes |
| `task_attachments` | Migrated to decision proofs |
| `task_history` | Audit pattern kept, not Jira-specific data |
| `time_logs` | Task-level time tracking removed |
| `board_configs` | Kanban boards removed |
| `saved_filters` | Complex filtering removed |

## Data Migration Mapping

| Source | Destination | Criteria |
|--------|-------------|----------|
| `comments` → `notes` | Song comments only | |
| `epics` → `songs` | Music-related epics | New songs created with prefix |
| `task_comments` → `notes` | All task comments | |
| `tasks` → `decisions` | type IN (recording, mixing, mastering, writing) | Creative decisions only |
| `task_attachments` → `decisions.audio_proof_id` | Audio files only | |
| `rehearsals` → `creative_sessions` | All rehearsals | |

## Key Changes by Area

### Conceptual Changes

| Old Concept | New Concept | Why |
|-------------|-------------|-----|
| Tasks | Decisions | Creative work is about decisions, not tasks |
| Story Points | Confidence (0-100) | Emotional certainty matters, not velocity |
| Status (todo/done) | Phase + State | Songs evolve, they're not "done" |
| Sprint | Creative Session | Time-boxed sprints don't fit creative flow |
| Epic | Song | Music-native terminology |
| Velocity | Momentum | Flow and energy matter, not speed |
| Subtask | (removed) | Breaks creative momentum |
| Dependencies | (removed) | Adds complexity, reduces flexibility |

### Database Design Philosophy

**Old (Jira Clone):**
- Task-centric
- Status workflows (todo → done)
- Hierarchical (epic → story → task → subtask)
- Time-tracking focused
- Velocity and burndown charts

**New (Music OS):**
- Decision-centric
- Phase-based with confidence levels
- Flat (album → song → decision)
- Momentum and energy focused
- Undecided is a valid state
- Audio-first

## Schema Statistics

### Before Migration

| Category | Tables |
|----------|--------|
| Jira Concepts | 12 tables (tasks, epics, sprints, subtasks, dependencies, labels, comments, attachments, history, time logs, board configs, filters) |
| Music Concepts | 8 tables (projects, songs, lyrics, arrangements, files, comments, rehearsals, etc.) |
| Infrastructure | 10 tables (users, sessions, files, sharing, notifications, etc.) |

### After Migration

| Category | Tables |
|----------|--------|
| Music OS Core | 9 new tables (style_parameters, song_versions, song_sections, section_templates, decisions, section_priorities, notes, creative_sessions, momentum_metrics) |
| Music Concepts | 8 enhanced tables (projects, songs extended with phase/confidence/etc.) |
| Infrastructure | 10 tables (unchanged) |
| Jira Concepts | 0 tables (all removed) |

## Quick Start Commands

### Test in Staging

```bash
# Backup
sqlite3 staging.db ".backup backup-$(date +%Y%m%d).db"

# Run all phases
sqlite3 staging.db < migration-phase-1-create-tables.sql
sqlite3 staging.db < migration-phase-2-alter-tables.sql
sqlite3 staging.db < migration-phase-3-migrate-data.sql

# Verify
sqlite3 staging.db < migration-verification-queries.sql

# If all good, drop old tables
sqlite3 staging.db < migration-phase-4-drop-old-tables.sql
```

### Production Migration

```bash
# Backup (CRITICAL!)
sqlite3 production.db ".backup backup-production-$(date +%Y%m%d-%H%M%S).db"

# Run complete migration
sqlite3 production.db < sql-migrations.sql

# Verify
sqlite3 production.db < migration-verification-queries.sql
```

## Rollback Plan

```bash
# Restore from backup
sqlite3 production.db ".restore backup-production-TIMESTAMP.db"
```

## Next Steps After Migration

1. **Update Drizzle Schema** (`src/lib/db/schema.ts`)
   - [ ] Add new table definitions
   - [ ] Remove old table definitions
   - [ ] Export new table types

2. **Update API Routes**
   - [ ] Remove: `/api/tasks`, `/api/epics`, `/api/sprints`
   - [ ] Create: `/api/decisions`, `/api/sessions`, `/api/notes`
   - [ ] Update: `/api/songs` to include new fields

3. **Update UI**
   - [ ] Remove: Kanban boards, sprint cards, task lists
   - [ ] Create: Timeline view, decision lifecycle, session tracker
   - [ ] Update: Song cards with confidence/phase

4. **Update Navigation**
   - [ ] Remove: Tasks, Backlog, Epics, Sprints, Roadmap
   - [ ] Add: Albums, Timeline, Sessions, Decisions

5. **Testing**
   - [ ] Create test album
   - [ ] Add songs with confidence/phase
   - [ ] Upload demo versions
   - [ ] Create decisions
   - [ ] Track creative session
   - [ ] View timeline

## Verification Checklist

After running migrations:

- [ ] All 9 new tables created
- [ ] Songs table has 9 new columns
- [ ] Projects table has 11 new columns
- [ ] Data migrated from comments to notes
- [ ] Data migrated from tasks to decisions
- [ ] Data migrated from rehearsals to creative_sessions
- [ ] All indexes created
- [ ] Default section templates inserted
- [ ] No orphaned foreign keys
- [ ] Old Jira tables dropped (if Phase 4 run)
- [ ] Application works with new schema

## Success Metrics

**Migration is successful when:**

1. ✅ All new tables exist and are populated
2. ✅ Songs have phase and confidence values
3. ✅ Old comments accessible as notes
4. ✅ Creative decisions visible in new format
5. ✅ Sessions show intent and reflection
6. ✅ No Jira terminology in database
7. ✅ Application functions with new schema
8. ✅ No data loss (critical data preserved)

## Support

- See **MIGRATION-GUIDE.md** for detailed instructions
- See **TODO.md** for philosophical background
- Run **migration-verification-queries.sql** to check status
- Keep backups of every phase

---

**Remember**: This is a replacement, not an extension. Music is not made with tasks—it's made with decisions, iterations, and moments of clarity.
