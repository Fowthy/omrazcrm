import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, setlists, setlistItems, songs, users } from '@/lib/db';
import { eq, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allSetlists = await db
      .select()
      .from(setlists)
      .orderBy(desc(setlists.updatedAt));

    const setlistsWithRelations = await Promise.all(
      allSetlists.map(async (setlist) => {
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
          })
          .from(setlistItems)
          .leftJoin(songs, eq(setlistItems.songId, songs.id))
          .where(eq(setlistItems.setlistId, setlist.id))
          .orderBy(asc(setlistItems.position));

        const totalDuration = items.reduce((acc, item) => {
          return acc + (item.customDuration || item.songDuration || 0);
        }, 0);

        const creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, setlist.createdById))
          .limit(1);

        return {
          ...setlist,
          items,
          totalDuration,
          songCount: items.length,
          createdBy: creator[0] || null,
        };
      })
    );

    return NextResponse.json(setlistsWithRelations);
  } catch (error) {
    console.error('Error fetching setlists:', error);
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
    const { name, description, venue, eventDate, notes, items } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Setlist name is required' },
        { status: 400 }
      );
    }

    const setlistId = nanoid();

    await db.insert(setlists).values({
      id: setlistId,
      name,
      description: description || null,
      venue: venue || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      notes: notes || null,
      createdById: session.user.id,
    });

    // Add songs to setlist
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        await db.insert(setlistItems).values({
          id: nanoid(),
          setlistId,
          songId: items[i].songId,
          position: i + 1,
          notes: items[i].notes || null,
          customDuration: items[i].customDuration || null,
        });
      }
    }

    const newSetlist = await db
      .select()
      .from(setlists)
      .where(eq(setlists.id, setlistId))
      .limit(1);

    return NextResponse.json(newSetlist[0], { status: 201 });
  } catch (error) {
    console.error('Error creating setlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
