'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Users,
  Target,
  Mic,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

// Mock data
const rehearsals = [
  {
    id: '1',
    title: 'Weekly Band Rehearsal',
    location: 'Studio A',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    notes: 'Focus on new songs from the album',
    goals: ['Run through full setlist', 'Work on transitions', 'Record rehearsal for review'],
    attendees: [
      { id: '1', name: 'Alex', status: 'confirmed', avatar: null },
      { id: '2', name: 'Sam', status: 'confirmed', avatar: null },
      { id: '3', name: 'Jordan', status: 'pending', avatar: null },
    ],
  },
  {
    id: '2',
    title: 'Pre-show Rehearsal',
    location: 'The Venue - Backstage',
    scheduledAt: new Date(Date.now() + 604800000).toISOString(), // Next week
    endTime: new Date(Date.now() + 604800000 + 7200000).toISOString(),
    notes: 'Final run-through before the show',
    goals: ['Sound check', 'Run full set', 'Check all gear'],
    attendees: [
      { id: '1', name: 'Alex', status: 'confirmed', avatar: null },
      { id: '2', name: 'Sam', status: 'confirmed', avatar: null },
      { id: '3', name: 'Jordan', status: 'confirmed', avatar: null },
      { id: '4', name: 'Taylor', status: 'confirmed', avatar: null },
    ],
  },
];

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
    // Simulate API call
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const upcomingRehearsals = rehearsals.filter(
    (r) => new Date(r.scheduledAt) > new Date()
  );

  const pastRehearsals = rehearsals.filter(
    (r) => new Date(r.scheduledAt) <= new Date()
  );

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

      {/* Upcoming Rehearsals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Upcoming</h2>

        {upcomingRehearsals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CalendarDays className="h-10 w-10 text-zinc-500" />
              <p className="mt-2 text-sm text-zinc-400">No upcoming rehearsals</p>
              <Button className="mt-4" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                Schedule One
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingRehearsals.map((rehearsal) => (
              <Card key={rehearsal.id} className="transition-colors hover:border-zinc-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{rehearsal.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <CalendarDays className="h-4 w-4" />
                        {formatDateTime(rehearsal.scheduledAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Location */}
                  {rehearsal.location && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      {rehearsal.location}
                    </div>
                  )}

                  {/* Goals */}
                  {rehearsal.goals && rehearsal.goals.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Target className="h-4 w-4" />
                        Goals
                      </div>
                      <ul className="space-y-1">
                        {rehearsal.goals.map((goal, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Attendees */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Users className="h-4 w-4" />
                      Attendees
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rehearsal.attendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={attendee.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {attendee.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-zinc-300">{attendee.name}</span>
                          {getStatusIcon(attendee.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Rehearsals */}
      {pastRehearsals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Past</h2>
          <div className="space-y-2">
            {pastRehearsals.map((rehearsal) => (
              <Card key={rehearsal.id} className="bg-zinc-900/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                    <Mic className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-300">{rehearsal.title}</h3>
                    <p className="text-sm text-zinc-500">
                      {formatDate(rehearsal.scheduledAt)} at {rehearsal.location}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {rehearsal.attendees.slice(0, 3).map((attendee) => (
                      <Avatar key={attendee.id} className="h-7 w-7 border-2 border-zinc-900">
                        <AvatarFallback className="text-xs">
                          {attendee.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
