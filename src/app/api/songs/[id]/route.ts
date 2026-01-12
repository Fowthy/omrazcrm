import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, songs, files, users, projects, comments } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const song = await db
      .select()
      .from(songs)
      .where(eq(songs.id, id))
      .limit(1);

    if (song.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Get related data
    const audioFiles = await db
      .select()
      .from(files)
      .where(eq(files.songId, id));

    const project = song[0].projectId
      ? await db
          .select({ id: projects.id, name: projects.name })
          .from(projects)
          .where(eq(projects.id, song[0].projectId))
          .limit(1)
      : [];

    const creator = await db
      .select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, song[0].createdById))
      .limit(1);

    const songComments = await db
      .select()
      .from(comments)
      .where(eq(comments.songId, id));

    return NextResponse.json({
      ...song[0],
      files: audioFiles,
      project: project[0] || null,
      createdBy: creator[0] || null,
      comments: songComments,
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      duration,
      bpm,
      musicalKey,
      timeSignature,
      status,
      trackNumber,
      projectId,
    } = body;

    // Check if song exists
    const existing = await db
      .select()
      .from(songs)
      .where(eq(songs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Update song
    const updated = await db
      .update(songs)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
        ...(bpm !== undefined && { bpm }),
        ...(musicalKey !== undefined && { musicalKey }),
        ...(timeSignature !== undefined && { timeSignature }),
        ...(status !== undefined && { status }),
        ...(trackNumber !== undefined && { trackNumber }),
        ...(projectId !== undefined && { projectId }),
        updatedAt: new Date(),
      })
      .where(eq(songs.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if song exists
    const existing = await db
      .select()
      .from(songs)
      .where(eq(songs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Delete associated files
    await db.delete(files).where(eq(files.songId, id));

    // Delete associated comments
    await db.delete(comments).where(eq(comments.songId, id));

    // Delete song
    await db.delete(songs).where(eq(songs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
