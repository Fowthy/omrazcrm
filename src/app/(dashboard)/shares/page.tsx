'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface ShareLink {
  id: string;
  token: string;
  password: string | null;
  expiresAt: string | null;
  allowDownload: boolean;
  viewCount: number;
  maxViews: number | null;
  isActive: boolean;
  createdAt: string;
  createdById: string;
  projectId: string | null;
  songId: string | null;
  fileId: string | null;
  creatorName: string | null;
  creatorAvatar: string | null;
  project: { id: string; name: string } | null;
  song: { id: string; title: string } | null;
  file: { id: string; name: string } | null;
}

export default function SharesPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingShare, setEditingShare] = useState<ShareLink | null>(null);
  const queryClient = useQueryClient();

  const { data: shares = [], isLoading } = useQuery<ShareLink[]>({
    queryKey: ['shares'],
    queryFn: async () => {
      const res = await fetch('/api/shares');
      if (!res.ok) throw new Error('Failed to fetch shares');
      return res.json();
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shares/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete share');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
    },
  });

  const copyLink = (share: ShareLink) => {
    const url = `${window.location.origin}/share/${share.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleActive = (share: ShareLink) => {
    updateMutation.mutate({ id: share.id, data: { isActive: !share.isActive } });
  };

  const getSharedItemName = (share: ShareLink) => {
    if (share.project) return `Project: ${share.project.name}`;
    if (share.song) return `Song: ${share.song.title}`;
    if (share.file) return `File: ${share.file.name}`;
    return 'Unknown';
  };

  const getSharedItemType = (share: ShareLink) => {
    if (share.project) return 'project';
    if (share.song) return 'song';
    if (share.file) return 'file';
    return 'unknown';
  };

  const isExpired = (share: ShareLink) => {
    if (!share.expiresAt) return false;
    return new Date(share.expiresAt) < new Date();
  };

  const isMaxViewsReached = (share: ShareLink) => {
    if (!share.maxViews) return false;
    return share.viewCount >= share.maxViews;
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingShare) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingShare.id,
      data: {
        password: formData.get('password') as string || null,
        expiresAt: formData.get('expiresAt') as string || null,
        maxViews: formData.get('maxViews') ? parseInt(formData.get('maxViews') as string) : null,
        allowDownload: formData.get('allowDownload') === 'on',
        isActive: formData.get('isActive') === 'on',
      },
    });
  };

  const activeShares = shares.filter((s) => s.isActive && !isExpired(s) && !isMaxViewsReached(s));
  const inactiveShares = shares.filter((s) => !s.isActive || isExpired(s) || isMaxViewsReached(s));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Shared Links</h1>
          <p className="text-zinc-400">Manage shared links to your projects, songs, and files</p>
        </div>
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
                <p className="text-2xl font-bold text-white">{activeShares.length}</p>
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
                  {shares.reduce((sum, s) => sum + s.viewCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links List */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : shares.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No shared links yet</h3>
            <p className="text-zinc-400 text-center max-w-md">
              Share links are created when you share projects, songs, or files with others.
              Go to a project, song, or file and click the share button to create a link.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeShares.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Active Links</h2>
              <div className="space-y-3">
                {activeShares.map((share) => (
                  <Card key={share.id} className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link className="h-5 w-5 text-violet-400" />
                            <span className="font-semibold text-white">{getSharedItemName(share)}</span>
                            <Badge variant="outline" className="text-xs">
                              {getSharedItemType(share)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{share.viewCount} views</span>
                              {share.maxViews && <span className="text-zinc-500">/ {share.maxViews}</span>}
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
                                <span>Password protected</span>
                              </div>
                            )}
                            {share.allowDownload && (
                              <div className="flex items-center gap-1">
                                <Download className="h-4 w-4" />
                                <span>Downloads allowed</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyLink(share)}
                          >
                            {copiedId === share.id ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Link
                              </>
                            )}
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
                                {share.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
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
                ))}
              </div>
            </div>
          )}

          {inactiveShares.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-400 mb-3">Inactive/Expired Links</h2>
              <div className="space-y-3">
                {inactiveShares.map((share) => (
                  <Card key={share.id} className="border-zinc-800 bg-zinc-900/30 opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link className="h-5 w-5 text-zinc-500" />
                            <span className="font-semibold text-zinc-300">{getSharedItemName(share)}</span>
                            <Badge variant="secondary" className="text-xs bg-zinc-700">
                              {!share.isActive ? 'Disabled' : isExpired(share) ? 'Expired' : 'Max views reached'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{share.viewCount} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Created {format(new Date(share.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(share)}
                          >
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
                ))}
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
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue={editingShare?.password || ''}
                placeholder="Leave empty for no password"
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
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingShare?.isActive}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingShare(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
