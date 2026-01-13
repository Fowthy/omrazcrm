import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { midiProjects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

// GET /api/midi-projects/[id] - Get a single MIDI project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select()
      .from(midiProjects)
      .where(
        and(
          eq(midiProjects.id, id),
          eq(midiProjects.createdById, session.user.id)
        )
      );

    if (!project) {
      return NextResponse.json({ error: 'MIDI project not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...project,
      tracks: JSON.parse(project.tracks),
    });
  } catch (error) {
    console.error('Error fetching MIDI project:', error);
    return NextResponse.json({ error: 'Failed to fetch MIDI project' }, { status: 500 });
  }
}

// PUT /api/midi-projects/[id] - Update a MIDI project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, bpm, totalBeats, tracks, songId, projectId } = body;

    // Check if project exists and belongs to user
    const [existing] = await db
      .select()
      .from(midiProjects)
      .where(
        and(
          eq(midiProjects.id, id),
          eq(midiProjects.createdById, session.user.id)
        )
      );

    if (!existing) {
      return NextResponse.json({ error: 'MIDI project not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (bpm !== undefined) updates.bpm = bpm;
    if (totalBeats !== undefined) updates.totalBeats = totalBeats;
    if (tracks !== undefined) updates.tracks = JSON.stringify(tracks);
    if (songId !== undefined) updates.songId = songId;
    if (projectId !== undefined) updates.projectId = projectId;

    await db
      .update(midiProjects)
      .set(updates)
      .where(eq(midiProjects.id, id));

    const [updated] = await db
      .select()
      .from(midiProjects)
      .where(eq(midiProjects.id, id));

    return NextResponse.json({
      ...updated,
      tracks: JSON.parse(updated.tracks),
    });
  } catch (error) {
    console.error('Error updating MIDI project:', error);
    return NextResponse.json({ error: 'Failed to update MIDI project' }, { status: 500 });
  }
}

// DELETE /api/midi-projects/[id] - Delete a MIDI project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if project exists and belongs to user
    const [existing] = await db
      .select()
      .from(midiProjects)
      .where(
        and(
          eq(midiProjects.id, id),
          eq(midiProjects.createdById, session.user.id)
        )
      );

    if (!existing) {
      return NextResponse.json({ error: 'MIDI project not found' }, { status: 404 });
    }

    await db
      .delete(midiProjects)
      .where(eq(midiProjects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting MIDI project:', error);
    return NextResponse.json({ error: 'Failed to delete MIDI project' }, { status: 500 });
  }
}
