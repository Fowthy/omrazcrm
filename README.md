# Omraz Studio

A comprehensive band management platform that centralizes all your band's creative work, planning, and business operations in one place. Built specifically for bands and music creators who need to stay organized while focusing on what matters most: making music.

## What is Omraz Studio?

Omraz Studio is your band's digital headquarters. It brings together everything a working band needs to manage their music career:

- **Organize your music** - Track projects from initial ideas through final release
- **Collaborate effectively** - Assign tasks, share files, and keep everyone on the same page
- **Plan your schedule** - Manage rehearsals, shows, and deadlines in one calendar
- **Handle business** - Track expenses, manage merch inventory, and maintain industry contacts
- **Preserve inspiration** - Save ideas, references, and creative concepts before they're forgotten

Whether you're working on a new album, preparing for a tour, or just trying to keep band practice organized, Omraz Studio provides the tools you need without the complexity.

## Getting Started

1. **Create an account** or sign in with the demo credentials
2. **Select or create a project** - This is your album, EP, or single
3. **Add songs** to your project with metadata like BPM, key, and lyrics
4. **Upload audio files** and collaborate on mixes
5. **Track progress** with the kanban task board
6. **Schedule events** like rehearsals and shows in the calendar

Use the **Command Palette** (press `Cmd/Ctrl + K`) to quickly navigate anywhere in the app.

## Features

### Core Features
- **Projects** - Manage albums, EPs, singles, and demos with status tracking through the production workflow (Idea → Writing → Recording → Mixing → Mastering → Released)
- **Songs** - Track songs with BPM, key, time signature, duration, lyrics, and audio files
- **File Management** - Upload and version control for audio, images, documents, and project files
- **Audio Player** - Waveform visualization with playback speed control and looping for practice

### Work Management
- **Tasks (Kanban Board)** - Visual task management with columns for To Do, In Progress, Review, and Done. Assign tasks to band members, set priorities, link to songs or projects
- **Setlists** - Create and manage setlists with drag-and-drop ordering, automatic duration calculations, and transition notes
- **Rehearsals** - Schedule band practice with location, goals, and attendance tracking
- **Calendar** - Unified calendar view showing all shows, rehearsals, task deadlines, and release dates

### Resources
- **Finances** - Log band expenses by category, upload receipts, track who paid, and view spending summaries
- **Gear Inventory** - Catalog all your equipment with brand, model, serial numbers, and maintenance logs for string changes, repairs, etc.
- **Contacts** - Manage industry contacts (venues, studios, engineers, promoters) with notes and interaction history
- **Inspiration Board** - Save reference tracks, mood boards, images, and creative ideas with tags for easy filtering

### Additional Features
- **Shows & Tours** - Track venue details, set times, soundcheck, ticket prices, and link setlists
- **Merch** - Manage merchandise products with pricing, inventory levels, and sales tracking
- **Sharing** - Generate password-protected, expiring links to share projects, songs, or files with collaborators
- **Global Search** - Find anything across the platform instantly

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Turso/libSQL (SQLite-compatible, Edge-ready)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js v5
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

## Deploying to Vercel

### 1. Create a Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create a database
turso db create omraz-studio

# Get database URL
turso db show omraz-studio --url

# Create auth token
turso db tokens create omraz-studio
```

### 2. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `DATABASE_URL` - Your Turso database URL (e.g., `libsql://your-db.turso.io`)
   - `DATABASE_AUTH_TOKEN` - Your Turso auth token
   - `NEXTAUTH_SECRET` - A random secret string (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
4. Deploy!

### 3. Initialize Database

After deployment, run the database migrations:

```bash
# Push schema to Turso
DATABASE_URL=libsql://your-db.turso.io DATABASE_AUTH_TOKEN=your-token npx drizzle-kit push
```

## Contributing

This is a private project for Omraz. Contact the band for contribution guidelines.

## License

Private - All rights reserved.
