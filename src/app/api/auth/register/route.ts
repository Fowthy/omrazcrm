import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, instrument } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        id: nanoid(),
        email,
        password: hashedPassword,
        name,
        instrument: instrument || null,
        role: 'member',
      })
      .returning();

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
