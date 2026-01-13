'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Timer,
  Plus,
  Search,
  Loader2,
  Clock,
  Music,
  FolderKanban,
  ListMusic,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TempoMapSection {
  id: string;
  tempoMapId: string;
  position: number;
  name: string | null;
  bars: number;
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  notes: string | null;
}

interface TempoMap {
  id: string;
  name: string;
  description: string | null;
  defaultBpm: number;
  defaultTimeSignature: string;
  projectId: string | null;
  songId: string | null;
  sections: TempoMapSection[];
  sectionCount: number;
  totalBars: number;
  totalDuration: number;
  project: { id: string; name: string } | null;
  song: { id: string; title: string } | null;
  createdBy: { name: string; avatar: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  bpm: number | null;
  timeSignature: string | null;
}

export default function TempoMapsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTempoMap, setNewTempoMap] = useState({
    name: '',
    description: '',
    defaultBpm: 120,
    defaultTimeSignature: '4/4',
    projectId: '',
    songId: '',
  });

  const queryClient = useQueryClient();

  // Fetch tempo maps
  const { data: tempoMaps, isLoading } = useQuery<TempoMap[]>({
    queryKey: ['tempoMaps'],
    queryFn: async () => {
      const res = await fetch('/api/tempo-maps');
      if (!res.ok) throw new Error('Failed to fetch tempo maps');
      return res.json();
    },
  });

  // Fetch projects for linking
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Fetch songs for linking
  const { data: songs } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) throw new Error('Failed to fetch songs');
      return res.json();
    },
  });

  // Filter tempo maps
  const filteredTempoMaps = tempoMaps?.filter((tm) =>
    tm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tm.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tm.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tm.song?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create tempo map
  const handleCreateTempoMap = async () => {
    if (!newTempoMap.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/tempo-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTempoMap,
          projectId: newTempoMap.projectId || null,
          songId: newTempoMap.songId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create tempo map');

      toast.success('Tempo map created!');
      setIsCreateDialogOpen(false);
      setNewTempoMap({
        name: '',
        description: '',
        defaultBpm: 120,
        defaultTimeSignature: '4/4',
        projectId: '',
        songId: '',
      });
      queryClient.invalidateQueries({ queryKey: ['tempoMaps'] });
    } catch (error) {
      toast.error('Failed to create tempo map');
    } finally {
      setIsCreating(false);
    }
  };

  // When song is selected, auto-fill BPM and time signature
  const handleSongSelect = (songId: string) => {
    const song = songs?.find((s) => s.id === songId);
    if (song) {
      setNewTempoMap((prev) => ({
        ...prev,
        songId,
        defaultBpm: song.bpm || prev.defaultBpm,
        defaultTimeSignature: song.timeSignature || prev.defaultTimeSignature,
      }));
    } else {
      setNewTempoMap((prev) => ({ ...prev, songId }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tempo Maps</h1>
          <p className="mt-1 text-zinc-400">
            Create and manage tempo maps for your songs
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Tempo Map
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Tempo Map</DialogTitle>
              <DialogDescription>
                Create a new tempo map with multiple sections for tempo and time signature changes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Song Structure for 'Epic Intro'"
                  value={newTempoMap.name}
                  onChange={(e) =>
                    setNewTempoMap({ ...newTempoMap, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Notes about this tempo map..."
                  value={newTempoMap.description}
                  onChange={(e) =>
                    setNewTempoMap({ ...newTempoMap, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default BPM</Label>
                  <Input
                    type="number"
                    min={20}
                    max={300}
                    value={newTempoMap.defaultBpm}
                    onChange={(e) =>
                      setNewTempoMap({
                        ...newTempoMap,
                        defaultBpm: parseInt(e.target.value) || 120,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Time Signature</Label>
                  <Select
                    value={newTempoMap.defaultTimeSignature}
                    onValueChange={(value) =>
                      setNewTempoMap({ ...newTempoMap, defaultTimeSignature: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4/4">4/4</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="6/8">6/8</SelectItem>
                      <SelectItem value="5/4">5/4</SelectItem>
                      <SelectItem value="7/8">7/8</SelectItem>
                      <SelectItem value="2/4">2/4</SelectItem>
                      <SelectItem value="12/8">12/8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link to Project (optional)</Label>
                <Select
                  value={newTempoMap.projectId || 'none'}
                  onValueChange={(value) =>
                    setNewTempoMap({ ...newTempoMap, projectId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link to Song (optional)</Label>
                <Select
                  value={newTempoMap.songId || 'none'}
                  onValueChange={(value) => handleSongSelect(value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a song" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {songs?.map((song) => (
                      <SelectItem key={song.id} value={song.id}>
                        {song.title} {song.bpm && `(${song.bpm} BPM)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTempoMap} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tempo Map
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search tempo maps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : filteredTempoMaps?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Timer className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">
              {searchQuery ? 'No tempo maps found' : 'No tempo maps yet'}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first tempo map to get started'}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Tempo Map
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTempoMaps?.map((tempoMap) => (
            <Link key={tempoMap.id} href={`/tempo-maps/${tempoMap.id}`}>
              <Card className="h-full transition-colors hover:border-zinc-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{tempoMap.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {tempoMap.defaultBpm} BPM
                    </Badge>
                  </div>
                  {tempoMap.description && (
                    <CardDescription className="line-clamp-2">
                      {tempoMap.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <ListMusic className="h-4 w-4" />
                      <span>{tempoMap.sectionCount} sections</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      <span>{tempoMap.totalBars} bars</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(tempoMap.totalDuration)}</span>
                    </div>
                  </div>

                  {/* Time signature */}
                  <div className="text-sm text-zinc-400">
                    Default: {tempoMap.defaultTimeSignature}
                  </div>

                  {/* Links */}
                  {(tempoMap.project || tempoMap.song) && (
                    <div className="flex flex-wrap gap-2">
                      {tempoMap.project && (
                        <Badge variant="secondary" className="text-xs">
                          <FolderKanban className="mr-1 h-3 w-3" />
                          {tempoMap.project.name}
                        </Badge>
                      )}
                      {tempoMap.song && (
                        <Badge variant="secondary" className="text-xs">
                          <Music className="mr-1 h-3 w-3" />
                          {tempoMap.song.title}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Section preview */}
                  {tempoMap.sections.length > 0 && (
                    <div className="flex gap-1 overflow-hidden">
                      {tempoMap.sections.slice(0, 6).map((section, i) => (
                        <div
                          key={section.id}
                          className={cn(
                            'flex-shrink-0 rounded px-2 py-1 text-xs',
                            i % 3 === 0
                              ? 'bg-violet-500/20 text-violet-400'
                              : i % 3 === 1
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-amber-500/20 text-amber-400'
                          )}
                        >
                          {section.name || `${section.bars} bars`}
                        </div>
                      ))}
                      {tempoMap.sections.length > 6 && (
                        <div className="flex-shrink-0 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                          +{tempoMap.sections.length - 6}
                        </div>
                      )}
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
