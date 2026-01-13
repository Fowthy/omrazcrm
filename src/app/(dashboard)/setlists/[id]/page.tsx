'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Loader2,
  MapPin,
  Music,
  Plus,
  Printer,
  Trash2,
  GripVertical,
  X,
} from 'lucide-react';
import { formatDuration, formatDate, songStatuses } from '@/lib/utils';
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
  songStatus: string;
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

interface Song {
  id: string;
  title: string;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  status: string;
}

export default function SetlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    venue: '',
    eventDate: '',
    notes: '',
  });
  const [selectedSongId, setSelectedSongId] = useState('');

  const { data: setlist, isLoading, error } = useQuery<Setlist>({
    queryKey: ['setlist', id],
    queryFn: async () => {
      const res = await fetch(`/api/setlists/${id}`);
      if (!res.ok) throw new Error('Failed to fetch setlist');
      return res.json();
    },
  });

  const { data: allSongs } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) throw new Error('Failed to fetch songs');
      return res.json();
    },
  });

  const availableSongs = allSongs?.filter(
    song => !setlist?.items.some(item => item.songId === song.id)
  );

  const handleOpenEditDialog = () => {
    if (setlist) {
      setEditData({
        name: setlist.name,
        description: setlist.description || '',
        venue: setlist.venue || '',
        eventDate: setlist.eventDate ? new Date(setlist.eventDate).toISOString().split('T')[0] : '',
        notes: setlist.notes || '',
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) {
      toast.error('Setlist name is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/setlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error('Failed to update setlist');

      await queryClient.invalidateQueries({ queryKey: ['setlist', id] });
      await queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update setlist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/setlists/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete setlist');

      await queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist deleted!');
      router.push('/setlists');
    } catch (error) {
      toast.error('Failed to delete setlist');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSong = async () => {
    if (!selectedSongId) {
      toast.error('Please select a song');
      return;
    }

    setIsAddingSong(true);
    try {
      const res = await fetch(`/api/setlists/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: selectedSongId }),
      });

      if (!res.ok) throw new Error('Failed to add song');

      await queryClient.invalidateQueries({ queryKey: ['setlist', id] });
      toast.success('Song added to setlist!');
      setIsAddSongDialogOpen(false);
      setSelectedSongId('');
    } catch (error) {
      toast.error('Failed to add song');
    } finally {
      setIsAddingSong(false);
    }
  };

  const handleRemoveSong = async (itemId: string) => {
    try {
      const res = await fetch(`/api/setlists/${id}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove song');

      await queryClient.invalidateQueries({ queryKey: ['setlist', id] });
      toast.success('Song removed from setlist!');
    } catch (error) {
      toast.error('Failed to remove song');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !setlist) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold text-white">Setlist not found</h2>
        <p className="mt-2 text-zinc-400">The setlist you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push('/setlists')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Setlists
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{setlist.name}</h1>
            {setlist.description && (
              <p className="mt-1 text-zinc-400">{setlist.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                {setlist.songCount} songs
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(setlist.totalDuration)}
              </div>
              {setlist.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {setlist.venue}
                </div>
              )}
              {setlist.eventDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(setlist.eventDate)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleOpenEditDialog}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Setlist Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Songs</CardTitle>
            <CardDescription>Songs in this setlist</CardDescription>
          </div>
          <Button onClick={() => setIsAddSongDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Song
          </Button>
        </CardHeader>
        <CardContent>
          {setlist.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">No songs yet</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Add songs to build your setlist
              </p>
              <Button className="mt-4" onClick={() => setIsAddSongDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Song
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {setlist.items.map((item, index) => {
                const statusInfo = songStatuses.find(s => s.value === item.songStatus);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/20 text-sm font-medium text-violet-400">
                      {item.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/songs/${item.songId}`}
                        className="font-medium text-white hover:text-violet-400 transition-colors"
                      >
                        {item.songTitle}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {item.songDuration && (
                          <span>{formatDuration(item.customDuration || item.songDuration)}</span>
                        )}
                        {item.songBpm && <span>{item.songBpm} BPM</span>}
                        {item.songKey && <span>Key: {item.songKey}</span>}
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-xs text-zinc-400 italic">{item.notes}</p>
                      )}
                    </div>
                    {statusInfo && (
                      <Badge
                        variant="secondary"
                        className={`${statusInfo.color} text-white shrink-0`}
                      >
                        {statusInfo.label}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-zinc-500 hover:text-red-400"
                      onClick={() => handleRemoveSong(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {setlist.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 whitespace-pre-wrap">{setlist.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setlist</DialogTitle>
            <DialogDescription>Update setlist details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Setlist Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Setlist name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input
                  value={editData.venue}
                  onChange={(e) => setEditData({ ...editData, venue: e.target.value })}
                  placeholder="Venue name"
                />
              </div>
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={editData.eventDate}
                  onChange={(e) => setEditData({ ...editData, eventDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
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

      {/* Add Song Dialog */}
      <Dialog open={isAddSongDialogOpen} onOpenChange={setIsAddSongDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Song to Setlist</DialogTitle>
            <DialogDescription>Select a song to add</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Song</Label>
              <Select value={selectedSongId} onValueChange={setSelectedSongId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a song" />
                </SelectTrigger>
                <SelectContent>
                  {availableSongs?.filter((s) => s.id).map((song) => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title}
                      {song.duration && ` (${formatDuration(song.duration)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableSongs?.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-4">
                All songs are already in this setlist, or you haven't created any songs yet.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSongDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSong} disabled={isAddingSong || !selectedSongId}>
              {isAddingSong ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Song'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Setlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{setlist.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Setlist'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
