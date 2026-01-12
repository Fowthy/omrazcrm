import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allContacts = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .all();

    return NextResponse.json(allContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
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
        { error: 'Contact name is required' },
        { status: 400 }
      );
    }

    const newContact = {
      id: nanoid(),
      name: body.name.trim(),
      email: body.email || null,
      phone: body.phone || null,
      type: body.type || 'other',
      company: body.company || null,
      website: body.website || null,
      address: body.address || null,
      notes: body.notes || null,
      createdById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(contacts).values(newContact).run();

    return NextResponse.json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
