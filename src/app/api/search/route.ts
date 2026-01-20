import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, projects, songs, decisions, creativeSessions, notes } from '@/lib/db';
import { like, or, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

interface SearchResult {
  id: string;
  type: 'album' | 'song' | 'decision' | 'session' | 'note';
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  url: string;
  createdAt: Date;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // album, song, decision, session, note, or null for all
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const searchPattern = `%${query}%`;
    const results: SearchResult[] = [];

    // Search albums (projects)
    if (!type || type === 'album') {
      const albumResults = await db
        .select()
        .from(projects)
        .where(
          or(
            like(projects.name, searchPattern),
            like(projects.description, searchPattern),
            like(projects.artisticIntent, searchPattern),
            like(projects.narrativeTheme, searchPattern)
          )
        )
        .orderBy(desc(projects.updatedAt))
        .limit(type ? limit : 5);

      results.push(
        ...albumResults.map((album) => ({
          id: album.id,
          type: 'album' as const,
          title: album.name,
          subtitle: album.type,
          description: album.description || album.artisticIntent || undefined,
          status: album.status,
          url: `/projects/${album.id}`,
          createdAt: album.createdAt,
        }))
      );
    }

    // Search songs
    if (!type || type === 'song') {
      const songResults = await db
        .select()
        .from(songs)
        .where(
          or(
            like(songs.title, searchPattern),
            like(songs.description, searchPattern),
            like(songs.lyrics, searchPattern),
            like(songs.artisticIntent, searchPattern)
          )
        )
        .orderBy(desc(songs.updatedAt))
        .limit(type ? limit : 5);

      results.push(
        ...songResults.map((song) => ({
          id: song.id,
          type: 'song' as const,
          title: song.title,
          subtitle: song.phase || song.status,
          description: song.description || song.artisticIntent || undefined,
          status: song.phase || song.status,
          url: `/songs/${song.id}`,
          createdAt: song.createdAt,
        }))
      );
    }

    // Search decisions
    if (!type || type === 'decision') {
      const decisionResults = await db
        .select()
        .from(decisions)
        .where(
          or(
            like(decisions.question, searchPattern),
            like(decisions.context, searchPattern),
            like(decisions.outcome, searchPattern),
            like(decisions.instrumentOrRole, searchPattern)
          )
        )
        .orderBy(desc(decisions.updatedAt))
        .limit(type ? limit : 5);

      results.push(
        ...decisionResults.map((decision) => ({
          id: decision.id,
          type: 'decision' as const,
          title: decision.question,
          subtitle: `${decision.decisionType} • ${decision.instrumentOrRole || 'general'}`,
          description: decision.context || decision.outcome || undefined,
          status: decision.status,
          url: `/decisions?id=${decision.id}`,
          createdAt: decision.createdAt,
        }))
      );
    }

    // Search sessions
    if (!type || type === 'session') {
      const sessionResults = await db
        .select()
        .from(creativeSessions)
        .where(
          or(
            like(creativeSessions.preSessionIntent, searchPattern),
            like(creativeSessions.postSessionReflection, searchPattern),
            like(creativeSessions.stuckPoints, searchPattern)
          )
        )
        .orderBy(desc(creativeSessions.date))
        .limit(type ? limit : 5);

      results.push(
        ...sessionResults.map((s) => ({
          id: s.id,
          type: 'session' as const,
          title: s.preSessionIntent || 'Session',
          subtitle: s.date ? new Date(s.date).toLocaleDateString() : undefined,
          description: s.postSessionReflection || undefined,
          status: s.endTime ? 'completed' : 'active',
          url: `/sessions?id=${s.id}`,
          createdAt: s.date,
        }))
      );
    }

    // Search notes
    if (!type || type === 'note') {
      const noteResults = await db
        .select()
        .from(notes)
        .where(like(notes.content, searchPattern))
        .orderBy(desc(notes.createdAt))
        .limit(type ? limit : 5);

      results.push(
        ...noteResults.map((note) => ({
          id: note.id,
          type: 'note' as const,
          title: note.content.substring(0, 80) + (note.content.length > 80 ? '...' : ''),
          subtitle: note.noteType,
          description: undefined,
          status: note.isArchived ? 'archived' : 'active',
          url: `/notes?id=${note.id}`,
          createdAt: note.createdAt,
        }))
      );
    }

    // Sort all results by createdAt
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
