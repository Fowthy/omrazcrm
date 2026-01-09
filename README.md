# Omraz Studio

A comprehensive band management platform for Omraz that centralizes all band-related work in one place.

## Features

### Core Features
- **Projects** - Manage albums, EPs, singles, and demos with status tracking
- **Songs** - Track songs with BPM, key, lyrics, and audio files
- **File Management** - Upload and version control for audio, images, documents, and more
- **Audio Player** - Waveform visualization with playback speed control and looping

### Work Management
- **Tasks** - Kanban board for task management with assignments and priorities
- **Setlists** - Create and manage setlists with duration calculations
- **Rehearsals** - Schedule rehearsals with attendance tracking and goals
- **Calendar** - Unified calendar view for all events

### Resources
- **Finances** - Track expenses, split costs, and generate reports
- **Gear Inventory** - Catalog equipment with maintenance logs
- **Contacts** - Manage industry contacts and interaction history
- **Inspiration Board** - Save references, ideas, and creative inspiration

### Additional Features
- **Shows & Tours** - Manage live shows and tour logistics
- **Merch** - Track merchandise inventory and sales
- **Sharing** - Generate password-protected share links
- **Notifications** - Stay updated on band activity
- **Global Search** - Find anything across the platform

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Audio**: WaveSurfer.js for waveform visualization
- **UI Components**: Radix UI primitives with shadcn/ui styling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   npm run db:init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login

- Email: `admin@omraz.com`
- Password: `admin123`

## Database

The application uses SQLite with Drizzle ORM. Database commands:

```bash
# Generate migrations
npm run db:generate

# Push schema changes
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Initialize with seed data
npm run db:init
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── audio/            # Audio player components
│   ├── layout/           # Layout components
│   └── ui/               # UI components (shadcn/ui style)
├── lib/                   # Utility libraries
│   ├── db/               # Database schema and connection
│   ├── auth.ts           # NextAuth configuration
│   └── utils.ts          # Utility functions
├── store/                 # Zustand stores
└── types/                 # TypeScript type definitions
```

## Contributing

This is a private project for Omraz. Contact the band for contribution guidelines.

## License

Private - All rights reserved.
