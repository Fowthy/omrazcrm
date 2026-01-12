'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic2,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface Show {
  id: string;
  title: string;
  venue: string;
  city: string | null;
  country: string | null;
  date: string;
  loadIn: string | null;
  soundcheck: string | null;
  doors: string | null;
  setTime: string | null;
  setDuration: number | null;
  ticketPrice: number | null;
  ticketLink: string | null;
  promoter: string | null;
  notes: string | null;
  status: string;
  setlistId: string | null;
  setlistName: string | null;
}

const showStatuses = [
  { value: 'inquiry', label: 'Inquiry', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export default function ShowsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const queryClient = useQueryClient();

  const { data: shows = [], isLoading } = useQuery<Show[]>({
    queryKey: ['shows'],
    queryFn: async () => {
      const res = await fetch('/api/shows');
      if (!res.ok) throw new Error('Failed to fetch shows');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Show>) => {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create show');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Show> }) => {
      const res = await fetch(`/api/shows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update show');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      setEditingShow(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete show');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      venue: formData.get('venue') as string,
      city: formData.get('city') as string || null,
      country: formData.get('country') as string || null,
      date: formData.get('date') as string,
      setTime: formData.get('setTime') as string || null,
      setDuration: formData.get('setDuration') ? parseInt(formData.get('setDuration') as string) : null,
      ticketPrice: formData.get('ticketPrice') ? parseFloat(formData.get('ticketPrice') as string) : null,
      ticketLink: formData.get('ticketLink') as string || null,
      promoter: formData.get('promoter') as string || null,
      notes: formData.get('notes') as string || null,
      status: formData.get('status') as string || 'confirmed',
    };

    if (editingShow) {
      updateMutation.mutate({ id: editingShow.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const now = new Date();
  const upcomingShows = shows.filter((s) => new Date(s.date) >= now && s.status !== 'cancelled');
  const pastShows = shows.filter((s) => new Date(s.date) < now);
  const cancelledShows = shows.filter((s) => s.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    const statusInfo = showStatuses.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={`${statusInfo?.color} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const ShowCard = ({ show }: { show: Show }) => (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-white">{show.title}</h3>
              {getStatusBadge(show.status)}
            </div>
            <div className="space-y-1 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{show.venue}{show.city && `, ${show.city}`}{show.country && `, ${show.country}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(show.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              {show.setTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Set time: {format(new Date(show.setTime), 'h:mm a')}</span>
                  {show.setDuration && <span className="text-zinc-500">({show.setDuration} min)</span>}
                </div>
              )}
              {show.ticketPrice && (
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  <span>${show.ticketPrice.toFixed(2)}</span>
                  {show.ticketLink && (
                    <a href={show.ticketLink} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {show.setlistName && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Setlist: {show.setlistName}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingShow(show)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => {
                  if (confirm('Delete this show?')) {
                    deleteMutation.mutate(show.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  const ShowForm = ({ show }: { show?: Show | null }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Show Title *</Label>
          <Input
            id="title"
            name="title"
            defaultValue={show?.title}
            placeholder="e.g., Summer Festival 2024"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={show?.status || 'confirmed'}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue *</Label>
          <Input id="venue" name="venue" defaultValue={show?.venue} placeholder="Venue name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={show?.city || ''} placeholder="City" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={show?.country || ''} placeholder="Country" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="datetime-local"
            defaultValue={show?.date ? format(new Date(show.date), "yyyy-MM-dd'T'HH:mm") : ''}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="setTime">Set Time</Label>
          <Input
            id="setTime"
            name="setTime"
            type="datetime-local"
            defaultValue={show?.setTime ? format(new Date(show.setTime), "yyyy-MM-dd'T'HH:mm") : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setDuration">Set Duration (minutes)</Label>
          <Input
            id="setDuration"
            name="setDuration"
            type="number"
            defaultValue={show?.setDuration || ''}
            placeholder="45"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticketPrice">Ticket Price ($)</Label>
          <Input
            id="ticketPrice"
            name="ticketPrice"
            type="number"
            step="0.01"
            defaultValue={show?.ticketPrice || ''}
            placeholder="20.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticketLink">Ticket Link</Label>
          <Input
            id="ticketLink"
            name="ticketLink"
            type="url"
            defaultValue={show?.ticketLink || ''}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="promoter">Promoter</Label>
        <Input id="promoter" name="promoter" defaultValue={show?.promoter || ''} placeholder="Promoter name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={show?.notes || ''} placeholder="Any additional notes..." />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddOpen(false);
            setEditingShow(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {show ? 'Update Show' : 'Add Show'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Shows</h1>
          <p className="text-zinc-400">Manage your upcoming and past performances</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Show
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Show</DialogTitle>
            </DialogHeader>
            <ShowForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Mic2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Upcoming Shows</p>
                <p className="text-2xl font-bold text-white">{upcomingShows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Past Shows</p>
                <p className="text-2xl font-bold text-white">{pastShows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Ticket className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Shows</p>
                <p className="text-2xl font-bold text-white">{shows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingShows.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastShows.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledShows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-400">Loading...</div>
          ) : upcomingShows.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mic2 className="h-12 w-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No upcoming shows</h3>
                <p className="text-zinc-400 mb-4">Book your next performance!</p>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Show
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastShows.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No past shows</div>
          ) : (
            <div className="grid gap-4">
              {pastShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {cancelledShows.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No cancelled shows</div>
          ) : (
            <div className="grid gap-4">
              {cancelledShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingShow} onOpenChange={(open) => !open && setEditingShow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Show</DialogTitle>
          </DialogHeader>
          <ShowForm show={editingShow} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
