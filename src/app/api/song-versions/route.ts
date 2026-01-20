import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, songVersions, songs, files, users } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    let query = db
      .select()
      .from(songVersions);

    if (songId) {
      query = query.where(eq(songVersions.songId, songId)) as any;
    }

    const allVersions = await query.orderBy(desc(songVersions.recordedAt));

    // Enrich with related data
    const versionsWithRelations = await Promise.all(
      allVersions.map(async (version) => {
        const song = await db
          .select({ title: songs.title })
          .from(songs)
          .where(eq(songs.id, version.songId))
          .limit(1);

        const file = await db
          .select()
          .from(files)
          .where(eq(files.id, version.fileId))
          .limit(1);

        const uploader = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, version.uploadedBy))
          .limit(1);

        return {
          ...version,
          song: song[0] || null,
          file: file[0] || null,
          uploadedByUser: uploader[0] || null,
        };
      })
    );

    return NextResponse.json(versionsWithRelations);
  } catch (error) {
    console.error('Error fetching song versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const {
      songId,
      fileId,
      versionIntent,
      recordedAt,
      durationSeconds,
      isMainVersion,
    } = body;

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get the next version number for this song
    const existingVersions = await db
      .select()
      .from(songVersions)
      .where(eq(songVersions.songId, songId));

    const nextVersionNumber = existingVersions.length + 1;

    // If this is marked as main version, unset other main versions
    if (isMainVersion) {
      await db
        .update(songVersions)
        .set({ isMainVersion: false })
        .where(eq(songVersions.songId, songId));
    }

    const newVersion = await db
      .insert(songVersions)
      .values({
        id: nanoid(),
        songId,
        fileId,
        versionNumber: nextVersionNumber,
        versionIntent: versionIntent || null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        uploadedBy: session.user.id,
        durationSeconds: durationSeconds || null,
        isMainVersion: isMainVersion || false,
        listenCount: 0,
      })
      .returning();

    const result = Array.isArray(newVersion) ? newVersion[0] : newVersion;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating song version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
