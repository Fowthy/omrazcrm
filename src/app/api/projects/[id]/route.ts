import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, projects, songs, files, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
// Use Node.js runtime for file:// database URLs (local SQLite)
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

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get creator info
    const creator = await db
      .select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, project[0].createdById))
      .limit(1);

    return NextResponse.json({
      ...project[0],
      createdBy: creator[0] || null,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
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
    const { name, description, type, status, releaseDate, coverImage } = body;

    // Check if project exists
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update project
    const updated = await db
      .update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
        ...(coverImage !== undefined && { coverImage }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating project:', error);
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

    // Check if project exists
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete associated songs first
    await db.delete(songs).where(eq(songs.projectId, id));

    // Delete associated files
    await db.delete(files).where(eq(files.projectId, id));

    // Delete project
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
