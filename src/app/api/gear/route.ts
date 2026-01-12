import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { gearItems } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wishlist = searchParams.get('wishlist');

    let query = db.select().from(gearItems);

    if (wishlist === 'true') {
      query = query.where(eq(gearItems.isWishlist, true)) as typeof query;
    } else if (wishlist === 'false') {
      query = query.where(eq(gearItems.isWishlist, false)) as typeof query;
    }

    const allGear = await query.orderBy(desc(gearItems.createdAt)).all();

    return NextResponse.json(allGear);
  } catch (error) {
    console.error('Error fetching gear:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gear' },
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
      return NextResponse.json(
        { error: 'Gear name is required' },
        { status: 400 }
      );
    }

    const newGear = {
      id: nanoid(),
      name: body.name.trim(),
      category: body.category || 'other',
      brand: body.brand || null,
      model: body.model || null,
      serialNumber: body.serialNumber || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
      currentValue: body.currentValue ? parseFloat(body.currentValue) : null,
      condition: body.condition || null,
      location: body.location || null,
      notes: body.notes || null,
      image: body.image || null,
      isWishlist: body.isWishlist || false,
      ownerId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(gearItems).values(newGear).run();

    return NextResponse.json(newGear);
  } catch (error) {
    console.error('Error creating gear:', error);
    return NextResponse.json(
      { error: 'Failed to create gear' },
      { status: 500 }
    );
  }
}
