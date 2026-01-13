import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allExpenses = await db
      .select({
        id: expenses.id,
        title: expenses.title,
        amount: expenses.amount,
        currency: expenses.currency,
        category: expenses.category,
        date: expenses.date,
        description: expenses.description,
        receipt: expenses.receipt,
        paidById: expenses.paidById,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        paidByName: users.name,
        paidByAvatar: users.avatar,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.paidById, users.id))
      .orderBy(desc(expenses.date))
      .all();

    // Calculate summary
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = allExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      expenses: allExpenses,
      summary: {
        total: totalExpenses,
        byCategory,
        count: allExpenses.length,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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

    if (!body.title?.trim() || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Title and amount are required' },
        { status: 400 }
      );
    }

    const newExpense = {
      id: nanoid(),
      title: body.title.trim(),
      amount: parseFloat(body.amount),
      currency: body.currency || 'USD',
      category: body.category || 'other',
      date: body.date ? new Date(body.date) : new Date(),
      description: body.description || null,
      receipt: body.receipt || null,
      paidById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(expenses).values(newExpense).run();

    return NextResponse.json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
