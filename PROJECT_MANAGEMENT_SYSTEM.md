# Music Project Management System - Jira Clone for Music Production

A comprehensive project management system specifically designed for managing music projects, albums, tours, and band operations. This is a full-featured Jira-like system tailored for the music industry.

## 🎵 Overview

This system transforms the basic task management into a powerful, music-industry-focused project management platform with features including:

- **Epic Management** - Group large bodies of work (Album Releases, Tours, Marketing Campaigns)
- **Sprint/Iteration Planning** - Time-boxed work periods for focused execution
- **Advanced Task Management** - Story points, time tracking, dependencies, custom fields
- **Timeline & Roadmap Views** - Visualize project timelines and deadlines
- **Backlog Management** - Prioritize and groom upcoming work
- **Reports & Analytics** - Velocity charts, burndown charts, project health metrics
- **Music-Specific Workflows** - Task types for Recording, Mixing, Mastering, Marketing, etc.

## 🚀 Features

### 1. Epic System
Epics are large bodies of work that can be broken down into smaller tasks. Perfect for:
- Album Release Campaigns
- Tour Planning
- Music Video Projects
- Merchandise Launches

**API Endpoints:**
- `GET /api/epics` - List all epics (filter by project)
- `POST /api/epics` - Create new epic
- `GET /api/epics/[id]` - Get epic details with tasks
- `PATCH /api/epics/[id]` - Update epic
- `DELETE /api/epics/[id]` - Delete epic (if no tasks)

### 2. Sprint/Iteration Management
Time-boxed work periods (typically 1-4 weeks) for focused execution:
- Sprint Planning
- Sprint Tracking (velocity, burndown)
- Sprint Retrospectives

**API Endpoints:**
- `GET /api/sprints` - List all sprints (filter by project/status)
- `POST /api/sprints` - Create new sprint
- `GET /api/sprints/[id]` - Get sprint details with tasks and metrics
- `PATCH /api/sprints/[id]` - Update sprint
- `DELETE /api/sprints/[id]` - Delete sprint

### 3. Enhanced Task Management

Tasks now support:
- **Task Types**: Recording, Mixing, Mastering, Writing, Marketing, Video, Live Show, Bug, Story
- **Story Points**: Estimation using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- **Time Tracking**: Log work time, compare estimates vs actuals
- **Dependencies**: Block/is-blocked-by relationships
- **Labels**: Flexible tagging system
- **Epic & Sprint Assignment**: Link tasks to larger initiatives
- **Task History**: Audit log of all changes
- **Comments**: Threaded discussions on tasks
- **Attachments**: Link files to tasks

**Enhanced API Endpoints:**
- `GET /api/tasks` - List tasks (filter by project, epic, sprint, status, assignee)
- `POST /api/tasks` - Create task with all new fields
- `GET /api/tasks/[id]` - Get complete task details
- `PATCH /api/tasks/[id]` - Update task (auto-logs history)
- `DELETE /api/tasks/[id]` - Delete task with cascading deletes

**Time Tracking:**
- `GET /api/tasks/[id]/time-logs` - Get time logs for a task
- `POST /api/tasks/[id]/time-logs` - Log time worked

### 4. Label System
Flexible tagging for tasks:
- Global labels (available to all projects)
- Project-specific labels
- Color-coded for visual organization
- Predefined music industry labels:
  - Urgent, Bug, Recording, Mixing, Mastering
  - Marketing, Video, Live Show, Rehearsal, Writing
  - Blocked, Feedback, High Priority, Low Priority

**API Endpoints:**
- `GET /api/labels` - List labels (global + project-specific)
- `POST /api/labels` - Create new label
- `DELETE /api/labels?id=[id]` - Delete label

### 5. Enhanced Projects
Projects now include:
- **Project Keys**: Unique identifier (e.g., ALB, EP, TOUR)
- **Project Types**: Album, EP, Single, Music Video, Tour, Band Management, Marketing Campaign, Merchandise
- **Timeline**: Start date, release date, completed date
- **Budget Tracking**: Budget vs spent
- **Progress Tracking**: 0-100% completion
- **Project Lead**: Designated project manager
- **Board Configuration**: Custom board views per project
- **Project Members**: Team assignment with roles

### 6. Project Templates (Ready to Implement)
Pre-configured workflows for common music projects:

**Album Release Template:**
- Epics: Writing, Recording, Mixing, Mastering, Marketing, Distribution
- Tasks: Pre-production, tracking sessions, mix revisions, artwork, social media, etc.

**Tour Template:**
- Epics: Booking, Logistics, Rehearsals, Marketing, Execution
- Tasks: Venue booking, travel arrangements, setlist preparation, promotion, etc.

**Single Release Template:**
- Epics: Production, Marketing, Distribution
- Tasks: Streamlined for quick releases

