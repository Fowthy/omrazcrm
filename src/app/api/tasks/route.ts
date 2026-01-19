import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, tasks, users, projects, songs, subtasks, epics, sprints, labels, taskLabels } from '@/lib/db';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const epicId = searchParams.get('epicId');
    const sprintId = searchParams.get('sprintId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');

    let conditions = [];
    if (projectId) conditions.push(eq(tasks.projectId, projectId));
    if (epicId) conditions.push(eq(tasks.epicId, epicId));
    if (sprintId) conditions.push(eq(tasks.sprintId, sprintId));
    if (status) conditions.push(eq(tasks.status, status));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));

    let query = db.select().from(tasks);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allTasks = await query.orderBy(desc(tasks.updatedAt));

    const tasksWithRelations = await Promise.all(
      allTasks.map(async (task) => {
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

        // Fetch labels for this task
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

        return {
          ...task,
          assignee: assignee[0] || null,
          reporter: reporter[0] || null,
          project: project[0] || null,
          song: song[0] || null,
          epic: epic[0] || null,
          sprint: sprint[0] || null,
          subtasks: taskSubtasks,
          labels: taskLabelsList,
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
      type,
      status,
      priority,
      storyPoints,
      timeEstimate,
      dueDate,
      startDate,
      assigneeId,
      projectId,
      songId,
      epicId,
      sprintId,
      parentTaskId,
      labelIds,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Generate unique key for task
    const projectPrefix = projectId
      ? (await db.select().from(projects).where(eq(projects.id, projectId)).limit(1))[0]?.key || 'TASK'
      : 'TASK';

    // Get count of tasks to generate next number
    const existingTasks = await db.select().from(tasks);
    const taskNumber = existingTasks.length + 1;
    const key = `${projectPrefix}-${taskNumber}`;

    const newTask = await db
      .insert(tasks)
      .values({
        id: nanoid(),
        key,
        title,
        description: description || null,
        type: type || 'task',
        status: status || 'todo',
        priority: priority || 'medium',
        storyPoints: storyPoints || null,
        timeEstimate: timeEstimate || null,
        timeSpent: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        assigneeId: assigneeId || null,
        reporterId: session.user.id,
        projectId: projectId || null,
        songId: songId || null,
        epicId: epicId || null,
        sprintId: sprintId || null,
        parentTaskId: parentTaskId || null,
        position: 0,
        createdById: session.user.id,
      })
      .returning();

    // Add labels if provided
    if (labelIds && labelIds.length > 0) {
      await db.insert(taskLabels).values(
        labelIds.map((labelId: string) => ({
          id: nanoid(),
          taskId: newTask[0].id,
          labelId,
        }))
      );
    }

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
