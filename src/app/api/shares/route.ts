import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  shareLinks,
  projects,
  songs,
  files,
  users,
  setlists,
  rehearsals,
  shows,
  media,
  tempoMaps,
} from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Share types supported
export const SHARE_TYPES = [
  'project',
  'song',
  'file',
  'setlist',
  'rehearsal',
  'show',
  'media',
  'tempo-map',
] as const;

export type ShareType = (typeof SHARE_TYPES)[number];

// Helper to get entity details based on share type
async function getEntityDetails(shareType: string, entityId: string) {
  switch (shareType) {
    case 'project':
      return db
        .select({ id: projects.id, name: projects.name, type: projects.type })
        .from(projects)
        .where(eq(projects.id, entityId))
        .get();
    case 'song':
      return db
        .select({ id: songs.id, name: songs.title })
        .from(songs)
        .where(eq(songs.id, entityId))
        .get();
    case 'file':
      return db
        .select({ id: files.id, name: files.name, type: files.type })
        .from(files)
        .where(eq(files.id, entityId))
        .get();
    case 'setlist':
      return db
        .select({ id: setlists.id, name: setlists.name })
        .from(setlists)
        .where(eq(setlists.id, entityId))
        .get();
    case 'rehearsal':
      return db
        .select({ id: rehearsals.id, name: rehearsals.title })
        .from(rehearsals)
        .where(eq(rehearsals.id, entityId))
        .get();
    case 'show':
      return db
        .select({ id: shows.id, name: shows.title, venue: shows.venue })
        .from(shows)
        .where(eq(shows.id, entityId))
        .get();
    case 'media':
      return db
        .select({ id: media.id, name: media.title, type: media.type })
        .from(media)
        .where(eq(media.id, entityId))
        .get();
    case 'tempo-map':
      return db
        .select({ id: tempoMaps.id, name: tempoMaps.name })
        .from(tempoMaps)
        .where(eq(tempoMaps.id, entityId))
        .get();
    default:
      return null;
  }
}

// Helper to get entity ID from share
function getEntityIdFromShare(share: any): string | null {
  return (
    share.projectId ||
    share.songId ||
    share.fileId ||
    share.setlistId ||
    share.rehearsalId ||
    share.showId ||
    share.mediaId ||
    share.tempoMapId ||
    null
  );
}

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
        name: shareLinks.name,
        shareType: shareLinks.shareType,
        password: shareLinks.password,
        expiresAt: shareLinks.expiresAt,
        allowDownload: shareLinks.allowDownload,
        viewCount: shareLinks.viewCount,
        maxViews: shareLinks.maxViews,
        isActive: shareLinks.isActive,
        includeConfig: shareLinks.includeConfig,
        createdAt: shareLinks.createdAt,
        createdById: shareLinks.createdById,
        projectId: shareLinks.projectId,
        songId: shareLinks.songId,
        fileId: shareLinks.fileId,
        setlistId: shareLinks.setlistId,
        rehearsalId: shareLinks.rehearsalId,
        showId: shareLinks.showId,
        mediaId: shareLinks.mediaId,
        tempoMapId: shareLinks.tempoMapId,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(shareLinks)
      .leftJoin(users, eq(shareLinks.createdById, users.id))
      .orderBy(desc(shareLinks.createdAt))
      .all();

    // Fetch entity details for each share
    const sharesWithDetails = await Promise.all(
      allShares.map(async (share) => {
        const entityId = getEntityIdFromShare(share);
        const entity = entityId
          ? await getEntityDetails(share.shareType, entityId)
          : null;

        return {
          ...share,
          entity,
          includeConfig: share.includeConfig
            ? JSON.parse(share.includeConfig)
            : null,
        };
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
    const {
      name,
      shareType,
      entityId,
      password,
      expiresAt,
      allowDownload,
      maxViews,
      includeConfig,
    } = body;

    // Validate share type
    if (!shareType || !SHARE_TYPES.includes(shareType)) {
      return NextResponse.json(
        { error: `Invalid share type. Must be one of: ${SHARE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate entity ID
    if (!entityId) {
      return NextResponse.json(
        { error: 'Entity ID is required' },
        { status: 400 }
      );
    }

    // Verify entity exists
    const entity = await getEntityDetails(shareType, entityId);
    if (!entity) {
      return NextResponse.json(
        { error: `${shareType} not found` },
        { status: 404 }
      );
    }

    // Build entity reference based on share type
    const entityRef: Record<string, string | null> = {
      projectId: shareType === 'project' ? entityId : null,
      songId: shareType === 'song' ? entityId : null,
      fileId: shareType === 'file' ? entityId : null,
      setlistId: shareType === 'setlist' ? entityId : null,
      rehearsalId: shareType === 'rehearsal' ? entityId : null,
      showId: shareType === 'show' ? entityId : null,
      mediaId: shareType === 'media' ? entityId : null,
      tempoMapId: shareType === 'tempo-map' ? entityId : null,
    };

    const newShare = {
      id: nanoid(),
      token: nanoid(12),
      name: name || (entity as any).name || null,
      shareType,
      password: password || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      allowDownload: allowDownload || false,
      viewCount: 0,
      maxViews: maxViews || null,
      isActive: true,
      includeConfig: includeConfig ? JSON.stringify(includeConfig) : null,
      createdAt: new Date(),
      createdById: session.user.id as string,
      ...entityRef,
    };

    await db.insert(shareLinks).values(newShare).run();

    return NextResponse.json({
      ...newShare,
      entity,
      includeConfig: includeConfig || null,
    });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
