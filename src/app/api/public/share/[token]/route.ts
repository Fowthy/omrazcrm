import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  shareLinks,
  projects,
  songs,
  files,
  setlists,
  setlistItems,
  rehearsals,
  rehearsalAttendees,
  shows,
  media,
  tempoMaps,
  tempoMapSections,
  users,
  lyrics,
  arrangements,
  songCredits,
} from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// No auth required for this route - it's public!

interface ShareValidation {
  valid: boolean;
  error?: string;
  status?: number;
  requiresPassword?: boolean;
}

// Validate share link
async function validateShare(share: any, providedPassword?: string): Promise<ShareValidation> {
  // Check if active
  if (!share.isActive) {
    return { valid: false, error: 'This share link has been deactivated', status: 410 };
  }

  // Check expiration
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return { valid: false, error: 'This share link has expired', status: 410 };
  }

  // Check view limit
  if (share.maxViews && share.viewCount >= share.maxViews) {
    return { valid: false, error: 'This share link has reached its view limit', status: 410 };
  }

  // Check password if required
  if (share.password) {
    if (!providedPassword) {
      return { valid: false, requiresPassword: true, status: 401 };
    }

    // Verify password (handle both hashed and plain text for backwards compatibility)
    const isValid = share.password.startsWith('$2')
      ? await bcrypt.compare(providedPassword, share.password)
      : providedPassword === share.password;

    if (!isValid) {
      return { valid: false, error: 'Incorrect password', status: 401 };
    }
  }

  return { valid: true };
}

// Fetch full project data with optional related entities
async function getProjectData(projectId: string, includeConfig: any) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();

  if (!project) return null;

  const result: any = { ...project, type: 'project' };

  // Default include all if no config
  const config = includeConfig || { songs: true, files: true };

  if (config.songs !== false) {
    const projectSongs = await db
      .select()
      .from(songs)
      .where(eq(songs.projectId, projectId))
      .all();

    // Get additional song data
    result.songs = await Promise.all(
      projectSongs.map(async (song) => {
        const songData: any = { ...song };

        if (config.lyrics !== false) {
          songData.lyrics = await db
            .select()
            .from(lyrics)
            .where(eq(lyrics.songId, song.id))
            .all();
        }

        if (config.arrangements !== false) {
          songData.arrangements = await db
            .select()
            .from(arrangements)
            .where(eq(arrangements.songId, song.id))
            .all();
        }

        if (config.credits !== false) {
          const credits = await db
            .select({
              id: songCredits.id,
              role: songCredits.role,
              userName: users.name,
            })
            .from(songCredits)
            .leftJoin(users, eq(songCredits.userId, users.id))
            .where(eq(songCredits.songId, song.id))
            .all();
          songData.credits = credits;
        }

        return songData;
      })
    );
  }

  if (config.files !== false) {
    result.files = await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .all();
  }

  // Get creator info
  const creator = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, project.createdById))
    .get();
  result.createdBy = creator;

  return result;
}

// Fetch song data with related entities
async function getSongData(songId: string, includeConfig: any) {
  const song = await db.select().from(songs).where(eq(songs.id, songId)).get();
  if (!song) return null;

  const result: any = { ...song, type: 'song' };
  const config = includeConfig || { lyrics: true, arrangements: true, credits: true, files: true };

  if (config.lyrics !== false) {
    result.lyrics = await db.select().from(lyrics).where(eq(lyrics.songId, songId)).all();
  }

  if (config.arrangements !== false) {
    result.arrangements = await db.select().from(arrangements).where(eq(arrangements.songId, songId)).all();
  }

  if (config.credits !== false) {
    const credits = await db
      .select({
        id: songCredits.id,
        role: songCredits.role,
        userName: users.name,
      })
      .from(songCredits)
      .leftJoin(users, eq(songCredits.userId, users.id))
      .where(eq(songCredits.songId, songId))
      .all();
    result.credits = credits;
  }

  if (config.files !== false) {
    result.files = await db.select().from(files).where(eq(files.songId, songId)).all();
  }

  // Get project info if linked
  if (song.projectId) {
    const project = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, song.projectId))
      .get();
    result.project = project;
  }

  // Get creator info
  const creator = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, song.createdById))
    .get();
  result.createdBy = creator;

  return result;
}

// Fetch file data
async function getFileData(fileId: string) {
  const file = await db.select().from(files).where(eq(files.id, fileId)).get();
  if (!file) return null;

  const result: any = { ...file, type: 'file' };

  // Get uploader info
  const uploader = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, file.uploadedById))
    .get();
  result.uploadedBy = uploader;

  return result;
}

// Fetch setlist data with songs
async function getSetlistData(setlistId: string) {
  const setlist = await db.select().from(setlists).where(eq(setlists.id, setlistId)).get();
  if (!setlist) return null;

  const result: any = { ...setlist, type: 'setlist' };

  // Get setlist items with song details
  const items = await db
    .select({
      id: setlistItems.id,
      position: setlistItems.position,
      notes: setlistItems.notes,
      customDuration: setlistItems.customDuration,
      songId: setlistItems.songId,
      songTitle: songs.title,
      songDuration: songs.duration,
      songBpm: songs.bpm,
      songKey: songs.musicalKey,
    })
    .from(setlistItems)
    .leftJoin(songs, eq(setlistItems.songId, songs.id))
    .where(eq(setlistItems.setlistId, setlistId))
    .orderBy(asc(setlistItems.position))
    .all();

  result.items = items;
  result.totalDuration = items.reduce(
    (acc, item) => acc + (item.customDuration || item.songDuration || 0),
    0
  );

  // Get creator info
  const creator = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, setlist.createdById))
    .get();
  result.createdBy = creator;

  return result;
}

