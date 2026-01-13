import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rehearsals, users } from '@/lib/db/schema';
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

    const allRehearsals = await db
      .select({
        id: rehearsals.id,
        title: rehearsals.title,
        location: rehearsals.location,
        scheduledAt: rehearsals.scheduledAt,
        endTime: rehearsals.endTime,
        notes: rehearsals.notes,
        goals: rehearsals.goals,
        createdAt: rehearsals.createdAt,
        updatedAt: rehearsals.updatedAt,
        createdById: rehearsals.createdById,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(rehearsals)
      .leftJoin(users, eq(rehearsals.createdById, users.id))
      .orderBy(desc(rehearsals.scheduledAt))
      .all();

    return NextResponse.json(allRehearsals);
  } catch (error) {
    console.error('Error fetching rehearsals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rehearsals' },
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
        { error: 'Rehearsal title is required' },
        { status: 400 }
      );
    }

    const newRehearsal = {
      id: nanoid(),
      title: body.title.trim(),
      location: body.location || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
      endTime: body.endTime ? new Date(body.endTime) : null,
      notes: body.notes || null,
      goals: body.goals || null,
      recordings: null,
      createdById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(rehearsals).values(newRehearsal).run();

    return NextResponse.json(newRehearsal);
  } catch (error) {
    console.error('Error creating rehearsal:', error);
    return NextResponse.json(
      { error: 'Failed to create rehearsal' },
      { status: 500 }
    );
  }
}
