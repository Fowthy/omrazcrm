import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Get current user with password
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, currentUser[0].password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
