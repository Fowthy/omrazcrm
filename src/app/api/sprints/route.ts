import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, sprints, users, projects, tasks } from '@/lib/db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
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
    const status = searchParams.get('status');

    let conditions = [];
    if (projectId) {
      conditions.push(eq(sprints.projectId, projectId));
    }
    if (status) {
      conditions.push(eq(sprints.status, status));
    }

    let query = db.select().from(sprints);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allSprints = await query.orderBy(desc(sprints.startDate));

    const sprintsWithRelations = await Promise.all(
      allSprints.map(async (sprint) => {
        const creator = sprint.createdById
          ? await db
              .select({ id: users.id, name: users.name, avatar: users.avatar })
              .from(users)
              .where(eq(users.id, sprint.createdById))
              .limit(1)
          : [];

        const project = sprint.projectId
          ? await db
              .select({ id: projects.id, name: projects.name, key: projects.key })
              .from(projects)
              .where(eq(projects.id, sprint.projectId))
              .limit(1)
          : [];

        // Count tasks in sprint
        const sprintTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.sprintId, sprint.id));

        const completedTasks = sprintTasks.filter(t => t.status === 'done').length;
        const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedPoints = sprintTasks
          .filter(t => t.status === 'done')
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return {
          ...sprint,
          createdBy: creator[0] || null,
          project: project[0] || null,
          taskCount: sprintTasks.length,
          completedTaskCount: completedTasks,
          totalPoints,
          completedPoints,
        };
      })
    );

    return NextResponse.json(sprintsWithRelations);
  } catch (error) {
    console.error('Error fetching sprints:', error);
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
      name,
      goal,
      status,
      startDate,
      endDate,
      projectId,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Sprint name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const newSprint = await db
      .insert(sprints)
      .values({
        id: nanoid(),
        name,
        goal: goal || null,
        status: status || 'planning',
        startDate: start,
        endDate: end,
        projectId: projectId || null,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(newSprint[0], { status: 201 });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
