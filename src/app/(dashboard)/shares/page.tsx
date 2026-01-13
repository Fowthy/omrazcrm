'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Share2,
  Link,
  Copy,
  Eye,
  Calendar,
  Lock,
  Download,
  MoreVertical,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Plus,
  Music,
  FolderKanban,
  FileText,
  ListMusic,
  CalendarDays,
  Mic2,
  Image as ImageIcon,
  Timer,
  Loader2,
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Type icons map
const TYPE_ICONS: Record<string, any> = {
  project: FolderKanban,
  song: Music,
  file: FileText,
  setlist: ListMusic,
  rehearsal: CalendarDays,
  show: Mic2,
  media: ImageIcon,
  'tempo-map': Timer,
};

const SHARE_TYPES = [
  { value: 'project', label: 'Project', icon: FolderKanban },
  { value: 'song', label: 'Song', icon: Music },
  { value: 'file', label: 'File', icon: FileText },
  { value: 'setlist', label: 'Setlist', icon: ListMusic },
  { value: 'rehearsal', label: 'Rehearsal', icon: CalendarDays },
  { value: 'show', label: 'Show', icon: Mic2 },
  { value: 'media', label: 'Media', icon: ImageIcon },
  { value: 'tempo-map', label: 'Tempo Map', icon: Timer },
];

interface ShareLink {
  id: string;
  token: string;
  name: string | null;
  shareType: string;
  password: string | null;
  expiresAt: string | null;
  allowDownload: boolean;
  viewCount: number;
  maxViews: number | null;
  isActive: boolean;
  includeConfig: any;
  createdAt: string;
  createdById: string;
  projectId: string | null;
  songId: string | null;
  fileId: string | null;
  setlistId: string | null;
  rehearsalId: string | null;
  showId: string | null;
  mediaId: string | null;
  tempoMapId: string | null;
  creatorName: string | null;
  creatorAvatar: string | null;
  entity: { id: string; name: string; type?: string } | null;
}

interface EntityOption {
  id: string;
  name: string;
  type?: string;
}

