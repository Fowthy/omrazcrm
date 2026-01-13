import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { visualizations, songs, projects, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

// Default visualization parameters
const DEFAULT_PARAMETERS = {
  colorScheme: 'neon', // neon, sunset, ocean, forest, fire, monochrome, rainbow
  backgroundColor: '#000000',
  sensitivity: 1.5,
  smoothing: 0.8,
  barCount: 64,
  barWidth: 0.8,
  barGap: 0.2,
  barRadius: 4,
  particleCount: 100,
  particleSize: 3,
  particleSpeed: 1,
  rotationSpeed: 0.5,
  mirrorMode: false,
  glowIntensity: 0.5,
  reactToAudio: true,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allVisualizations = await db
      .select()
      .from(visualizations)
      .orderBy(desc(visualizations.createdAt))
      .all();

    // Enrich with song and project info
    const enrichedVisualizations = await Promise.all(
      allVisualizations.map(async (viz) => {
        let song = null;
        let project = null;
        let creator = null;

        if (viz.songId) {
          song = await db
            .select({ id: songs.id, title: songs.title })
            .from(songs)
            .where(eq(songs.id, viz.songId))
            .get();
        }

        if (viz.projectId) {
          project = await db
            .select({ id: projects.id, name: projects.name })
            .from(projects)
            .where(eq(projects.id, viz.projectId))
            .get();
        }

        creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, viz.createdById))
          .get();

        return {
          ...viz,
          parameters: JSON.parse(viz.parameters),
          song,
          project,
          createdBy: creator,
        };
      })
    );

    return NextResponse.json(enrichedVisualizations);
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visualizations' },
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

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = nanoid();
    const parameters = {
      ...DEFAULT_PARAMETERS,
      ...(body.parameters || {}),
    };

    await db.insert(visualizations).values({
      id,
      name: body.name.trim(),
      description: body.description || null,
      visualType: body.visualType || 'bars',
      parameters: JSON.stringify(parameters),
      songId: body.songId || null,
      projectId: body.projectId || null,
      createdById: session.user.id,
    });

    const newVisualization = await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.id, id))
      .get();

    return NextResponse.json(
      {
        ...newVisualization,
        parameters: JSON.parse(newVisualization!.parameters),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating visualization:', error);
    return NextResponse.json(
      { error: 'Failed to create visualization' },
      { status: 500 }
    );
  }
}
