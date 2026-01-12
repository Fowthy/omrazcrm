'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lightbulb,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Inspiration {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  type: string;
  tags: string | null;
  notes: string | null;
  createdAt: string;
}

const inspirationTypes = [
  { value: 'song', label: 'Song' },
  { value: 'artist', label: 'Artist' },
  { value: 'album', label: 'Album' },
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'image', label: 'Image' },
  { value: 'quote', label: 'Quote' },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' },
];

export default function InspirationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const inspirationId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    url: '',
    type: 'idea',
    tags: '',
    notes: '',
  });

  const { data: inspiration, isLoading } = useQuery<Inspiration>({
    queryKey: ['inspiration-item', inspirationId],
    queryFn: async () => {
      const res = await fetch(`/api/inspiration/${inspirationId}`);
      if (!res.ok) throw new Error('Failed to fetch inspiration');
      return res.json();
    },
  });

  if (inspiration && !editForm.title && inspiration.title !== editForm.title) {
    setEditForm({
      title: inspiration.title,
      content: inspiration.content || '',
      url: inspiration.url || '',
      type: inspiration.type,
      tags: inspiration.tags || '',
      notes: inspiration.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/inspiration/${inspirationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update inspiration');

      await queryClient.invalidateQueries({ queryKey: ['inspiration-item', inspirationId] });
      await queryClient.invalidateQueries({ queryKey: ['inspiration'] });
      toast.success('Inspiration updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update inspiration');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/inspiration/${inspirationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete inspiration');

      await queryClient.invalidateQueries({ queryKey: ['inspiration'] });
      toast.success('Inspiration deleted!');
      router.push('/inspiration');
    } catch (error) {
      toast.error('Failed to delete inspiration');
    } finally {
      setIsDeleting(false);
    }
  };

  const parseTags = (tags: string | null) => {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!inspiration) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/inspiration')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inspiration
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Inspiration not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tags = parseTags(inspiration.tags);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/inspiration')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{inspiration.title}</h1>
            <Badge variant="secondary">
              {inspirationTypes.find(t => t.value === inspiration.type)?.label || inspiration.type}
            </Badge>
          </div>
          <p className="mt-1 text-zinc-400">
            Added {formatDate(inspiration.createdAt)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="bg-violet-500/10 text-violet-400">
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* URL */}
      {inspiration.url && (
        <Card>
          <CardContent className="py-4">
            <a
              href={inspiration.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-violet-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {inspiration.url}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {inspiration.content && (
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{inspiration.content}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {inspiration.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{inspiration.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inspiration</DialogTitle>
            <DialogDescription>Update inspiration details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {inspirationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="guitar, ambient, experimental"
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={4}
                placeholder="Lyrics, description, or main content..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="How to incorporate this, related ideas..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
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
            <DialogTitle>Delete Inspiration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{inspiration.title}&quot;? This action cannot be undone.
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
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