**Music Video Template:**
- Epics: Pre-Production, Filming, Post-Production, Release
- Tasks: Concept development, location scouting, filming, editing, upload, etc.

## 📊 Database Schema

### New Tables

#### `epics`
- Epic management with key, title, description, status, color
- Timeline tracking (start, target, completed dates)
- Progress percentage
- Links to projects

#### `sprints`
- Sprint planning with name, goal, status
- Date range (start/end)
- Links to projects
- Automatic metric calculation (velocity, completion)

#### `labels`
- Flexible tagging system
- Global or project-specific
- Color-coded

#### `task_labels`
- Many-to-many relationship between tasks and labels

#### `task_dependencies`
- Task blocking relationships
- Dependency types: blocks, is_blocked_by, relates_to

#### `time_logs`
- Time tracking on tasks
- User, time spent, description
- Logged date

#### `project_members`
- Project team management
- User roles: project_lead, developer, designer, qa, musician, engineer, producer

#### `saved_filters`
- Save complex filter combinations
- Public or private
- JSON filter configuration

#### `board_configs`
- Custom board configurations
- Column definitions
- Swimlane grouping (by assignee, priority, epic, type)
- Board types: kanban, scrum, timeline, calendar

#### `task_comments`
- Task discussion threads
- Nested comments support

#### `task_attachments`
- Link files to tasks

#### `task_history`
- Audit log of task changes
- Tracks status, assignee, priority, epic, sprint changes

### Enhanced Tables

#### `tasks` - Now includes:
- `key`: Unique task identifier (e.g., ALB-123)
- `type`: Task classification (recording, mixing, mastering, etc.)
- `storyPoints`: Estimation field
- `timeEstimate`, `timeSpent`: Time tracking
- `startDate`, `completedDate`: Timeline fields
- `epicId`, `sprintId`: Epic and sprint assignment
- `parentTaskId`: Subtask support
- `reporterId`: Who created the task
- `position`: Ordering within lists

#### `projects` - Now includes:
- `key`: Project identifier (e.g., ALB, TOUR)
- `startDate`, `completedDate`: Timeline tracking
- `budget`, `spentBudget`, `currency`: Financial tracking
- `progress`: Completion percentage
- `leadId`: Project manager
- `boardConfigId`: Custom board configuration

## 🎯 Music-Specific Task Types

The system includes pre-configured task types optimized for music production:

1. **Recording** - Studio tracking sessions
2. **Mixing** - Mix engineering tasks
3. **Mastering** - Final mastering work
4. **Writing** - Songwriting and composition
5. **Marketing** - Promotional activities
6. **Video** - Music video production
7. **Live Show** - Performance preparation
8. **Story** - User stories/features
9. **Task** - General tasks
10. **Bug** - Issues and fixes

## 🔄 Workflows

### Album Release Workflow
1. Create Project (Type: Album) with key "ALB"
2. Create Epics:
   - ALB-1: Songwriting
   - ALB-2: Pre-Production
   - ALB-3: Recording
   - ALB-4: Mixing
   - ALB-5: Mastering
   - ALB-6: Marketing Campaign
3. Create Sprint (e.g., "Recording Sprint 1")
4. Create Tasks under each Epic
5. Assign tasks to team members
6. Track progress through Kanban/Sprint boards
7. Monitor timeline via Roadmap view
8. Review velocity and adjust planning

### Sprint Planning Workflow
1. Create Sprint with start/end dates
2. Review Backlog
3. Estimate tasks (story points)
4. Assign tasks to sprint
5. Set sprint goal
6. Start sprint
7. Daily standups (update task status)
8. Sprint review & retrospective
9. Complete sprint

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **UI**: React 19, Tailwind CSS 4, Radix UI
- **State Management**: Zustand, TanStack Query
- **Auth**: NextAuth 5
- **Drag & Drop**: dnd-kit

## 📋 API Reference

### Task Filtering

All task endpoints support filtering via query parameters:
- `projectId` - Filter by project
- `epicId` - Filter by epic
- `sprintId` - Filter by sprint
- `status` - Filter by status
- `assigneeId` - Filter by assignee

Example:
```
GET /api/tasks?projectId=abc&sprintId=xyz&status=in_progress
```

### Sprint Metrics

Sprint endpoints automatically calculate:
- `taskCount` - Total tasks in sprint
- `completedTaskCount` - Completed tasks
- `totalPoints` - Sum of all story points
- `completedPoints` - Sum of completed story points

### Task History Tracking

The following fields are automatically tracked in `task_history`:
- status changes
- assignee changes
- priority changes
- epic changes
- sprint changes

## 🎨 UI Components (To Be Built)

The following UI components need to be implemented:

### 1. Epic Board (`/epics`)
- List view of all epics
- Epic cards showing progress, tasks, timeline
- Create/Edit/Delete epic dialogs
- Drag-and-drop to reorder epics
- Filter by project, status
- Roadmap visualization

