// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'admin' | 'member' | 'guest';
  instrument: string | null;
  bio: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  key: string; // e.g., ALB, EP, TOUR
  name: string;
  description: string | null;
  type: 'album' | 'ep' | 'single' | 'demo' | 'music_video' | 'tour' | 'band_management' | 'marketing_campaign' | 'merchandise';
  status: 'idea' | 'writing' | 'recording' | 'mixing' | 'mastering' | 'released' | 'archived';
  coverImage: string | null;
  startDate: Date | null;
  releaseDate: Date | null;
  completedDate: Date | null;
  budget: number | null;
  spentBudget: number;
  currency: string;
  progress: number; // 0-100
  defaultAssigneeId: string | null;
  leadId: string | null;
  boardConfigId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
  lead?: User;
  defaultAssignee?: User;
  songs?: Song[];
  files?: FileItem[];
  tags?: string[];
  members?: ProjectMember[];
  epics?: Epic[];
  sprints?: Sprint[];
  boardConfig?: BoardConfig;
}

// Song types
export interface Song {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  timeSignature: string;
  status: 'idea' | 'writing' | 'recording' | 'mixing' | 'mastering' | 'released';
  trackNumber: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  createdById: string;
  project?: Project;
  createdBy?: User;
  files?: FileItem[];
  lyrics?: Lyric[];
  arrangements?: Arrangement[];
  comments?: Comment[];
  credits?: SongCredit[];
  tags?: string[];
}

export interface Lyric {
  id: string;
  songId: string;
  content: string;
  version: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
}

export interface Arrangement {
  id: string;
  songId: string;
  name: string;
  sections: ArrangementSection[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArrangementSection {
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  notes?: string;
}

export interface SongCredit {
  id: string;
  songId: string;
  userId: string;
  role: string;
  user?: User;
}

// File types
export interface FileItem {
  id: string;
  name: string;
  type: 'audio' | 'image' | 'document' | 'reaper' | 'midi' | 'stem' | 'other';
  mimeType: string;
  size: number;
  path: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  uploadedById: string;
  projectId: string | null;
  songId: string | null;
  uploadedBy?: User;
  versions?: FileVersion[];
  comments?: Comment[];
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  path: string;
  size: number;
  notes: string | null;
  createdAt: Date;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  timestamp: number | null;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  songId: string | null;
  fileId: string | null;
  parentId: string | null;
  user?: User;
  replies?: Comment[];
}

// Share types
export interface ShareLink {
  id: string;
  token: string;
  password: string | null;
  expiresAt: Date | null;
  allowDownload: boolean;
  viewCount: number;
  maxViews: number | null;
  isActive: boolean;
  createdAt: Date;
  createdById: string;
  projectId: string | null;
  songId: string | null;
  fileId: string | null;
  createdBy?: User;
  project?: Project;
  song?: Song;
  file?: FileItem;
}

// Setlist types
export interface Setlist {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  eventDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
  items?: SetlistItem[];
  totalDuration?: number;
}

export interface SetlistItem {
  id: string;
  setlistId: string;
  songId: string;
  position: number;
  notes: string | null;
  customDuration: number | null;
  song?: Song;
}

// Rehearsal types
export interface Rehearsal {
  id: string;
  title: string;
  location: string | null;
  scheduledAt: Date;
  endTime: Date | null;
  notes: string | null;
  goals: string[] | null;
  recordings: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
  attendees?: RehearsalAttendee[];
}

export interface RehearsalAttendee {
  id: string;
  rehearsalId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'declined';
  user?: User;
}

// Epic types - Large bodies of work grouping related tasks
export interface Epic {
  id: string;
  key: string; // e.g., ALB-1, TOUR-2
  title: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  color: string;
  startDate: Date | null;
  targetDate: Date | null;
  completedDate: Date | null;
  progress: number; // 0-100
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
  project?: Project;
  tasks?: Task[];
}

// Sprint types - Time-boxed iterations
export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: 'planning' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
  project?: Project;
  tasks?: Task[];
}

// Label types - Flexible tagging
export interface Label {
  id: string;
  name: string;
  color: string;
  description: string | null;
  projectId: string | null; // null = global
  createdAt: Date;
  project?: Project;
}

// Task types (Enhanced)
export type TaskType =
  | 'story'
  | 'task'
  | 'bug'
  | 'recording'
  | 'mixing'
  | 'mastering'
  | 'writing'
  | 'marketing'
  | 'video'
  | 'live_show';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'blocked'
  | 'backlog';

export interface Task {
  id: string;
  key: string; // e.g., TASK-123
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  storyPoints: number | null; // 1, 2, 3, 5, 8, 13, 21
  timeEstimate: number | null; // Minutes
  timeSpent: number; // Minutes
  dueDate: Date | null;
  startDate: Date | null;
  completedDate: Date | null;
  // Relationships
  epicId: string | null;
  sprintId: string | null;
  projectId: string | null;
  songId: string | null;
  parentTaskId: string | null; // For subtasks
  reporterId: string; // Who created it
  assigneeId: string | null; // Who's working on it
  position: number; // For ordering
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  // Relations
  createdBy?: User;
  reporter?: User;
  assignee?: User;
  project?: Project;
  song?: Song;
  epic?: Epic;
  sprint?: Sprint;
  parentTask?: Task;
  subtasks?: Task[]; // Child tasks
  labels?: Label[];
  dependencies?: TaskDependency[];
  blockedBy?: TaskDependency[];
  timeLogs?: TimeLog[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  history?: TaskHistory[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// Task Dependency types
export interface TaskDependency {
  id: string;
  taskId: string; // This task
  dependsOnTaskId: string; // Depends on this task
  type: 'blocks' | 'is_blocked_by' | 'relates_to';
  createdAt: Date;
  task?: Task;
  dependsOnTask?: Task;
}

// Time Log types
export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  timeSpent: number; // Minutes
  description: string | null;
  loggedAt: Date;
  createdAt: Date;
  task?: Task;
  user?: User;
}

// Project Member types
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'project_lead' | 'developer' | 'designer' | 'qa' | 'musician' | 'engineer' | 'producer';
  joinedAt: Date;
  project?: Project;
  user?: User;
}

// Saved Filter types
export interface SavedFilter {
  id: string;
  name: string;
  description: string | null;
  filterConfig: FilterConfig;
  isPublic: boolean;
  projectId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: User;
  project?: Project;
}

export interface FilterConfig {
  status?: TaskStatus[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  type?: TaskType[];
  assignee?: string[];
  epic?: string[];
  sprint?: string[];
  labels?: string[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  searchQuery?: string;
}

// Board Config types
export interface BoardConfig {
  id: string;
  name: string;
  description: string | null;
  type: 'kanban' | 'scrum' | 'timeline' | 'calendar';
  columns: BoardColumn[];
  swimlanes: SwimlaneConfig | null;
  projectId: string | null;
  isDefault: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: User;
  project?: Project;
}

export interface BoardColumn {
  id: string;
  name: string;
  status: TaskStatus;
  color: string;
  limit?: number; // WIP limit
}

export interface SwimlaneConfig {
  groupBy: 'assignee' | 'priority' | 'epic' | 'type';
}

// Task Comment types
export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  task?: Task;
  user?: User;
  replies?: TaskComment[];
}

// Task Attachment types
export interface TaskAttachment {
  id: string;
  taskId: string;
  fileId: string;
  createdAt: Date;
  task?: Task;
  file?: FileItem;
}

// Task History types
export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  task?: Task;
  user?: User;
}

// Finance types
export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: 'gear' | 'studio' | 'merch' | 'travel' | 'marketing' | 'other';
  date: Date;
  description: string | null;
  receipt: string | null;
  paidById: string;
  createdAt: Date;
  updatedAt: Date;
  paidBy?: User;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  share: number;
  isPaid: boolean;
}

// Gear types
export interface GearItem {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currentValue: number | null;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  location: string | null;
  notes: string | null;
  image: string | null;
  isWishlist: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  maintenance?: GearMaintenance[];
}

export interface GearMaintenance {
  id: string;
  gearItemId: string;
  date: Date;
  type: string;
  description: string;
  cost: number | null;
  performedBy: string | null;
}

// Inspiration types
export interface Inspiration {
  id: string;
  title: string;
  type: 'reference_track' | 'mood_board' | 'idea' | 'article' | 'video' | 'image';
  content: string | null;
  url: string | null;
  filePath: string | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
}

// Contact types
export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: 'venue' | 'studio' | 'engineer' | 'photographer' | 'videographer' | 'manager' | 'label' | 'promoter' | 'press' | 'other';
  company: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
  interactions?: ContactInteraction[];
}

