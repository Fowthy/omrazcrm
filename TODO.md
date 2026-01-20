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

**Phase 3: Data Model Refactor** - COMPLETE ✓
- Created 9 new Music OS tables in schema
- Extended songs table with 9 new fields
- Extended projects table with 11 new album-centric fields
- Removed 12 Jira tables from schema
- Created comprehensive SQL migration suite (4 phased files + verification)
- Built complete data migration strategy

**Phase 4: UX & Product Redesign** - PARTIAL (Core Complete) ✓
- Created 4 new Music OS pages (decisions, sessions, notes, timeline)
- Updated navigation with Music OS links
- Built 4 complete API route sets
- Integrated NextAuth session handling
- Fixed all build errors (Next.js 15+ async params, calendar API)

### 📊 Statistics

- **Files Modified**: 25+
- **Files Deleted**: 18 (17 Jira files + 1 obsolete script)
- **Files Created**: 21 (migrations, APIs, UI pages, docs)
- **Lines Added**: ~2,700+
- **Lines Removed**: ~4,100+
- **New Database Tables**: 9
- **Removed Database Tables**: 12
- **New API Routes**: 4 complete sets
- **New UI Pages**: 4 functional pages
- **Build Status**: ✅ Passing

### 🎯 REMAINING WORK

**High Priority:**
1. Run database migrations in production
2. Update songs/projects APIs with new fields
3. Enhance UI pages with forms and workflows
4. Create audio player component
5. Build enhanced timeline view

**Medium Priority:**
6. Song version management UI
7. Decision workflow (propose → test → lock)
8. Session tracking enhancements
9. Momentum metrics dashboard

**Low Priority:**
10. Style parameters UI
11. Section management
12. Advanced features (voice notes, collaboration, search)

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

## Phase 1: Conceptual Reset & Deprecation

### Remove Jira-Clone Mental Models

- [ ] **Audit all pages in `(dashboard)` directory**
  - List pages that enforce task-centric thinking
  - Mark for deletion: `/tasks`, `/backlog`, `/epics`, `/sprints`, `/roadmap`
  - Mark for transformation: `/projects` → `/albums`, `/calendar` → `/timeline`

- [ ] **Create deprecation plan for Jira tables**
  - [ ] `epics` → migrate to `songs` or archive and delete
  - [ ] `sprints` → archive and delete (no direct replacement)
  - [ ] `tasks` → partially migrate to `decisions` + `sessionIntents`, then delete
  - [ ] `subtasks` → delete entirely
  - [ ] `taskDependencies` → delete entirely
  - [ ] `taskLabels` → evaluate if needed for decisions
  - [ ] `timeLogs` → simplify to session-level duration only
  - [ ] `taskComments` → migrate to timestamped notes
  - [ ] `taskAttachments` → migrate to decision audio proofs
  - [ ] `taskHistory` → keep audit pattern, apply to new models
  - [ ] `boardConfigs` → delete entirely (no boards in new system)
  - [ ] `savedFilters` → delete entirely (no complex filtering)

- [ ] **Create data export/archive strategy**
  - Before deletion, export existing tasks/epics/sprints to JSON
  - Store in `/archive` directory with timestamp
  - Document in migration log

- [ ] **Remove task-centric UI components**
  - [ ] Delete kanban board components
  - [ ] Delete sprint planning UI
  - [ ] Delete epic cards/progress bars
  - [ ] Delete story point pickers
  - [ ] Delete status dropdown with Jira statuses
  - [ ] Delete task priority selectors (urgent/high/medium/low)

### Protect Against Jira Regression

- [ ] **Create anti-pattern checklist for code reviews**
  - No "status" fields with workflow states unless explicitly for song phases
  - No "story points" or velocity metrics
  - No task hierarchies deeper than Album → Song → Decision
  - No "assigned to" unless it's session participants or credits
  - No "due dates" on creative decisions (timeline is different)

- [ ] **Document forbidden concepts in project README**
  - Add section: "What We Don't Build"
  - Include rationale for each forbidden pattern

