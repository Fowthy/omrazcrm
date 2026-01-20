'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function TimelinePage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-violet-400" />
            Timeline
          </h1>
          <p className="text-zinc-400 mt-1">
            View your creative journey over time
          </p>
        </div>
      </div>

      {/* Timeline Content - Placeholder */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-12 text-center">
          <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg mb-2">Timeline View</p>
          <p className="text-zinc-500 text-sm">
            Timeline view with playable audio and event markers coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
