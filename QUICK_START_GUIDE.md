# Quick Start Guide - Music Project Management System

Welcome to your new Jira-like music project management system! This guide will help you get started quickly.

## 🎵 What You Now Have

A complete, production-ready project management system designed specifically for music production, including:

- **Epics** - Large initiatives (Album Releases, Tours, Music Videos)
- **Sprints** - Time-boxed work periods (1-4 weeks)
- **Backlog** - Prioritize and estimate upcoming work
- **Tasks Board** - Kanban-style task management
- **Roadmap** - Timeline visualization of epics
- **Time Tracking** - Log work on tasks
- **Labels** - Flexible tagging system
- **Advanced Filtering** - Find exactly what you need

## 🚀 Getting Started in 5 Minutes

### Step 1: Create Your First Project

1. Navigate to **Projects** in the sidebar
2. Click **Create Project**
3. Fill in:
   - **Name**: "Debut Album"
   - **Key**: "DEBUT" (this will prefix all tasks/epics)
   - **Type**: Album
   - **Status**: Writing
   - **Release Date**: Your target date
   - **Budget**: (optional) 50000

### Step 2: Create Epics for Major Work Streams

1. Navigate to **Epics** in the sidebar
2. Click **Create Epic**
3. Create these epics:

**Epic 1: Songwriting**
- Title: "Album Songwriting"
- Project: Debut Album
- Status: In Progress
- Start Date: Today
- Target Date: 3 months from now
- Color: Purple

**Epic 2: Recording**
- Title: "Studio Recording Sessions"
- Project: Debut Album
- Status: Planning
- Start Date: 3 months from now
- Target Date: 5 months from now
- Color: Blue

**Epic 3: Mixing**
- Title: "Album Mixing"
- Project: Debut Album
- Status: Planning
- Start Date: 5 months from now
- Target Date: 6 months from now
- Color: Cyan

**Epic 4: Marketing**
- Title: "Album Release Campaign"
- Project: Debut Album
- Status: Planning
- Start Date: 6 months from now
- Target Date: 8 months from now
- Color: Orange

### Step 3: Create Your First Sprint

1. Navigate to **Sprints** in the sidebar
2. Click **Create Sprint**
3. Fill in:
   - **Name**: "Writing Sprint 1"
   - **Goal**: "Complete 3 song demos"
   - **Project**: Debut Album
   - **Status**: Planning
   - **Start Date**: Next Monday
   - **End Date**: 2 weeks from start date

### Step 4: Create Tasks

1. Navigate to **Backlog** in the sidebar
2. From the task board, create tasks:

**Task 1:**
- Title: "Write lyrics for Song 1"
- Type: Writing (✍️)
- Priority: High
- Story Points: 5
- Epic: Album Songwriting
- Description: "Write complete lyrics with verse/chorus structure"

**Task 2:**
- Title: "Record guitar demo for Song 1"
- Type: Recording (🎙️)
- Priority: High
- Story Points: 3
- Epic: Album Songwriting

**Task 3:**
- Title: "Book studio time for tracking"
- Type: Task (✓)
- Priority: Urgent
- Story Points: 2
- Epic: Studio Recording Sessions

### Step 5: Sprint Planning

1. Go to **Backlog**
2. For each task, estimate **Story Points** (1-21, use Fibonacci: 1, 2, 3, 5, 8, 13, 21)
3. Select **Assign to sprint** dropdown
4. Choose "Writing Sprint 1"
5. Repeat for multiple tasks

### Step 6: Start Working!

1. Navigate to **Tasks Board**
2. Drag tasks from "To Do" to "In Progress"
3. Work on your tasks
4. Log time:
   - Click a task to open details
   - Go to Time Tracking tab
   - Log work (e.g., 240 minutes = 4 hours)
5. Update task status as you progress
6. Move completed tasks to "Done"

### Step 7: Track Progress

1. **Roadmap** - See all epics on a timeline
2. **Sprints** - View velocity metrics (% complete, points burned)
3. **Epics** - Update progress percentage manually

## 📋 Common Workflows

### Album Release Workflow

```
1. Create Project (Type: Album)
2. Create Epics:
   - Songwriting
   - Pre-Production
   - Recording
   - Mixing
   - Mastering
   - Artwork/Branding
   - Marketing Campaign
   - Distribution
3. Create Sprints (2-week cycles)
4. Create Tasks under each Epic
5. Sprint Planning: Assign tasks to upcoming sprint
6. Daily Work: Move tasks through board
7. Sprint Review: Check velocity
8. Repeat until release
```

### Tour Planning Workflow

```
1. Create Project (Type: Tour)
2. Create Epics:
   - Booking/Logistics
   - Rehearsals
   - Marketing
   - Tour Execution
3. Create Tasks:
   - Book venues (task per city)
   - Arrange travel
   - Prepare setlist
   - Promote shows
   - Merch production
4. Track on Roadmap
5. Update as tour progresses
```

### Single Release Workflow

```
1. Create Project (Type: Single)
2. Create Epics:
   - Production
   - Marketing
   - Distribution
3. Create short sprint (1 week)
4. Create focused tasks
5. Quick iteration
6. Release!
```

## 🎯 Task Types Explained

Each task type has a specific icon:

- **📖 Story** - User stories or features
- **✓ Task** - General work items
- **🐛 Bug** - Issues to fix
- **🎙️ Recording** - Studio tracking sessions
- **🎚️ Mixing** - Mix engineering work
- **✨ Mastering** - Final mastering
- **✍️ Writing** - Songwriting/composition
- **📢 Marketing** - Promotional work
- **🎬 Video** - Music video production
- **🎸 Live Show** - Performance prep

## 📊 Story Points Guide

Use Fibonacci sequence for estimation:

