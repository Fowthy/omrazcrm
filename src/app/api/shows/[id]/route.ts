import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shows } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    const show = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id))
      .get();

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    return NextResponse.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    return NextResponse.json(
      { error: 'Failed to fetch show' },
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

    const existingShow = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id))
      .get();

    if (!existingShow) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.date !== undefined) updateData.date = body.date ? new Date(body.date) : null;
    if (body.loadIn !== undefined) updateData.loadIn = body.loadIn ? new Date(body.loadIn) : null;
    if (body.soundcheck !== undefined) updateData.soundcheck = body.soundcheck ? new Date(body.soundcheck) : null;
    if (body.doors !== undefined) updateData.doors = body.doors ? new Date(body.doors) : null;
    if (body.setTime !== undefined) updateData.setTime = body.setTime ? new Date(body.setTime) : null;
    if (body.setDuration !== undefined) updateData.setDuration = body.setDuration;
    if (body.ticketPrice !== undefined) updateData.ticketPrice = body.ticketPrice ? parseFloat(body.ticketPrice) : null;
    if (body.ticketLink !== undefined) updateData.ticketLink = body.ticketLink;
    if (body.promoter !== undefined) updateData.promoter = body.promoter;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.setlistId !== undefined) updateData.setlistId = body.setlistId;

    await db
      .update(shows)
      .set(updateData)
      .where(eq(shows.id, id))
      .run();

    const updatedShow = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id))
      .get();

    return NextResponse.json(updatedShow);
  } catch (error) {
    console.error('Error updating show:', error);
    return NextResponse.json(
      { error: 'Failed to update show' },
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

    const existingShow = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id))
      .get();

    if (!existingShow) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    await db.delete(shows).where(eq(shows.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting show:', error);
    return NextResponse.json(
      { error: 'Failed to delete show' },
      { status: 500 }
    );
  }
}
