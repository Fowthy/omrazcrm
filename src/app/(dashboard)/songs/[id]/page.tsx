'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Music,
  FileAudio,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  Clock,
  Gauge,
  FolderKanban,
  MessageSquare,
  Upload,
} from 'lucide-react';
import { songStatuses, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Song {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  timeSignature: string | null;
  status: string;
  trackNumber: number | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string } | null;
  createdBy: { id: string; name: string; avatar: string | null } | null;
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    timestamp: number | null;
    createdAt: string;
  }>;
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const songId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'idea',
    bpm: '',
    musicalKey: '',
    timeSignature: '4/4',
  });

  // Fetch song
  const { data: song, isLoading } = useQuery<Song>({
    queryKey: ['song', songId],
    queryFn: async () => {
      const res = await fetch(`/api/songs/${songId}`);
      if (!res.ok) throw new Error('Failed to fetch song');
      return res.json();
    },
  });

  // Initialize edit form when song loads
  if (song && !editForm.title && song.title !== editForm.title) {
    setEditForm({
      title: song.title,
      description: song.description || '',
      status: song.status,
      bpm: song.bpm?.toString() || '',
      musicalKey: song.musicalKey || '',
      timeSignature: song.timeSignature || '4/4',
    });
  }

  const handleUpdateSong = async () => {
    if (!editForm.title.trim()) {
      toast.error('Song title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          bpm: editForm.bpm ? parseInt(editForm.bpm) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update song');

      await queryClient.invalidateQueries({ queryKey: ['song', songId] });
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update song');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSong = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete song');

      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song deleted!');

      // Navigate back to project or songs list
      if (song?.project) {
        router.push(`/projects/${song.project.id}`);
      } else {
        router.push('/songs');
      }
    } catch (error) {
      toast.error('Failed to delete song');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-gray-500/20 text-gray-400',
      writing: 'bg-blue-500/20 text-blue-400',
      recording: 'bg-yellow-500/20 text-yellow-400',
      mixing: 'bg-orange-500/20 text-orange-400',
      mastering: 'bg-purple-500/20 text-purple-400',
      released: 'bg-green-500/20 text-green-400',
    };
    return colors[status] || colors.idea;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/songs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Songs
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Song not found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This song may have been deleted or doesn&apos;t exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => song.project ? router.push(`/projects/${song.project.id}`) : router.push('/songs')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{song.title}</h1>
            <Badge variant="outline" className={getStatusColor(song.status)}>
              {songStatuses.find(s => s.value === song.status)?.label || song.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-zinc-400">
            {song.project && (
              <Link href={`/projects/${song.project.id}`} className="flex items-center gap-1 hover:text-white">
                <FolderKanban className="h-4 w-4" />
                {song.project.name}
              </Link>
            )}
            <span>•</span>
            <span>Created {formatDate(song.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Song
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Song Info */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatDuration(song.duration)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Gauge className="h-4 w-4" />
              <span className="text-sm">BPM</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {song.bpm || '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Music className="h-4 w-4" />
              <span className="text-sm">Key</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {song.musicalKey || '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileAudio className="h-4 w-4" />
              <span className="text-sm">Files</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {song.files?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {song.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-zinc-300">{song.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">Files ({song.files?.length || 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({song.comments?.length || 0})</TabsTrigger>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          {song.files?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileAudio className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">No files yet</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Upload audio files, stems, and mixes
                </p>
                <Button className="mt-4" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {song.files?.map((file) => (
                <Card key={file.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                      <FileAudio className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{file.name}</h4>
                      <p className="text-sm text-zinc-500">
                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">No comments yet</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Add timestamped comments while listening
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lyrics" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileAudio className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">No lyrics yet</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Add lyrics and track different versions
              </p>
              <Button className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Lyrics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
            <DialogDescription>Update song details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {songStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>BPM</Label>
                <Input
                  type="number"
                  value={editForm.bpm}
                  onChange={(e) => setEditForm({ ...editForm, bpm: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={editForm.musicalKey}
                  onChange={(e) => setEditForm({ ...editForm, musicalKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Signature</Label>
                <Input
                  value={editForm.timeSignature}
                  onChange={(e) => setEditForm({ ...editForm, timeSignature: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSong} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Song</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{song.title}&quot;? This action cannot be undone.
              All files and comments associated with this song will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSong} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Song'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
