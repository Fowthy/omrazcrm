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
  Link as LinkIcon,
  Copy,
  Eye,
  Calendar,
  Share2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Share {
  id: string;
  name: string;
  url: string;
  type: string;
  accessLevel: string;
  password: string | null;
  expiresAt: string | null;
  viewCount: number;
  notes: string | null;
  createdAt: string;
}

const shareTypes = [
  { value: 'project', label: 'Project' },
  { value: 'song', label: 'Song' },
  { value: 'file', label: 'File' },
  { value: 'demo', label: 'Demo' },
  { value: 'press_kit', label: 'Press Kit' },
  { value: 'other', label: 'Other' },
];

const accessLevels = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'password', label: 'Password Protected' },
];

export default function ShareDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shareId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    url: '',
    type: 'other',
    accessLevel: 'unlisted',
    password: '',
    expiresAt: '',
    notes: '',
  });

  const { data: share, isLoading } = useQuery<Share>({
    queryKey: ['share-item', shareId],
    queryFn: async () => {
      const res = await fetch(`/api/shares/${shareId}`);
      if (!res.ok) throw new Error('Failed to fetch share');
      return res.json();
    },
  });

  if (share && !editForm.name && share.name !== editForm.name) {
    setEditForm({
      name: share.name,
      url: share.url,
      type: share.type,
      accessLevel: share.accessLevel,
      password: share.password || '',
      expiresAt: share.expiresAt ? share.expiresAt.split('T')[0] : '',
      notes: share.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim() || !editForm.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update share');

      await queryClient.invalidateQueries({ queryKey: ['share-item', shareId] });
      await queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('Share updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update share');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shares/${shareId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete share');

      await queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('Share deleted!');
      router.push('/shares');
    } catch (error) {
      toast.error('Failed to delete share');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async () => {
    if (share?.url) {
      await navigator.clipboard.writeText(share.url);
      toast.success('Link copied to clipboard!');
    }
  };

  const getAccessColor = (access: string) => {
    const colors: Record<string, string> = {
      public: 'bg-green-500/20 text-green-400',
      unlisted: 'bg-blue-500/20 text-blue-400',
      password: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[access] || 'bg-zinc-500/20 text-zinc-400';
  };

  const isExpired = share?.expiresAt && new Date(share.expiresAt) < new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!share) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/shares')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shares
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Share not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/shares')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{share.name}</h1>
            <Badge variant="secondary">
              {shareTypes.find(t => t.value === share.type)?.label || share.type}
            </Badge>
            <Badge variant="outline" className={getAccessColor(share.accessLevel)}>
              {accessLevels.find(a => a.value === share.accessLevel)?.label || share.accessLevel}
            </Badge>
            {isExpired && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400">
                Expired
              </Badge>
            )}
          </div>
          <p className="mt-1 text-zinc-400">
            Created {formatDate(share.createdAt)}
          </p>
        </div>

        <Button variant="outline" onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* URL */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <LinkIcon className="h-5 w-5 text-violet-500" />
            <a
              href={share.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-violet-400 hover:underline truncate"
            >
              {share.url}
            </a>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-violet-500" />
              <span className="text-2xl font-bold text-white">{share.viewCount}</span>
            </div>
          </CardContent>
        </Card>

        {share.expiresAt && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Expires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-500" />
                <span className={`text-white ${isExpired ? 'text-red-400' : ''}`}>
                  {formatDate(share.expiresAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {share.password && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Password</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-violet-400 bg-zinc-800 px-2 py-1 rounded">
                {share.password}
              </code>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {share.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{share.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Share</DialogTitle>
            <DialogDescription>Update share settings</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
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
                    {shareTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select
                  value={editForm.accessLevel}
                  onValueChange={(value) => setEditForm({ ...editForm, accessLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires</Label>
                <Input
                  type="date"
                  value={editForm.expiresAt}
                  onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="Who this is shared with, purpose, etc..."
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
            <DialogTitle>Delete Share</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{share.name}&quot;? The link will no longer work.
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
                'Delete Share'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
