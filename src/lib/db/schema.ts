import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================
// AUTHENTICATION & USERS
// ============================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role').default('member').notNull(), // admin, member, guest
  instrument: text('instrument'),
  bio: text('bio'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

// ============================================
// PROJECTS & SONGS
// ============================================

// Board Configurations - REMOVED (Jira-specific, replaced by timeline view)

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g., ALB, EP, TOUR, VIDEO
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('album').notNull(), // album, ep, single, demo, music_video, tour, band_management, marketing_campaign, merchandise
  status: text('status').default('idea').notNull(), // idea, writing, recording, mixing, mastering, released, archived
  coverImage: text('cover_image'),
  // Timeline fields
  startDate: integer('start_date', { mode: 'timestamp' }),
  releaseDate: integer('release_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),
  // Project management fields
  budget: real('budget'),
  spentBudget: real('spent_budget').default(0),
  currency: text('currency').default('USD'),
  progress: integer('progress').default(0), // 0-100
  defaultAssigneeId: text('default_assignee_id').references(() => users.id),
  leadId: text('lead_id').references(() => users.id), // Project lead
  // Music OS album-centric fields
  artisticIntent: text('artistic_intent'), // album's artistic purpose
  emotionalArc: text('emotional_arc'), // emotional journey of the album
  narrativeTheme: text('narrative_theme'), // overarching theme
  songCountTarget: integer('song_count_target'), // target number of songs
  budgetCeiling: real('budget_ceiling'), // maximum budget
  timelineText: text('timeline_text'), // flexible timeline (not hard dates)
  selfAssessmentCriteria: text('self_assessment_criteria'), // JSON array
  targetAudience: text('target_audience'),
  genreBoundaries: text('genre_boundaries'),
  instrumentalPalette: text('instrumental_palette'), // JSON array
  collaborators: text('collaborators'), // JSON array
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const projectTags = sqliteTable('project_tags', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
});

export const songs = sqliteTable('songs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  lyrics: text('lyrics'),
  duration: integer('duration'), // Duration in seconds
  bpm: integer('bpm'),
  musicalKey: text('musical_key'),
  timeSignature: text('time_signature').default('4/4'),
  status: text('status').default('idea').notNull(), // idea, writing, recording, mixing, mastering, released
  trackNumber: integer('track_number'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  // Music OS fields
  phase: text('phase').default('concepting'), // concepting, demo, tracking, mixing, mastering, archived
  confidence: integer('confidence').default(50), // 0-100, how solid the song feels
  stabilityScore: integer('stability_score').default(50), // 0-100, how much it's changing
  lastMajorChange: integer('last_major_change', { mode: 'timestamp' }),
  narrativeRole: text('narrative_role'), // opener, climax, interlude, closer, bonus, cut
  artisticIntent: text('artistic_intent'), // why this song exists
  emotionalTarget: text('emotional_target'),
  referenceTracksIds: text('reference_tracks_ids'), // JSON array
  stagnantSince: integer('stagnant_since', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  projectId: text('project_id').references(() => projects.id),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const songTags = sqliteTable('song_tags', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
});

export const songCredits = sqliteTable('song_credits', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // vocals, guitar, bass, drums, keys, production, mixing, mastering, etc.
});

export const lyrics = sqliteTable('lyrics', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // Full lyrics text with chord notations
  version: integer('version').default(1),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const arrangements = sqliteTable('arrangements', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  name: text('name').default('Main'),
  sections: text('sections').notNull(), // JSON array of sections with timing
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// FILES & VERSIONS
// ============================================

export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // audio, image, document, reaper, midi, stem, other
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  uploadedById: text('uploaded_by_id').notNull().references(() => users.id),
  projectId: text('project_id').references(() => projects.id),
  songId: text('song_id').references(() => songs.id),
  stemSeparationId: text('stem_separation_id'),
});

export const fileVersions = sqliteTable('file_versions', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  path: text('path').notNull(),
  size: integer('size').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const stemSeparations = sqliteTable('stem_separations', {
  id: text('id').primaryKey(),
  sourceFileId: text('source_file_id').notNull().unique(),
  status: text('status').default('pending').notNull(), // pending, processing, completed, failed
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// ============================================
// COMMENTS & FEEDBACK
// ============================================

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  timestamp: real('timestamp'), // For audio comments, time in seconds
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  userId: text('user_id').notNull().references(() => users.id),
  songId: text('song_id').references(() => songs.id),
  fileId: text('file_id').references(() => files.id),
  parentId: text('parent_id'),
});

// ============================================
// SHARING
// ============================================

export const shareLinks = sqliteTable('share_links', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  name: text('name'), // Custom name for the share link
  shareType: text('share_type').notNull(), // project, song, file, setlist, rehearsal, show, media, tempo-map
  password: text('password'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  allowDownload: integer('allow_download', { mode: 'boolean' }).default(false),
  viewCount: integer('view_count').default(0),
  maxViews: integer('max_views'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  // Configuration for what to include (JSON) - used for project sharing
  includeConfig: text('include_config'), // JSON: { songs: true, files: true, setlists: false, ... }
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
  // Entity references - only one will be set based on shareType
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  songId: text('song_id').references(() => songs.id, { onDelete: 'cascade' }),
  fileId: text('file_id').references(() => files.id, { onDelete: 'cascade' }),
  setlistId: text('setlist_id'), // References setlists.id
  rehearsalId: text('rehearsal_id'), // References rehearsals.id
  showId: text('show_id'), // References shows.id
  mediaId: text('media_id'), // References media.id
  tempoMapId: text('tempo_map_id'), // References tempoMaps.id
});

// ============================================
// SETLISTS
// ============================================

export const setlists = sqliteTable('setlists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  venue: text('venue'),
  eventDate: integer('event_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const setlistItems = sqliteTable('setlist_items', {
  id: text('id').primaryKey(),
  setlistId: text('setlist_id').notNull().references(() => setlists.id, { onDelete: 'cascade' }),
  songId: text('song_id').notNull().references(() => songs.id),
  position: integer('position').notNull(),
  notes: text('notes'), // Transition notes, tuning, etc.
  customDuration: integer('custom_duration'), // Override duration if needed
});

// ============================================
// REHEARSALS
// ============================================

export const rehearsals = sqliteTable('rehearsals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  location: text('location'),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  notes: text('notes'),
  goals: text('goals'), // JSON array of practice goals
  recordings: text('recordings'), // JSON array of recording file paths
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const rehearsalAttendees = sqliteTable('rehearsal_attendees', {
  id: text('id').primaryKey(),
  rehearsalId: text('rehearsal_id').notNull().references(() => rehearsals.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').default('pending').notNull(), // pending, confirmed, declined
});

export const rehearsalNotes = sqliteTable('rehearsal_notes', {
  id: text('id').primaryKey(),
  rehearsalId: text('rehearsal_id').notNull().references(() => rehearsals.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// MUSIC OS - CORE TABLES
// ============================================

// Style Parameters - Album-level aesthetic and musical parameters
export const styleParameters = sqliteTable('style_parameters', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  dimension: text('dimension').notNull(), // musical, sonic, conceptual
  parameterName: text('parameter_name').notNull(), // e.g., "tempo", "distortion", "intimacy"
  startValue: text('start_value'), // text or numeric
  endValue: text('end_value'), // nullable if evolution not defined
  currentState: text('current_state').default('undecided').notNull(), // undecided, exploring, locked
  evolutionNotes: text('evolution_notes'), // how it should change across album
  locked: integer('locked', { mode: 'boolean' }).default(false),
  lockedAt: integer('locked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Song Versions - Track demos and recordings with intent
export const songVersions = sqliteTable('song_versions', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  versionIntent: text('version_intent'), // why this version was recorded
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  durationSeconds: real('duration_seconds'),
  isMainVersion: integer('is_main_version', { mode: 'boolean' }).default(false),
  listenCount: integer('listen_count').default(0),
  lastListenedAt: integer('last_listened_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Song Sections - Song structure with timestamps
export const songSections = sqliteTable('song_sections', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  sectionName: text('section_name').notNull(), // intro, verse, chorus, bridge, outro, custom
  startTime: real('start_time'), // seconds, nullable if not yet defined
  endTime: real('end_time'), // seconds, nullable
  orderIndex: integer('order_index').notNull(),
  notes: text('notes'),
  referenceVersionId: text('reference_version_id').references(() => songVersions.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Section Templates - Reusable song structures
export const sectionTemplates = sqliteTable('section_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  structure: text('structure').notNull(), // JSON array of section names
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Decisions - Creative decisions (replaces tasks)
export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  songId: text('song_id').references(() => songs.id, { onDelete: 'cascade' }),
  albumId: text('album_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  decisionType: text('decision_type').notNull(), // arrangement, performance, sonic, lyrical, structural, production
  question: text('question').notNull(), // what needs to be decided
  context: text('context'), // why it matters
  status: text('status').default('proposed').notNull(), // proposed, testing, locked, reopened
  proposedAt: integer('proposed_at', { mode: 'timestamp' }).notNull(),
  testedAt: integer('tested_at', { mode: 'timestamp' }),
  lockedAt: integer('locked_at', { mode: 'timestamp' }),
  reopenedAt: integer('reopened_at', { mode: 'timestamp' }),
  proposedBy: text('proposed_by').notNull().references(() => users.id),
  audioProofId: text('audio_proof_id').references(() => files.id, { onDelete: 'set null' }),
  linkedSectionId: text('linked_section_id').references(() => songSections.id, { onDelete: 'set null' }),
  instrumentOrRole: text('instrument_or_role'), // guitar, bass, drums, vocals, mix, master
  outcome: text('outcome'), // what was decided
  confidence: integer('confidence').default(50), // 0-100
  daysOpen: integer('days_open').default(0), // computed
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Section Priorities - Priority flags per section/instrument
export const sectionPriorities = sqliteTable('section_priorities', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => songSections.id, { onDelete: 'cascade' }),
  priorityType: text('priority_type').notNull(), // performance, arrangement, recording, mixing, mastering
  instrumentOrRole: text('instrument_or_role').notNull(),
  priority: text('priority').notNull(), // high, medium, low
  notes: text('notes'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Notes - Timestamped notes (replaces comments)
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  albumId: text('album_id').references(() => projects.id, { onDelete: 'cascade' }),
  songId: text('song_id').references(() => songs.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').references(() => songSections.id, { onDelete: 'cascade' }),
  noteType: text('note_type').default('text').notNull(), // text, voice
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  linkedToTimestamp: real('linked_to_timestamp'), // seconds
  linkedToVersionId: text('linked_to_version_id').references(() => songVersions.id, { onDelete: 'set null' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
});

// Creative Sessions - Sessions with intent and reflection (replaces rehearsals)
export const creativeSessions = sqliteTable('creative_sessions', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  preSessionIntent: text('pre_session_intent'), // what you plan to work on
  preSessionEnergy: integer('pre_session_energy'), // 1-5 scale
  postSessionReflection: text('post_session_reflection'), // what actually happened
  postSessionEnergy: integer('post_session_energy'), // 1-5 scale
  postSessionMomentum: text('post_session_momentum'), // stalled, slow, steady, flowing, breakthrough
  decisionsLocked: text('decisions_locked'), // JSON array of decision IDs
  versionsRecorded: text('versions_recorded'), // JSON array of version IDs
  participants: text('participants'), // JSON array of user IDs
  stuckPoints: text('stuck_points'), // what blocked progress
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

// Momentum Metrics - Weekly momentum tracking
export const momentumMetrics = sqliteTable('momentum_metrics', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  weekStart: integer('week_start', { mode: 'timestamp' }).notNull(),
  decisionsLocked: integer('decisions_locked').default(0),
  versionsRecorded: integer('versions_recorded').default(0),
  averageEnergy: real('average_energy'), // 1-5
  averageMomentum: text('average_momentum'), // stalled, slow, steady, flowing, breakthrough
  songsActive: integer('songs_active').default(0), // songs with recent activity
  songsStagnant: integer('songs_stagnant').default(0), // songs with no activity >7 days
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// PROJECT MANAGEMENT
// ============================================

// JIRA TABLES REMOVED - Migrated to Music OS
// See migration-phase-4-drop-old-tables.sql for details
// Removed: epics, sprints, tasks, subtasks, taskDependencies, taskLabels,
//          timeLogs, savedFilters, taskComments, taskAttachments, taskHistory

// Labels - Flexible tagging system (kept for songs/decisions)
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#gray'),
  description: text('description'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }), // null = global label
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Project Members - Team members with roles
export const projectMembers = sqliteTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // project_lead, musician, engineer, producer
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// FINANCES
// ============================================

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USD').notNull(),
  category: text('category').notNull(), // gear, studio, merch, travel, marketing, other
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description'),
  receipt: text('receipt'), // File path
  paidById: text('paid_by_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const expenseSplits = sqliteTable('expense_splits', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  share: real('share').notNull(), // Percentage or fixed amount
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
});

// ============================================
// GEAR INVENTORY
// ============================================

export const gearItems = sqliteTable('gear_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // guitar, bass, drums, keys, pedals, amps, microphones, cables, other
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchasePrice: real('purchase_price'),
  currentValue: real('current_value'),
  condition: text('condition'), // excellent, good, fair, poor
  location: text('location'),
  notes: text('notes'),
  image: text('image'),
  isWishlist: integer('is_wishlist', { mode: 'boolean' }).default(false),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const gearMaintenance = sqliteTable('gear_maintenance', {
  id: text('id').primaryKey(),
  gearItemId: text('gear_item_id').notNull().references(() => gearItems.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  type: text('type').notNull(), // repair, setup, cleaning, strings, other
  description: text('description').notNull(),
  cost: real('cost'),
  performedBy: text('performed_by'),
});

// ============================================
// INSPIRATION BOARD
// ============================================

export const inspirations = sqliteTable('inspirations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // reference_track, mood_board, idea, article, video, image
  content: text('content'), // Description or notes
  url: text('url'), // External link
  filePath: text('file_path'), // Internal file
  tags: text('tags'), // Comma-separated tags
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

// ============================================
// CONTACTS
// ============================================

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  type: text('type').notNull(), // venue, studio, engineer, photographer, manager, label, other
  company: text('company'),
  website: text('website'),
  address: text('address'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const contactInteractions = sqliteTable('contact_interactions', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // email, call, meeting, note
  date: integer('date', { mode: 'timestamp' }).notNull(),
  summary: text('summary').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// NOTIFICATIONS & ACTIVITY
// ============================================

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // comment, task, share, upload, mention
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // upload, comment, create, update, delete, share
  action: text('action').notNull(),
  metadata: text('metadata'), // JSON for additional data
  projectId: text('project_id').references(() => projects.id),
  songId: text('song_id').references(() => songs.id),
  fileId: text('file_id').references(() => files.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// BAND SETTINGS
// ============================================

export const bandSettings = sqliteTable('band_settings', {
  id: text('id').primaryKey().default('default'),
  name: text('name').default('Omraz').notNull(),
  logo: text('logo'),
  primaryColor: text('primary_color').default('#8B5CF6').notNull(),
  secondaryColor: text('secondary_color').default('#06B6D4').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  currency: text('currency').default('USD').notNull(),
  defaultShareExpiry: integer('default_share_expiry'),
  youtubeChannelId: text('youtube_channel_id'),
  youtubeChannelName: text('youtube_channel_name'),
});

// ============================================
// MEDIA GALLERY
// ============================================

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // photo, video, youtube
  category: text('category').notNull(), // photoshoot, music_video, promo, behind_the_scenes, live, interview, other
  // For file uploads
  filePath: text('file_path'),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  // For YouTube videos
  youtubeUrl: text('youtube_url'),
  youtubeVideoId: text('youtube_video_id'),
  youtubeThumbnail: text('youtube_thumbnail'),
  // Common fields
  tags: text('tags'), // Comma-separated tags
  date: integer('date', { mode: 'timestamp' }), // When the media was created/shot
  duration: integer('duration'), // For videos, in seconds
  width: integer('width'),
  height: integer('height'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

// ============================================
// SHOWS & TOURS
// ============================================

export const shows = sqliteTable('shows', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  venue: text('venue').notNull(),
  city: text('city'),
  country: text('country'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  loadIn: integer('load_in', { mode: 'timestamp' }),
  soundcheck: integer('soundcheck', { mode: 'timestamp' }),
  doors: integer('doors', { mode: 'timestamp' }),
  setTime: integer('set_time', { mode: 'timestamp' }),
  setDuration: integer('set_duration'), // Minutes
  ticketPrice: real('ticket_price'),
  ticketLink: text('ticket_link'),
  promoter: text('promoter'),
  notes: text('notes'),
  status: text('status').default('confirmed').notNull(), // inquiry, confirmed, cancelled
  setlistId: text('setlist_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const tours = sqliteTable('tours', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  description: text('description'),
  budget: real('budget'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// MERCH
// ============================================

export const merchItems = sqliteTable('merch_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // tshirt, hoodie, poster, vinyl, cd, sticker, other
  price: real('price').notNull(),
  cost: real('cost'),
  sizes: text('sizes'), // JSON array for clothing
  stock: integer('stock').default(0).notNull(),
  image: text('image'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const merchSales = sqliteTable('merch_sales', {
  id: text('id').primaryKey(),
  merchItemId: text('merch_item_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  channel: text('channel').notNull(), // show, online, other
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// TEMPO MAPS
// ============================================

export const tempoMaps = sqliteTable('tempo_maps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  defaultBpm: integer('default_bpm').default(120).notNull(),
  defaultTimeSignature: text('default_time_signature').default('4/4').notNull(),
  // Link to project or song (optional)
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  songId: text('song_id').references(() => songs.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

export const tempoMapSections = sqliteTable('tempo_map_sections', {
  id: text('id').primaryKey(),
  tempoMapId: text('tempo_map_id').notNull().references(() => tempoMaps.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(), // Order in the tempo map
  name: text('name'), // Optional section name (Intro, Verse, Chorus, etc.)
  bars: integer('bars').notNull().default(4), // Number of bars in this section
  bpm: integer('bpm').notNull(), // Tempo for this section
  timeSignatureNumerator: integer('time_signature_numerator').notNull().default(4), // e.g., 4 in 4/4
  timeSignatureDenominator: integer('time_signature_denominator').notNull().default(4), // e.g., 4 in 4/4
  notes: text('notes'), // Any notes for this section
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// VISUALIZATIONS
// ============================================

export const visualizations = sqliteTable('visualizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // Visualization type and parameters
  visualType: text('visual_type').notNull().default('bars'), // bars, waveform, circular, particles, kaleidoscope, geometric
  // Parameters stored as JSON
  parameters: text('parameters').notNull(), // JSON: { colorScheme, sensitivity, particleCount, speed, etc. }
  // Preview and export
  previewUrl: text('preview_url'), // Thumbnail/preview image
  videoUrl: text('video_url'), // Exported video file path
  videoDuration: integer('video_duration'), // Duration in seconds
  // Links
  songId: text('song_id').references(() => songs.id, { onDelete: 'set null' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

// MIDI Projects - for saving MIDI Builder compositions
export const midiProjects = sqliteTable('midi_projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // Project settings
  bpm: integer('bpm').notNull().default(120),
  totalBeats: integer('total_beats').notNull().default(16),
  // Tracks and notes stored as JSON
  // JSON structure: [{ id, name, instrument, notes: [{id, pitch, start, duration, velocity}], muted, solo, volume, pan }]
  tracks: text('tracks').notNull(),
  // Links to existing content
  songId: text('song_id').references(() => songs.id, { onDelete: 'set null' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdById: text('created_by_id').notNull().references(() => users.id),
});

// ============================================
// SAMPLE LIBRARY
// ============================================

export const samples = sqliteTable('samples', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // Category: kick, snare, hihat, clap, tom, cymbal, percussion, bass, synth, fx, vocal, loop, other
  category: text('category').notNull().default('other'),
  // Tags for searching (comma-separated)
  tags: text('tags'),
  // File info
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  // Audio properties
  duration: real('duration'), // Duration in seconds
  sampleRate: integer('sample_rate'),
  channels: integer('channels'), // 1 = mono, 2 = stereo
  // Optional metadata
  bpm: integer('bpm'), // For loops
  musicalKey: text('musical_key'), // For melodic samples
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  uploadedById: text('uploaded_by_id').notNull().references(() => users.id),
});
