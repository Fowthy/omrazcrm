# omrazcrm → Music OS Refactor

**Purpose**: Transform omrazcrm from a Jira-style task management system into a music-native creative operating system for making albums.

**Core Principle**: This is a **replacement**, not an extension. Jira-clone concepts violate the creative process and must be removed.

---

## 🚀 TRANSFORMATION STATUS (Updated: 2026-01-20)

### ✅ COMPLETED PHASES

**Phase 0: Audit & Understanding** - COMPLETE ✓
- Audited entire codebase and database schema
- Identified all Jira concepts and Music OS opportunities
- Created comprehensive conceptual mappings
- Documented forbidden patterns

**Phase 1: Conceptual Reset & Deprecation** - COMPLETE ✓
- Removed all Jira UI pages (/tasks, /backlog, /epics, /sprints, /roadmap)
- Removed all Jira API routes
- Deleted Jira-specific components
- Updated navigation to Music OS links

**Phase 2: Core Primitive Introduction** - COMPLETE ✓
- Created all 9 new Music OS database tables
- Extended songs and projects tables with new fields
- Built all API routes for new primitives
- Created UI pages for decisions, sessions, notes, timeline

**Phase 3: Data Model Refactor** - COMPLETE ✓
- Created 9 new Music OS tables in schema
- Extended songs table with 9 new fields
- Extended projects table with 11 new album-centric fields
- Removed 12 Jira tables from schema
- Created comprehensive SQL migration suite (4 phased files + verification)
- ✅ Database migrations run in production (Turso)
- ✅ All Jira tables dropped

**Phase 4: UX & Product Redesign** - COMPLETE ✓
- Created 4 new Music OS pages (decisions, sessions, notes, timeline)
- Updated sidebar navigation with Music OS links (no Jira links)
- Built 4 complete API route sets with full CRUD
- Integrated NextAuth session handling
- Fixed all build errors (Next.js 15+ async params, calendar API)
- ✅ Added working "New Decision" dialog with form
- ✅ Added working "New Session" dialog with form
- ✅ Added working "New Note" dialog with form

### 📊 Statistics

- **Files Modified**: 30+
- **Files Deleted**: 18 (17 Jira files + 1 obsolete script)
- **Files Created**: 21 (migrations, APIs, UI pages, docs)
- **Lines Added**: ~3,200+
- **Lines Removed**: ~4,100+
- **New Database Tables**: 9
- **Removed Database Tables**: 12
- **New API Routes**: 5 complete sets (decisions, sessions, notes, song-versions, calendar)
- **New UI Pages**: 4 functional pages with working create forms
- **Build Status**: ✅ Passing

### 🎯 REMAINING WORK

**High Priority:**
1. ~~Run database migrations in production~~ ✅ Done
2. ~~Create API endpoints for new primitives~~ ✅ Done
3. ~~Enhance UI pages with forms and workflows~~ ✅ Basic forms done
4. Build audio player component with waveform
5. Enhance timeline view with playable events

**Medium Priority:**
6. Song version management UI (upload flow)
7. Decision status transitions UI (propose → test → lock)
8. Session end/reflection form
9. Momentum metrics dashboard widget

**Low Priority:**
10. Style parameters UI
11. Section editor with timestamp sync
12. Voice notes recording
13. Advanced search and filtering

See **MUSIC-OS-TRANSFORMATION.md** for complete detailed documentation.

---

## Philosophical Reset

**What this tool IS:**
- Decision-centric, not task-centric
- Audio-first, not text-first
- Time-based (calendar/timeline), not status-based
- Designed to preserve creative momentum
- Built to externalize intent, uncertainty, and stylistic direction

**What this tool is NOT:**
- ❌ Not a task tracker
- ❌ Not a Jira or Notion clone
- ❌ Not a DAW
- ❌ Not a generic CRM

**Core Principles:**
1. Decisions matter more than tasks
2. Listening matters more than reading
3. Undecided is valid data
4. Backtracking is expected
5. Progress must be emotionally visible
6. Cognitive load must be minimized
7. Must feel usable at 2am after a bad take

---

## Phase 0: Audit & Understanding ✅ COMPLETED

### Existing Codebase Audit

- [x] **Read and document current database schema** (`src/lib/db/schema.ts`)
  - ✅ Audited: 789 lines, mix of music-specific and Jira-clone tables

