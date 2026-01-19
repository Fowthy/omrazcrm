import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, epics, users, projects, tasks } from '@/lib/db';
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

    const epic = await db
      .select()
      .from(epics)
      .where(eq(epics.id, id))
      .limit(1);

    if (!epic[0]) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    // Fetch creator
    const creator = epic[0].createdById
      ? await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, epic[0].createdById))
          .limit(1)
      : [];

    // Fetch project
    const project = epic[0].projectId
      ? await db
          .select({ id: projects.id, name: projects.name, key: projects.key })
          .from(projects)
          .where(eq(projects.id, epic[0].projectId))
          .limit(1)
      : [];

    // Fetch tasks in this epic
    const epicTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.epicId, id));

    return NextResponse.json({
      ...epic[0],
      createdBy: creator[0] || null,
      project: project[0] || null,
      tasks: epicTasks,
    });
  } catch (error) {
    console.error('Error fetching epic:', error);
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
    if (updates.targetDate) updates.targetDate = new Date(updates.targetDate);
    if (updates.completedDate) updates.completedDate = new Date(updates.completedDate);

    const updatedEpic = await db
      .update(epics)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(epics.id, id))
      .returning();

    if (!updatedEpic[0]) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEpic[0]);
  } catch (error) {
    console.error('Error updating epic:', error);
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

    // Check if epic has tasks
    const epicTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.epicId, id));

    if (epicTasks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete epic with associated tasks. Remove tasks first.' },
        { status: 400 }
      );
    }

    await db.delete(epics).where(eq(epics.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting epic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
