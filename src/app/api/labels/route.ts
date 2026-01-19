import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, labels, projects } from '@/lib/db';
import { eq, or, isNull } from 'drizzle-orm';
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

    // Fetch global labels + project-specific labels
    let conditions = [isNull(labels.projectId)];
    if (projectId) {
      conditions.push(eq(labels.projectId, projectId));
    }

    const allLabels = await db
      .select()
      .from(labels)
      .where(or(...conditions));

    const labelsWithProject = await Promise.all(
      allLabels.map(async (label) => {
        const project = label.projectId
          ? await db
              .select({ id: projects.id, name: projects.name, key: projects.key })
              .from(projects)
              .where(eq(projects.id, label.projectId))
              .limit(1)
          : [];

        return {
          ...label,
          project: project[0] || null,
        };
      })
    );

    return NextResponse.json(labelsWithProject);
  } catch (error) {
    console.error('Error fetching labels:', error);
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
    const { name, color, description, projectId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      );
    }

    const newLabel = await db
      .insert(labels)
      .values({
        id: nanoid(),
        name,
        color: color || '#gray',
        description: description || null,
        projectId: projectId || null,
      })
      .returning();

    return NextResponse.json(newLabel[0], { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Label ID is required' },
        { status: 400 }
      );
    }

    await db.delete(labels).where(eq(labels.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