- [x] **Identify all Jira-clone concepts currently implemented**
  - ✅ Found: `epics`, `sprints`, `tasks`, `subtasks`, `taskDependencies`, `taskLabels`, `timeLogs`, `taskComments`, `taskAttachments`, `taskHistory`, `savedFilters`, `boardConfigs`
  - ✅ Found: Status workflows (todo/in_progress/review/done/blocked)
  - ✅ Found: Story points, time tracking, priorities, labels
  - ✅ Found: Kanban boards with drag & drop

- [x] **Identify music-specific concepts that align with new direction**
  - ✅ Can reuse: `projects` (becomes Albums), `songs`, `lyrics`, `arrangements`, `songCredits`, `files`, `fileVersions`
  - ✅ Can transform: `rehearsals` → Sessions, `comments` (with timestamps) → timestamped notes
  - ✅ Kept for later: `setlists`, `shows`, `tours` (live performance tracking)

- [x] **Identify infrastructure that can be reused**
  - ✅ Authentication (NextAuth v5)
  - ✅ File upload/storage system
  - ✅ Database connection (Drizzle + Turso)
  - ✅ API route structure
  - ✅ UI component library (Radix UI)
  - ✅ Dark theme and design system

- [x] **Map existing data volume and migration complexity**
  - ✅ Created comprehensive migration scripts with data preservation strategy

### Conceptual Mapping

- [x] **Create explicit mapping of old → new concepts**
  - ✅ Project → Album / Creative Project
  - ✅ Epic → Song
  - ✅ Story/Task → Decision
  - ✅ Task → Action / Session Intent
  - ✅ Status workflows → Song phases + Decision lifecycles
  - ✅ Sprint/Rehearsal → Creative Session
  - ✅ Velocity → Momentum + Stability
  - ✅ Subtask → deleted entirely
  - ✅ Dependencies → deleted (complexity trap)
  - ✅ Time logs → Session duration (simplified)
  - ✅ Story points → deleted entirely

- [x] **Document what will NOT be rebuilt**
  - ✅ No story points or velocity metrics
  - ✅ No task dependencies (complexity trap)
  - ✅ No subtasks (anti-momentum)
  - ✅ No sprints as time-boxed iterations
  - ✅ No "done" status (music is never truly done, only released)
  - ✅ No burndown charts (wrong mental model)
  - ✅ No task hierarchies beyond Album → Song → Decision
  - ✅ No Kanban boards (wrong paradigm for creative work)

---

## Phase 1: Conceptual Reset & Deprecation ✅ COMPLETED

### Remove Jira-Clone Mental Models

- [x] **Audit all pages in `(dashboard)` directory**
  - ✅ Deleted: `/tasks`, `/backlog`, `/epics`, `/sprints`, `/roadmap`
  - ✅ Kept and enhanced: `/projects`, `/calendar`

- [x] **Create deprecation plan for Jira tables**
  - [x] `epics` → archived and deleted
  - [x] `sprints` → archived and deleted
  - [x] `tasks` → archived and deleted
  - [x] `subtasks` → deleted entirely
  - [x] `taskDependencies` → deleted entirely
  - [x] `taskLabels` → deleted
  - [x] `timeLogs` → deleted
  - [x] `taskComments` → deleted (replaced by notes)
  - [x] `taskAttachments` → deleted
  - [x] `taskHistory` → deleted
  - [x] `boardConfigs` → deleted entirely
  - [x] `savedFilters` → deleted entirely

- [x] **Create data export/archive strategy**
  - ✅ Migration scripts handle data preservation
  - ✅ migration-phase-3-migrate-data.sql migrates relevant data

- [x] **Remove task-centric UI components**
  - [x] Deleted kanban board components
  - [x] Deleted sprint planning UI
  - [x] Deleted epic cards/progress bars
  - [x] Deleted story point pickers
  - [x] Deleted status dropdown with Jira statuses
  - [x] Deleted task priority selectors

### Protect Against Jira Regression

- [x] **Create anti-pattern checklist for code reviews**
  - ✅ Documented in this file and MUSIC-OS-TRANSFORMATION.md

- [x] **Document forbidden concepts in project README**
  - ✅ Added "What We Don't Build" section

---

## Phase 2: Core Primitive Introduction ✅ COMPLETED

### New Data Models