export interface ContactInteraction {
  id: string;
  contactId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  date: Date;
  summary: string;
  createdAt: Date;
}

// Show/Tour types
export interface Show {
  id: string;
  title: string;
  venue: string;
  city: string | null;
  country: string | null;
  date: Date;
  loadIn: Date | null;
  soundcheck: Date | null;
  doors: Date | null;
  setTime: Date | null;
  setDuration: number | null;
  ticketPrice: number | null;
  ticketLink: string | null;
  promoter: string | null;
  notes: string | null;
  status: 'inquiry' | 'confirmed' | 'cancelled';
  setlistId: string | null;
  createdAt: Date;
  updatedAt: Date;
  setlist?: Setlist;
}

export interface Tour {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  description: string | null;
  budget: number | null;
  createdAt: Date;
  updatedAt: Date;
  shows?: Show[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'task' | 'share' | 'upload' | 'mention';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

// Activity types
export interface Activity {
  id: string;
  userId: string;
  type: 'upload' | 'comment' | 'create' | 'update' | 'delete' | 'share';
  action: string;
  metadata: Record<string, unknown> | null;
  projectId: string | null;
  songId: string | null;
  fileId: string | null;
  createdAt: Date;
  user?: User;
  project?: Project;
  song?: Song;
  file?: FileItem;
}

// Merch types
export interface MerchItem {
  id: string;
  name: string;
  type: 'tshirt' | 'hoodie' | 'poster' | 'vinyl' | 'cd' | 'sticker' | 'other';
  price: number;
  cost: number | null;
  sizes: string[] | null;
  stock: number;
  image: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Audio player types
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  loop: {
    enabled: boolean;
    start: number;
    end: number;
  };
}

// Search types
export interface SearchResult {
  type: 'project' | 'song' | 'file' | 'task' | 'contact' | 'gear' | 'inspiration';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}
