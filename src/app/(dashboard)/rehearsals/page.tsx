'use client';

import { useState } from 'react';
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
  Target,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RehearsalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRehearsal, setNewRehearsal] = useState({
    title: '',
    location: '',
    scheduledAt: '',
    endTime: '',
    notes: '',
    goals: '',
  });

  const handleCreateRehearsal = async () => {
    if (!newRehearsal.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsCreating(true);
    // TODO: Implement API call when rehearsals API is ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
    setIsCreating(false);
  };

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
                <Label>Title</Label>
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
                <Label>Goals (one per line)</Label>
                <Textarea
                  placeholder="Run through full setlist&#10;Work on transitions&#10;Record for review"
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
              <Button onClick={handleCreateRehearsal} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
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
    </div>
  );
}
