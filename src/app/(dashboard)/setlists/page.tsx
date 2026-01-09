'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ListMusic,
  Plus,
  Search,
  Clock,
  Music,
  MapPin,
  Calendar,
  Loader2,
  Printer,
} from 'lucide-react';
import { formatDuration, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SetlistItem {
  id: string;
  position: number;
  notes: string | null;
  customDuration: number | null;
  songId: string;
  songTitle: string;
  songDuration: number | null;
  songBpm: number | null;
  songKey: string | null;
}

interface Setlist {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  eventDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: SetlistItem[];
  totalDuration: number;
  songCount: number;
  createdBy: { name: string; avatar: string | null } | null;
}

export default function SetlistsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSetlist, setNewSetlist] = useState({
    name: '',
    description: '',
    venue: '',
    eventDate: '',
    notes: '',
  });

  const { data: setlists, isLoading, refetch } = useQuery<Setlist[]>({
    queryKey: ['setlists'],
    queryFn: async () => {
      const res = await fetch('/api/setlists');
      if (!res.ok) throw new Error('Failed to fetch setlists');
      return res.json();
    },
  });

  const filteredSetlists = setlists?.filter((setlist) =>
    setlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSetlist = async () => {
    if (!newSetlist.name.trim()) {
      toast.error('Setlist name is required');
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch('/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetlist),
      });

      if (!res.ok) throw new Error('Failed to create setlist');

      toast.success('Setlist created!');
      setIsCreateDialogOpen(false);
      setNewSetlist({ name: '', description: '', venue: '', eventDate: '', notes: '' });
      refetch();
    } catch (error) {
      toast.error('Failed to create setlist');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Setlists</h1>
          <p className="mt-1 text-zinc-400">
            Create and manage setlists for shows and rehearsals
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Setlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Setlist</DialogTitle>
              <DialogDescription>
                Create a setlist for your next show or rehearsal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Setlist Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Club Show January 2024"
                  value={newSetlist.name}
                  onChange={(e) =>
                    setNewSetlist({ ...newSetlist, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    placeholder="Venue name"
                    value={newSetlist.venue}
                    onChange={(e) =>
                      setNewSetlist({ ...newSetlist, venue: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={newSetlist.eventDate}
                    onChange={(e) =>
                      setNewSetlist({ ...newSetlist, eventDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Notes about this setlist..."
                  value={newSetlist.description}
                  onChange={(e) =>
                    setNewSetlist({ ...newSetlist, description: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSetlist} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Setlist'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search setlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Setlists Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filteredSetlists?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListMusic className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No setlists found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first setlist to get started'}
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Setlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSetlists?.map((setlist) => (
            <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
              <Card className="h-full transition-all hover:border-zinc-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{setlist.name}</CardTitle>
                      <CardDescription>
                        {setlist.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Music className="h-4 w-4" />
                      {setlist.songCount} songs
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(setlist.totalDuration)}
                    </div>
                  </div>

                  {/* Event Info */}
                  {(setlist.venue || setlist.eventDate) && (
                    <div className="space-y-1 text-sm">
                      {setlist.venue && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <MapPin className="h-4 w-4" />
                          {setlist.venue}
                        </div>
                      )}
                      {setlist.eventDate && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="h-4 w-4" />
                          {formatDate(setlist.eventDate)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Song Preview */}
                  {setlist.items.length > 0 && (
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <div className="space-y-1">
                        {setlist.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-zinc-300 truncate">
                              {item.position}. {item.songTitle}
                            </span>
                            <span className="text-zinc-500">
                              {item.songDuration
                                ? formatDuration(item.songDuration)
                                : '--:--'}
                            </span>
                          </div>
                        ))}
                        {setlist.items.length > 3 && (
                          <p className="text-xs text-zinc-500">
                            +{setlist.items.length - 3} more songs
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
