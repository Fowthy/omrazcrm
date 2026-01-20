'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Lightbulb,
  Plus,
  Loader2,
  Search,
  ExternalLink,
  Trash2,
  Edit,
  Music,
  FileText,
  Video,
  Image,
  Palette,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Inspiration {
  id: string;
  title: string;
  type: string;
  content: string | null;
  url: string | null;
  tags: string | null;
  createdAt: string;
  creatorName: string | null;
}

const inspirationTypes = [
  { value: 'idea', label: 'Idea', icon: Lightbulb },
  { value: 'reference_track', label: 'Reference Track', icon: Music },
  { value: 'mood_board', label: 'Mood Board', icon: Palette },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'image', label: 'Image', icon: Image },
];

export default function InspirationPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);
  const [newInspiration, setNewInspiration] = useState({
    title: '',
    type: 'idea',
    content: '',
    url: '',
    tags: '',
  });

  const { data: inspirations, isLoading } = useQuery<Inspiration[]>({
    queryKey: ['inspirations'],
    queryFn: async () => {
      const res = await fetch('/api/inspiration');
      if (!res.ok) throw new Error('Failed to fetch inspirations');
      return res.json();
    },
  });

  const filteredInspirations = inspirations?.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreateInspiration = async () => {
    if (!newInspiration.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch('/api/inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInspiration),
      });

      if (!res.ok) throw new Error('Failed to create inspiration');

      toast.success('Inspiration saved!');
      setIsCreateDialogOpen(false);
      setNewInspiration({
        title: '',
        type: 'idea',
        content: '',
        url: '',
        tags: '',
      });
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
    } catch (error) {
      toast.error('Failed to save inspiration');
    }
  };

  const handleEditInspiration = async () => {
    if (!editingInspiration || !editingInspiration.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch(`/api/inspiration/${editingInspiration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingInspiration),
      });

      if (!res.ok) throw new Error('Failed to update inspiration');

      toast.success('Inspiration updated!');
      setIsEditDialogOpen(false);
      setEditingInspiration(null);
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
    } catch (error) {
      toast.error('Failed to update inspiration');
    }
  };

  const handleDeleteInspiration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      const res = await fetch(`/api/inspiration/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete inspiration');

      toast.success('Inspiration deleted!');
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
    } catch (error) {
      toast.error('Failed to delete inspiration');
    }
  };

  const getTypeInfo = (type: string) => {
    return inspirationTypes.find((t) => t.value === type) || {
      value: type,
      label: type,
      icon: Lightbulb
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inspiration Board</h1>
          <p className="mt-1 text-zinc-400">
            Save references, ideas, and creative inspiration
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Inspiration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inspiration</DialogTitle>
              <DialogDescription>
                Save a reference, idea, or creative inspiration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Give it a name"
                  value={newInspiration.title}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newInspiration.type}
                  onValueChange={(value) =>
                    setNewInspiration({ ...newInspiration, type: value })
                  }
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
                <Label>URL (optional)</Label>
                <Input
                  placeholder="https://"
                  value={newInspiration.url}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="What makes this inspiring?"
                  value={newInspiration.content}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, content: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="guitar, tone, production"
                  value={newInspiration.tags}
                  onChange={(e) =>
                    setNewInspiration({ ...newInspiration, tags: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInspiration}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search inspiration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {inspirationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filteredInspirations?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lightbulb className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No inspiration saved</h3>
            <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
              Collect ideas, reference tracks, mood boards, articles, and videos
              that inspire your music and creative direction.
            </p>
            <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Save Your First Inspiration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInspirations?.map((item) => {
            const typeInfo = getTypeInfo(item.type);
            const TypeIcon = typeInfo.icon;
            const tags = item.tags?.split(',').map((t) => t.trim()).filter(Boolean) || [];

            return (
              <Card key={item.id} className="transition-all hover:border-zinc-700">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                        <TypeIcon className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                        <CardDescription>{typeInfo.label}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.content && (
                    <p className="text-sm text-zinc-400 line-clamp-3">
                      {item.content}
                    </p>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Link
                    </a>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Tag className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingInspiration(item);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteInspiration(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inspiration</DialogTitle>
            <DialogDescription>
              Update your inspiration
            </DialogDescription>
          </DialogHeader>

          {editingInspiration && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editingInspiration.title}
                  onChange={(e) =>
                    setEditingInspiration({ ...editingInspiration, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingInspiration.type}
                  onValueChange={(value) =>
                    setEditingInspiration({ ...editingInspiration, type: value })
                  }
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
                  value={editingInspiration.url || ''}
                  onChange={(e) =>
                    setEditingInspiration({ ...editingInspiration, url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingInspiration.content || ''}
                  onChange={(e) =>
                    setEditingInspiration({ ...editingInspiration, content: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editingInspiration.tags || ''}
                  onChange={(e) =>
                    setEditingInspiration({ ...editingInspiration, tags: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditInspiration}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
