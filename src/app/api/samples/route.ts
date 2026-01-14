import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, samples, users } from '@/lib/db';
import { eq, desc, like, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

// Sample categories
const SAMPLE_CATEGORIES = [
  'kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal',
  'percussion', 'bass', 'synth', 'fx', 'vocal', 'loop', 'other'
];

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = db.select().from(samples);

    if (category && SAMPLE_CATEGORIES.includes(category)) {
      query = query.where(eq(samples.category, category)) as typeof query;
    }

    if (search) {
      query = query.where(
        or(
          like(samples.name, `%${search}%`),
          like(samples.tags, `%${search}%`)
        )
      ) as typeof query;
    }

    const allSamples = await query.orderBy(desc(samples.createdAt));

    // Get uploader info for each sample
    const samplesWithUploader = await Promise.all(
      allSamples.map(async (sample) => {
        const uploader = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, sample.uploadedById))
          .limit(1);

        return {
          ...sample,
          uploadedBy: uploader[0] || null,
        };
      })
    );

    return NextResponse.json(samplesWithUploader);
  } catch (error) {
    console.error('Error fetching samples:', error);
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

    const contentType = request.headers.get('content-type') || '';

    // Handle client-side upload (JSON with blob URL)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { blobUrl, fileName, fileSize, mimeType, name, category, tags, bpm, musicalKey } = body;

      if (!blobUrl || !fileName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const sampleId = nanoid();
      const ext = fileName.split('.').pop() || '';

      const newSample = await db
        .insert(samples)
        .values({
          id: sampleId,
          name: name || fileName.replace(`.${ext}`, ''),
          category: SAMPLE_CATEGORIES.includes(category || '') ? category : 'other',
          tags: tags || null,
          filePath: blobUrl,
          mimeType: mimeType || 'audio/mpeg',
          fileSize: fileSize || 0,
          bpm: bpm ? parseInt(bpm) : null,
          musicalKey: musicalKey || null,
          uploadedById: session.user.id,
        })
        .returning();

      return NextResponse.json(newSample[0], { status: 201 });
    }

    // Handle server-side upload (FormData) - for small files
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string | null;
    const category = formData.get('category') as string || 'other';
    const tags = formData.get('tags') as string | null;
    const bpm = formData.get('bpm') as string | null;
    const musicalKey = formData.get('musicalKey') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - must be audio
    const mimeType = file.type;
    if (!mimeType.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // Generate unique filename
    const sampleId = nanoid();
    const ext = file.name.split('.').pop() || '';
    const blobPath = `samples/${sampleId}${ext ? `.${ext}` : ''}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create sample record with blob URL
    const newSample = await db
      .insert(samples)
      .values({
        id: sampleId,
        name: name || file.name.replace(`.${ext}`, ''),
        category: SAMPLE_CATEGORIES.includes(category) ? category : 'other',
        tags: tags || null,
        filePath: blob.url,
        mimeType: mimeType,
        fileSize: file.size,
        bpm: bpm ? parseInt(bpm) : null,
        musicalKey: musicalKey || null,
        uploadedById: session.user.id,
      })
      .returning();

    return NextResponse.json(newSample[0], { status: 201 });
  } catch (error) {
    console.error('Error uploading sample:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
