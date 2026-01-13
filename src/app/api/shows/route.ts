import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shows, setlists } from '@/lib/db/schema';
import { desc, eq, gte, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');

    let query = db
      .select({
        id: shows.id,
        title: shows.title,
        venue: shows.venue,
        city: shows.city,
        country: shows.country,
        date: shows.date,
        loadIn: shows.loadIn,
        soundcheck: shows.soundcheck,
        doors: shows.doors,
        setTime: shows.setTime,
        setDuration: shows.setDuration,
        ticketPrice: shows.ticketPrice,
        ticketLink: shows.ticketLink,
        promoter: shows.promoter,
        notes: shows.notes,
        status: shows.status,
        setlistId: shows.setlistId,
        createdAt: shows.createdAt,
        updatedAt: shows.updatedAt,
        setlistName: setlists.name,
      })
      .from(shows)
      .leftJoin(setlists, eq(shows.setlistId, setlists.id));

    if (status) {
      query = query.where(eq(shows.status, status)) as typeof query;
    }

    if (upcoming === 'true') {
      query = query.where(gte(shows.date, new Date())) as typeof query;
    } else if (upcoming === 'false') {
      query = query.where(lt(shows.date, new Date())) as typeof query;
    }

    const allShows = await query.orderBy(desc(shows.date)).all();

    return NextResponse.json(allShows);
  } catch (error) {
    console.error('Error fetching shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
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

    if (!body.title?.trim() || !body.venue?.trim() || !body.date) {
      return NextResponse.json(
        { error: 'Title, venue, and date are required' },
        { status: 400 }
      );
    }

    const newShow = {
      id: nanoid(),
      title: body.title.trim(),
      venue: body.venue.trim(),
      city: body.city || null,
      country: body.country || null,
      date: new Date(body.date),
      loadIn: body.loadIn ? new Date(body.loadIn) : null,
      soundcheck: body.soundcheck ? new Date(body.soundcheck) : null,
      doors: body.doors ? new Date(body.doors) : null,
      setTime: body.setTime ? new Date(body.setTime) : null,
      setDuration: body.setDuration || null,
      ticketPrice: body.ticketPrice ? parseFloat(body.ticketPrice) : null,
      ticketLink: body.ticketLink || null,
      promoter: body.promoter || null,
      notes: body.notes || null,
      status: body.status || 'confirmed',
      setlistId: body.setlistId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(shows).values(newShow).run();

    return NextResponse.json(newShow);
  } catch (error) {
    console.error('Error creating show:', error);
    return NextResponse.json(
      { error: 'Failed to create show' },
      { status: 500 }
    );
  }
}
