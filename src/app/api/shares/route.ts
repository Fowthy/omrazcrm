import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shareLinks, projects, songs, files, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allShares = await db
      .select({
        id: shareLinks.id,
        token: shareLinks.token,
        password: shareLinks.password,
        expiresAt: shareLinks.expiresAt,
        allowDownload: shareLinks.allowDownload,
        viewCount: shareLinks.viewCount,
        maxViews: shareLinks.maxViews,
        isActive: shareLinks.isActive,
        createdAt: shareLinks.createdAt,
        createdById: shareLinks.createdById,
        projectId: shareLinks.projectId,
        songId: shareLinks.songId,
        fileId: shareLinks.fileId,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(shareLinks)
      .leftJoin(users, eq(shareLinks.createdById, users.id))
      .orderBy(desc(shareLinks.createdAt))
      .all();

    // Fetch related entities for each share
    const sharesWithDetails = await Promise.all(
      allShares.map(async (share) => {
        let project = null;
        let song = null;
        let file = null;

        if (share.projectId) {
          project = await db
            .select({ id: projects.id, name: projects.name })
            .from(projects)
            .where(eq(projects.id, share.projectId))
            .get();
        }
        if (share.songId) {
          song = await db
            .select({ id: songs.id, title: songs.title })
            .from(songs)
            .where(eq(songs.id, share.songId))
            .get();
        }
        if (share.fileId) {
          file = await db
            .select({ id: files.id, name: files.name })
            .from(files)
            .where(eq(files.id, share.fileId))
            .get();
        }

        return { ...share, project, song, file };
      })
    );

    return NextResponse.json(sharesWithDetails);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
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

    if (!body.projectId && !body.songId && !body.fileId) {
      return NextResponse.json(
        { error: 'Must share a project, song, or file' },
        { status: 400 }
      );
    }

    const newShare = {
      id: nanoid(),
      token: nanoid(12),
      password: body.password || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      allowDownload: body.allowDownload || false,
      viewCount: 0,
      maxViews: body.maxViews || null,
      isActive: true,
      createdAt: new Date(),
      createdById: session.user.id as string,
      projectId: body.projectId || null,
      songId: body.songId || null,
      fileId: body.fileId || null,
    };

    await db.insert(shareLinks).values(newShare).run();

    return NextResponse.json(newShare);
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
