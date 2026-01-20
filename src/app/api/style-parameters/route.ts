import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, styleParameters, projects } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const dimension = searchParams.get('dimension');

    let query = db
      .select()
      .from(styleParameters);

    if (albumId) {
      query = query.where(eq(styleParameters.albumId, albumId)) as any;
    }

    if (dimension) {
      query = query.where(eq(styleParameters.dimension, dimension)) as any;
    }

    const allParams = await query.orderBy(desc(styleParameters.createdAt));

    // Enrich with album data
    const paramsWithRelations = await Promise.all(
      allParams.map(async (param) => {
        const album = await db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, param.albumId))
          .limit(1);

        return {
          ...param,
          album: album[0] || null,
        };
      })
    );

    return NextResponse.json(paramsWithRelations);
  } catch (error) {
    console.error('Error fetching style parameters:', error);
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
      albumId,
      dimension,
      parameterName,
      startValue,
      endValue,
      currentState,
      evolutionNotes,
    } = body;

    if (!albumId) {
      return NextResponse.json(
        { error: 'Album ID is required' },
        { status: 400 }
      );
    }

    if (!dimension) {
      return NextResponse.json(
        { error: 'Dimension is required' },
        { status: 400 }
      );
    }

    if (!parameterName) {
      return NextResponse.json(
        { error: 'Parameter name is required' },
        { status: 400 }
      );
    }

    const newParam = await db
      .insert(styleParameters)
      .values({
        id: nanoid(),
        albumId,
        dimension,
        parameterName,
        startValue: startValue || null,
        endValue: endValue || null,
        currentState: currentState || 'undecided',
        evolutionNotes: evolutionNotes || null,
        locked: false,
      })
      .returning();

    const result = Array.isArray(newParam) ? newParam[0] : newParam;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating style parameter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
