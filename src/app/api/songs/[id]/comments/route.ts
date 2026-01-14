import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, comments, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// Get all comments for a song
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: songId } = await params;

    const songComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        timestamp: comments.timestamp,
        resolved: comments.resolved,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        parentId: comments.parentId,
      })
      .from(comments)
      .where(eq(comments.songId, songId))
      .orderBy(desc(comments.createdAt));

    // Get user info for each comment
    const commentsWithUser = await Promise.all(
      songComments.map(async (comment) => {
        const user = await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, comment.userId))
          .limit(1);

        return {
          ...comment,
          user: user[0] || null,
        };
      })
    );

    return NextResponse.json(commentsWithUser);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: songId } = await params;
    const body = await request.json();
    const { content, timestamp, parentId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const newComment = await db
      .insert(comments)
      .values({
        id: nanoid(),
        content: content.trim(),
        timestamp: timestamp ?? null,
        songId,
        userId: session.user.id,
        parentId: parentId || null,
      })
      .returning();

    // Get user info
    const user = await db
      .select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      ...newComment[0],
      user: user[0] || null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check if comment exists and belongs to user
    const existing = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existing[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
