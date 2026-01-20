import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, notes, songs, projects, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const songId = searchParams.get('songId');
    const sectionId = searchParams.get('sectionId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let query = db
      .select()
      .from(notes);

    const conditions = [];
    if (albumId) {
      conditions.push(eq(notes.albumId, albumId));
    }
    if (songId) {
      conditions.push(eq(notes.songId, songId));
    }
    if (sectionId) {
      conditions.push(eq(notes.sectionId, sectionId));
    }
    if (!includeArchived) {
      conditions.push(eq(notes.isArchived, false));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allNotes = await query.orderBy(desc(notes.createdAt));

    // Enrich with related data
    const notesWithRelations = await Promise.all(
      allNotes.map(async (note) => {
        const creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, note.createdBy))
          .limit(1);

        let song = null;
        if (note.songId) {
          const songData = await db
            .select({ title: songs.title })
            .from(songs)
            .where(eq(songs.id, note.songId))
            .limit(1);
          song = songData[0] || null;
        }

        let album = null;
        if (note.albumId) {
          const albumData = await db
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, note.albumId))
            .limit(1);
          album = albumData[0] || null;
        }

        return {
          ...note,
          createdByUser: creator[0] || null,
          song,
          album,
        };
      })
    );

    return NextResponse.json(notesWithRelations);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      albumId,
      songId,
      sectionId,
      noteType,
      content,
      audioUrl,
      linkedToTimestamp,
      linkedToVersionId,
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const newNote = await db
      .insert(notes)
      .values({
        id: nanoid(),
        albumId: albumId || null,
        songId: songId || null,
        sectionId: sectionId || null,
        noteType: noteType || 'text',
        content,
        audioUrl: audioUrl || null,
        linkedToTimestamp: linkedToTimestamp || null,
        linkedToVersionId: linkedToVersionId || null,
        createdBy: session.user.id,
        isArchived: false,
      })
      .returning();

    const result = Array.isArray(newNote) ? newNote[0] : newNote;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
