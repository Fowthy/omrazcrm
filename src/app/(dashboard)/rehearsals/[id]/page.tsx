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
  MapPin,
  Calendar,
  Clock,
  Music2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Rehearsal {
  id: string;
  title: string;
  location: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

const rehearsalStatuses = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function RehearsalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rehearsalId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'scheduled',
    notes: '',
  });

  const { data: rehearsal, isLoading } = useQuery<Rehearsal>({
    queryKey: ['rehearsal', rehearsalId],
    queryFn: async () => {
      const res = await fetch(`/api/rehearsals/${rehearsalId}`);
      if (!res.ok) throw new Error('Failed to fetch rehearsal');
      return res.json();
    },
  });

  if (rehearsal && !editForm.title && rehearsal.title !== editForm.title) {
    setEditForm({
      title: rehearsal.title,
      location: rehearsal.location || '',
      date: rehearsal.date ? rehearsal.date.split('T')[0] : '',
      startTime: rehearsal.startTime || '',
      endTime: rehearsal.endTime || '',
      status: rehearsal.status,
      notes: rehearsal.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/rehearsals/${rehearsalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update rehearsal');

      await queryClient.invalidateQueries({ queryKey: ['rehearsal', rehearsalId] });
      await queryClient.invalidateQueries({ queryKey: ['rehearsals'] });
      toast.success('Rehearsal updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update rehearsal');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rehearsals/${rehearsalId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rehearsal');

      await queryClient.invalidateQueries({ queryKey: ['rehearsals'] });
      toast.success('Rehearsal deleted!');
      router.push('/rehearsals');
    } catch (error) {
      toast.error('Failed to delete rehearsal');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!rehearsal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/rehearsals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rehearsals
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music2 className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Rehearsal not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/rehearsals')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{rehearsal.title}</h1>
            <Badge variant="outline" className={getStatusColor(rehearsal.status)}>
              {rehearsalStatuses.find(s => s.value === rehearsal.status)?.label || rehearsal.status}
            </Badge>
          </div>
          {rehearsal.location && (
            <p className="mt-1 text-zinc-400 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {rehearsal.location}
            </p>
          )}
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
              Edit Rehearsal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              <span className="text-white">{rehearsal.date ? formatDate(rehearsal.date) : 'TBD'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Start Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              <span className="text-white">{rehearsal.startTime || 'TBD'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">End Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              <span className="text-white">{rehearsal.endTime || 'TBD'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {rehearsal.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{rehearsal.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rehearsal</DialogTitle>
            <DialogDescription>Update rehearsal details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
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
                    {rehearsalStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
                placeholder="Songs to practice, things to work on..."
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
            <DialogTitle>Delete Rehearsal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{rehearsal.title}&quot;? This action cannot be undone.
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
                'Delete Rehearsal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
