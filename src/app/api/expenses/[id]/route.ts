import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    const expense = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .get();

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
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

    const existingExpense = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .get();

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.date !== undefined) {
      updateData.date = body.date ? new Date(body.date) : null;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.receipt !== undefined) updateData.receipt = body.receipt;

    await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .run();

    const updatedExpense = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .get();

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
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

    const existingExpense = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .get();

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await db.delete(expenses).where(eq(expenses.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
