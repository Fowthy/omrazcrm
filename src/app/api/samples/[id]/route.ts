import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, samples } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import path from 'path';

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

    const sample = await db
      .select()
      .from(samples)
      .where(eq(samples.id, id))
      .limit(1);

    if (sample.length === 0) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
    }

    return NextResponse.json(sample[0]);
  } catch (error) {
    console.error('Error fetching sample:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if sample exists and belongs to user
    const existing = await db
      .select()
      .from(samples)
      .where(eq(samples.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
    }

    // Update sample
    const updated = await db
      .update(samples)
      .set({
        name: body.name ?? existing[0].name,
        category: body.category ?? existing[0].category,
        tags: body.tags ?? existing[0].tags,
        bpm: body.bpm ?? existing[0].bpm,
        musicalKey: body.musicalKey ?? existing[0].musicalKey,
        updatedAt: new Date(),
      })
      .where(eq(samples.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating sample:', error);
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

    // Check if sample exists
    const existing = await db
      .select()
      .from(samples)
      .where(eq(samples.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
    }

    // Delete the file
    try {
      const filePath = path.join(process.cwd(), existing[0].filePath);
      await unlink(filePath);
    } catch (e) {
      // File might not exist, continue with db deletion
      console.warn('Could not delete sample file:', e);
    }

    // Delete from database
    await db.delete(samples).where(eq(samples.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sample:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
