import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Use Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate the user before generating upload token
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: [
            // Audio
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
            'audio/flac', 'audio/aac', 'audio/m4a', 'audio/x-m4a',
            // Video
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Documents
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // MIDI
            'audio/midi', 'audio/x-midi',
            // Other
            'application/octet-stream',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after the file is uploaded
        // The client will handle saving metadata to DB
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
