'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, Music, Clock } from 'lucide-react';

interface CreativeSession {
  id: string;
  albumId: string;
  date: Date;
  startTime: Date;
  endTime: Date | null;
  preSessionIntent: string | null;
  postSessionReflection: string | null;
  preSessionEnergy: number | null;
  postSessionEnergy: number | null;
  postSessionMomentum: string | null;
  album: { name: string } | null;
  createdBy: { name: string; avatar: string | null } | null;
}

const momentumColors: Record<string, string> = {
  stalled: 'bg-red-500/20 text-red-400',
  slow: 'bg-orange-500/20 text-orange-400',
  steady: 'bg-blue-500/20 text-blue-400',
  flowing: 'bg-green-500/20 text-green-400',
  breakthrough: 'bg-purple-500/20 text-purple-400',
};

export default function SessionsPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<CreativeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-violet-400" />
            Creative Sessions
          </h1>
          <p className="text-zinc-400 mt-1">
            Track your creative work with intent and reflection
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <CalendarDays className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No sessions yet</p>
            <p className="text-zinc-500 text-sm mb-4">
              Start tracking your creative sessions with intent and reflection
            </p>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Start First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((sess) => (
            <Card
              key={sess.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {new Date(sess.date).toLocaleDateString()}
                      </Badge>
                      {sess.postSessionMomentum && (
                        <Badge className={momentumColors[sess.postSessionMomentum]}>
                          {sess.postSessionMomentum}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg text-white">
                      {sess.album?.name || 'Untitled Album'}
                    </CardTitle>
                    {sess.preSessionIntent && (
                      <CardDescription className="text-zinc-400 mt-2">
                        Intent: {sess.preSessionIntent}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {formatDuration(sess.startTime, sess.endTime)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              {sess.postSessionReflection && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-300">
                      Reflection:
                    </p>
                    <p className="text-sm text-zinc-400">
                      {sess.postSessionReflection}
                    </p>
                    {sess.preSessionEnergy !== null &&
                      sess.postSessionEnergy !== null && (
                        <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">
                              Energy Before:
                            </span>
                            <span className="text-sm text-white">
                              {sess.preSessionEnergy}/5
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">
                              Energy After:
                            </span>
                            <span className="text-sm text-white">
                              {sess.postSessionEnergy}/5
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
