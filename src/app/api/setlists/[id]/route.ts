import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { setlists, setlistItems, songs, users } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

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

    const setlist = await db
      .select({
        id: setlists.id,
        name: setlists.name,
        description: setlists.description,
        venue: setlists.venue,
        eventDate: setlists.eventDate,
        notes: setlists.notes,
        createdAt: setlists.createdAt,
        updatedAt: setlists.updatedAt,
        createdById: setlists.createdById,
      })
      .from(setlists)
      .where(eq(setlists.id, id))
      .get();

    if (!setlist) {
      return NextResponse.json({ error: 'Setlist not found' }, { status: 404 });
    }

    // Get setlist items with song details
    const items = await db
      .select({
        id: setlistItems.id,
        position: setlistItems.position,
        notes: setlistItems.notes,
        customDuration: setlistItems.customDuration,
        songId: setlistItems.songId,
        songTitle: songs.title,
        songDuration: songs.duration,
        songBpm: songs.bpm,
        songKey: songs.musicalKey,
        songStatus: songs.status,
      })
      .from(setlistItems)
      .leftJoin(songs, eq(setlistItems.songId, songs.id))
      .where(eq(setlistItems.setlistId, id))
      .orderBy(asc(setlistItems.position))
      .all();

    // Get creator info
    const creator = await db
      .select({
        name: users.name,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, setlist.createdById))
      .get();

    // Calculate total duration
    const totalDuration = items.reduce((acc, item) => {
      return acc + (item.customDuration || item.songDuration || 0);
    }, 0);

    return NextResponse.json({
      ...setlist,
      items,
      totalDuration,
      songCount: items.length,
      createdBy: creator,
    });
  } catch (error) {
    console.error('Error fetching setlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setlist' },
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

    // Check if setlist exists
    const existingSetlist = await db
      .select()
      .from(setlists)
      .where(eq(setlists.id, id))
      .get();

    if (!existingSetlist) {
      return NextResponse.json({ error: 'Setlist not found' }, { status: 404 });
    }

    // Update setlist
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.eventDate !== undefined) {
      updateData.eventDate = body.eventDate ? new Date(body.eventDate) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    await db
      .update(setlists)
      .set(updateData)
      .where(eq(setlists.id, id))
      .run();

    const updatedSetlist = await db
      .select()
      .from(setlists)
      .where(eq(setlists.id, id))
      .get();

    return NextResponse.json(updatedSetlist);
  } catch (error) {
    console.error('Error updating setlist:', error);
    return NextResponse.json(
      { error: 'Failed to update setlist' },
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

    // Check if setlist exists
    const existingSetlist = await db
      .select()
      .from(setlists)
      .where(eq(setlists.id, id))
      .get();

    if (!existingSetlist) {
      return NextResponse.json({ error: 'Setlist not found' }, { status: 404 });
    }

    // Delete setlist (items will cascade)
    await db.delete(setlists).where(eq(setlists.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete setlist' },
      { status: 500 }
    );
  }
}
