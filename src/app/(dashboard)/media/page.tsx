'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/upload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Image as ImageIcon,
  Video,
  Youtube,
  MoreVertical,
  Trash2,
  Edit,
  X,
  Upload,
  Link as LinkIcon,
  Loader2,
  Play,
  Calendar,
  Tag,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  type: 'photo' | 'video' | 'youtube';
  category: string;
  filePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  youtubeThumbnail: string | null;
  tags: string | null;
  date: string | null;
  createdAt: string;
}

const categories = [
  { value: 'photoshoot', label: 'Photoshoot' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'promo', label: 'Promo' },
  { value: 'behind_the_scenes', label: 'Behind the Scenes' },
  { value: 'live', label: 'Live Performance' },
  { value: 'interview', label: 'Interview' },
  { value: 'other', label: 'Other' },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    photoshoot: 'bg-pink-500/20 text-pink-400',
    music_video: 'bg-violet-500/20 text-violet-400',
    promo: 'bg-blue-500/20 text-blue-400',
    behind_the_scenes: 'bg-yellow-500/20 text-yellow-400',
    live: 'bg-red-500/20 text-red-400',
    interview: 'bg-green-500/20 text-green-400',
    other: 'bg-zinc-500/20 text-zinc-400',
  };
  return colors[category] || colors.other;
};

export default function MediaPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [addMode, setAddMode] = useState<'upload' | 'youtube'>('upload');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    tags: '',
    date: '',
    youtubeUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch media
  const { data: mediaItems, isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media', filterType, filterCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) throw new Error('Failed to fetch media');
      return res.json();
    },
  });

  // Create media mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData | object) => {
      const isFormData = data instanceof FormData;
      const res = await fetch('/api/media', {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create media');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete media');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setIsViewDialogOpen(false);
      setSelectedMedia(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'other',
      tags: '',
      date: '',
      youtubeUrl: '',
    });
    setSelectedFile(null);
    setAddMode('upload');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addMode === 'upload' && selectedFile) {
      // Use client upload for large files
      try {
        const res = await uploadFile({
          file: selectedFile,
          endpoint: '/api/media',
          metadata: {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            tags: formData.tags,
            date: formData.date || undefined,
          },
        });
        if (!res.ok) throw new Error('Failed to upload');
        queryClient.invalidateQueries({ queryKey: ['media'] });
        setIsAddDialogOpen(false);
        resetForm();
      } catch (error) {
        console.error('Upload error:', error);
      }
    } else if (addMode === 'youtube' && formData.youtubeUrl) {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        date: formData.date || null,
        youtubeUrl: formData.youtubeUrl,
      });
    }
  };

  const getMediaThumbnail = (item: MediaItem) => {
    if (item.type === 'youtube' && item.youtubeThumbnail) {
      return item.youtubeThumbnail;
    }
    if (item.type === 'photo' && item.filePath) {
      return item.filePath;
    }
    if (item.type === 'video' && item.filePath) {
      // For videos, we could generate thumbnails but for now show a placeholder
      return null;
    }
    return null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const filteredMedia = mediaItems || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Media Gallery</h1>
          <p className="mt-1 text-zinc-400">
            Photos, videos, and YouTube content from your band
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Media
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Media</DialogTitle>
              <DialogDescription>
                Upload photos/videos or add YouTube links
              </DialogDescription>
            </DialogHeader>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={addMode === 'upload' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAddMode('upload')}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={addMode === 'youtube' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAddMode('youtube')}
              >
                <Youtube className="mr-2 h-4 w-4" />
                YouTube Link
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {addMode === 'upload' ? (
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!formData.title) {
                          setFormData(prev => ({
                            ...prev,
                            title: file.name.replace(/\.[^/.]+$/, ''),
                          }));
                        }
                      }
                    }}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-zinc-400 mt-1">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="youtubeUrl">YouTube URL</Label>
                  <Input
                    id="youtubeUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <Input
                    id="tags"
                    placeholder="tag1, tag2, tag3"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date (optional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || (!selectedFile && addMode === 'upload') || (!formData.youtubeUrl && addMode === 'youtube')}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Media'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="photo">
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-1" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="youtube">
              <Youtube className="h-4 w-4 mr-1" />
              YouTube
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No media yet</h3>
            <p className="text-zinc-400 text-center mb-4">
              Upload photos, videos, or add YouTube links to build your media gallery.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMedia.map((item) => {
            const thumbnail = getMediaThumbnail(item);

            return (
              <Card
                key={item.id}
                className="group cursor-pointer overflow-hidden transition-all hover:border-violet-500/50"
                onClick={() => {
                  setSelectedMedia(item);
                  setIsViewDialogOpen(true);
                }}
              >
                <div className="relative aspect-video bg-zinc-800">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {item.type === 'video' ? (
                        <Video className="h-12 w-12 text-zinc-600" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-zinc-600" />
                      )}
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-black/60 text-white">
                      {getTypeIcon(item.type)}
                    </Badge>
                  </div>

                  {/* Play button overlay for videos */}
                  {(item.type === 'video' || item.type === 'youtube') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-black ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/60">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMedia(item);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this media?')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-3">
                  <h3 className="font-medium text-white truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getCategoryColor(item.category)}>
                      {categories.find(c => c.value === item.category)?.label || item.category}
                    </Badge>
                  </div>
                  {item.date && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatDate(item.date)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          {selectedMedia && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle>{selectedMedia.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getCategoryColor(selectedMedia.category)}>
                        {categories.find(c => c.value === selectedMedia.category)?.label || selectedMedia.category}
                      </Badge>
                      <span className="text-zinc-500">•</span>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(selectedMedia.type)}
                        {selectedMedia.type.charAt(0).toUpperCase() + selectedMedia.type.slice(1)}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Media Preview */}
                <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                  {selectedMedia.type === 'youtube' && selectedMedia.youtubeVideoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedMedia.youtubeVideoId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : selectedMedia.type === 'video' && selectedMedia.filePath ? (
                    <video
                      src={selectedMedia.filePath}
                      controls
                      className="w-full h-full"
                    />
                  ) : selectedMedia.type === 'photo' && selectedMedia.filePath ? (
                    <img
                      src={selectedMedia.filePath}
                      alt={selectedMedia.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Details */}
                {selectedMedia.description && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-1">Description</h4>
                    <p className="text-white">{selectedMedia.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedMedia.date && (
                    <div>
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date
                      </span>
                      <p className="text-white">{formatDate(selectedMedia.date)}</p>
                    </div>
                  )}
                  {selectedMedia.tags && (
                    <div>
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMedia.tags.split(',').map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedMedia.youtubeUrl && (
                  <div>
                    <span className="text-zinc-400 flex items-center gap-1 text-sm">
                      <LinkIcon className="h-4 w-4" />
                      YouTube Link
                    </span>
                    <a
                      href={selectedMedia.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:underline text-sm"
                    >
                      {selectedMedia.youtubeUrl}
                    </a>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this media?')) {
                      deleteMutation.mutate(selectedMedia.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
