import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { gearItems, gearMaintenance } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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

    const gear = await db
      .select()
      .from(gearItems)
      .where(eq(gearItems.id, id))
      .get();

    if (!gear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    // Get maintenance history
    const maintenance = await db
      .select()
      .from(gearMaintenance)
      .where(eq(gearMaintenance.gearItemId, id))
      .orderBy(desc(gearMaintenance.date))
      .all();

    return NextResponse.json({ ...gear, maintenance });
  } catch (error) {
    console.error('Error fetching gear:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gear' },
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

    const existingGear = await db
      .select()
      .from(gearItems)
      .where(eq(gearItems.id, id))
      .get();

    if (!existingGear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber;
    if (body.purchaseDate !== undefined) {
      updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    }
    if (body.purchasePrice !== undefined) {
      updateData.purchasePrice = body.purchasePrice ? parseFloat(body.purchasePrice) : null;
    }
    if (body.currentValue !== undefined) {
      updateData.currentValue = body.currentValue ? parseFloat(body.currentValue) : null;
    }
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.isWishlist !== undefined) updateData.isWishlist = body.isWishlist;

    await db
      .update(gearItems)
      .set(updateData)
      .where(eq(gearItems.id, id))
      .run();

    const updatedGear = await db
      .select()
      .from(gearItems)
      .where(eq(gearItems.id, id))
      .get();

    return NextResponse.json(updatedGear);
  } catch (error) {
    console.error('Error updating gear:', error);
    return NextResponse.json(
      { error: 'Failed to update gear' },
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

    const existingGear = await db
      .select()
      .from(gearItems)
      .where(eq(gearItems.id, id))
      .get();

    if (!existingGear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    await db.delete(gearItems).where(eq(gearItems.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gear:', error);
    return NextResponse.json(
      { error: 'Failed to delete gear' },
      { status: 500 }
    );
  }
}
