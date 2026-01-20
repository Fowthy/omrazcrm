import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, decisions } from '@/lib/db';
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

    const decision = await db
      .select()
      .from(decisions)
      .where(eq(decisions.id, id))
      .limit(1);

    if (!decision || decision.length === 0) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    return NextResponse.json(decision[0]);
  } catch (error) {
    console.error('Error fetching decision:', error);
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
      status,
      outcome,
      confidence,
      audioProofId,
      linkedSectionId,
      instrumentOrRole,
      context,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;

      // Update timestamps based on status
      if (status === 'testing' && !updateData.testedAt) {
        updateData.testedAt = new Date();
      } else if (status === 'locked' && !updateData.lockedAt) {
        updateData.lockedAt = new Date();
      } else if (status === 'reopened') {
        updateData.reopenedAt = new Date();
      }
    }

    if (outcome !== undefined) updateData.outcome = outcome;
    if (confidence !== undefined) updateData.confidence = confidence;
    if (audioProofId !== undefined) updateData.audioProofId = audioProofId;
    if (linkedSectionId !== undefined) updateData.linkedSectionId = linkedSectionId;
    if (instrumentOrRole !== undefined) updateData.instrumentOrRole = instrumentOrRole;
    if (context !== undefined) updateData.context = context;

    const updatedDecision = await db
      .update(decisions)
      .set(updateData)
      .where(eq(decisions.id, id))
      .returning();

    if (!updatedDecision || updatedDecision.length === 0) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    const result = Array.isArray(updatedDecision) ? updatedDecision[0] : updatedDecision;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating decision:', error);
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

    await db.delete(decisions).where(eq(decisions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting decision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
