import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shareLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const share = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, id))
      .get();

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    return NextResponse.json(share);
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share' },
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

    const existingShare = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, id))
      .get();

    if (!existingShare) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.password !== undefined) updateData.password = body.password;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.allowDownload !== undefined) updateData.allowDownload = body.allowDownload;
    if (body.maxViews !== undefined) updateData.maxViews = body.maxViews;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await db
      .update(shareLinks)
      .set(updateData)
      .where(eq(shareLinks.id, id))
      .run();

    const updatedShare = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, id))
      .get();

    return NextResponse.json(updatedShare);
  } catch (error) {
    console.error('Error updating share:', error);
    return NextResponse.json(
      { error: 'Failed to update share' },
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

    const existingShare = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, id))
      .get();

    if (!existingShare) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    await db.delete(shareLinks).where(eq(shareLinks.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting share:', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}