- [x] **Album System** (using existing `projects` table)
  - [x] Extended `projects` table with album-centric fields:
    - ✅ artisticIntent, emotionalArc, narrativeTheme
    - ✅ songCountTarget, budgetCeiling, timelineText
    - ✅ selfAssessmentCriteria, targetAudience
    - ✅ genreBoundaries, instrumentalPalette, collaborators
  - [x] Created database migration
  - [x] TypeScript types in schema
  - [x] API endpoints: GET /api/projects, POST /api/projects, PATCH /api/projects/[id]

- [x] **Style & Aesthetic Parameter System**
  - [x] Created `styleParameters` table
    - ✅ albumId, dimension, parameterName
    - ✅ startValue, endValue, currentState
    - ✅ evolutionNotes, locked, lockedAt
  - [ ] Create UI for parameter definition and editing (deferred)

- [x] **Song System** (enhanced existing `songs` table)
  - [x] Added new fields to `songs`:
    - ✅ phase (concepting/demo/tracking/mixing/mastering/archived)
    - ✅ confidence (0-100)
    - ✅ stabilityScore (0-100)
    - ✅ lastMajorChange
    - ✅ narrativeRole (opener/climax/interlude/closer/bonus/cut)
    - ✅ artisticIntent
    - ✅ emotionalTarget
    - ✅ referenceTracksIds
    - ✅ stagnantSince
  - [x] Created migration
  - [ ] Update song API to expose new fields in UI (partial)

- [x] **Demo & Version System**
  - [x] Created `songVersions` table
    - ✅ songId, fileId, versionNumber, versionIntent
    - ✅ recordedAt, uploadedBy, durationSeconds
    - ✅ isMainVersion, listenCount, lastListenedAt
  - [x] API endpoints: GET/POST /api/song-versions
  - [ ] Build audio player component with waveform (pending)
  - [ ] Build version upload flow with intent capture (pending)

- [x] **Song Structure System**
  - [x] Created `songSections` table
    - ✅ songId, sectionName, startTime, endTime
    - ✅ orderIndex, notes, referenceVersionId
  - [x] Created `sectionTemplates` table
    - ✅ name, structure, isDefault
  - [ ] Build section editor UI (pending)

- [x] **Decision System** ✅ FULLY IMPLEMENTED
  - [x] Created `decisions` table
    - ✅ id, songId, albumId, decisionType
    - ✅ question, context, status
    - ✅ proposedAt, testedAt, lockedAt, reopenedAt
    - ✅ proposedBy, audioProofId, linkedSectionId
    - ✅ instrumentOrRole, outcome, confidence, daysOpen
  - [x] API endpoints: GET, POST /api/decisions + GET, PATCH, DELETE /api/decisions/[id]
  - [x] Build decision proposal form (working dialog)
  - [x] Build decision detail view
  - [ ] Create decision lifecycle UI transitions (partial - status in API)

- [x] **Section-Level Priorities**
  - [x] Created `sectionPriorities` table
    - ✅ sectionId, priorityType, instrumentOrRole
    - ✅ priority, notes, resolvedAt
  - [ ] Build priority tagging UI (pending)

- [x] **Timestamped Notes** ✅ FULLY IMPLEMENTED
  - [x] Created `notes` table
    - ✅ id, albumId, songId, sectionId
    - ✅ noteType, content, audioUrl
    - ✅ linkedToTimestamp, linkedToVersionId
    - ✅ createdBy, createdAt, isArchived
  - [x] API endpoints: GET, POST /api/notes
  - [x] Build note creation form (working dialog)
  - [ ] Build voice note recorder UI (pending)
  - [ ] Build notes timeline view with audio linking (pending)

- [x] **Session System** ✅ FULLY IMPLEMENTED
  - [x] Created `creativeSessions` table
    - ✅ id, albumId, date, startTime, endTime
    - ✅ preSessionIntent, preSessionEnergy
    - ✅ postSessionReflection, postSessionEnergy, postSessionMomentum
    - ✅ decisionsLocked, versionsRecorded, participants
    - ✅ stuckPoints
  - [x] API endpoints: GET, POST /api/sessions + /api/sessions/[id]
  - [x] Create session intent capture form (working dialog)
  - [ ] Create session reflection form (partial)
  - [ ] Build session timeline view (pending)

- [x] **Momentum & Feedback System**
  - [x] Created `momentumMetrics` table
    - ✅ albumId, weekStart
    - ✅ decisionsLocked, versionsRecorded
    - ✅ averageEnergy, averageMomentum
    - ✅ songsActive, songsStagnant
  - [ ] Build momentum calculation job (pending)
  - [ ] Build album health dashboard (pending)

