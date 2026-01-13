import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, tempoMaps, tempoMapSections, projects, songs, users } from '@/lib/db';
import { eq, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTempoMaps = await db
      .select()
      .from(tempoMaps)
      .orderBy(desc(tempoMaps.updatedAt));

    const tempoMapsWithRelations = await Promise.all(
      allTempoMaps.map(async (tempoMap) => {
        // Get sections
        const sections = await db
          .select()
          .from(tempoMapSections)
          .where(eq(tempoMapSections.tempoMapId, tempoMap.id))
          .orderBy(asc(tempoMapSections.position));

        // Calculate total bars and duration
        const totalBars = sections.reduce((acc, s) => acc + s.bars, 0);
        const totalDuration = sections.reduce((acc, s) => {
          // Duration = (bars * beats per bar * 60) / bpm
          const beatsPerBar = s.timeSignatureNumerator;
          return acc + (s.bars * beatsPerBar * 60) / s.bpm;
        }, 0);

        // Get project info if linked
        let project = null;
        if (tempoMap.projectId) {
          const p = await db
            .select({ id: projects.id, name: projects.name })
            .from(projects)
            .where(eq(projects.id, tempoMap.projectId))
            .limit(1);
          project = p[0] || null;
        }

        // Get song info if linked
        let song = null;
        if (tempoMap.songId) {
          const s = await db
            .select({ id: songs.id, title: songs.title })
            .from(songs)
            .where(eq(songs.id, tempoMap.songId))
            .limit(1);
          song = s[0] || null;
        }

        // Get creator info
        const creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, tempoMap.createdById))
          .limit(1);

        return {
          ...tempoMap,
          sections,
          sectionCount: sections.length,
          totalBars,
          totalDuration: Math.round(totalDuration),
          project,
          song,
          createdBy: creator[0] || null,
        };
      })
    );

    return NextResponse.json(tempoMapsWithRelations);
  } catch (error) {
    console.error('Error fetching tempo maps:', error);
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
    const { name, description, defaultBpm, defaultTimeSignature, projectId, songId, sections } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tempo map name is required' },
        { status: 400 }
      );
    }

    const tempoMapId = nanoid();

    await db.insert(tempoMaps).values({
      id: tempoMapId,
      name,
      description: description || null,
      defaultBpm: defaultBpm || 120,
      defaultTimeSignature: defaultTimeSignature || '4/4',
      projectId: projectId || null,
      songId: songId || null,
      createdById: session.user.id,
    });

    // Add sections if provided
    if (sections && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        await db.insert(tempoMapSections).values({
          id: nanoid(),
          tempoMapId,
          position: i + 1,
          name: section.name || null,
          bars: section.bars || 4,
          bpm: section.bpm || defaultBpm || 120,
          timeSignatureNumerator: section.timeSignatureNumerator || 4,
          timeSignatureDenominator: section.timeSignatureDenominator || 4,
          notes: section.notes || null,
        });
      }
    }

    const newTempoMap = await db
      .select()
      .from(tempoMaps)
      .where(eq(tempoMaps.id, tempoMapId))
      .limit(1);

    return NextResponse.json(newTempoMap[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tempo map:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
