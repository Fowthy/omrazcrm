import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, sprints, users, projects, tasks } from '@/lib/db';
import { eq } from 'drizzle-orm';

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

    const sprint = await db
      .select()
      .from(sprints)
      .where(eq(sprints.id, id))
      .limit(1);

    if (!sprint[0]) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Fetch creator
    const creator = sprint[0].createdById
      ? await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, sprint[0].createdById))
          .limit(1)
      : [];

    // Fetch project
    const project = sprint[0].projectId
      ? await db
          .select({ id: projects.id, name: projects.name, key: projects.key })
          .from(projects)
          .where(eq(projects.id, sprint[0].projectId))
          .limit(1)
      : [];

    // Fetch tasks in this sprint
    const sprintTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.sprintId, id));

    // Calculate metrics
    const completedTasks = sprintTasks.filter(t => t.status === 'done').length;
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = sprintTasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    return NextResponse.json({
      ...sprint[0],
      createdBy: creator[0] || null,
      project: project[0] || null,
      tasks: sprintTasks,
      taskCount: sprintTasks.length,
      completedTaskCount: completedTasks,
      totalPoints,
      completedPoints,
    });
  } catch (error) {
    console.error('Error fetching sprint:', error);
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

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Convert date strings to Date objects if present
    const updates = { ...body };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const updatedSprint = await db
      .update(sprints)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sprints.id, id))
      .returning();

    if (!updatedSprint[0]) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSprint[0]);
  } catch (error) {
    console.error('Error updating sprint:', error);
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

    // When deleting sprint, just remove sprint reference from tasks (don't delete tasks)
    await db
      .update(tasks)
      .set({ sprintId: null })
      .where(eq(tasks.sprintId, id));

    await db.delete(sprints).where(eq(sprints.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
