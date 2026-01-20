import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, epics, users, projects } from '@/lib/db';
import { eq, desc, and, isNull, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const allEpics = projectId
      ? await db
          .select()
          .from(epics)
          .where(eq(epics.projectId, projectId))
          .orderBy(desc(epics.updatedAt))
      : await db
          .select()
          .from(epics)
          .orderBy(desc(epics.updatedAt));

    const epicsWithRelations = await Promise.all(
      allEpics.map(async (epic) => {
        const creator = epic.createdById
          ? await db
              .select({ id: users.id, name: users.name, avatar: users.avatar })
              .from(users)
              .where(eq(users.id, epic.createdById))
              .limit(1)
          : [];

        const project = epic.projectId
          ? await db
              .select({ id: projects.id, name: projects.name, key: projects.key })
              .from(projects)
              .where(eq(projects.id, epic.projectId))
              .limit(1)
          : [];

        return {
          ...epic,
          createdBy: creator[0] || null,
          project: project[0] || null,
        };
      })
    );

    return NextResponse.json(epicsWithRelations);
  } catch (error) {
    console.error('Error fetching epics:', error);
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
      title,
      description,
      status,
      color,
      startDate,
      targetDate,
      projectId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Epic title is required' },
        { status: 400 }
      );
    }

    // Convert empty string or 'none' to null for projectId
    const normalizedProjectId = projectId && projectId.trim() !== '' && projectId !== 'none' ? projectId : null;

    // Generate unique key for epic
    const projectPrefix = normalizedProjectId
      ? (await db.select().from(projects).where(eq(projects.id, normalizedProjectId)).limit(1))[0]?.key || 'EPIC'
      : 'EPIC';

    // Get count of epics for this project to generate next number
    const existingEpics = await db
      .select()
      .from(epics)
      .where(normalizedProjectId ? eq(epics.projectId, normalizedProjectId) : isNull(epics.projectId));

    const epicNumber = existingEpics.length + 1;
    const key = `${projectPrefix}-${epicNumber}`;

    const newEpic = await db
      .insert(epics)
      .values({
        id: nanoid(),
        key,
        title,
        description: description || null,
        status: status || 'planning',
        color: color || '#8B5CF6',
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        projectId: normalizedProjectId,
        progress: 0,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(newEpic[0], { status: 201 });
  } catch (error) {
    console.error('Error creating epic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