### Timeboard / Calendar View

- [x] **Create unified timeline interface**
  - [x] Created /timeline page (placeholder)
  - [ ] Build timeline component with zoom (pending)
  - [ ] Integrate playable demos in timeline (pending)

---

## Phase 3: Data Model Refactor ✅ COMPLETED

### Database Schema Changes

- [x] **Create new tables (migrations)**
  - [x] ✅ styleParameters table
  - [x] ✅ songVersions table
  - [x] ✅ songSections table
  - [x] ✅ sectionTemplates table
  - [x] ✅ decisions table
  - [x] ✅ sectionPriorities table
  - [x] ✅ notes table
  - [x] ✅ creativeSessions table
  - [x] ✅ momentumMetrics table

- [x] **Extend existing tables**
  - [x] ✅ songs table with 9 new fields
  - [x] ✅ projects table with 11 new album-centric fields

- [x] **Deprecate Jira tables (migrations)**
  - [x] ✅ Dropped `epics`
  - [x] ✅ Dropped `sprints`
  - [x] ✅ Dropped `tasks`
  - [x] ✅ Dropped `subtasks`
  - [x] ✅ Dropped `taskDependencies`
  - [x] ✅ Dropped `taskLabels`
  - [x] ✅ Dropped `timeLogs`
  - [x] ✅ Dropped `taskComments`
  - [x] ✅ Dropped `taskAttachments`
  - [x] ✅ Dropped `taskHistory`
  - [x] ✅ Dropped `boardConfigs`
  - [x] ✅ Dropped `savedFilters`

- [x] **Preserve and enhance infrastructure tables**
  - ✅ Kept: `users`, `sessions`, `files`, `fileVersions`, `shareLinks`, `notifications`, `activities`
  - ✅ Kept: `labels` for songs/decisions
  - ✅ Kept: `projectMembers`

### Data Migration Strategy

- [x] **Migration scripts created and executed**
  - [x] ✅ migration-phase-1-create-tables.sql
  - [x] ✅ migration-phase-2-alter-tables.sql
  - [x] ✅ migration-phase-3-migrate-data.sql
  - [x] ✅ migration-phase-4-drop-old-tables.sql
  - [x] ✅ migration-verification-queries.sql

---

## Phase 4: UX & Product Redesign ✅ MOSTLY COMPLETE

### Navigation & Information Architecture

- [x] **Redesign main navigation**
  - ✅ Removed: Tasks, Backlog, Epics, Sprints, Roadmap
  - ✅ Added: Decisions, Sessions, Notes, Timeline
  - ✅ Kept: Projects (Albums), Songs, Calendar, Shows, Setlists
  - ✅ Kept: Media, Gear, Contacts, Inspiration, etc.

- [x] **Update sidebar navigation**
  - ✅ Work section: Decisions, Sessions, Notes, Timeline, Calendar, Tempo Maps, Visualizations, Tools, MIDI Builder, Samples
  - ✅ No Jira links present

### Page Implementations

- [x] **Decisions page** ✅ COMPLETE
  - [x] List view with status, type, confidence
  - [x] Filter by status
  - [x] Working "New Decision" dialog with form
  - [x] Empty state with call-to-action

- [x] **Sessions page** ✅ COMPLETE
  - [x] List view with intent/reflection
  - [x] Energy and momentum indicators
  - [x] Working "New Session" dialog with form
  - [x] Empty state with call-to-action

- [x] **Notes page** ✅ COMPLETE
  - [x] List view with content preview
  - [x] Album/song badges
  - [x] Working "New Note" dialog with form
  - [x] Empty state with call-to-action

- [x] **Timeline page** (placeholder)
  - [x] Page structure created
  - [ ] Timeline component with events (pending)
  - [ ] Playable audio integration (pending)

### Component Library Updates

- [x] **Delete Jira-specific components**
  - [x] ✅ Removed kanban board
  - [x] ✅ Removed sprint cards
  - [x] ✅ Removed epic progress bars
  - [x] ✅ Removed task status dropdowns
  - [x] ✅ Removed story point pickers

- [ ] **Create new music-native components** (partial)
  - [ ] Audio player with waveform (pending)
  - [ ] Version history drawer (pending)
  - [ ] Section editor with timestamp sync (pending)
  - [x] ✅ Confidence slider (in decision form)
  - [ ] Phase lifecycle stepper (pending)
  - [x] ✅ Decision status badges
  - [ ] Momentum gauge (pending)
  - [x] ✅ Session intent form

