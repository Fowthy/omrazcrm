import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { merchItems, merchSales } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    const merch = await db
      .select()
      .from(merchItems)
      .where(eq(merchItems.id, id))
      .get();

    if (!merch) {
      return NextResponse.json({ error: 'Merch item not found' }, { status: 404 });
    }

    // Get sales history
    const sales = await db
      .select()
      .from(merchSales)
      .where(eq(merchSales.merchItemId, id))
      .orderBy(desc(merchSales.date))
      .all();

    return NextResponse.json({ ...merch, sales });
  } catch (error) {
    console.error('Error fetching merch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merch' },
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

    const existingMerch = await db
      .select()
      .from(merchItems)
      .where(eq(merchItems.id, id))
      .get();

    if (!existingMerch) {
      return NextResponse.json({ error: 'Merch item not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.cost !== undefined) updateData.cost = body.cost ? parseFloat(body.cost) : null;
    if (body.sizes !== undefined) updateData.sizes = body.sizes;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
    if (body.image !== undefined) updateData.image = body.image;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await db
      .update(merchItems)
      .set(updateData)
      .where(eq(merchItems.id, id))
      .run();

    const updatedMerch = await db
      .select()
      .from(merchItems)
      .where(eq(merchItems.id, id))
      .get();

    return NextResponse.json(updatedMerch);
  } catch (error) {
    console.error('Error updating merch:', error);
    return NextResponse.json(
      { error: 'Failed to update merch' },
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

    const existingMerch = await db
      .select()
      .from(merchItems)
      .where(eq(merchItems.id, id))
      .get();

    if (!existingMerch) {
      return NextResponse.json({ error: 'Merch item not found' }, { status: 404 });
    }

    await db.delete(merchItems).where(eq(merchItems.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch:', error);
    return NextResponse.json(
      { error: 'Failed to delete merch' },
      { status: 500 }
    );
  }
}
