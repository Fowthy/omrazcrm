import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, timeLogs, tasks, users } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
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

    const logs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.taskId, id))
      .orderBy(desc(timeLogs.loggedAt));

    // Fetch user info for each log
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await db
          .select({ id: users.id, name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, log.userId))
          .limit(1);

        return {
          ...log,
          user: user[0] || null,
        };
      })
    );

    return NextResponse.json(logsWithUsers);
  } catch (error) {
    console.error('Error fetching time logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { timeSpent, description, loggedAt } = body;

    if (!timeSpent || timeSpent <= 0) {
      return NextResponse.json(
        { error: 'Time spent must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create time log
    const newLog = await db
      .insert(timeLogs)
      .values({
        id: nanoid(),
        taskId: id,
        userId: session.user.id,
        timeSpent,
        description: description || null,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      })
      .returning();

    // Update task's total timeSpent
    const currentTimeSpent = task[0].timeSpent || 0;
    await db
      .update(tasks)
      .set({
        timeSpent: currentTimeSpent + timeSpent,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id));

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('Error creating time log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
