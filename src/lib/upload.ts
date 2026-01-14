import { upload } from '@vercel/blob/client';

interface UploadOptions {
  file: File;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Upload a file to Vercel Blob using client-side upload
 * This bypasses the 4.5MB serverless function limit
 */
export async function uploadToBlob({ file, onProgress }: UploadOptions): Promise<UploadResult> {
  const result = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(progress);
      }
    },
  });

  return {
    url: result.url,
    pathname: result.pathname,
  };
}

/**
 * Upload a file and save metadata to a specific API endpoint
 */
export async function uploadFile({
  file,
  endpoint,
  metadata = {},
  onProgress,
}: {
  file: File;
  endpoint: string;
  metadata?: Record<string, string | null | undefined>;
  onProgress?: (progress: number) => void;
}): Promise<Response> {
  // Upload file to Vercel Blob
  const blob = await uploadToBlob({ file, onProgress });

  // Save metadata to API
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blobUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      ...metadata,
    }),
  });

  return response;
}
