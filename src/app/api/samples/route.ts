import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, samples, users } from '@/lib/db';
import { eq, desc, like, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Create samples directory
    const samplesDir = path.join(process.cwd(), 'uploads', 'samples');
    await mkdir(samplesDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const sampleId = nanoid();
    const fileName = `${sampleId}${ext}`;
    const filePath = path.join(samplesDir, fileName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create sample record
    const newSample = await db
      .insert(samples)
      .values({
        id: sampleId,
        name: name || file.name.replace(ext, ''),
        category: SAMPLE_CATEGORIES.includes(category) ? category : 'other',
        tags: tags || null,
        filePath: `/uploads/samples/${fileName}`,
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