---

## Phase 5: Audio & Time-Based Features (PENDING)

### Audio Infrastructure

- [ ] **Enhance file upload for audio**
  - [ ] Extract audio metadata
  - [ ] Generate waveform data
  - [ ] Store waveform JSON

- [ ] **Build audio player component**
  - [ ] Waveform visualization
  - [ ] Playback controls
  - [ ] Timestamp marker placement

- [ ] **Voice notes**
  - [ ] Browser audio recording
  - [ ] Quick record button
  - [ ] Playback in notes

### Timeline Features

- [ ] **Build timeline UI**
  - [ ] Zoom levels: day/week/month
  - [ ] Event markers with icons
  - [ ] Inline audio playback

---

## Phase 6: Migration & Cleanup ✅ COMPLETED

### Remove Jira Pages

- [x] ✅ Deleted `/tasks` page
- [x] ✅ Deleted `/backlog` page
- [x] ✅ Deleted `/epics` page
- [x] ✅ Deleted `/sprints` page
- [x] ✅ Deleted `/roadmap` page

### Delete Related API Routes

- [x] ✅ Deleted `/api/epics`
- [x] ✅ Deleted `/api/sprints`
- [x] ✅ Deleted `/api/tasks`

### Update Navigation

- [x] ✅ Removed Jira links from sidebar
- [x] ✅ Added Music OS navigation links

### Clean Up Types & Utilities

- [x] ✅ Removed Jira types from schema
- [x] ✅ Added new Music OS types
- [x] ✅ Updated Drizzle schema exports

---

## Phase 7: MVP Refinement (IN PROGRESS)

### Core MVP Features Status

- [x] ✅ Album creation with intent and constraints (via projects)
- [x] ✅ Song creation with phase, confidence, narrative role (schema ready)
- [x] ✅ Version upload API (song-versions endpoint)
- [x] ✅ Decision proposal with forms
- [x] ✅ Section structure tables ready
- [ ] Timeline view with playable audio (placeholder only)
- [x] ✅ Session intent capture
- [x] ✅ Timestamped notes
- [ ] Basic momentum tracking UI

### Post-MVP Features (deferred)

- ⏸️ Style parameter evolution over time
- ⏸️ Advanced momentum metrics and trends
- ⏸️ Voice notes
- ⏸️ Waveform visualization
- ⏸️ Section templates UI
- ⏸️ Collaboration features

---

## Anti-Pattern Reminders

**Never rebuild these Jira concepts:**
- ❌ Story points or velocity
- ❌ Task dependencies (blocker/blocked by)
- ❌ Subtasks or task hierarchies beyond Album → Song → Decision
- ❌ Sprint planning or time-boxed iterations
- ❌ Kanban boards with drag-drop status columns
- ❌ "Done" as a final state (music is released, not done)
- ❌ Burndown charts or capacity planning
- ❌ Task assignment with workload balancing

**Always remember:**
- ✅ Decisions > Tasks
- ✅ Listening > Reading
- ✅ Undecided is valid
- ✅ Backtracking is expected
- ✅ Momentum > Velocity
- ✅ Phases > Statuses
- ✅ Creative blocks are not bugs to fix, they're signals to examine

---

## Success Criteria

**The refactor is successful when:**

1. ✅ **No Jira concepts remain** in the UI, database, or mental model
2. ⏳ **Audio is first-class** - playable everywhere (pending audio player)
3. ⏳ **Timeline is intuitive** - can see album progress over time (pending)
4. ✅ **Decisions are visible** - clear what's locked, what's open
5. ⏳ **Momentum is felt** - users can sense if they're flowing or stalled
6. ✅ **Cognitive load is low** - simple forms, minimal clicks
7. ✅ **Undecided is okay** - system supports "proposed" state
8. ✅ **Backtracking is easy** - decisions can be reopened

---

## Final Notes

This is a **replacement**, not an extension.

Every Jira concept that made it into this codebase represents a wrong turn. Task-centric thinking is antithetical to creative work.

The goal is not to build a better Jira for musicians. The goal is to build a tool that respects the creative process: nonlinear, emotional, uncertain, and deeply personal.

If a feature makes you think "this is like Jira, but for music," delete it.

If a feature helps externalize creative intent, preserve momentum, or reduce cognitive load at 2am, build it.

Music is not made with tasks. It's made with decisions, iterations, and moments of clarity.

Build for that.