// Fetch rehearsal data
async function getRehearsalData(rehearsalId: string) {
  const rehearsal = await db.select().from(rehearsals).where(eq(rehearsals.id, rehearsalId)).get();
  if (!rehearsal) return null;

  const result: any = { ...rehearsal, type: 'rehearsal' };

  // Get attendees
  const attendees = await db
    .select({
      id: rehearsalAttendees.id,
      status: rehearsalAttendees.status,
      userName: users.name,
    })
    .from(rehearsalAttendees)
    .leftJoin(users, eq(rehearsalAttendees.userId, users.id))
    .where(eq(rehearsalAttendees.rehearsalId, rehearsalId))
    .all();
  result.attendees = attendees;

  // Get creator info
  const creator = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, rehearsal.createdById))
    .get();
  result.createdBy = creator;

  return result;
}

// Fetch show data
async function getShowData(showId: string) {
  const show = await db.select().from(shows).where(eq(shows.id, showId)).get();
  if (!show) return null;

  const result: any = { ...show, type: 'show' };

  // Get setlist if linked
  if (show.setlistId) {
    result.setlist = await getSetlistData(show.setlistId);
  }

  return result;
}

// Fetch media data
async function getMediaData(mediaId: string) {
  const mediaItem = await db.select().from(media).where(eq(media.id, mediaId)).get();
  if (!mediaItem) return null;

  const result: any = { ...mediaItem, type: 'media' };

  // Get creator info
  const creator = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, mediaItem.createdById))
    .get();
  result.createdBy = creator;

  return result;
}

// Fetch tempo map data with sections
async function getTempoMapData(tempoMapId: string) {
  const tempoMap = await db.select().from(tempoMaps).where(eq(tempoMaps.id, tempoMapId)).get();
  if (!tempoMap) return null;

  const result: any = { ...tempoMap, type: 'tempo-map' };

  // Get sections
  const sections = await db
    .select()
    .from(tempoMapSections)
    .where(eq(tempoMapSections.tempoMapId, tempoMapId))
    .orderBy(asc(tempoMapSections.position))
    .all();
  result.sections = sections;

  // Calculate totals
  result.totalBars = sections.reduce((acc, s) => acc + s.bars, 0);
  result.totalDuration = sections.reduce((acc, s) => {
    return acc + (s.bars * s.timeSignatureNumerator * 60) / s.bpm;
  }, 0);

  // Get linked song/project
  if (tempoMap.songId) {
    const song = await db
      .select({ id: songs.id, title: songs.title })
      .from(songs)
      .where(eq(songs.id, tempoMap.songId))
      .get();
    result.song = song;
  }
  if (tempoMap.projectId) {
    const project = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, tempoMap.projectId))
      .get();
    result.project = project;
  }

  // Get creator info
  const creator = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, tempoMap.createdById))
    .get();
  result.createdBy = creator;

  return result;
}

// Get data based on share type
async function getSharedData(share: any) {
  const includeConfig = share.includeConfig ? JSON.parse(share.includeConfig) : null;

  switch (share.shareType) {
    case 'project':
      return share.projectId ? getProjectData(share.projectId, includeConfig) : null;
    case 'song':
      return share.songId ? getSongData(share.songId, includeConfig) : null;
    case 'file':
      return share.fileId ? getFileData(share.fileId) : null;
    case 'setlist':
      return share.setlistId ? getSetlistData(share.setlistId) : null;
    case 'rehearsal':
      return share.rehearsalId ? getRehearsalData(share.rehearsalId) : null;
    case 'show':
      return share.showId ? getShowData(share.showId) : null;
    case 'media':
      return share.mediaId ? getMediaData(share.mediaId) : null;
    case 'tempo-map':
      return share.tempoMapId ? getTempoMapData(share.tempoMapId) : null;
    default:
      return null;
  }
}

// POST - verify password and get share data
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    // Find share by token
    const share = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, token))
      .get();

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Validate share
    const validation = await validateShare(share, password);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          requiresPassword: validation.requiresPassword,
        },
        { status: validation.status || 400 }
      );
    }

    // Increment view count
    await db
      .update(shareLinks)
      .set({ viewCount: (share.viewCount || 0) + 1 })
      .where(eq(shareLinks.id, share.id))
      .run();

    // Get shared data
    const data = await getSharedData(share);
    if (!data) {
      return NextResponse.json({ error: 'Shared content not found' }, { status: 404 });
    }

    return NextResponse.json({
      share: {
        id: share.id,
        name: share.name,
        shareType: share.shareType,
        allowDownload: share.allowDownload,
        expiresAt: share.expiresAt,
        viewCount: (share.viewCount || 0) + 1,
        maxViews: share.maxViews,
      },
      data,
    });
  } catch (error) {
    console.error('Error accessing share:', error);
    return NextResponse.json(
      { error: 'Failed to access share' },
      { status: 500 }
    );
  }
}

// GET - check if share exists and if password is required
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find share by token
    const share = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, token))
      .get();

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Check basic validity (without password)
    const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
    const isMaxViews = share.maxViews && share.viewCount && share.viewCount >= share.maxViews;

    return NextResponse.json({
      exists: true,
      name: share.name,
      shareType: share.shareType,
      requiresPassword: !!share.password,
      isActive: share.isActive,
      isExpired,
      isMaxViews,
      allowDownload: share.allowDownload,
    });
  } catch (error) {
    console.error('Error checking share:', error);
    return NextResponse.json(
      { error: 'Failed to check share' },
      { status: 500 }
    );
  }
}