export default function SharesPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingShare, setEditingShare] = useState<ShareLink | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const queryClient = useQueryClient();

  // Create share form state
  const [createForm, setCreateForm] = useState({
    shareType: '',
    entityId: '',
    name: '',
    password: '',
    expiresAt: '',
    maxViews: '',
    allowDownload: false,
    includeConfig: {
      songs: true,
      files: true,
      lyrics: true,
      arrangements: true,
      credits: true,
    },
  });

  // Fetch shares
  const { data: shares = [], isLoading } = useQuery<ShareLink[]>({
    queryKey: ['shares'],
    queryFn: async () => {
      const res = await fetch('/api/shares');
      if (!res.ok) throw new Error('Failed to fetch shares');
      return res.json();
    },
  });

  // Fetch entities for creating shares
  const { data: projects = [] } = useQuery<EntityOption[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((p: any) => ({ id: p.id, name: p.name, type: p.type }));
    },
  });

  const { data: songs = [] } = useQuery<EntityOption[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((s: any) => ({ id: s.id, name: s.title }));
    },
  });

  const { data: setlists = [] } = useQuery<EntityOption[]>({
    queryKey: ['setlists'],
    queryFn: async () => {
      const res = await fetch('/api/setlists');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((s: any) => ({ id: s.id, name: s.name }));
    },
  });

  const { data: rehearsals = [] } = useQuery<EntityOption[]>({
    queryKey: ['rehearsals'],
    queryFn: async () => {
      const res = await fetch('/api/rehearsals');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((r: any) => ({ id: r.id, name: r.title }));
    },
  });

  const { data: showsList = [] } = useQuery<EntityOption[]>({
    queryKey: ['shows'],
    queryFn: async () => {
      const res = await fetch('/api/shows');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((s: any) => ({ id: s.id, name: s.title }));
    },
  });

  const { data: mediaItems = [] } = useQuery<EntityOption[]>({
    queryKey: ['media'],
    queryFn: async () => {
      const res = await fetch('/api/media');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((m: any) => ({ id: m.id, name: m.title, type: m.type }));
    },
  });

  const { data: tempoMaps = [] } = useQuery<EntityOption[]>({
    queryKey: ['tempoMaps'],
    queryFn: async () => {
      const res = await fetch('/api/tempo-maps');
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((t: any) => ({ id: t.id, name: t.name }));
    },
  });

  // Get entity options based on selected type
  const getEntityOptions = (): EntityOption[] => {
    switch (createForm.shareType) {
      case 'project': return projects;
      case 'song': return songs;
      case 'setlist': return setlists;
      case 'rehearsal': return rehearsals;
      case 'show': return showsList;
      case 'media': return mediaItems;
      case 'tempo-map': return tempoMaps;
      default: return [];
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create share');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      setIsCreateDialogOpen(false);
      setCreateForm({
        shareType: '',
        entityId: '',
        name: '',
        password: '',
        expiresAt: '',
        maxViews: '',
        allowDownload: false,
        includeConfig: { songs: true, files: true, lyrics: true, arrangements: true, credits: true },
      });
      toast.success('Share link created!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShareLink> }) => {
      const res = await fetch(`/api/shares/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update share');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      setEditingShare(null);
      toast.success('Share updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shares/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete share');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('Share deleted!');
    },
  });

  const copyLink = (share: ShareLink) => {
    const url = `${window.location.origin}/share/${share.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleActive = (share: ShareLink) => {
    updateMutation.mutate({ id: share.id, data: { isActive: !share.isActive } });
  };

  const isExpired = (share: ShareLink) => {
    if (!share.expiresAt) return false;
    return new Date(share.expiresAt) < new Date();
  };

  const isMaxViewsReached = (share: ShareLink) => {
    if (!share.maxViews) return false;
    return share.viewCount >= share.maxViews;
  };

  const handleCreateSubmit = () => {
    if (!createForm.shareType || !createForm.entityId) {
      toast.error('Please select a type and item to share');
      return;
    }

    createMutation.mutate({
      shareType: createForm.shareType,
      entityId: createForm.entityId,
      name: createForm.name || null,
      password: createForm.password || null,
      expiresAt: createForm.expiresAt || null,
      maxViews: createForm.maxViews ? parseInt(createForm.maxViews) : null,
      allowDownload: createForm.allowDownload,
      includeConfig: createForm.shareType === 'project' ? createForm.includeConfig : null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingShare) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingShare.id,
      data: {
        name: formData.get('name') as string || null,
        password: formData.get('password') as string || null,
        expiresAt: formData.get('expiresAt') as string || null,
        maxViews: formData.get('maxViews') ? parseInt(formData.get('maxViews') as string) : null,
        allowDownload: formData.get('allowDownload') === 'on',
        isActive: formData.get('isActive') === 'on',
      },
    });
  };

  // Filter shares
  const filteredShares = shares.filter((share) => {
    const matchesSearch =
      share.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.entity?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.shareType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || share.shareType === filterType;
    return matchesSearch && matchesType;
  });

  const activeShares = filteredShares.filter((s) => s.isActive && !isExpired(s) && !isMaxViewsReached(s));
  const inactiveShares = filteredShares.filter((s) => !s.isActive || isExpired(s) || isMaxViewsReached(s));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Shared Links</h1>
          <p className="text-zinc-400">Create and manage share links for your content</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Share Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Share Link</DialogTitle>
              <DialogDescription>
                Share your content with anyone. They can view it without logging in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>What do you want to share?</Label>
                <Select
                  value={createForm.shareType}
                  onValueChange={(value) => setCreateForm({ ...createForm, shareType: value, entityId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {createForm.shareType && (
                <div className="space-y-2">
                  <Label>Select {createForm.shareType}</Label>
                  <Select
                    value={createForm.entityId}
                    onValueChange={(value) => setCreateForm({ ...createForm, entityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${createForm.shareType}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getEntityOptions().filter((e) => e.id).map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {createForm.shareType === 'project' && createForm.entityId && (
                <div className="space-y-3 rounded-lg border border-zinc-800 p-4">
                  <Label className="text-sm font-medium">Include in share:</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'songs', label: 'Songs' },
                      { key: 'files', label: 'Files' },
                      { key: 'lyrics', label: 'Lyrics' },
                      { key: 'arrangements', label: 'Arrangements' },
                      { key: 'credits', label: 'Credits' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.key}
                          checked={createForm.includeConfig[item.key as keyof typeof createForm.includeConfig]}
                          onCheckedChange={(checked) =>
                            setCreateForm({
                              ...createForm,
                              includeConfig: { ...createForm.includeConfig, [item.key]: checked },
                            })
                          }
                        />
                        <label htmlFor={item.key} className="text-sm text-zinc-300">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="create-name">Custom name (optional)</Label>
                <Input
                  id="create-name"
                  placeholder="e.g., Demo for Label"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Password protection (optional)</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Leave empty for no password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-expires">Expiration date</Label>
                  <Input
                    id="create-expires"
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-maxViews">Max views</Label>
                  <Input
                    id="create-maxViews"
                    type="number"
                    placeholder="Unlimited"
                    value={createForm.maxViews}
                    onChange={(e) => setCreateForm({ ...createForm, maxViews: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="create-download"
                  checked={createForm.allowDownload}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, allowDownload: checked })}
                />
                <Label htmlFor="create-download">Allow downloads</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Share2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Links</p>
                <p className="text-2xl font-bold text-white">{shares.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Active Links</p>
                <p className="text-2xl font-bold text-white">
                  {shares.filter((s) => s.isActive && !isExpired(s) && !isMaxViewsReached(s)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Eye className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Views</p>
                <p className="text-2xl font-bold text-white">
                  {shares.reduce((sum, s) => sum + (s.viewCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search shares..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SHARE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Links List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : shares.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No shared links yet</h3>
            <p className="text-zinc-400 text-center max-w-md mb-4">
              Create share links to let anyone view your content without logging in.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Share Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeShares.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Active Links</h2>
              <div className="space-y-3">
                {activeShares.map((share) => {
                  const Icon = TYPE_ICONS[share.shareType] || Link;
                  return (
                    <Card key={share.id} className="border-zinc-800 bg-zinc-900/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="h-5 w-5 text-violet-400" />
                              <span className="font-semibold text-white">
                                {share.name || share.entity?.name || 'Untitled'}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {share.shareType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{share.viewCount || 0} views</span>
                                {share.maxViews && (
                                  <span className="text-zinc-500">/ {share.maxViews}</span>
                                )}
                              </div>
                              {share.expiresAt && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Expires {format(new Date(share.expiresAt), 'MMM d, yyyy')}</span>
                                </div>
                              )}
                              {share.password && (
                                <div className="flex items-center gap-1">
                                  <Lock className="h-4 w-4" />
                                  <span>Protected</span>
                                </div>
                              )}
                              {share.allowDownload && (
                                <div className="flex items-center gap-1">
                                  <Download className="h-4 w-4" />
                                  <span>Downloads</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => copyLink(share)}>
                              {copiedId === share.id ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`/share/${share.token}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingShare(share)}>
                                  Edit Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleActive(share)}>
                                  Deactivate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-400"
                                  onClick={() => {
                                    if (confirm('Delete this share link?')) {
                                      deleteMutation.mutate(share.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {inactiveShares.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-400 mb-3">Inactive/Expired Links</h2>
              <div className="space-y-3">
                {inactiveShares.map((share) => {
                  const Icon = TYPE_ICONS[share.shareType] || Link;
                  return (
                    <Card key={share.id} className="border-zinc-800 bg-zinc-900/30 opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="h-5 w-5 text-zinc-500" />
                              <span className="font-semibold text-zinc-300">
                                {share.name || share.entity?.name || 'Untitled'}
                              </span>
                              <Badge variant="secondary" className="text-xs bg-zinc-700">
                                {!share.isActive ? 'Disabled' : isExpired(share) ? 'Expired' : 'Max views'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                              <span>{share.viewCount || 0} views</span>
                              <span>Created {format(new Date(share.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleActive(share)}>
                              Reactivate
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Delete this share link?')) {
                                  deleteMutation.mutate(share.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingShare} onOpenChange={(open) => !open && setEditingShare(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Share Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingShare?.name || ''}
                placeholder="Custom name for this share"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue=""
                placeholder="Leave empty to keep current / no password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                defaultValue={
                  editingShare?.expiresAt
                    ? format(new Date(editingShare.expiresAt), "yyyy-MM-dd'T'HH:mm")
                    : ''
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxViews">Max Views</Label>
              <Input
                id="maxViews"
                name="maxViews"
                type="number"
                defaultValue={editingShare?.maxViews || ''}
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowDownload"
                  name="allowDownload"
                  defaultChecked={editingShare?.allowDownload}
                />
                <Label htmlFor="allowDownload">Allow Downloads</Label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked={editingShare?.isActive} />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingShare(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
