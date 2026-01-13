import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { merchItems, merchSales } from '@/lib/db/schema';
import { desc, eq, sum } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    let query = db.select().from(merchItems);

    if (type) {
      query = query.where(eq(merchItems.type, type)) as typeof query;
    }

    if (active === 'true') {
      query = query.where(eq(merchItems.isActive, true)) as typeof query;
    } else if (active === 'false') {
      query = query.where(eq(merchItems.isActive, false)) as typeof query;
    }

    const allMerch = await query.orderBy(desc(merchItems.createdAt)).all();

    // Calculate total inventory value
    const totalValue = allMerch.reduce((sum, item) => sum + (item.price * item.stock), 0);
    const totalStock = allMerch.reduce((sum, item) => sum + item.stock, 0);

    return NextResponse.json({
      items: allMerch,
      summary: {
        totalItems: allMerch.length,
        totalStock,
        totalValue,
      },
    });
  } catch (error) {
    console.error('Error fetching merch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merch' },
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

    if (!body.name?.trim() || body.price === undefined || !body.type) {
      return NextResponse.json(
        { error: 'Name, type, and price are required' },
        { status: 400 }
      );
    }

    const newMerch = {
      id: nanoid(),
      name: body.name.trim(),
      type: body.type,
      price: parseFloat(body.price),
      cost: body.cost ? parseFloat(body.cost) : null,
      sizes: body.sizes || null,
      stock: body.stock ? parseInt(body.stock) : 0,
      image: body.image || null,
      description: body.description || null,
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(merchItems).values(newMerch).run();

    return NextResponse.json(newMerch);
  } catch (error) {
    console.error('Error creating merch:', error);
    return NextResponse.json(
      { error: 'Failed to create merch' },
      { status: 500 }
    );
  }
}
