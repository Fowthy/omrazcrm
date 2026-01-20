import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, songVersions, files } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

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
    const { isMainVersion, versionIntent } = body;

    // Get the current version
    const existingVersions = await db
      .select()
      .from(songVersions)
      .where(eq(songVersions.id, id))
      .limit(1);

    if (existingVersions.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const existingVersion = existingVersions[0];

    // If setting this as main version, unset other main versions for this song
    if (isMainVersion) {
      await db
        .update(songVersions)
        .set({ isMainVersion: false })
        .where(eq(songVersions.songId, existingVersion.songId));
    }

    // Update the version
    const updateData: any = {};
    if (isMainVersion !== undefined) updateData.isMainVersion = isMainVersion;
    if (versionIntent !== undefined) updateData.versionIntent = versionIntent;

    const updatedVersion = await db
      .update(songVersions)
      .set(updateData)
      .where(eq(songVersions.id, id))
      .returning();

    const result = Array.isArray(updatedVersion) ? updatedVersion[0] : updatedVersion;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating song version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Get the version to delete
    const existingVersions = await db
      .select()
      .from(songVersions)
      .where(eq(songVersions.id, id))
      .limit(1);

    if (existingVersions.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const existingVersion = existingVersions[0];

    // Delete the version
    await db.delete(songVersions).where(eq(songVersions.id, id));

    // Also delete the associated file
    if (existingVersion.fileId) {
      await db.delete(files).where(eq(files.id, existingVersion.fileId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting song version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
