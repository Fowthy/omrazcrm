import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, media } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import path from 'path';

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

    const result = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching media:', error);
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, category, tags, date } = body;

    const existing = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const result = await db
      .update(media)
      .set({
        title: title || existing[0].title,
        description: description !== undefined ? description : existing[0].description,
        category: category || existing[0].category,
        tags: tags !== undefined ? tags : existing[0].tags,
        date: date ? new Date(date) : existing[0].date,
        updatedAt: new Date(),
      })
      .where(eq(media.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating media:', error);
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete file if it exists
    if (existing[0].filePath) {
      try {
        const fullPath = path.join(process.cwd(), 'public', existing[0].filePath);
        await unlink(fullPath);
      } catch (err) {
        // File might not exist, continue with deletion
        console.warn('Could not delete file:', err);
      }
    }

    await db.delete(media).where(eq(media.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
