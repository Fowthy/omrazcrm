import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tempoMaps, tempoMapSections, projects, songs, users } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

    const tempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, id))
      .get();

    if (!tempoMap) {
      return NextResponse.json({ error: 'Tempo map not found' }, { status: 404 });
    }

    // Get sections
    const sections = await db
      .select()
      .from(tempoMapSections)
      .where(eq(tempoMapSections.tempoMapId, id))
      .orderBy(asc(tempoMapSections.position))
      .all();

    // Calculate totals
    const totalBars = sections.reduce((acc, s) => acc + s.bars, 0);
    const totalDuration = sections.reduce((acc, s) => {
      const beatsPerBar = s.timeSignatureNumerator;
      return acc + (s.bars * beatsPerBar * 60) / s.bpm;
    }, 0);

    // Get project info if linked
    let project = null;
    if (tempoMap.projectId) {
      project = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(eq(projects.id, tempoMap.projectId))
        .get();
    }

    // Get song info if linked
    let song = null;
    if (tempoMap.songId) {
      song = await db
        .select({ id: songs.id, title: songs.title, bpm: songs.bpm, timeSignature: songs.timeSignature })
        .from(songs)
        .where(eq(songs.id, tempoMap.songId))
        .get();
    }

    // Get creator info
    const creator = await db
      .select({ name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, tempoMap.createdById))
      .get();

    return NextResponse.json({
      ...tempoMap,
      sections,
      sectionCount: sections.length,
      totalBars,
      totalDuration: Math.round(totalDuration),
      project,
      song,
      createdBy: creator,
    });
  } catch (error) {
    console.error('Error fetching tempo map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tempo map' },
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

    // Check if tempo map exists
    const existingTempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, id))
      .get();

    if (!existingTempoMap) {
      return NextResponse.json({ error: 'Tempo map not found' }, { status: 404 });
    }

    // Update tempo map
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.defaultBpm !== undefined) updateData.defaultBpm = body.defaultBpm;
    if (body.defaultTimeSignature !== undefined) updateData.defaultTimeSignature = body.defaultTimeSignature;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;
    if (body.songId !== undefined) updateData.songId = body.songId || null;

    await db
      .update(tempoMaps)
      .set(updateData)
      .where(eq(tempoMaps.id, id))
      .run();

    // If sections are provided, update them (replace all)
    if (body.sections !== undefined) {
      // Delete existing sections
      await db
        .delete(tempoMapSections)
        .where(eq(tempoMapSections.tempoMapId, id))
        .run();

      // Insert new sections
      if (body.sections && body.sections.length > 0) {
        for (let i = 0; i < body.sections.length; i++) {
          const section = body.sections[i];
          await db.insert(tempoMapSections).values({
            id: section.id || nanoid(),
            tempoMapId: id,
            position: i + 1,
            name: section.name || null,
            bars: section.bars || 4,
            bpm: section.bpm || existingTempoMap.defaultBpm || 120,
            timeSignatureNumerator: section.timeSignatureNumerator || 4,
            timeSignatureDenominator: section.timeSignatureDenominator || 4,
            notes: section.notes || null,
          });
        }
      }
    }

    const updatedTempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, id))
      .get();

    return NextResponse.json(updatedTempoMap);
  } catch (error) {
    console.error('Error updating tempo map:', error);
    return NextResponse.json(
      { error: 'Failed to update tempo map' },
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

    // Check if tempo map exists
    const existingTempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, id))
      .get();

    if (!existingTempoMap) {
      return NextResponse.json({ error: 'Tempo map not found' }, { status: 404 });
    }

    // Delete tempo map (sections will cascade)
    await db.delete(tempoMaps).where(eq(tempoMaps.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tempo map:', error);
    return NextResponse.json(
      { error: 'Failed to delete tempo map' },
      { status: 500 }
    );
  }
}
