'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '@/lib/upload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Upload,
  Play,
  Pause,
  Trash2,
  Search,
  Music,
  Loader2,
  MoreVertical,
  Filter,
  Volume2,
  Clock,
  Tag,
  Edit,
  Download,
} from 'lucide-react';

// Sample categories
const CATEGORIES = [
  { value: 'all', label: 'All Samples' },
  { value: 'kick', label: 'Kick' },
  { value: 'snare', label: 'Snare' },
  { value: 'hihat', label: 'Hi-Hat' },
  { value: 'clap', label: 'Clap' },
  { value: 'tom', label: 'Tom' },
  { value: 'cymbal', label: 'Cymbal' },
  { value: 'percussion', label: 'Percussion' },
  { value: 'bass', label: 'Bass' },
  { value: 'synth', label: 'Synth' },
  { value: 'fx', label: 'FX' },
  { value: 'vocal', label: 'Vocal' },
  { value: 'loop', label: 'Loop' },
  { value: 'other', label: 'Other' },
];

interface Sample {
  id: string;
  name: string;
  category: string;
  tags: string | null;
  filePath: string;
  mimeType: string;
  fileSize: number;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  createdAt: string;
  uploadedBy: { name: string; avatar: string | null } | null;
}

// Audio context for playback
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export default function SamplesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);

  // Upload form state
  const [uploadFileState, setUploadFileState] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadBpm, setUploadBpm] = useState('');
  const [uploadKey, setUploadKey] = useState('');

  // Fetch samples
  const { data: samples = [], isLoading } = useQuery<Sample[]>({
    queryKey: ['samples', categoryFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/samples?${params}`);
      if (!res.ok) throw new Error('Failed to fetch samples');
      return res.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFileState) throw new Error('No file selected');

      const res = await uploadFile({
        file: uploadFileState,
        endpoint: '/api/samples',
        metadata: {
          name: uploadName || uploadFileState.name,
          category: uploadCategory,
          tags: uploadTags || undefined,
          bpm: uploadBpm || undefined,
          musicalKey: uploadKey || undefined,
        },
      });
      if (!res.ok) throw new Error('Failed to upload sample');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      setUploadDialogOpen(false);
      resetUploadForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Sample>) => {
      if (!selectedSample) throw new Error('No sample selected');
      const res = await fetch(`/api/samples/${selectedSample.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update sample');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      setEditDialogOpen(false);
      setSelectedSample(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/samples/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete sample');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
    },
  });

  const resetUploadForm = () => {
    setUploadFileState(null);
    setUploadName('');
    setUploadCategory('other');
    setUploadTags('');
    setUploadBpm('');
    setUploadKey('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Play/stop sample
  const togglePlaySample = useCallback(async (sample: Sample) => {
    const ctx = getAudioContext();

    // If already playing this sample, stop it
    if (playingSampleId === sample.id) {
      if (currentSource) {
        currentSource.stop();
        currentSource = null;
      }
      setPlayingSampleId(null);
      return;
    }

    // Stop any currently playing sample
    if (currentSource) {
      currentSource.stop();
      currentSource = null;
    }

    try {
      // Fetch and decode the audio file
      const response = await fetch(sample.filePath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Create and play source
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setPlayingSampleId(null);
        currentSource = null;
      };
      source.start(0);

      currentSource = source;
      setPlayingSampleId(sample.id);
    } catch (error) {
      console.error('Error playing sample:', error);
      setPlayingSampleId(null);
    }
  }, [playingSampleId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      kick: 'bg-red-500/20 text-red-400',
      snare: 'bg-orange-500/20 text-orange-400',
      hihat: 'bg-yellow-500/20 text-yellow-400',
      clap: 'bg-lime-500/20 text-lime-400',
      tom: 'bg-green-500/20 text-green-400',
      cymbal: 'bg-emerald-500/20 text-emerald-400',
      percussion: 'bg-teal-500/20 text-teal-400',
      bass: 'bg-cyan-500/20 text-cyan-400',
      synth: 'bg-blue-500/20 text-blue-400',
      fx: 'bg-indigo-500/20 text-indigo-400',
      vocal: 'bg-violet-500/20 text-violet-400',
      loop: 'bg-purple-500/20 text-purple-400',
      other: 'bg-zinc-500/20 text-zinc-400',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-onboarding="samples-header">
        <div>
          <h1 className="text-2xl font-bold">Sample Library</h1>
          <p className="text-sm text-zinc-400">
            Upload and manage your audio samples
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Sample
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search samples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Samples Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : samples.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-zinc-500 mb-4" />
            <p className="text-zinc-400 mb-2">No samples found</p>
            <p className="text-sm text-zinc-500">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload your first sample to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {samples.map((sample) => (
            <Card
              key={sample.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{sample.name}</h3>
                    <Badge className={cn('text-[10px] mt-1', getCategoryColor(sample.category))}>
                      {sample.category}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedSample(sample);
                        setEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={sample.filePath} download={sample.name}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => {
                          if (confirm('Delete this sample?')) {
                            deleteMutation.mutate(sample.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Play button */}
                <Button
                  variant="outline"
                  className="w-full mb-3"
                  onClick={() => togglePlaySample(sample)}
                >
                  {playingSampleId === sample.id ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>

                {/* Metadata */}
                <div className="space-y-1 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-3 w-3" />
                    <span>{formatFileSize(sample.fileSize)}</span>
                  </div>
                  {sample.bpm && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{sample.bpm} BPM</span>
                    </div>
                  )}
                  {sample.tags && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      <span className="truncate">{sample.tags}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Sample</DialogTitle>
            <DialogDescription>
              Add a new audio sample to your library.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Audio File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFileState(file);
                    if (!uploadName) setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Sample name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.slice(1).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="deep, punchy, 808"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>BPM (optional)</Label>
                <Input
                  type="number"
                  value={uploadBpm}
                  onChange={(e) => setUploadBpm(e.target.value)}
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label>Key (optional)</Label>
                <Input
                  value={uploadKey}
                  onChange={(e) => setUploadKey(e.target.value)}
                  placeholder="C minor"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              resetUploadForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!uploadFileState || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sample</DialogTitle>
          </DialogHeader>
          {selectedSample && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={selectedSample.name}
                  onChange={(e) => setSelectedSample({ ...selectedSample, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedSample.category}
                  onValueChange={(v) => setSelectedSample({ ...selectedSample, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.slice(1).map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={selectedSample.tags || ''}
                  onChange={(e) => setSelectedSample({ ...selectedSample, tags: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BPM</Label>
                  <Input
                    type="number"
                    value={selectedSample.bpm || ''}
                    onChange={(e) => setSelectedSample({ ...selectedSample, bpm: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    value={selectedSample.musicalKey || ''}
                    onChange={(e) => setSelectedSample({ ...selectedSample, musicalKey: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate(selectedSample!)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
