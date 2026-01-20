import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, styleParameters } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

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
    const {
      parameterName,
      startValue,
      endValue,
      currentState,
      evolutionNotes,
      locked,
    } = body;

    // Get the current parameter
    const existingParams = await db
      .select()
      .from(styleParameters)
      .where(eq(styleParameters.id, id))
      .limit(1);

    if (existingParams.length === 0) {
      return NextResponse.json({ error: 'Parameter not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (parameterName !== undefined) updateData.parameterName = parameterName;
    if (startValue !== undefined) updateData.startValue = startValue;
    if (endValue !== undefined) updateData.endValue = endValue;
    if (currentState !== undefined) updateData.currentState = currentState;
    if (evolutionNotes !== undefined) updateData.evolutionNotes = evolutionNotes;
    if (locked !== undefined) {
      updateData.locked = locked;
      if (locked) {
        updateData.lockedAt = new Date();
      } else {
        updateData.lockedAt = null;
      }
    }

    const updatedParam = await db
      .update(styleParameters)
      .set(updateData)
      .where(eq(styleParameters.id, id))
      .returning();

    const result = Array.isArray(updatedParam) ? updatedParam[0] : updatedParam;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating style parameter:', error);
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

    // Check if parameter exists
    const existingParams = await db
      .select()
      .from(styleParameters)
      .where(eq(styleParameters.id, id))
      .limit(1);

    if (existingParams.length === 0) {
      return NextResponse.json({ error: 'Parameter not found' }, { status: 404 });
    }

    await db.delete(styleParameters).where(eq(styleParameters.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting style parameter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