---

## Phase 2: Core Primitive Introduction

### New Data Models

- [ ] **Album System**
  - [ ] Create `albums` table (or refactor `projects`)
    - Core fields: id, name, createdAt, updatedAt, releaseTarget (nullable), status (concepting/writing/recording/mixing/mastering/released)
    - Intent fields: artisticIntent (text), emotionalArc (text), narrativeTheme (text)
    - Constraint fields: songCount (target), budgetCeiling, timeline (flexible text, not hard dates)
    - Success criteria: selfAssessmentCriteria (text array), targetAudience (text)
    - Scope: genreBoundaries (text), instrumentalPalette (text array), collaborators
  - [ ] Create database migration
  - [ ] Create TypeScript types
  - [ ] Create API endpoints: GET /api/albums, POST /api/albums, PATCH /api/albums/[id]
  - [ ] Build basic Album creation/edit form

- [ ] **Style & Aesthetic Parameter System**
  - [ ] Create `styleParameters` table
    - albumId (FK)
    - dimension (musical/sonic/conceptual)
    - parameterName (e.g., "tempo", "distortion", "intimacy")
    - startValue (text or numeric)
    - endValue (text or numeric, nullable if evolution not defined)
    - currentState (undecided/exploring/locked)
    - evolutionNotes (how it should change across album)
    - locked (boolean)
    - lockedAt (timestamp, nullable)
  - [ ] Create UI for parameter definition and editing
    - Support "undecided" as first-class state
    - Visual indicator for locked vs. exploring parameters
    - Timeline view of parameter evolution (post-MVP)

