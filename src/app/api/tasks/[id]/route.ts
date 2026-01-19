import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  db,
  tasks,
  users,
  projects,
  songs,
  subtasks,
  epics,
  sprints,
  labels,
  taskLabels,
  taskComments,
  taskHistory,
  timeLogs,
  taskDependencies,
} from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

    const taskResult = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult[0];

    // Fetch all related data
    const assignee = task.assigneeId
      ? await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, task.assigneeId))
          .limit(1)
      : [];

    const reporter = task.reporterId
      ? await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, task.reporterId))
          .limit(1)
      : [];

    const project = task.projectId
      ? await db
          .select({ id: projects.id, name: projects.name, key: projects.key })
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

    const epic = task.epicId
      ? await db
          .select({ id: epics.id, key: epics.key, title: epics.title, color: epics.color })
          .from(epics)
          .where(eq(epics.id, task.epicId))
          .limit(1)
      : [];

    const sprint = task.sprintId
      ? await db
          .select({ id: sprints.id, name: sprints.name, status: sprints.status })
          .from(sprints)
          .where(eq(sprints.id, task.sprintId))
          .limit(1)
      : [];

    const taskSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, task.id));

    // Fetch labels
    const taskLabelRelations = await db
      .select()
      .from(taskLabels)
      .where(eq(taskLabels.taskId, task.id));

    const taskLabelsList = taskLabelRelations.length > 0
      ? await db
          .select()
          .from(labels)
          .where(inArray(labels.id, taskLabelRelations.map(tl => tl.labelId)))
      : [];

    // Fetch comments
    const comments = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, task.id));

    // Fetch time logs
    const logs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.taskId, task.id));

    // Fetch dependencies
    const dependencies = await db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, task.id));

    // Fetch history
    const history = await db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.taskId, task.id));

    return NextResponse.json({
      ...task,
      assignee: assignee[0] || null,
      reporter: reporter[0] || null,
      project: project[0] || null,
      song: song[0] || null,
      epic: epic[0] || null,
      sprint: sprint[0] || null,
      subtasks: taskSubtasks,
      labels: taskLabelsList,
      comments,
      timeLogs: logs,
      dependencies,
      history,
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

    // Extract labelIds if provided (handle separately)
    const { labelIds, ...updates } = body;

    // Get current task for history tracking
    const currentTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (currentTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Track field changes for history
    const task = currentTask[0] as any;
    const fieldsToTrack = ['status', 'assigneeId', 'priority', 'epicId', 'sprintId'];

    for (const field of fieldsToTrack) {
      const oldVal = task[field];
      const newVal = updates[field as keyof typeof updates];
      if (newVal !== undefined && newVal !== oldVal) {
        await db.insert(taskHistory).values({
          id: nanoid(),
          taskId: id,
          userId: session.user.id,
          field: field,
          oldValue: String(oldVal ?? ''),
          newValue: String(newVal ?? ''),
        });
      }
    }

    // Convert date fields
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.completedDate) updates.completedDate = new Date(updates.completedDate);

    // If status changed to 'done', set completedDate
    if (updates.status === 'done' && currentTask[0].status !== 'done') {
      updates.completedDate = new Date();
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    // Update labels if provided
    if (labelIds !== undefined) {
      // Remove existing labels
      await db.delete(taskLabels).where(eq(taskLabels.taskId, id));

      // Add new labels
      if (labelIds.length > 0) {
        await db.insert(taskLabels).values(
          labelIds.map((labelId: string) => ({
            id: nanoid(),
            taskId: id,
            labelId,
          }))
        );
      }
    }

    const result = Array.isArray(updatedTask) ? updatedTask[0] : updatedTask;
    return NextResponse.json(result);
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

    // All related data should cascade delete based on schema
    // But let's be explicit for safety
    await db.delete(subtasks).where(eq(subtasks.taskId, id));
    await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
    await db.delete(taskComments).where(eq(taskComments.taskId, id));
    await db.delete(taskHistory).where(eq(taskHistory.taskId, id));
    await db.delete(timeLogs).where(eq(timeLogs.taskId, id));
    await db.delete(taskDependencies).where(eq(taskDependencies.taskId, id));

    // Delete the task
    const deletedTask = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deletedTask || (Array.isArray(deletedTask) && deletedTask.length === 0)) {
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
