import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, tasks, users, projects, songs, subtasks } from '@/lib/db';
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

    const taskResult = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult[0];

    const assignee = task.assigneeId
      ? await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, task.assigneeId))
          .limit(1)
      : [];

    const project = task.projectId
      ? await db
          .select({ id: projects.id, name: projects.name })
          .from(projects)
          .where(eq(projects.id, task.projectId))
          .limit(1)
      : [];

    const song = task.songId
      ? await db
          .select({ id: songs.id, title: songs.title })
          .from(songs)
          .where(eq(songs.id, task.songId))
          .limit(1)
      : [];

    const taskSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, task.id));

    return NextResponse.json({
      ...task,
      assignee: assignee[0] || null,
      project: project[0] || null,
      song: song[0] || null,
      subtasks: taskSubtasks,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
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

    const updatedTask = await db
      .update(tasks)
      .set({
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
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

    // Delete subtasks first
    await db.delete(subtasks).where(eq(subtasks.taskId, id));

    // Delete the task
    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (deletedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
