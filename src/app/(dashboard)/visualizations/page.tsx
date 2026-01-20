'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Sparkles,
  Plus,
  Search,
  Loader2,
  Music,
  FolderKanban,
  Waves,
  Circle,
  BarChart3,
  Hexagon,
  Atom,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Visualization {
  id: string;
  name: string;
  description: string | null;
  visualType: string;
  parameters: Record<string, unknown>;
  previewUrl: string | null;
  videoUrl: string | null;
  songId: string | null;
  projectId: string | null;
  song: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
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
}

const VISUAL_TYPES = [
  { value: 'bars', label: 'Frequency Bars', icon: BarChart3, color: 'text-cyan-400' },
  { value: 'waveform', label: 'Waveform', icon: Waves, color: 'text-green-400' },
  { value: 'circular', label: 'Circular Spectrum', icon: Circle, color: 'text-violet-400' },
  { value: 'particles', label: 'Particles', icon: Atom, color: 'text-pink-400' },
  { value: 'kaleidoscope', label: 'Kaleidoscope', icon: Hexagon, color: 'text-orange-400' },
  { value: 'geometric', label: 'Geometric', icon: Sparkles, color: 'text-yellow-400' },
  { value: 'spiral', label: 'Spiral', icon: Circle, color: 'text-emerald-400' },
  { value: 'matrix', label: 'Matrix Rain', icon: BarChart3, color: 'text-lime-400' },
];

export default function VisualizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newVisualization, setNewVisualization] = useState({
    name: '',
    description: '',
    visualType: 'bars',
    projectId: '',
    songId: '',
  });

  const queryClient = useQueryClient();

  // Fetch visualizations
  const { data: visualizations, isLoading } = useQuery<Visualization[]>({
    queryKey: ['visualizations'],
    queryFn: async () => {
      const res = await fetch('/api/visualizations');
      if (!res.ok) throw new Error('Failed to fetch visualizations');
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

  // Filter visualizations
  const filteredVisualizations = visualizations?.filter(
    (viz) =>
      viz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      viz.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      viz.song?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      viz.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create visualization
  const handleCreate = async () => {
    if (!newVisualization.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const res = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVisualization,
          projectId: newVisualization.projectId || null,
          songId: newVisualization.songId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create visualization');

      toast.success('Visualization created!');
      setIsCreateDialogOpen(false);
      setNewVisualization({
        name: '',
        description: '',
        visualType: 'bars',
        projectId: '',
        songId: '',
      });
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
    } catch (error) {
      toast.error('Failed to create visualization');
    }
  };

  const getTypeInfo = (type: string) => {
    return VISUAL_TYPES.find((t) => t.value === type) || VISUAL_TYPES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Visualizations</h1>
          <p className="mt-1 text-zinc-400">
            Create audio-reactive visualizations for your music
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Visualization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Visualization</DialogTitle>
              <DialogDescription>
                Create a new audio-reactive visualization for your music
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Neon Bars Visualizer"
                  value={newVisualization.name}
                  onChange={(e) =>
                    setNewVisualization({ ...newVisualization, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this visualization..."
                  value={newVisualization.description}
                  onChange={(e) =>
                    setNewVisualization({ ...newVisualization, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Visualization Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VISUAL_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() =>
                          setNewVisualization({ ...newVisualization, visualType: type.value })
                        }
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                          newVisualization.visualType === type.value
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-zinc-800 hover:border-zinc-700'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', type.color)} />
                        <span className="text-xs text-zinc-400">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link to Project (optional)</Label>
                <Select
                  value={newVisualization.projectId || 'none'}
                  onValueChange={(value) =>
                    setNewVisualization({
                      ...newVisualization,
                      projectId: value === 'none' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(projects ?? []).map((project) =>
                      project.id && project.id.length > 0 ? (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link to Song (optional)</Label>
                <Select
                  value={newVisualization.songId || 'none'}
                  onValueChange={(value) =>
                    setNewVisualization({
                      ...newVisualization,
                      songId: value === 'none' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a song" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(songs ?? []).map((song) =>
                      song.id && song.id.length > 0 ? (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title} {song.bpm && `(${song.bpm} BPM)`}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create Visualization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search visualizations..."
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
      ) : filteredVisualizations?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">
              {searchQuery ? 'No visualizations found' : 'No visualizations yet'}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first visualization to get started'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Visualization
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVisualizations?.map((viz) => {
            const typeInfo = getTypeInfo(viz.visualType);
            const TypeIcon = typeInfo.icon;

            return (
              <Link key={viz.id} href={`/visualizations/${viz.id}`}>
                <Card className="h-full transition-colors hover:border-zinc-700 overflow-hidden">
                  {/* Preview */}
                  <div className="relative h-32 bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                    {viz.previewUrl ? (
                      <img
                        src={viz.previewUrl}
                        alt={viz.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <TypeIcon className={cn('h-10 w-10', typeInfo.color)} />
                        <span className="text-xs text-zinc-500">{typeInfo.label}</span>
                      </div>
                    )}
                    {viz.videoUrl && (
                      <Badge className="absolute top-2 right-2 text-xs bg-green-500/20 text-green-400">
                        Video Ready
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{viz.name}</CardTitle>
                      <TypeIcon className={cn('h-4 w-4', typeInfo.color)} />
                    </div>
                    {viz.description && (
                      <CardDescription className="line-clamp-2">
                        {viz.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {/* Links */}
                    {(viz.project || viz.song) && (
                      <div className="flex flex-wrap gap-2">
                        {viz.project && (
                          <Badge variant="secondary" className="text-xs">
                            <FolderKanban className="mr-1 h-3 w-3" />
                            {viz.project.name}
                          </Badge>
                        )}
                        {viz.song && (
                          <Badge variant="secondary" className="text-xs">
                            <Music className="mr-1 h-3 w-3" />
                            {viz.song.title}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Type badge */}
                    <Badge variant="outline" className="text-xs">
                      {typeInfo.label}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
