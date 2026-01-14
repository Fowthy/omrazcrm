import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, files, fileVersions, users } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { put } from '@vercel/blob';

// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const songId = searchParams.get('songId');

    let allFiles;
    if (projectId) {
      allFiles = await db.select().from(files).where(eq(files.projectId, projectId)).orderBy(desc(files.updatedAt));
    } else if (songId) {
      allFiles = await db.select().from(files).where(eq(files.songId, songId)).orderBy(desc(files.updatedAt));
    } else {
      allFiles = await db.select().from(files).orderBy(desc(files.updatedAt));
    }

    // Get versions and uploader for each file
    const filesWithRelations = await Promise.all(
      allFiles.map(async (file) => {
        const versions = await db
          .select()
          .from(fileVersions)
          .where(eq(fileVersions.fileId, file.id))
          .orderBy(desc(fileVersions.version));

        const uploader = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, file.uploadedById))
          .limit(1);

        return {
          ...file,
          versions,
          uploadedBy: uploader[0] || null,
          currentVersion: versions[0]?.version || 1,
        };
      })
    );

    return NextResponse.json(filesWithRelations);
  } catch (error) {
    console.error('Error fetching files:', error);
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
    const projectId = formData.get('projectId') as string | null;
    const songId = formData.get('songId') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type
    const mimeType = file.type;
    let fileType = 'other';
    if (mimeType.startsWith('audio/')) fileType = 'audio';
    else if (mimeType.startsWith('image/')) fileType = 'image';
    else if (mimeType.startsWith('video/')) fileType = 'video';
    else if (mimeType.includes('pdf') || mimeType.includes('document')) fileType = 'document';
    else if (file.name.endsWith('.rpp') || file.name.endsWith('.rpp-bak')) fileType = 'reaper';
    else if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) fileType = 'midi';

    // Generate unique filename
    const fileId = nanoid();
    const ext = file.name.split('.').pop() || '';
    const blobPath = `files/${fileId}${ext ? `.${ext}` : ''}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create file record with blob URL
    const newFile = await db
      .insert(files)
      .values({
        id: fileId,
        name: file.name,
        type: fileType,
        mimeType: mimeType,
        size: file.size,
        path: blob.url,
        description: description || null,
        uploadedById: session.user.id,
        projectId: projectId || null,
        songId: songId || null,
      })
      .returning();

    // Create initial version
    await db.insert(fileVersions).values({
      id: nanoid(),
      fileId: fileId,
      version: 1,
      path: blob.url,
      size: file.size,
      notes: 'Initial upload',
    });

    return NextResponse.json(newFile[0], { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
