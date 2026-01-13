import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, bandSettings, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get band settings
    const settings = await db
      .select()
      .from(bandSettings)
      .limit(1);

    if (settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        id: 'default',
        name: 'Omraz',
        timezone: 'UTC',
        currency: 'USD',
        defaultShareExpiry: 7,
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update band settings' }, { status: 403 });
    }

    const body = await request.json();
    const { name, timezone, currency, defaultShareExpiry } = body;

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(bandSettings)
      .limit(1);

    let result;
    if (existingSettings.length === 0) {
      // Create new settings
      result = await db
        .insert(bandSettings)
        .values({
          id: 'default',
          name: name || 'Omraz',
          timezone: timezone || 'UTC',
          currency: currency || 'USD',
          defaultShareExpiry: defaultShareExpiry ? parseInt(defaultShareExpiry) : 7,
        })
        .returning();
    } else {
      // Update existing settings
      result = await db
        .update(bandSettings)
        .set({
          name: name || existingSettings[0].name,
          timezone: timezone || existingSettings[0].timezone,
          currency: currency || existingSettings[0].currency,
          defaultShareExpiry: defaultShareExpiry ? parseInt(defaultShareExpiry) : existingSettings[0].defaultShareExpiry,
        })
        .where(eq(bandSettings.id, 'default'))
        .returning();
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
