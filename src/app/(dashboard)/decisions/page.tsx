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
import { GitBranch, Plus, Music, Album } from 'lucide-react';
import Link from 'next/link';

interface Decision {
  id: string;
  songId: string | null;
  albumId: string;
  decisionType: string;
  question: string;
  context: string | null;
  status: string;
  proposedAt: Date;
  confidence: number;
  daysOpen: number;
  proposedByUser: { name: string; avatar: string | null } | null;
  song: { title: string } | null;
  album: { name: string } | null;
}

const statusColors: Record<string, string> = {
  proposed: 'bg-blue-500/20 text-blue-400',
  testing: 'bg-yellow-500/20 text-yellow-400',
  locked: 'bg-green-500/20 text-green-400',
  reopened: 'bg-orange-500/20 text-orange-400',
};

const decisionTypeColors: Record<string, string> = {
  arrangement: 'bg-purple-500/20 text-purple-400',
  performance: 'bg-pink-500/20 text-pink-400',
  sonic: 'bg-cyan-500/20 text-cyan-400',
  lyrical: 'bg-green-500/20 text-green-400',
  structural: 'bg-orange-500/20 text-orange-400',
  production: 'bg-red-500/20 text-red-400',
};

export default function DecisionsPage() {
  const { data: session } = useSession();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (session?.user) {
      fetchDecisions();
    }
  }, [session]);

  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/decisions');
      if (response.ok) {
        const data = await response.json();
        setDecisions(data);
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecisions = decisions.filter((decision) => {
    if (filter === 'all') return true;
    return decision.status === filter;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading decisions...</p>
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
            <GitBranch className="h-8 w-8 text-violet-400" />
            Decisions
          </h1>
          <p className="text-zinc-400 mt-1">
            Creative decisions that shape your music
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          New Decision
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'proposed' ? 'default' : 'outline'}
          onClick={() => setFilter('proposed')}
          size="sm"
        >
          Proposed
        </Button>
        <Button
          variant={filter === 'testing' ? 'default' : 'outline'}
          onClick={() => setFilter('testing')}
          size="sm"
        >
          Testing
        </Button>
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          onClick={() => setFilter('locked')}
          size="sm"
        >
          Locked
        </Button>
        <Button
          variant={filter === 'reopened' ? 'default' : 'outline'}
          onClick={() => setFilter('reopened')}
          size="sm"
        >
          Reopened
        </Button>
      </div>

      {/* Decisions Grid */}
      {filteredDecisions.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No decisions yet</p>
            <p className="text-zinc-500 text-sm mb-4">
              Start making creative decisions to shape your album
            </p>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Decision
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDecisions.map((decision) => (
            <Card
              key={decision.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[decision.status] || 'bg-zinc-700'}>
                        {decision.status}
                      </Badge>
                      <Badge className={decisionTypeColors[decision.decisionType] || 'bg-zinc-700'}>
                        {decision.decisionType}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white">
                      {decision.question}
                    </CardTitle>
                  </div>
                </div>
                {decision.context && (
                  <CardDescription className="text-zinc-400 mt-2">
                    {decision.context}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {decision.album && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Album className="h-4 w-4" />
                      <span>{decision.album.name}</span>
                    </div>
                  )}
                  {decision.song && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Music className="h-4 w-4" />
                      <span>{decision.song.title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-zinc-500">Confidence</span>
                    <span className="text-white font-medium">
                      {decision.confidence}%
                    </span>
                  </div>
                  {decision.daysOpen > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Open for</span>
                      <span className="text-white font-medium">
                        {decision.daysOpen} days
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
