import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, creativeSessions, projects, users } from '@/lib/db';
import { eq, desc, and, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const recent = searchParams.get('recent'); // e.g., "7" for last 7 days

    let query = db
      .select()
      .from(creativeSessions);

    const conditions = [];
    if (albumId) {
      conditions.push(eq(creativeSessions.albumId, albumId));
    }
    if (recent) {
      const daysAgo = parseInt(recent);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      conditions.push(gte(creativeSessions.date, date));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allSessions = await query.orderBy(desc(creativeSessions.date));

    // Enrich with album and creator data
    const sessionsWithRelations = await Promise.all(
      allSessions.map(async (cs) => {
        const album = await db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, cs.albumId))
          .limit(1);

        const creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, cs.createdById))
          .limit(1);

        return {
          ...cs,
          album: album[0] || null,
          createdBy: creator[0] || null,
        };
      })
    );

    return NextResponse.json(sessionsWithRelations);
  } catch (error) {
    console.error('Error fetching creative sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const {
      albumId,
      date,
      startTime,
      endTime,
      preSessionIntent,
      preSessionEnergy,
      postSessionReflection,
      postSessionEnergy,
      postSessionMomentum,
      decisionsLocked,
      versionsRecorded,
      participants,
      stuckPoints,
    } = body;

    if (!albumId) {
      return NextResponse.json(
        { error: 'Album ID is required' },
        { status: 400 }
      );
    }

    const sessionDate = date ? new Date(date) : new Date();
    const sessionStartTime = startTime ? new Date(startTime) : sessionDate;

    const newSession = await db
      .insert(creativeSessions)
      .values({
        id: nanoid(),
        albumId,
        date: sessionDate,
        startTime: sessionStartTime,
        endTime: endTime ? new Date(endTime) : null,
        preSessionIntent: preSessionIntent || null,
        preSessionEnergy: preSessionEnergy || null,
        postSessionReflection: postSessionReflection || null,
        postSessionEnergy: postSessionEnergy || null,
        postSessionMomentum: postSessionMomentum || null,
        decisionsLocked: decisionsLocked ? JSON.stringify(decisionsLocked) : null,
        versionsRecorded: versionsRecorded ? JSON.stringify(versionsRecorded) : null,
        participants: participants ? JSON.stringify(participants) : null,
        stuckPoints: stuckPoints || null,
        createdById: session.user.id,
      })
      .returning();

    const result = Array.isArray(newSession) ? newSession[0] : newSession;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating creative session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
