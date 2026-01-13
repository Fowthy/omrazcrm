import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tempoMaps, tempoMapSections } from '@/lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

// Add section(s) - supports single or batch
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tempoMapId } = await params;
    const body = await request.json();

    // Check if tempo map exists
    const tempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, tempoMapId))
      .get();

    if (!tempoMap) {
      return NextResponse.json({ error: 'Tempo map not found' }, { status: 404 });
    }

    // Get max position
    const existingSections = await db
      .select()
      .from(tempoMapSections)
      .where(eq(tempoMapSections.tempoMapId, tempoMapId))
      .orderBy(asc(tempoMapSections.position))
      .all();

    const maxPosition = existingSections.length > 0
      ? Math.max(...existingSections.map(s => s.position))
      : 0;

    // Support batch insert (array of sections)
    const sectionsToAdd = Array.isArray(body.sections) ? body.sections : [body];
    const newSections = [];

    for (let i = 0; i < sectionsToAdd.length; i++) {
      const section = sectionsToAdd[i];
      const sectionId = nanoid();
      newSections.push({
        id: sectionId,
        tempoMapId,
        position: maxPosition + i + 1,
        name: section.name || null,
        bars: section.bars || 4,
        bpm: section.bpm || tempoMap.defaultBpm || 120,
        timeSignatureNumerator: section.timeSignatureNumerator || 4,
        timeSignatureDenominator: section.timeSignatureDenominator || 4,
        notes: section.notes || null,
      });
    }

    // Batch insert all sections at once
    if (newSections.length > 0) {
      await db.insert(tempoMapSections).values(newSections);
    }

    // Update tempo map timestamp
    await db
      .update(tempoMaps)
      .set({ updatedAt: new Date() })
      .where(eq(tempoMaps.id, tempoMapId))
      .run();

    // Return all new sections
    const insertedSections = await db
      .select()
      .from(tempoMapSections)
      .where(eq(tempoMapSections.tempoMapId, tempoMapId))
      .orderBy(asc(tempoMapSections.position))
      .all();

    return NextResponse.json(
      Array.isArray(body.sections) ? insertedSections : insertedSections[insertedSections.length - 1],
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding section:', error);
    return NextResponse.json(
      { error: 'Failed to add section' },
      { status: 500 }
    );
  }
}

// Update section or reorder sections
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tempoMapId } = await params;
    const body = await request.json();

    // Check if tempo map exists
    const tempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, tempoMapId))
      .get();

    if (!tempoMap) {
      return NextResponse.json({ error: 'Tempo map not found' }, { status: 404 });
    }

    // If reordering (array of section IDs)
    if (body.order && Array.isArray(body.order)) {
      for (let i = 0; i < body.order.length; i++) {
        await db
          .update(tempoMapSections)
          .set({ position: i + 1 })
          .where(eq(tempoMapSections.id, body.order[i]))
          .run();
      }
    }

    // If updating a specific section
    if (body.sectionId) {
      const updateData: Record<string, unknown> = {};

      if (body.name !== undefined) updateData.name = body.name;
      if (body.bars !== undefined) updateData.bars = body.bars;
      if (body.bpm !== undefined) updateData.bpm = body.bpm;
      if (body.timeSignatureNumerator !== undefined) updateData.timeSignatureNumerator = body.timeSignatureNumerator;
      if (body.timeSignatureDenominator !== undefined) updateData.timeSignatureDenominator = body.timeSignatureDenominator;
      if (body.notes !== undefined) updateData.notes = body.notes;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(tempoMapSections)
          .set(updateData)
          .where(eq(tempoMapSections.id, body.sectionId))
          .run();
      }
    }

    // Update tempo map timestamp
    await db
      .update(tempoMaps)
      .set({ updatedAt: new Date() })
      .where(eq(tempoMaps.id, tempoMapId))
      .run();

    // Return updated sections
    const sections = await db
      .select()
      .from(tempoMapSections)
      .where(eq(tempoMapSections.tempoMapId, tempoMapId))
      .orderBy(asc(tempoMapSections.position))
      .all();

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error updating sections:', error);
    return NextResponse.json(
      { error: 'Failed to update sections' },
      { status: 500 }
    );
  }
}

// Delete section(s) - supports single or clearAll
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tempoMapId } = await params;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const clearAll = searchParams.get('clearAll') === 'true';

    // Clear all sections at once
    if (clearAll) {
      await db
        .delete(tempoMapSections)
        .where(eq(tempoMapSections.tempoMapId, tempoMapId))
        .run();

      await db
        .update(tempoMaps)
        .set({ updatedAt: new Date() })
        .where(eq(tempoMaps.id, tempoMapId))
        .run();

      return NextResponse.json({ success: true, cleared: true });
    }

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Check if section exists
    const section = await db
      .select()
      .from(tempoMapSections)
      .where(eq(tempoMapSections.id, sectionId))
      .get();

    if (!section || section.tempoMapId !== tempoMapId) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const deletedPosition = section.position;

    // Delete section
    await db
      .delete(tempoMapSections)
      .where(eq(tempoMapSections.id, sectionId))
      .run();

    // Update tempo map timestamp
    await db
      .update(tempoMaps)
      .set({ updatedAt: new Date() })
      .where(eq(tempoMaps.id, tempoMapId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
