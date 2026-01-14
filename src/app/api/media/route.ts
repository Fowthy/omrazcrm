import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, media } from '@/lib/db';
import { desc, eq, like, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { put } from '@vercel/blob';

// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = db.select().from(media);

    // Build conditions
    const conditions = [];

    if (type) {
      conditions.push(eq(media.type, type));
    }

    if (category) {
      conditions.push(eq(media.category, category));
    }

    if (search) {
      conditions.push(
        or(
          like(media.title, `%${search}%`),
          like(media.description, `%${search}%`),
          like(media.tags, `%${search}%`)
        )
      );
    }

    const results = await db
      .select()
      .from(media)
      .where(conditions.length > 0 ? conditions.reduce((acc, cond) => acc ? or(acc, cond) : cond) : undefined)
      .orderBy(desc(media.createdAt));

    // Filter by all conditions (AND logic)
    let filteredResults = results;
    if (type) {
      filteredResults = filteredResults.filter(m => m.type === type);
    }
    if (category) {
      filteredResults = filteredResults.filter(m => m.category === category);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResults = filteredResults.filter(m =>
        m.title.toLowerCase().includes(searchLower) ||
        m.description?.toLowerCase().includes(searchLower) ||
        m.tags?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string | null;
      const category = formData.get('category') as string;
      const tags = formData.get('tags') as string | null;
      const dateStr = formData.get('date') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (!title || !category) {
        return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }

      // Determine media type
      const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';

      // Generate unique filename
      const id = nanoid();
      const ext = file.name.split('.').pop() || '';
      const blobPath = `media/${id}${ext ? `.${ext}` : ''}`;

      // Upload to Vercel Blob
      const blob = await put(blobPath, file, {
        access: 'public',
        addRandomSuffix: false,
      });

      // Create media record with blob URL
      const result = await db
        .insert(media)
        .values({
          id,
          title,
          description,
          type: mediaType,
          category,
          filePath: blob.url,
          mimeType: file.type,
          fileSize: file.size,
          tags,
          date: dateStr ? new Date(dateStr) : null,
          createdById: session.user.id,
        })
        .returning();

      return NextResponse.json(result[0], { status: 201 });
    } else {
      // Handle YouTube link, client upload, or JSON body
      const body = await request.json();
      const { title, description, category, youtubeUrl, tags, date, blobUrl, fileName, fileSize, mimeType } = body;

      if (!title || !category) {
        return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
      }

      // Handle client-side upload (JSON with blob URL)
      if (blobUrl) {
        const mediaType = mimeType?.startsWith('image/') ? 'photo' : 'video';
        const id = nanoid();

        const result = await db
          .insert(media)
          .values({
            id,
            title,
            description,
            type: mediaType,
            category,
            filePath: blobUrl,
            mimeType: mimeType || 'application/octet-stream',
            fileSize: fileSize || 0,
            tags,
            date: date ? new Date(date) : null,
            createdById: session.user.id,
          })
          .returning();

        return NextResponse.json(result[0], { status: 201 });
      }

      if (youtubeUrl) {
        // YouTube video
        const videoId = extractYouTubeVideoId(youtubeUrl);

        if (!videoId) {
          return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        const id = nanoid();
        const result = await db
          .insert(media)
          .values({
            id,
            title,
            description,
            type: 'youtube',
            category,
            youtubeUrl,
            youtubeVideoId: videoId,
            youtubeThumbnail: getYouTubeThumbnail(videoId),
            tags,
            date: date ? new Date(date) : null,
            createdById: session.user.id,
          })
          .returning();

        return NextResponse.json(result[0], { status: 201 });
      }

      return NextResponse.json({ error: 'Either file, blobUrl, or YouTube URL is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
