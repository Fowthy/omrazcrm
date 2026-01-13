import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rehearsals } from '@/lib/db/schema';
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

    const rehearsal = await db
      .select()
      .from(rehearsals)
      .where(eq(rehearsals.id, id))
      .get();

    if (!rehearsal) {
      return NextResponse.json({ error: 'Rehearsal not found' }, { status: 404 });
    }

    return NextResponse.json(rehearsal);
  } catch (error) {
    console.error('Error fetching rehearsal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rehearsal' },
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

    const existingRehearsal = await db
      .select()
      .from(rehearsals)
      .where(eq(rehearsals.id, id))
      .get();

    if (!existingRehearsal) {
      return NextResponse.json({ error: 'Rehearsal not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime ? new Date(body.endTime) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.goals !== undefined) updateData.goals = body.goals;

    await db
      .update(rehearsals)
      .set(updateData)
      .where(eq(rehearsals.id, id))
      .run();

    const updatedRehearsal = await db
      .select()
      .from(rehearsals)
      .where(eq(rehearsals.id, id))
      .get();

    return NextResponse.json(updatedRehearsal);
  } catch (error) {
    console.error('Error updating rehearsal:', error);
    return NextResponse.json(
      { error: 'Failed to update rehearsal' },
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

    const existingRehearsal = await db
      .select()
      .from(rehearsals)
      .where(eq(rehearsals.id, id))
      .get();

    if (!existingRehearsal) {
      return NextResponse.json({ error: 'Rehearsal not found' }, { status: 404 });
    }

    await db.delete(rehearsals).where(eq(rehearsals.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rehearsal:', error);
    return NextResponse.json(
      { error: 'Failed to delete rehearsal' },
      { status: 500 }
    );
  }
}
