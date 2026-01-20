'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { GitBranch, Plus, Music, Album } from 'lucide-react';
import toast from 'react-hot-toast';

interface Decision {
  id: string;
  songId: string | null;
  albumId: string;
  decisionType: string;
  question: string;
  context: string | null;
  status: string;
  proposedAt: Date;
  confidence: number;
  daysOpen: number;
  proposedByUser: { name: string; avatar: string | null } | null;
  song: { title: string } | null;
  album: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  projectId: string | null;
}

const statusColors: Record<string, string> = {
  proposed: 'bg-blue-500/20 text-blue-400',
  testing: 'bg-yellow-500/20 text-yellow-400',
  locked: 'bg-green-500/20 text-green-400',
  reopened: 'bg-orange-500/20 text-orange-400',
};

const decisionTypeColors: Record<string, string> = {
  arrangement: 'bg-purple-500/20 text-purple-400',
  performance: 'bg-pink-500/20 text-pink-400',
  sonic: 'bg-cyan-500/20 text-cyan-400',
  lyrical: 'bg-green-500/20 text-green-400',
  structural: 'bg-orange-500/20 text-orange-400',
  production: 'bg-red-500/20 text-red-400',
};

const DECISION_TYPES = [
  { value: 'arrangement', label: 'Arrangement' },
  { value: 'performance', label: 'Performance' },
  { value: 'sonic', label: 'Sonic' },
  { value: 'lyrical', label: 'Lyrical' },
  { value: 'structural', label: 'Structural' },
  { value: 'production', label: 'Production' },
];

export default function DecisionsPage() {
  const { data: session } = useSession();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    albumId: '',
    songId: '',
    decisionType: '',
    question: '',
    context: '',
    confidence: 50,
  });

  useEffect(() => {
    if (session?.user) {
      fetchDecisions();
      fetchProjects();
      fetchSongs();
    }
  }, [session]);

  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/decisions');
      if (response.ok) {
        const data = await response.json();
        setDecisions(data);
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (response.ok) {
        const data = await response.json();
        setSongs(data);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.albumId) {
      toast.error('Please select an album');
      return;
    }
    if (!formData.decisionType) {
      toast.error('Please select a decision type');
      return;
    }
    if (!formData.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: formData.albumId,
          songId: formData.songId || null,
          decisionType: formData.decisionType,
          question: formData.question,
          context: formData.context || null,
          confidence: formData.confidence,
        }),
      });

      if (response.ok) {
        toast.success('Decision created successfully');
        setDialogOpen(false);
        setFormData({
          albumId: '',
          songId: '',
          decisionType: '',
          question: '',
          context: '',
          confidence: 50,
        });
        fetchDecisions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create decision');
      }
    } catch (error) {
      console.error('Error creating decision:', error);
      toast.error('Failed to create decision');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSongs = formData.albumId
    ? songs.filter((s) => s.projectId === formData.albumId)
    : songs;

  const filteredDecisions = decisions.filter((decision) => {
    if (filter === 'all') return true;
    return decision.status === filter;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading decisions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <GitBranch className="h-8 w-8 text-violet-400" />
            Decisions
          </h1>
          <p className="text-zinc-400 mt-1">
            Creative decisions that shape your music
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Decision
        </Button>
      </div>

      {/* New Decision Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Decision</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Propose a creative decision that needs to be made for your music.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Album *</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) =>
                  setFormData({ ...formData, albumId: value, songId: '' })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select an album" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Song (optional)</Label>
              <Select
                value={formData.songId}
                onValueChange={(value) =>
                  setFormData({ ...formData, songId: value })
                }
                disabled={!formData.albumId}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select a song" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {filteredSongs.map((song) => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Decision Type *</Label>
              <Select
                value={formData.decisionType}
                onValueChange={(value) =>
                  setFormData({ ...formData, decisionType: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {DECISION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Question *</Label>
              <Input
                placeholder="What needs to be decided?"
                className="bg-zinc-800 border-zinc-700 text-white"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Context</Label>
              <Textarea
                placeholder="Why does this decision matter?"
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={3}
                value={formData.context}
                onChange={(e) =>
                  setFormData({ ...formData, context: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-zinc-300">Confidence</Label>
                <span className="text-zinc-400 text-sm">
                  {formData.confidence}%
                </span>
              </div>
              <Slider
                value={[formData.confidence]}
                onValueChange={(value) =>
                  setFormData({ ...formData, confidence: value[0] })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? 'Creating...' : 'Create Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'proposed' ? 'default' : 'outline'}
          onClick={() => setFilter('proposed')}
          size="sm"
        >
          Proposed
        </Button>
        <Button
          variant={filter === 'testing' ? 'default' : 'outline'}
          onClick={() => setFilter('testing')}
          size="sm"
        >
          Testing
        </Button>
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          onClick={() => setFilter('locked')}
          size="sm"
        >
          Locked
        </Button>
        <Button
          variant={filter === 'reopened' ? 'default' : 'outline'}
          onClick={() => setFilter('reopened')}
          size="sm"
        >
          Reopened
        </Button>
      </div>

      {/* Decisions Grid */}
      {filteredDecisions.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No decisions yet</p>
            <p className="text-zinc-500 text-sm mb-4">
              Start making creative decisions to shape your album
            </p>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Decision
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDecisions.map((decision) => (
            <Card
              key={decision.id}
              className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[decision.status] || 'bg-zinc-700'}>
                        {decision.status}
                      </Badge>
                      <Badge className={decisionTypeColors[decision.decisionType] || 'bg-zinc-700'}>
                        {decision.decisionType}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white">
                      {decision.question}
                    </CardTitle>
                  </div>
                </div>
                {decision.context && (
                  <CardDescription className="text-zinc-400 mt-2">
                    {decision.context}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {decision.album && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Album className="h-4 w-4" />
                      <span>{decision.album.name}</span>
                    </div>
                  )}
                  {decision.song && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Music className="h-4 w-4" />
                      <span>{decision.song.title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-zinc-500">Confidence</span>
                    <span className="text-white font-medium">
                      {decision.confidence}%
                    </span>
                  </div>
                  {decision.daysOpen > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Open for</span>
                      <span className="text-white font-medium">
                        {decision.daysOpen} days
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
