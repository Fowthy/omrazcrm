import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { visualizations, songs, projects, users } from '@/lib/db/schema';
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

    const visualization = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id))
      .get();

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    // Get related entities
    let song = null;
    let project = null;
    let creator = null;

    if (visualization.songId) {
      song = await db
        .select({
          id: songs.id,
          title: songs.title,
          bpm: songs.bpm,
          duration: songs.duration,
        })
        .from(songs)
        .where(eq(songs.id, visualization.songId))
        .get();
    }

    if (visualization.projectId) {
      project = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(eq(projects.id, visualization.projectId))
        .get();
    }

    creator = await db
      .select({ name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, visualization.createdById))
      .get();

    return NextResponse.json({
      ...visualization,
      parameters: JSON.parse(visualization.parameters),
      song,
      project,
      createdBy: creator,
    });
  } catch (error) {
    console.error('Error fetching visualization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visualization' },
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

    // Check if visualization exists
    const existing = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id))
      .get();

    if (!existing) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.visualType !== undefined) updateData.visualType = body.visualType;
    if (body.parameters !== undefined) {
      // Merge with existing parameters
      const existingParams = JSON.parse(existing.parameters);
      updateData.parameters = JSON.stringify({
        ...existingParams,
        ...body.parameters,
      });
    }
    if (body.previewUrl !== undefined) updateData.previewUrl = body.previewUrl;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.videoDuration !== undefined) updateData.videoDuration = body.videoDuration;
    if (body.songId !== undefined) updateData.songId = body.songId || null;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;

    await db
      .update(visualizations)
      .set(updateData)
      .where(eq(visualizations.id, id))
      .run();

    const updated = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id))
      .get();

    return NextResponse.json({
      ...updated,
      parameters: JSON.parse(updated!.parameters),
    });
  } catch (error) {
    console.error('Error updating visualization:', error);
    return NextResponse.json(
      { error: 'Failed to update visualization' },
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

    // Check if visualization exists
    const existing = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id))
      .get();

    if (!existing) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    await db.delete(visualizations).where(eq(visualizations.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visualization:', error);
    return NextResponse.json(
      { error: 'Failed to delete visualization' },
      { status: 500 }
    );
  }
}
