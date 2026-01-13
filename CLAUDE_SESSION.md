# Omraz Studio - Claude Code Session Guide

## Project Overview

**Omraz Studio** is a comprehensive band/music project management platform built with Next.js 16, featuring project tracking, song management, setlists, rehearsals, shows, gear inventory, finances, and collaborative tools.

**Tech Stack:**
- Next.js 16 (App Router, Turbopack)
- TypeScript
- Drizzle ORM + SQLite (LibSQL)
- NextAuth.js for authentication
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui components
- Web Audio API for music tools

---

## Features Implemented

### Core Features
| Feature | Status | Location |
|---------|--------|----------|
| Authentication | Done | `/login`, `/register`, `/api/auth` |
| Dashboard | Done | `/dashboard` |
| Projects | Done | `/projects`, `/projects/[id]` |
| Songs | Done | `/songs`, `/songs/[id]` |
| Setlists | Done | `/setlists`, `/setlists/[id]` |
| Rehearsals | Done | `/rehearsals`, `/rehearsals/[id]` |
| Shows | Done | `/shows`, `/shows/[id]` |
| Calendar | Done | `/calendar` |
| Contacts | Done | `/contacts`, `/contacts/[id]` |
| Tasks | Done | `/tasks`, `/tasks/[id]` |
| Gear Inventory | Done | `/gear`, `/gear/[id]` |
| Finances/Expenses | Done | `/finances` |
| Merch | Done | `/merch`, `/merch/[id]` |
| User Profile | Done | `/profile` |
| Settings | Done | `/settings` |

### Advanced Features
| Feature | Status | Location |
|---------|--------|----------|
| Media Gallery | Done | `/media` - YouTube integration, categories |
| Inspiration Board | Done | `/inspiration`, `/inspiration/[id]` |
| Music Tools | Done | `/tools` - Metronome, Drum Sequencer, Calculators |
| Tempo Maps | Done | `/tempo-maps`, `/tempo-maps/[id]` |
| Comprehensive Sharing | Done | `/shares`, `/share/[token]` |

---

## Recent Implementations (Latest Session)

### 1. Tempo Maps Feature
**Commit:** `ccb0b02`

- Database tables: `tempo_maps`, `tempo_map_sections`
- Create/edit tempo maps with multiple sections
- Each section: name, BPM, time signature, bars count
- Visual timeline with playback progress
- Metronome playback that follows tempo map sections
- Link to projects and songs
- Location: `/tempo-maps`, `/tempo-maps/[id]`

### 2. Comprehensive Sharing System
**Commit:** `5669865`

**Shareable Entity Types (8 total):**
- Projects (with selective include: songs, files, lyrics, arrangements, credits)
- Songs
- Files
- Setlists
- Rehearsals
- Shows
- Media
- Tempo Maps

**Features:**
- Password protection (bcrypt hashed)
- Expiration dates
- View count limits
- Public access without authentication (READ ONLY)
- Selective content inclusion for projects

**Key Files:**
- Schema: `src/lib/db/schema.ts` (shareLinks table)
- Public API: `src/app/api/public/share/[token]/route.ts`
- Public Page: `src/app/share/[token]/page.tsx`
- Management: `src/app/(dashboard)/shares/page.tsx`

---

## Database Schema

### Key Tables
```
users, projects, songs, lyrics, arrangements, song_credits,
files, setlists, setlist_items, rehearsals, rehearsal_attendees,
shows, calendar_events, tasks, contacts, gear, gear_maintenance,
expenses, merch, media, inspiration, tempo_maps, tempo_map_sections,
share_links
```

### Share Links Table Structure
```sql
share_links (
  id, token, name, share_type, password,
  expires_at, allow_download, view_count, max_views, is_active,
  include_config, created_at, created_by_id,
  project_id, song_id, file_id, setlist_id,
  rehearsal_id, show_id, media_id, tempo_map_id
)
```

---

## API Routes

### Public (No Auth)
- `GET/POST /api/public/share/[token]` - Access shared content

### Protected (Requires Auth)
- `/api/projects`, `/api/songs`, `/api/files`
- `/api/setlists`, `/api/rehearsals`, `/api/shows`
- `/api/calendar`, `/api/tasks`, `/api/contacts`
- `/api/gear`, `/api/expenses`, `/api/merch`
- `/api/media`, `/api/inspiration`
- `/api/tempo-maps`, `/api/tempo-maps/[id]/sections`
- `/api/shares`
- `/api/users/profile`, `/api/users/avatar`, `/api/users/password`
- `/api/settings`

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated routes
│   │   ├── calendar/
│   │   ├── contacts/
│   │   ├── dashboard/
│   │   ├── finances/
│   │   ├── gear/
│   │   ├── inspiration/
│   │   ├── media/
│   │   ├── merch/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── rehearsals/
│   │   ├── setlists/
│   │   ├── settings/
│   │   ├── shares/
│   │   ├── shows/
│   │   ├── songs/
│   │   ├── tasks/
│   │   ├── tempo-maps/
│   │   └── tools/
│   ├── api/                  # API routes
│   ├── share/[token]/        # Public share page
│   ├── login/
│   └── register/
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── command-palette.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema
│   ├── auth.ts               # NextAuth config
│   └── utils.ts
└── styles/
    └── globals.css
```

---

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

---

## Known Issues / Technical Debt

1. **`/shares/[id]` page** - Has old data model, may need removal or update
2. **Middleware deprecation warning** - Next.js 16 suggests using "proxy" instead
3. **Foreign keys for shares** - Only project, song, file have proper FK constraints; others (setlist, rehearsal, show, media, tempo_map) are text references without FK

---

## Potential Future Enhancements

- [ ] Real-time collaboration (WebSocket)
- [ ] File upload to cloud storage (S3/R2)
- [ ] Mobile responsive improvements
- [ ] Export features (PDF setlists, calendar sync)
- [ ] Band member roles and permissions
- [ ] Notifications system
- [ ] Audio file waveform visualization
- [ ] MIDI export for tempo maps
- [ ] Integration with streaming platforms

---

## Session Continuation Prompt

Use this prompt to continue development:

```
Continue working on Omraz Studio (band management platform).
Read CLAUDE_SESSION.md for full context.
Branch: claude/omraz-studio-platform-vzOok
Tech: Next.js 16, Drizzle ORM, SQLite, TypeScript, shadcn/ui
```

---

*Last updated: January 2026*
*Latest commit: 5669865 - Comprehensive sharing system*
