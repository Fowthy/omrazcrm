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
  DollarSign,
  Users,
  Music,
  Ticket,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Show {
  id: string;
  name: string;
  venue: string | null;
  date: string | null;
  loadInTime: string | null;
  soundCheckTime: string | null;
  showTime: string | null;
  status: string;
  ticketPrice: number | null;
  capacity: number | null;
  ticketsSold: number | null;
  guarantee: number | null;
  notes: string | null;
  createdAt: string;
}

const showStatuses = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export default function ShowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    venue: '',
    date: '',
    loadInTime: '',
    soundCheckTime: '',
    showTime: '',
    status: 'inquiry',
    ticketPrice: '',
    capacity: '',
    guarantee: '',
    notes: '',
  });

  const { data: show, isLoading } = useQuery<Show>({
    queryKey: ['show', showId],
    queryFn: async () => {
      const res = await fetch(`/api/shows/${showId}`);
      if (!res.ok) throw new Error('Failed to fetch show');
      return res.json();
    },
  });

  if (show && !editForm.name && show.name !== editForm.name) {
    setEditForm({
      name: show.name,
      venue: show.venue || '',
      date: show.date ? show.date.split('T')[0] : '',
      loadInTime: show.loadInTime || '',
      soundCheckTime: show.soundCheckTime || '',
      showTime: show.showTime || '',
      status: show.status,
      ticketPrice: show.ticketPrice?.toString() || '',
      capacity: show.capacity?.toString() || '',
      guarantee: show.guarantee?.toString() || '',
      notes: show.notes || '',
    });
  }

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      toast.error('Show name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/shows/${showId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          ticketPrice: editForm.ticketPrice ? parseFloat(editForm.ticketPrice) : null,
          capacity: editForm.capacity ? parseInt(editForm.capacity) : null,
          guarantee: editForm.guarantee ? parseFloat(editForm.guarantee) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update show');

      await queryClient.invalidateQueries({ queryKey: ['show', showId] });
      await queryClient.invalidateQueries({ queryKey: ['shows'] });
      toast.success('Show updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update show');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shows/${showId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete show');

      await queryClient.invalidateQueries({ queryKey: ['shows'] });
      toast.success('Show deleted!');
      router.push('/shows');
    } catch (error) {
      toast.error('Failed to delete show');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      inquiry: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      completed: 'bg-blue-500/20 text-blue-400',
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

  if (!show) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/shows')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shows
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Show not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/shows')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{show.name}</h1>
            <Badge variant="outline" className={getStatusColor(show.status)}>
              {showStatuses.find(s => s.value === show.status)?.label || show.status}
            </Badge>
          </div>
          {show.venue && (
            <p className="mt-1 text-zinc-400 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {show.venue}
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
              Edit Show
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              <span className="text-white">{show.date ? formatDate(show.date) : 'TBD'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Show Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              <span className="text-white">{show.showTime || 'TBD'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Guarantee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-white">
                {show.guarantee ? `$${show.guarantee.toLocaleString()}` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-white">
                {show.ticketsSold || 0} / {show.capacity || '?'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      {(show.loadInTime || show.soundCheckTime) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              {show.loadInTime && (
                <div>
                  <p className="text-sm text-zinc-400">Load In</p>
                  <p className="text-white">{show.loadInTime}</p>
                </div>
              )}
              {show.soundCheckTime && (
                <div>
                  <p className="text-sm text-zinc-400">Sound Check</p>
                  <p className="text-white">{show.soundCheckTime}</p>
                </div>
              )}
              {show.showTime && (
                <div>
                  <p className="text-sm text-zinc-400">Show Time</p>
                  <p className="text-white">{show.showTime}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {show.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Notes & Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{show.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Show</DialogTitle>
            <DialogDescription>Update show details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Show Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={editForm.venue}
                onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
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
                    {showStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Load In</Label>
                <Input
                  type="time"
                  value={editForm.loadInTime}
                  onChange={(e) => setEditForm({ ...editForm, loadInTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sound Check</Label>
                <Input
                  type="time"
                  value={editForm.soundCheckTime}
                  onChange={(e) => setEditForm({ ...editForm, soundCheckTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Show Time</Label>
                <Input
                  type="time"
                  value={editForm.showTime}
                  onChange={(e) => setEditForm({ ...editForm, showTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ticket Price ($)</Label>
                <Input
                  type="number"
                  value={editForm.ticketPrice}
                  onChange={(e) => setEditForm({ ...editForm, ticketPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Guarantee ($)</Label>
                <Input
                  type="number"
                  value={editForm.guarantee}
                  onChange={(e) => setEditForm({ ...editForm, guarantee: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
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
            <DialogTitle>Delete Show</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{show.name}&quot;? This action cannot be undone.
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
                'Delete Show'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
