import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, creativeSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

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

    const creativeSession = await db
      .select()
      .from(creativeSessions)
      .where(eq(creativeSessions.id, id))
      .limit(1);

    if (!creativeSession || creativeSession.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(creativeSession[0]);
  } catch (error) {
    console.error('Error fetching creative session:', error);
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
      endTime,
      postSessionReflection,
      postSessionEnergy,
      postSessionMomentum,
      decisionsLocked,
      versionsRecorded,
      stuckPoints,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (postSessionReflection !== undefined) updateData.postSessionReflection = postSessionReflection;
    if (postSessionEnergy !== undefined) updateData.postSessionEnergy = postSessionEnergy;
    if (postSessionMomentum !== undefined) updateData.postSessionMomentum = postSessionMomentum;
    if (decisionsLocked !== undefined) updateData.decisionsLocked = JSON.stringify(decisionsLocked);
    if (versionsRecorded !== undefined) updateData.versionsRecorded = JSON.stringify(versionsRecorded);
    if (stuckPoints !== undefined) updateData.stuckPoints = stuckPoints;

    const updatedSession = await db
      .update(creativeSessions)
      .set(updateData)
      .where(eq(creativeSessions.id, id))
      .returning();

    if (!updatedSession || updatedSession.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const result = Array.isArray(updatedSession) ? updatedSession[0] : updatedSession;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating creative session:', error);
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

    await db.delete(creativeSessions).where(eq(creativeSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting creative session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
