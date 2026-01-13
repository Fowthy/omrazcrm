import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inspirations } from '@/lib/db/schema';
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

    const inspiration = await db
      .select()
      .from(inspirations)
      .where(eq(inspirations.id, id))
      .get();

    if (!inspiration) {
      return NextResponse.json({ error: 'Inspiration not found' }, { status: 404 });
    }

    return NextResponse.json(inspiration);
  } catch (error) {
    console.error('Error fetching inspiration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration' },
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

    const existing = await db
      .select()
      .from(inspirations)
      .where(eq(inspirations.id, id))
      .get();

    if (!existing) {
      return NextResponse.json({ error: 'Inspiration not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.filePath !== undefined) updateData.filePath = body.filePath;
    if (body.tags !== undefined) updateData.tags = body.tags;

    await db
      .update(inspirations)
      .set(updateData)
      .where(eq(inspirations.id, id))
      .run();

    const updated = await db
      .select()
      .from(inspirations)
      .where(eq(inspirations.id, id))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating inspiration:', error);
    return NextResponse.json(
      { error: 'Failed to update inspiration' },
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

    const existing = await db
      .select()
      .from(inspirations)
      .where(eq(inspirations.id, id))
      .get();

    if (!existing) {
      return NextResponse.json({ error: 'Inspiration not found' }, { status: 404 });
    }

    await db.delete(inspirations).where(eq(inspirations.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inspiration:', error);
    return NextResponse.json(
      { error: 'Failed to delete inspiration' },
      { status: 500 }
    );
  }
}
