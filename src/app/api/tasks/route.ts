import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, tasks, users, projects, songs, subtasks } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTasks = await db
      .select()
      .from(tasks)
      .orderBy(desc(tasks.updatedAt));

    const tasksWithRelations = await Promise.all(
      allTasks.map(async (task) => {
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

        return {
          ...task,
          assignee: assignee[0] || null,
          project: project[0] || null,
          song: song[0] || null,
          subtasks: taskSubtasks,
        };
      })
    );

    return NextResponse.json(tasksWithRelations);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
      priority,
      dueDate,
      assigneeId,
      projectId,
      songId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    const newTask = await db
      .insert(tasks)
      .values({
        id: nanoid(),
        title,
        description: description || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        projectId: projectId || null,
        songId: songId || null,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return NextResponse.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