### 2. Sprint Board (`/sprints`)
- Active sprint view (Kanban board)
- Sprint planning interface
- Backlog grooming
- Velocity charts
- Burndown charts
- Sprint goal display
- Time remaining indicator

### 3. Backlog View (`/backlog`)
- All unscheduled tasks
- Drag-and-drop prioritization
- Story point estimation
- Bulk actions (assign to sprint, epic)
- Advanced filtering

### 4. Roadmap View (`/roadmap`)
- Gantt chart visualization
- Epic timeline
- Sprint timeline
- Milestone markers
- Drag-to-adjust dates
- Zoom controls (month/quarter/year)

### 5. Enhanced Task Dialog
Tabs:
- **Details** - Title, description, type, priority, story points, dates, assignments
- **Comments** - Threaded discussion
- **History** - Activity log
- **Time Tracking** - Log work, view time logs
- **Attachments** - Linked files
- **Dependencies** - Blocked by, blocking tasks

### 6. Reports Dashboard (`/reports`)
- Velocity chart (points per sprint)
- Burndown chart (remaining work over time)
- Cumulative flow diagram
- Project health metrics
- Time tracking reports
- Team workload distribution

### 7. Labels Manager
- Global labels list
- Project-specific labels
- Color picker
- Usage statistics

### 8. Board Configuration
- Create custom board views
- Define columns (name, status mapping, WIP limits)
- Configure swimlanes (group by assignee, priority, epic)
- Board templates

## 📝 Next Steps

1. **UI Development** - Build all the UI components listed above
2. **Advanced Filtering** - Implement JQL-like query language
3. **Saved Filters** - UI for creating and managing saved filters
4. **Project Templates** - One-click project creation from templates
5. **Bulk Operations** - Multi-select and bulk edit tasks
6. **Notifications** - Real-time updates on task changes
7. **Mobile Responsive** - Optimize for mobile devices
8. **Keyboard Shortcuts** - Power-user features
9. **Export/Import** - CSV, Excel export
10. **Integrations** - Slack, Discord notifications

## 🚀 Getting Started

1. The database schema is already migrated
2. API endpoints are ready to use
3. Create your first project with a unique key (e.g., "ALB")
4. Create epics for major work streams
5. Create tasks and link them to epics
6. Start your first sprint
7. Begin tracking progress!

## 📖 Examples

### Creating an Album Project

```typescript
// POST /api/projects
{
  "name": "Debut Album",
  "key": "DEBUT",
  "type": "album",
  "status": "writing",
  "description": "Our first full-length album",
  "startDate": "2026-02-01",
  "releaseDate": "2026-12-01",
  "budget": 50000
}
```

### Creating an Epic

```typescript
// POST /api/epics
{
  "title": "Album Recording Sessions",
  "description": "Track all 12 songs for the album",
  "status": "planning",
  "projectId": "project_id_here",
  "startDate": "2026-03-01",
  "targetDate": "2026-06-01",
  "color": "#8B5CF6"
}
```

### Creating a Task

```typescript
// POST /api/tasks
{
  "title": "Record vocals for Song Title",
  "description": "Book studio, prepare lyrics, record lead and backing vocals",
  "type": "recording",
  "priority": "high",
  "storyPoints": 5,
  "timeEstimate": 480, // 8 hours in minutes
  "dueDate": "2026-03-15",
  "projectId": "project_id_here",
  "epicId": "epic_id_here",
  "assigneeId": "user_id_here",
  "labelIds": ["label_id_1", "label_id_2"]
}
```

### Logging Time

```typescript
// POST /api/tasks/[taskId]/time-logs
{
  "timeSpent": 240, // 4 hours in minutes
  "description": "Completed lead vocals and first harmony layer"
}
```

## 🎓 Best Practices

1. **Use Epics for Major Work** - Album releases, tours, video projects
2. **Estimate with Story Points** - Use Fibonacci sequence for sizing
3. **Keep Sprints Focused** - 1-2 weeks, clear goals
4. **Track Time Regularly** - Log work daily for accurate metrics
5. **Label Consistently** - Use standard labels across projects
6. **Document in Descriptions** - Provide context for future reference
7. **Link Dependencies** - Mark blocking relationships
8. **Regular Backlog Grooming** - Keep backlog prioritized and estimated

## 💡 Tips for Music Projects

- Use **Epics** for album phases (Writing, Recording, Mixing, etc.)
- Create **Sprints** around studio booking dates
- Use **Labels** for instruments, studio locations, or collaborators
- Track **Time** for accurate budget management
- Set **Dependencies** between related songs (e.g., vocals depend on instrumental tracks)
- Use **Story Points** based on song complexity or studio days required

---

**Built with ❤️ for music creators, bands, and producers who want professional project management tools tailored to their unique workflow.**
