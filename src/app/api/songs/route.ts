import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, songs, files, users, projects, comments } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allSongs = await db
      .select({
        id: songs.id,
        title: songs.title,
        description: songs.description,
        duration: songs.duration,
        bpm: songs.bpm,
        musicalKey: songs.musicalKey,
        timeSignature: songs.timeSignature,
        status: songs.status,
        trackNumber: songs.trackNumber,
        isPublished: songs.isPublished,
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
        projectId: songs.projectId,
        createdById: songs.createdById,
      })
      .from(songs)
      .orderBy(desc(songs.updatedAt));

    // Get related data for each song
    const songsWithRelations = await Promise.all(
      allSongs.map(async (song) => {
        const audioFiles = await db
          .select()
          .from(files)
          .where(eq(files.songId, song.id));

        const project = song.projectId
          ? await db
              .select({ id: projects.id, name: projects.name })
              .from(projects)
              .where(eq(projects.id, song.projectId))
              .limit(1)
          : [];

        const creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, song.createdById))
          .limit(1);

        const commentCount = await db
          .select()
          .from(comments)
          .where(eq(comments.songId, song.id));

        return {
          ...song,
          fileCount: audioFiles.length,
          project: project[0] || null,
          createdBy: creator[0] || null,
          commentCount: commentCount.length,
        };
      })
    );

    return NextResponse.json(songsWithRelations);
  } catch (error) {
    console.error('Error fetching songs:', error);
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
      title,
      description,
      duration,
      bpm,
      musicalKey,
      timeSignature,
      status,
      projectId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Song title is required' },
        { status: 400 }
      );
    }

    const newSong = await db
      .insert(songs)
      .values({
        id: nanoid(),
        title,
        description: description || null,
        duration: duration || null,
        bpm: bpm || null,
        musicalKey: musicalKey || null,
        timeSignature: timeSignature || '4/4',
        status: status || 'idea',
        projectId: projectId || null,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(newSong[0], { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
