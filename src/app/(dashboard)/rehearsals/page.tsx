'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Loader2,
  Trash2,
  Edit,
  Target,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Rehearsal {
  id: string;
  title: string;
  location: string | null;
  scheduledAt: string;
  endTime: string | null;
  notes: string | null;
  goals: string | null;
  createdAt: string;
  creatorName: string | null;
}

export default function RehearsalsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(null);
  const [newRehearsal, setNewRehearsal] = useState({
    title: '',
    location: '',
    scheduledAt: '',
    endTime: '',
    notes: '',
    goals: '',
  });

  const { data: rehearsals, isLoading } = useQuery<Rehearsal[]>({
    queryKey: ['rehearsals'],
    queryFn: async () => {
      const res = await fetch('/api/rehearsals');
      if (!res.ok) throw new Error('Failed to fetch rehearsals');
      return res.json();
    },
  });

  const handleCreateRehearsal = async () => {
    if (!newRehearsal.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch('/api/rehearsals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRehearsal),
      });

      if (!res.ok) throw new Error('Failed to create rehearsal');

      toast.success('Rehearsal scheduled!');
      setIsCreateDialogOpen(false);
      setNewRehearsal({
        title: '',
        location: '',
        scheduledAt: '',
        endTime: '',
        notes: '',
        goals: '',
      });
      queryClient.invalidateQueries({ queryKey: ['rehearsals'] });
    } catch (error) {
      toast.error('Failed to schedule rehearsal');
    }
  };

  const handleEditRehearsal = async () => {
    if (!editingRehearsal || !editingRehearsal.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch(`/api/rehearsals/${editingRehearsal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRehearsal),
      });

      if (!res.ok) throw new Error('Failed to update rehearsal');

      toast.success('Rehearsal updated!');
      setIsEditDialogOpen(false);
      setEditingRehearsal(null);
      queryClient.invalidateQueries({ queryKey: ['rehearsals'] });
    } catch (error) {
      toast.error('Failed to update rehearsal');
    }
  };

  const handleDeleteRehearsal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rehearsal?')) return;

    try {
      const res = await fetch(`/api/rehearsals/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete rehearsal');

      toast.success('Rehearsal deleted!');
      queryClient.invalidateQueries({ queryKey: ['rehearsals'] });
    } catch (error) {
      toast.error('Failed to delete rehearsal');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };

  // Separate upcoming and past rehearsals
  const upcomingRehearsals = rehearsals?.filter((r) => isUpcoming(r.scheduledAt)) || [];
  const pastRehearsals = rehearsals?.filter((r) => !isUpcoming(r.scheduledAt)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Rehearsals</h1>
          <p className="mt-1 text-zinc-400">
            Schedule and track band rehearsals
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Rehearsal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Rehearsal</DialogTitle>
              <DialogDescription>
                Set up a new rehearsal session
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., Weekly Rehearsal"
                  value={newRehearsal.title}
                  onChange={(e) =>
                    setNewRehearsal({ ...newRehearsal, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Studio A"
                  value={newRehearsal.location}
                  onChange={(e) =>
                    setNewRehearsal({ ...newRehearsal, location: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={newRehearsal.scheduledAt}
                    onChange={(e) =>
                      setNewRehearsal({ ...newRehearsal, scheduledAt: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={newRehearsal.endTime}
                    onChange={(e) =>
                      setNewRehearsal({ ...newRehearsal, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Goals</Label>
                <Textarea
                  placeholder="What do you want to accomplish?"
                  value={newRehearsal.goals}
                  onChange={(e) =>
                    setNewRehearsal({ ...newRehearsal, goals: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={newRehearsal.notes}
                  onChange={(e) =>
                    setNewRehearsal({ ...newRehearsal, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRehearsal}>
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : rehearsals?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No rehearsals scheduled</h3>
            <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
              Schedule your band rehearsals to keep everyone in sync.
              Track attendance, set goals, and record notes.
            </p>
            <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Your First Rehearsal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcomingRehearsals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Upcoming</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingRehearsals.map((rehearsal) => (
                  <Card key={rehearsal.id} className="transition-all hover:border-zinc-700">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="line-clamp-1">{rehearsal.title}</CardTitle>
                          <CardDescription>
                            {formatDate(rehearsal.scheduledAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="bg-green-600">Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="h-4 w-4" />
                        {formatTime(rehearsal.scheduledAt)}
                        {rehearsal.endTime && ` - ${formatTime(rehearsal.endTime)}`}
                      </div>
                      {rehearsal.location && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <MapPin className="h-4 w-4" />
                          {rehearsal.location}
                        </div>
                      )}
                      {rehearsal.goals && (
                        <div className="flex items-start gap-2 text-sm text-zinc-400">
                          <Target className="h-4 w-4 mt-0.5" />
                          <span className="line-clamp-2">{rehearsal.goals}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingRehearsal(rehearsal);
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
                          onClick={() => handleDeleteRehearsal(rehearsal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastRehearsals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Past Rehearsals</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastRehearsals.map((rehearsal) => (
                  <Card key={rehearsal.id} className="transition-all hover:border-zinc-700 opacity-75">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="line-clamp-1">{rehearsal.title}</CardTitle>
                          <CardDescription>
                            {formatDate(rehearsal.scheduledAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Past</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="h-4 w-4" />
                        {formatTime(rehearsal.scheduledAt)}
                        {rehearsal.endTime && ` - ${formatTime(rehearsal.endTime)}`}
                      </div>
                      {rehearsal.location && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <MapPin className="h-4 w-4" />
                          {rehearsal.location}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteRehearsal(rehearsal.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rehearsal</DialogTitle>
            <DialogDescription>
              Update rehearsal details
            </DialogDescription>
          </DialogHeader>

          {editingRehearsal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editingRehearsal.title}
                  onChange={(e) =>
                    setEditingRehearsal({ ...editingRehearsal, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editingRehearsal.location || ''}
                  onChange={(e) =>
                    setEditingRehearsal({ ...editingRehearsal, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Goals</Label>
                <Textarea
                  value={editingRehearsal.goals || ''}
                  onChange={(e) =>
                    setEditingRehearsal({ ...editingRehearsal, goals: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingRehearsal.notes || ''}
                  onChange={(e) =>
                    setEditingRehearsal({ ...editingRehearsal, notes: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRehearsal}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
