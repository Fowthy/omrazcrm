import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { setlistItems, songs } from '@/lib/db/schema';
import { eq, and, asc, gt, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: setlistId } = await params;
    const body = await request.json();

    if (!body.songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Get max position
    const maxPositionItem = await db
      .select({ position: setlistItems.position })
      .from(setlistItems)
      .where(eq(setlistItems.setlistId, setlistId))
      .orderBy(asc(setlistItems.position))
      .all();

    const maxPosition = maxPositionItem.length > 0
      ? Math.max(...maxPositionItem.map(i => i.position))
      : 0;

    const newItem = {
      id: nanoid(),
      setlistId,
      songId: body.songId,
      position: body.position ?? maxPosition + 1,
      notes: body.notes || null,
      customDuration: body.customDuration || null,
    };

    await db.insert(setlistItems).values(newItem).run();

    // Get the item with song details
    const item = await db
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
      })
      .from(setlistItems)
      .leftJoin(songs, eq(setlistItems.songId, songs.id))
      .where(eq(setlistItems.id, newItem.id))
      .get();

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error adding item to setlist:', error);
    return NextResponse.json(
      { error: 'Failed to add item to setlist' },
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

    const { id: setlistId } = await params;
    const body = await request.json();

    if (!body.itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.position !== undefined) updateData.position = body.position;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.customDuration !== undefined) updateData.customDuration = body.customDuration;

    await db
      .update(setlistItems)
      .set(updateData)
      .where(and(eq(setlistItems.id, body.itemId), eq(setlistItems.setlistId, setlistId)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating setlist item:', error);
    return NextResponse.json(
      { error: 'Failed to update setlist item' },
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

    const { id: setlistId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await db
      .delete(setlistItems)
      .where(and(eq(setlistItems.id, itemId), eq(setlistItems.setlistId, setlistId)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing item from setlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from setlist' },
      { status: 500 }
    );
  }
}
