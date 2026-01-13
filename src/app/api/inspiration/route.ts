import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inspirations, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allInspirations = await db
      .select({
        id: inspirations.id,
        title: inspirations.title,
        type: inspirations.type,
        content: inspirations.content,
        url: inspirations.url,
        filePath: inspirations.filePath,
        tags: inspirations.tags,
        createdAt: inspirations.createdAt,
        updatedAt: inspirations.updatedAt,
        createdById: inspirations.createdById,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(inspirations)
      .leftJoin(users, eq(inspirations.createdById, users.id))
      .orderBy(desc(inspirations.createdAt))
      .all();

    return NextResponse.json(allInspirations);
  } catch (error) {
    console.error('Error fetching inspirations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspirations' },
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

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newInspiration = {
      id: nanoid(),
      title: body.title.trim(),
      type: body.type || 'idea',
      content: body.content || null,
      url: body.url || null,
      filePath: body.filePath || null,
      tags: body.tags || null,
      createdById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(inspirations).values(newInspiration).run();

    return NextResponse.json(newInspiration);
  } catch (error) {
    console.error('Error creating inspiration:', error);
    return NextResponse.json(
      { error: 'Failed to create inspiration' },
      { status: 500 }
    );
  }
}