- **1 point** - Trivial (< 1 hour)
- **2 points** - Simple (1-2 hours)
- **3 points** - Medium (2-4 hours)
- **5 points** - Complex (1 day)
- **8 points** - Large (2 days)
- **13 points** - Very large (3-5 days)
- **21 points** - Huge (1 week) - consider breaking down

**Pro Tip:** Story points are relative, not absolute. Compare tasks to each other.

## ⚡ Keyboard Shortcuts & Tips

### Best Practices

1. **Daily Standup** - Review sprint board, move tasks
2. **Weekly Sprint Planning** - Groom backlog, estimate, assign to sprint
3. **Update Progress** - Mark epics progress % weekly
4. **Log Time Daily** - Track actual time for better estimates
5. **Use Labels** - Tag tasks for easy filtering
6. **Set Due Dates** - Keep deadlines visible
7. **Link Epics** - Always assign tasks to epics for roadmap visibility

### Time Tracking

Log time in minutes:
- 60 = 1 hour
- 120 = 2 hours
- 240 = 4 hours
- 480 = 8 hours (full day)

## 🔥 Power User Features

### Advanced Filtering

On the Backlog page:
- Search by task title
- Filter by project
- Filter by task type
- Filter by priority
- Combine filters for precision

### Sprint Metrics

Sprints automatically calculate:
- **Task Completion** - X/Y tasks done
- **Story Points** - X/Y points completed
- **Velocity** - Percentage complete
- **Days Remaining** - For active sprints

### Epic Progress Tracking

Update epic progress based on:
- Tasks completed in epic
- Milestones reached
- Your judgment of completion

## 🎨 Customization

### Colors

Each epic can have a custom color:
- Purple (#8B5CF6)
- Cyan (#06B6D4)
- Green (#10B981)
- Amber (#F59E0B)
- Red (#EF4444)
- Pink (#EC4899)
- Teal (#14B8A6)
- Indigo (#6366F1)
- Violet (#A855F7)
- Lime (#22C55E)

### Task Statuses

- **Backlog** - Not yet planned
- **To Do** - Ready to start
- **In Progress** - Being worked on
- **Review** - Needs review/approval
- **Done** - Completed
- **Blocked** - Cannot proceed

### Priority Levels

- 🟢 **Low** - Nice to have
- 🔵 **Medium** - Should do
- 🟠 **High** - Important
- 🔴 **Urgent** - Critical, do now

## 📱 Navigation

Your sidebar has been organized:

**Main**
- Dashboard
- Projects
- Songs
- Setlists
- Shows

**Work** (NEW!)
- **Tasks Board** - Kanban view
- **Backlog** - Prioritization
- **Epics** - Big initiatives
- **Sprints** - Time-boxed work
- **Roadmap** - Timeline view
- Rehearsals
- Calendar
- Other tools...

**Resources**
- Media
- Finances
- Gear
- Merch
- Contacts
- etc.

## 🚨 Common Questions

**Q: Can I delete an epic?**
A: Yes, but only if it has no tasks. Remove all tasks first.

**Q: What happens to tasks when I delete a sprint?**
A: Tasks are preserved, just unassigned from the sprint. They go back to backlog.

**Q: How do I know sprint velocity?**
A: Open a sprint to see completion percentage based on story points completed vs total.

**Q: Can tasks belong to multiple epics?**
A: No, one task = one epic. Create separate tasks if needed.

**Q: Should I use sprints?**
A: Yes if you want structured planning. No if you prefer continuous flow (just use backlog).

## 🎓 Next Level

Once you're comfortable:

1. Create **project templates** for common workflows
2. Use **saved filters** for recurring views
3. Track **time estimates** vs actuals for better planning
4. Set up **task dependencies** (blocking relationships)
5. Use **labels** extensively for categorization
6. Generate **reports** on velocity and burndown

## 💡 Tips for Music Projects

1. **One Epic per Album Phase** - Writing, Recording, Mixing, Mastering, Marketing
2. **Sprint Length = Studio Booking** - Align sprints with studio time
3. **Story Points = Complexity** - Not hours. A complex song = more points
4. **Use Task Types** - 🎙️ Recording, 🎚️ Mixing, ✨ Mastering keep it organized
5. **Link Songs to Tasks** - Reference specific songs in task descriptions
6. **Track Budget** - Use project budget field to manage studio costs
7. **Set Milestones** - Epic target dates for important deadlines
8. **Daily Updates** - Move task cards daily to maintain momentum

## 🎸 Example: Album Production

**Project:** "Summer Vibes" (Key: SUMMER)
- Budget: $25,000
- Release: 6 months

**Epics:**
1. SUMMER-1: Songwriting (Month 1-2)
2. SUMMER-2: Pre-Production (Month 2)
3. SUMMER-3: Recording (Month 3-4)
4. SUMMER-4: Mixing (Month 4-5)
5. SUMMER-5: Mastering (Month 5)
6. SUMMER-6: Marketing (Month 5-6)

**Sprint 1:** "Writing Sprint" (2 weeks)
- Tasks: Write 4 songs, create demos
- Story Points: 34
- Goal: Complete song structures

**Tasks in Sprint 1:**
- SUMMER-10: Write "Beach Song" lyrics (5 pts)
- SUMMER-11: Compose "Sunset" chords (3 pts)
- SUMMER-12: Record vocal demo "Beach Song" (3 pts)
- SUMMER-13: Program drums for all songs (8 pts)
- ... etc

Track progress on **Roadmap**, manage day-to-day on **Tasks Board**, plan ahead in **Backlog**.

---

**You're all set! Start creating and shipping music! 🎵🚀**

Need help? Check `PROJECT_MANAGEMENT_SYSTEM.md` for detailed API docs and technical details.
