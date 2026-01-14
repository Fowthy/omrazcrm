import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { put } from '@vercel/blob';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || '';
    const blobPath = `avatars/${session.user.id}-${nanoid()}${ext ? `.${ext}` : ''}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Update user avatar in database with blob URL
    const avatarUrl = blob.url;

    const updatedUser = await db
      .update(users)
      .set({
        avatar: avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