- [ ] **Song System** (enhance existing `songs` table)
  - [ ] Add new fields to `songs`:
    - phase (concepting/demo/tracking/mixing/mastering/archived)
    - confidence (0-100, how solid the song feels)
    - stabilityScore (0-100, how much it's changing)
    - lastMajorChange (timestamp)
    - narrativeRole (opener/climax/interlude/closer/bonus/cut)
    - artisticIntent (text, why this song exists)
    - emotionalTarget (text)
    - referenceTracksIds (array of inspiration IDs)
    - stagnantSince (timestamp, nullable)
  - [ ] Create migration to add fields
  - [ ] Update song API to handle new fields
  - [ ] Build song lifecycle UI (phase transitions, confidence slider)

- [ ] **Demo & Version System** (enhance existing `fileVersions`)
  - [ ] Create `songVersions` table
    - songId (FK)
    - fileId (FK to files table)
    - versionNumber (auto-increment per song)
    - versionIntent (text, why this version was recorded)
    - recordedAt (timestamp)
    - uploadedBy (FK to users)
    - durationSeconds (numeric)
    - isMainVersion (boolean, only one per song)
    - listenCount (integer, track plays)
    - lastListenedAt (timestamp)
  - [ ] Build audio player component with waveform
  - [ ] Integrate player in song detail page
  - [ ] Integrate player in timeline view
  - [ ] Create version upload flow with intent capture
  - [ ] Build version history sidebar

- [ ] **Song Structure System**
  - [ ] Create `songSections` table (or enhance `arrangements`)
    - songId (FK)
    - sectionName (intro/verse/chorus/bridge/outro/custom)
    - startTime (seconds, nullable if not yet defined)
    - endTime (seconds, nullable)
    - orderIndex (integer)
    - notes (text)
    - referenceVersionId (FK to songVersions, which version this timing is from)
  - [ ] Create `sectionTemplates` table
    - name (e.g., "Verse-Chorus-Verse-Bridge-Chorus", "ABABCB")
    - structure (JSON array of section names)
    - isDefault (boolean)
  - [ ] Build section editor UI
    - Drag to reorder sections
    - Timestamp input with audio player sync
    - Template application

- [ ] **Decision System** (replaces tasks/stories)
  - [ ] Create `decisions` table
    - id, songId (FK, nullable for album-level decisions), albumId (FK)
    - decisionType (arrangement/performance/sonic/lyrical/structural/production)
    - question (text, what needs to be decided)
    - context (text, why it matters)
    - status (proposed/testing/locked/reopened)
    - proposedAt (timestamp)
    - testedAt (timestamp, nullable)
    - lockedAt (timestamp, nullable)
    - reopenedAt (timestamp, nullable)
    - proposedBy (FK to users)
    - audioProofId (FK to files, nullable)
    - linkedSectionId (FK to songSections, nullable)
    - instrumentOrRole (guitar/bass/drums/vocals/mix/master, nullable)
    - outcome (text, what was decided)
    - confidence (0-100)
    - daysOpen (computed, how long it's been unresolved)
  - [ ] Create API endpoints for decision CRUD
  - [ ] Build decision proposal form
  - [ ] Build decision detail view with audio playback
  - [ ] Create decision lifecycle UI (propose → test → lock → reopen)

- [ ] **Section-Level Priorities**
  - [ ] Create `sectionPriorities` table
    - sectionId (FK to songSections)
    - priorityType (performance/arrangement/recording/mixing/mastering)
    - instrumentOrRole (guitar/bass/drums/vocals/etc.)
    - priority (high/medium/low)
    - notes (text)
    - resolvedAt (timestamp, nullable)
  - [ ] Build priority tagging UI in section editor
  - [ ] Create priority overview per song

- [ ] **Timestamped Notes** (transform existing `comments`)
  - [ ] Create `notes` table
    - id, albumId (FK, nullable), songId (FK, nullable), sectionId (FK, nullable)
    - noteType (text/voice)
    - content (text)
    - audioUrl (text, nullable for voice notes)
    - linkedToTimestamp (numeric, seconds, nullable)
    - linkedToVersionId (FK to songVersions, nullable)
    - createdBy (FK to users)
    - createdAt (timestamp)
    - isArchived (boolean)
  - [ ] Build voice note recorder UI
  - [ ] Build note creation with audio timestamp linking
  - [ ] Build notes sidebar/timeline view

- [ ] **Session System** (transform `rehearsals`)
  - [ ] Create `creativeSessions` table
    - id, albumId (FK), date, startTime, endTime
    - preSessionIntent (text, what you plan to work on)
    - preSessionEnergy (1-5 scale)
    - postSessionReflection (text, what actually happened)
    - postSessionEnergy (1-5 scale)
    - postSessionMomentum (stalled/slow/steady/flowing/breakthrough)
    - decisionsLocked (array of decision IDs)
    - versionsRecorded (array of version IDs)
    - participants (array of user IDs)
    - stuckPoints (text, what blocked progress)
  - [ ] Create session intent capture form (quick, low-friction)
  - [ ] Create session reflection form (post-session, encourages honesty)
  - [ ] Build session timeline view
  - [ ] Calculate momentum metrics from sessions

- [ ] **Momentum & Feedback System**
  - [ ] Create `momentumMetrics` table
    - albumId (FK)
    - weekStart (date)
    - decisionsLocked (count)
    - versionsRecorded (count)
    - averageEnergy (1-5)
    - averageMomentum (stalled/slow/steady/flowing/breakthrough)
    - songsActive (count, songs with recent activity)
    - songsStagnant (count, songs with no activity >7 days)
  - [ ] Build momentum calculation job (runs weekly)
  - [ ] Design neuroscience-aligned feedback UI
    - Subtle, not gamified
    - Reward meaningful progress (locked decisions, not task completion)
    - Visualize stability and confidence trends
    - Highlight stagnation gently, not as failure
  - [ ] Build album health dashboard

### Timeboard / Calendar View

- [ ] **Create unified timeline interface**
  - [ ] Design timeline data model
    - Events: sessions, decisions, version uploads, phase changes
    - Markers: stagnation alerts, momentum shifts, locked decisions
  - [ ] Build timeline component with zoom (day/week/month)
  - [ ] Integrate playable demos directly in timeline
  - [ ] Add decision markers with click-to-view details
  - [ ] Add version upload markers with inline audio player
  - [ ] Add phase change markers for songs
  - [ ] Highlight stagnation periods visually
  - [ ] Add session intent/reflection display

---

## Phase 3: Data Model Refactor

### Database Schema Changes

- [ ] **Create new tables (migrations)**
  - [ ] Migration 001: Create `albums` (or refactor `projects`)
  - [ ] Migration 002: Create `styleParameters`
  - [ ] Migration 003: Extend `songs` with new fields
  - [ ] Migration 004: Create `songVersions`
  - [ ] Migration 005: Enhance `songSections` (or create)
  - [ ] Migration 006: Create `sectionTemplates`
  - [ ] Migration 007: Create `decisions`
  - [ ] Migration 008: Create `sectionPriorities`
  - [ ] Migration 009: Create `notes` (transform comments)
  - [ ] Migration 010: Create `creativeSessions` (transform rehearsals)
  - [ ] Migration 011: Create `momentumMetrics`

- [ ] **Deprecate Jira tables (migrations)**
  - [ ] Migration 101: Archive and drop `epics`
  - [ ] Migration 102: Archive and drop `sprints`
  - [ ] Migration 103: Archive and drop `tasks`
  - [ ] Migration 104: Drop `subtasks`
  - [ ] Migration 105: Drop `taskDependencies`
  - [ ] Migration 106: Drop `taskLabels` (evaluate first)
  - [ ] Migration 107: Drop `timeLogs`
  - [ ] Migration 108: Drop `taskComments` (after migrating to notes)
  - [ ] Migration 109: Drop `taskAttachments` (after migrating)
  - [ ] Migration 110: Drop `taskHistory` (keep pattern, not data)
  - [ ] Migration 111: Drop `boardConfigs`
  - [ ] Migration 112: Drop `savedFilters`

- [ ] **Preserve and enhance infrastructure tables**
  - Keep: `users`, `sessions`, `files`, `fileVersions`, `shareLinks`, `notifications`, `activities`
  - Evaluate: `labels` (might be useful for songs/decisions)
  - Evaluate: `projectMembers` → `albumMembers` (rename)

### Data Migration Strategy

- [ ] **Export existing Jira data**
  - [ ] Write script to export all tasks, epics, sprints to JSON
  - [ ] Store in `/archive/migration-[timestamp]/`
  - [ ] Document in migration log

- [ ] **Selective migration of salvageable data**
  - [ ] Identify which epics can become songs
    - Criteria: Has name, description, dates, musical relevance
  - [ ] Identify which tasks can become decisions
    - Criteria: Task type = recording/mixing/writing, has clear question
  - [ ] Migrate task comments to notes (preserve timestamp, author)
  - [ ] Migrate task attachments to decision audio proofs (if audio)

- [ ] **Write migration scripts**
  - [ ] Script 1: epics → songs (with field mapping)
  - [ ] Script 2: tasks (subset) → decisions
  - [ ] Script 3: taskComments → notes
  - [ ] Script 4: taskAttachments (audio) → decision proofs
  - [ ] Script 5: rehearsals → creativeSessions (preserve intent if exists)

- [ ] **Test migrations in staging environment**
  - [ ] Run all migration scripts
  - [ ] Verify data integrity
  - [ ] Check relationship preservation
  - [ ] Validate no data loss in critical fields

---

## Phase 4: UX & Product Redesign

### Navigation & Information Architecture

- [ ] **Redesign main navigation**
  - Remove: Tasks, Backlog, Epics, Sprints, Roadmap
  - Add: Albums, Songs, Timeline, Sessions, Decisions (maybe)
  - Keep (evaluate): Calendar (transform to timeline), Rehearsals (transform to sessions)
  - Keep (post-MVP): Shows, Setlists, Tours (live performance is separate)
  - Keep: Media, Gear, Contacts, Inspiration (resources)

- [ ] **Create new album-centric IA**
  ```
  Albums (top-level)
    └─ Album Detail
        ├─ Overview (intent, constraints, style parameters)
        ├─ Songs (grid/list with confidence, stability, phase)
        ├─ Timeline (sessions, decisions, versions, markers)
        ├─ Decisions (album-level + song-level)
        ├─ Style Guide (parameters, references)
        └─ Health (momentum, stagnation, metrics)

  Song Detail (from album)
    ├─ Overview (intent, confidence, phase, narrative role)
    ├─ Versions (playable history with intent notes)
    ├─ Structure (sections with timestamps)
    ├─ Decisions (linked to sections/instruments)
    ├─ Notes (timestamped to audio)
    └─ Credits

  Timeline (top-level, cross-album)
    └─ Zoomable calendar with events, playable audio, markers

  Sessions (top-level or within album)
    └─ Session list with intent/reflection
  ```

- [ ] **Update dashboard home page**
  - Remove: Task counts, sprint progress, velocity charts
  - Add: Active albums with health indicators
  - Add: Recent decisions locked
  - Add: Stagnant songs alert (gentle)
  - Add: Momentum trend (last 4 weeks)
  - Add: Quick session intent entry

### Page Redesigns

- [ ] **Albums page** (replace projects)
  - [ ] Card layout with album art, status, song count
  - [ ] Health indicators: momentum, decisions locked/open, stagnant songs
  - [ ] Quick actions: Start session, Create song, View timeline
  - [ ] Filter by status (concepting/writing/recording/mixing/mastering/released)

- [ ] **Album detail page**
  - [ ] Intent & constraints section (editable)
  - [ ] Style parameters grid (with undecided states)
  - [ ] Songs grid with confidence/stability bars
  - [ ] Recent activity feed
  - [ ] Quick decision proposal
  - [ ] Quick session intent

- [ ] **Song detail page**
  - [ ] Phase indicator with visual lifecycle
  - [ ] Version player (latest) with version history drawer
  - [ ] Section structure editor (inline)
  - [ ] Decisions list (filterable by status, instrument)
  - [ ] Notes timeline (with audio scrubbing)
  - [ ] Confidence and stability trends (small chart)

- [ ] **Timeline page**
  - [ ] Zoomable calendar (day/week/month)
  - [ ] Event markers (sessions, versions, decisions)
  - [ ] Inline audio players for versions
  - [ ] Decision detail popups
  - [ ] Stagnation period highlighting
  - [ ] Filter by album, song, event type

- [ ] **Sessions page**
  - [ ] List view with intent/reflection
  - [ ] Energy and momentum indicators
  - [ ] Linked decisions and versions
  - [ ] Quick session start
  - [ ] Session detail with full notes

- [ ] **Decisions page** (maybe, or just in album/song context)
  - [ ] List view with status, age, confidence
  - [ ] Filter by status, type, instrument, song
  - [ ] Aging alerts (decisions open >14 days)
  - [ ] Quick proposal form

### Component Library Updates

- [ ] **Delete Jira-specific components**
  - [ ] Kanban board
  - [ ] Sprint cards
  - [ ] Epic progress bars
  - [ ] Task status dropdowns
  - [ ] Story point pickers
  - [ ] Burndown charts

- [ ] **Create new music-native components**
  - [ ] Audio player with waveform
  - [ ] Version history drawer
  - [ ] Section editor with timestamp sync
  - [ ] Confidence slider (0-100)
  - [ ] Stability indicator
  - [ ] Phase lifecycle stepper
  - [ ] Decision status pills (proposed/testing/locked/reopened)
  - [ ] Momentum gauge (subtle, non-gamified)
  - [ ] Stagnation alert (gentle, supportive)
  - [ ] Parameter state toggle (undecided/exploring/locked)
  - [ ] Session intent quick form
  - [ ] Voice note recorder
  - [ ] Timeline event markers

### Design System Updates

- [ ] **Update color semantics**
  - Remove: Task status colors (green/yellow/red/blue)
  - Add: Song phase colors (subtle, not alarming)
  - Add: Decision status colors (muted)
  - Add: Momentum colors (warm for flowing, cool for stalled, neutral for steady)

- [ ] **Update typography for readability at 2am**
  - Increase base font size
  - Improve contrast ratios
  - Use softer whites/blacks (not pure #000/#fff)

- [ ] **Minimize cognitive load in UI**
  - Reduce information density
  - Hide details in progressive disclosure
  - Default to "just enough" information
  - Make audio playback frictionless (no extra clicks)

---

## Phase 5: Audio & Time-Based Features

### Audio Infrastructure

- [ ] **Enhance file upload for audio**
  - [ ] Support drag-and-drop multi-file upload
  - [ ] Extract audio metadata (duration, sample rate, bit rate)
  - [ ] Generate waveform data (use library like wavesurfer.js or peaks.js)
  - [ ] Store waveform JSON with file record
  - [ ] Add transcoding for browser playback (if needed)

- [ ] **Build audio player component**
  - [ ] Waveform visualization
  - [ ] Playback controls (play/pause, seek, volume)
  - [ ] Current time / duration display
  - [ ] Speed control (0.5x, 1x, 1.5x, 2x)
  - [ ] Loop section control (for focused listening)
  - [ ] Timestamp marker placement (for notes)

- [ ] **Integrate player in song pages**
  - [ ] Song detail: Play latest version
  - [ ] Version history: Play any version
  - [ ] Timeline: Play inline from timeline

- [ ] **Voice notes**
  - [ ] Browser audio recording (MediaRecorder API)
  - [ ] Quick record button in note forms
  - [ ] Upload to files storage
  - [ ] Playback in notes timeline

### Timeline Features

- [ ] **Build timeline event model**
  - [ ] Define event types: session, versionUpload, decisionProposed, decisionLocked, decisionReopened, phaseChange, noteCreated
  - [ ] Create unified query for timeline data
  - [ ] Support filtering by album, song, event type, date range

- [ ] **Build timeline UI**
  - [ ] Zoom levels: day, week, month
  - [ ] Event markers with icons
  - [ ] Event detail popups
  - [ ] Inline audio playback for version events
  - [ ] Stagnation period highlighting (gentle, non-alarming)
  - [ ] Today indicator
  - [ ] Navigation (scroll, jump to date)

- [ ] **Playable demos in timeline**
  - [ ] Inline waveform for version upload events
  - [ ] Play/pause directly from timeline
  - [ ] Visual indicator of playing state
  - [ ] Auto-scroll timeline while playing (optional)

### Calendar Integration

- [ ] **Evaluate existing calendar page**
  - Currently shows: rehearsals, shows
  - Transform to: creative sessions, album milestones, release targets

- [ ] **Integrate timeline into calendar**
  - [ ] Merge timeline view into calendar
  - [ ] Add day/week/month switcher
  - [ ] Show sessions as calendar events
  - [ ] Show decisions locked as markers
  - [ ] Show version uploads as markers

---

## Phase 6: Migration & Cleanup

### Remove Jira Pages

- [ ] **Delete task management pages**
  - [ ] `/app/(dashboard)/tasks/page.tsx`
  - [ ] `/app/(dashboard)/backlog/page.tsx`
  - [ ] `/app/(dashboard)/epics/page.tsx`
  - [ ] `/app/(dashboard)/sprints/page.tsx`
  - [ ] `/app/(dashboard)/roadmap/page.tsx`

- [ ] **Delete related API routes**
  - [ ] `/app/api/epics/route.ts`
  - [ ] `/app/api/epics/[id]/route.ts`
  - [ ] `/app/api/sprints/route.ts`
  - [ ] `/app/api/sprints/[id]/route.ts`
  - [ ] `/app/api/tasks/route.ts` (most complex, has many relationships)
  - [ ] `/app/api/tasks/[id]/route.ts`
  - [ ] `/app/api/labels/route.ts` (evaluate first)

- [ ] **Remove Jira components**
  - [ ] Find all components referencing tasks/epics/sprints
  - [ ] Delete or refactor each component
  - [ ] Check for imports in other files

### Update Navigation

- [ ] **Remove Jira links from sidebar**
  - [ ] Update sidebar component (likely in `/app/(dashboard)/layout.tsx` or `/components/sidebar.tsx`)
  - [ ] Remove: Tasks, Backlog, Epics, Sprints, Roadmap links

- [ ] **Add new navigation links**
  - [ ] Albums
  - [ ] Timeline
  - [ ] Sessions
  - [ ] (Keep) Songs (but redesign)
  - [ ] (Keep) Calendar (but transformed)

### Clean Up Types & Utilities

- [ ] **Remove Jira TypeScript types**
  - [ ] Find all Epic, Sprint, Task, Subtask types
  - [ ] Remove from codebase
  - [ ] Update imports

- [ ] **Add new TypeScript types**
  - [ ] Album types
  - [ ] StyleParameter types
  - [ ] Decision types
  - [ ] SongVersion types
  - [ ] CreativeSession types
  - [ ] Note types
  - [ ] TimelineEvent types

- [ ] **Update Drizzle schema exports**
  - [ ] Remove deprecated table exports
  - [ ] Add new table exports
  - [ ] Update schema file structure if needed

### Testing & Validation

- [ ] **Create test albums**
  - [ ] Album 1: Full lifecycle (concepting → released)
  - [ ] Album 2: In progress (recording phase)
  - [ ] Album 3: Early stage (writing phase)

- [ ] **Test workflows**
  - [ ] Create album with intent and style parameters
  - [ ] Add songs with confidence and narrative roles
  - [ ] Upload demo versions with intent
  - [ ] Create sections with timestamps
  - [ ] Propose and lock decisions
  - [ ] Record session with intent and reflection
  - [ ] View timeline and play audio
  - [ ] Create timestamped notes

- [ ] **Test edge cases**
  - [ ] Undecided style parameters
  - [ ] Reopened decisions
  - [ ] Stagnant songs
  - [ ] Low momentum periods
  - [ ] Multiple versions same day
  - [ ] Voice notes

---

## Phase 7: MVP Refinement

### Define MVP Boundaries

- [ ] **Core MVP features (must-have)**
  - ✅ Album creation with intent and constraints
  - ✅ Song creation with phase, confidence, narrative role
  - ✅ Version upload with intent and playback
  - ✅ Decision proposal, testing, locking lifecycle
  - ✅ Section structure with timestamps
  - ✅ Timeline view with playable audio
  - ✅ Session intent and reflection
  - ✅ Timestamped notes
  - ✅ Basic momentum tracking

- [ ] **Post-MVP features (defer)**
  - ⏸️ Style parameter evolution over time (can start with static)
  - ⏸️ Advanced momentum metrics and trends
  - ⏸️ Neuroscience-aligned feedback UI (start simple)
  - ⏸️ Voice notes (can start text-only)
  - ⏸️ Waveform visualization (can use simple audio player)
  - ⏸️ Section templates (can manually create sections)
  - ⏸️ Collaboration features (multi-user sessions)
  - ⏸️ Mobile optimization
  - ⏸️ Offline support

- [ ] **Out of scope (do not build)**
  - ❌ DAW integration (too complex, wrong tool)
  - ❌ Mastering tools (use external)
  - ❌ Social sharing (not the point)
  - ❌ AI suggestions (can consider later, but not core)
  - ❌ Complex analytics dashboard (anti-momentum)
  - ❌ Third-party integrations (Spotify, SoundCloud, etc.) - post-MVP

### Polish MVP

- [ ] **Improve onboarding**
  - [ ] Create first-time user flow
  - [ ] Guide: Create album → Add song → Upload demo → Make decision
  - [ ] Tooltips for new concepts (decisions, confidence, momentum)

- [ ] **Performance optimization**
  - [ ] Optimize audio file loading
  - [ ] Lazy load timeline events
  - [ ] Optimize database queries (eager load relationships)
  - [ ] Add loading states

- [ ] **Error handling**
  - [ ] Graceful file upload failures
  - [ ] Audio playback errors (format not supported)
  - [ ] Network errors (retry logic)
  - [ ] Validation errors (clear messages)

- [ ] **Documentation**
  - [ ] Update README with new product vision
  - [ ] Document new data models
  - [ ] Create API documentation for new endpoints
  - [ ] Write user guide (how to use music OS)

---

## Phase 8: Post-Launch Iteration (Beyond MVP)

### Advanced Features

- [ ] **Style parameter evolution**
  - [ ] Timeline visualization of parameter changes
  - [ ] Parameter keyframes (value at different points in album)
  - [ ] Auto-suggest parameters based on genre

- [ ] **Enhanced momentum system**
  - [ ] Trend analysis (improving/declining)
  - [ ] Personalized energy patterns (best work time of day)
  - [ ] Gentle nudges when stagnation detected

- [ ] **Collaboration features**
  - [ ] Multi-user sessions with participants
  - [ ] Real-time presence indicators
  - [ ] Comment threads on decisions
  - [ ] @mentions in notes

- [ ] **Advanced audio**
  - [ ] Waveform comparison (version A vs B)
  - [ ] Section looping for focused listening
  - [ ] Timestamped markers on waveform
  - [ ] Audio annotations

- [ ] **Mobile experience**
  - [ ] Responsive timeline
  - [ ] Mobile audio recording
  - [ ] Quick session intent on mobile

### Integration Opportunities

- [ ] **External tools (evaluate carefully)**
  - [ ] DAW project linking (read-only, not two-way sync)
  - [ ] Streaming service pre-save campaigns (post-release)
  - [ ] Mastering service integration (post-mixing)

- [ ] **Export features**
  - [ ] Album book (PDF with intent, decisions, timeline)
  - [ ] Credits sheet (auto-generated from song credits)
  - [ ] Press kit generator (for release)

---

## Migration Checklist

### Pre-Migration

- [ ] Backup entire database
- [ ] Export all Jira data to JSON archive
- [ ] Document current data volume
- [ ] Test all migration scripts in staging
- [ ] Create rollback plan

### Migration Execution

- [ ] Run new table creation migrations
- [ ] Run data migration scripts (epics → songs, etc.)
- [ ] Verify data integrity
- [ ] Run deprecation migrations (drop old tables)
- [ ] Update database indexes
- [ ] Clear application cache

### Post-Migration

- [ ] Verify all new endpoints work
- [ ] Test user workflows end-to-end
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Update production environment variables if needed

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

1. **No Jira concepts remain** in the UI, database, or mental model
2. **Audio is first-class** - playable everywhere, easy to upload, central to workflow
3. **Timeline is intuitive** - can see album progress over time with context
4. **Decisions are visible** - clear what's locked, what's open, what's aging
5. **Momentum is felt** - users can sense if they're flowing or stalled
6. **Cognitive load is low** - usable at 2am after a bad take
7. **Undecided is okay** - system doesn't pressure premature decisions
8. **Backtracking is easy** - can reopen decisions without shame
9. **Progress is emotional** - not just task counts, but creative clarity

**User should be able to:**
- Start a session with a clear intent in <30 seconds
- Upload a demo and add intent in <2 minutes
- Propose a decision with audio proof in <3 minutes
- View song health (confidence, stability, stagnation) at a glance
- Play any version from timeline without friction
- Reflect on a session honestly without judgment
- See the album's narrative arc and stylistic evolution
- Know what's locked vs. still exploring
- Feel momentum (or lack thereof) viscerally

---

## Final Notes

This is a **replacement**, not an extension.

Every Jira concept that made it into this codebase represents a wrong turn. Task-centric thinking is antithetical to creative work.

The goal is not to build a better Jira for musicians. The goal is to build a tool that respects the creative process: nonlinear, emotional, uncertain, and deeply personal.

If a feature makes you think "this is like Jira, but for music," delete it.

If a feature helps externalize creative intent, preserve momentum, or reduce cognitive load at 2am, build it.

Music is not made with tasks. It's made with decisions, iterations, and moments of clarity.

Build for that.
