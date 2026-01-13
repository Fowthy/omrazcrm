import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, gearMaintenance, gearItems } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
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

    // Verify gear item exists
    const gearItem = await db
      .select()
      .from(gearItems)
      .where(eq(gearItems.id, id))
      .limit(1);

    if (gearItem.length === 0) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    const maintenanceLogs = await db
      .select()
      .from(gearMaintenance)
      .where(eq(gearMaintenance.gearItemId, id))
      .orderBy(desc(gearMaintenance.date));

    return NextResponse.json(maintenanceLogs);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { date, type, description, cost, performedBy } = body;

    if (!date || !type || !description) {
      return NextResponse.json(
        { error: 'Date, type, and description are required' },
        { status: 400 }
      );
    }

    // Verify gear item exists
    const gearItem = await db
      .select()
      .from(gearItems)
      .where(eq(gearItems.id, id))
      .limit(1);

    if (gearItem.length === 0) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    const newLog = await db
      .insert(gearMaintenance)
      .values({
        id: nanoid(),
        gearItemId: id,
        date: new Date(date),
        type,
        description,
        cost: cost ? parseFloat(cost) : null,
        performedBy: performedBy || null,
      })
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
