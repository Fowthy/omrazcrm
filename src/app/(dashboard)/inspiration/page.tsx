'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Music,
  Image,
  FileText,
  Video,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  Tag,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock data
const inspirations = [
  {
    id: '1',
    title: 'Arctic Monkeys - AM',
    type: 'reference_track',
    content: 'Love the guitar tone on this album. Very fuzzy and saturated.',
    url: 'https://open.spotify.com/album/78bpIziExqiI9qztvNFlQu',
    tags: ['guitar tone', 'rock', 'production'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Album Cover Ideas',
    type: 'mood_board',
    content: 'Dark, moody aesthetic with neon accents. Think 80s noir meets modern minimalism.',
    url: null,
    tags: ['artwork', 'visual', 'aesthetic'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Verse melody idea',
    type: 'idea',
    content: 'Da-da-dummm progression for the new song. Record voice memo!',
    url: null,
    tags: ['melody', 'new song'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '4',
    title: 'Music Production Article',
    type: 'article',
    content: 'Great tips on achieving punchy drums in rock mixes.',
    url: 'https://example.com/drum-mixing',
    tags: ['mixing', 'drums', 'production'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  reference_track: <Music className="h-4 w-4" />,
  mood_board: <Image className="h-4 w-4" />,
  idea: <Sparkles className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  reference_track: 'bg-green-500/20 text-green-400',
  mood_board: 'bg-pink-500/20 text-pink-400',
  idea: 'bg-yellow-500/20 text-yellow-400',
  article: 'bg-blue-500/20 text-blue-400',
  video: 'bg-red-500/20 text-red-400',
  image: 'bg-purple-500/20 text-purple-400',
};

export default function InspirationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newInspiration, setNewInspiration] = useState({
    title: '',
    type: 'idea',
    content: '',
    url: '',
    tags: '',
  });

  const handleCreateInspiration = async () => {
    if (!newInspiration.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Inspiration saved!');
    setIsCreateDialogOpen(false);
    setNewInspiration({
      title: '',
      type: 'idea',
      content: '',
      url: '',
      tags: '',
    });
    setIsCreating(false);
  };

  const filteredInspirations = inspirations.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Get all unique tags
  const allTags = [...new Set(inspirations.flatMap((i) => i.tags))];

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
                <Label>Title</Label>
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
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="reference_track">Reference Track</SelectItem>
                    <SelectItem value="mood_board">Mood Board</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
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
              <Button onClick={handleCreateInspiration} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-zinc-400 flex items-center gap-1">
          <Tag className="h-4 w-4" />
          Quick filters:
        </span>
        {allTags.slice(0, 8).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-zinc-800"
            onClick={() => setSearchQuery(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search inspiration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="idea">Ideas</SelectItem>
            <SelectItem value="reference_track">Reference Tracks</SelectItem>
            <SelectItem value="mood_board">Mood Boards</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inspirations Grid */}
      {filteredInspirations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No inspiration found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start collecting inspiration'}
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inspiration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInspirations.map((item) => (
            <Card key={item.id} className="transition-colors hover:border-zinc-700">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeColors[item.type]}`}>
                      {typeIcons[item.type]}
                    </div>
                    <div>
                      <CardTitle className="text-base line-clamp-1">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-xs capitalize">
                        {item.type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.content && (
                  <p className="text-sm text-zinc-400 line-clamp-3">{item.content}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
