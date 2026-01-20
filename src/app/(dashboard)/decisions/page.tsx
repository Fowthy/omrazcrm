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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GitBranch,
  Plus,
  Music,
  Album,
  MoreVertical,
  PlayCircle,
  Lock,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Decision {
  id: string;
  songId: string | null;
  albumId: string;
  decisionType: string;
  question: string;
  context: string | null;
  status: string;
  outcome: string | null;
  proposedAt: Date;
  testedAt: Date | null;
  lockedAt: Date | null;
  reopenedAt: Date | null;
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

const statusIcons: Record<string, any> = {
  proposed: AlertCircle,
  testing: PlayCircle,
  locked: Lock,
  reopened: RotateCcw,
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

const STATUS_FLOW = {
  proposed: { next: 'testing', action: 'Start Testing', icon: PlayCircle },
  testing: { next: 'locked', action: 'Lock Decision', icon: Lock },
  locked: { next: 'reopened', action: 'Reopen', icon: RotateCcw },
  reopened: { next: 'testing', action: 'Resume Testing', icon: PlayCircle },
};

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

  // Transition dialog state
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [transitionType, setTransitionType] = useState<'lock' | 'reopen' | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [newConfidence, setNewConfidence] = useState(50);

  // Detail view state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingDecision, setViewingDecision] = useState<Decision | null>(null);

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

  const handleStatusTransition = async (decision: Decision, newStatus: string) => {
    // For locking or reopening, show a dialog to capture additional info
    if (newStatus === 'locked') {
      setSelectedDecision(decision);
      setTransitionType('lock');
      setOutcomeText(decision.outcome || '');
      setNewConfidence(decision.confidence);
      setTransitionDialogOpen(true);
      return;
    }

    if (newStatus === 'reopened') {
      setSelectedDecision(decision);
      setTransitionType('reopen');
      setOutcomeText('');
      setNewConfidence(decision.confidence);
      setTransitionDialogOpen(true);
      return;
    }

    // For simple transitions (proposed → testing), just update
    try {
      const response = await fetch(`/api/decisions/${decision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Decision moved to ${newStatus}`);
        fetchDecisions();
      } else {
        toast.error('Failed to update decision status');
      }
    } catch (error) {
      console.error('Error updating decision:', error);
      toast.error('Failed to update decision status');
    }
  };

  const handleTransitionSubmit = async () => {
    if (!selectedDecision || !transitionType) return;

    const newStatus = transitionType === 'lock' ? 'locked' : 'reopened';

    if (transitionType === 'lock' && !outcomeText.trim()) {
      toast.error('Please describe the outcome/decision made');
      return;
    }

    setSubmitting(true);
    try {
      const updateData: any = {
        status: newStatus,
        confidence: newConfidence,
      };

      if (transitionType === 'lock') {
        updateData.outcome = outcomeText;
      } else {
        updateData.context = selectedDecision.context
          ? `${selectedDecision.context}\n\n[Reopened: ${outcomeText || 'Needs re-evaluation'}]`
          : `[Reopened: ${outcomeText || 'Needs re-evaluation'}]`;
      }

      const response = await fetch(`/api/decisions/${selectedDecision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success(transitionType === 'lock' ? 'Decision locked!' : 'Decision reopened');
        setTransitionDialogOpen(false);
        setSelectedDecision(null);
        setTransitionType(null);
        setOutcomeText('');
        fetchDecisions();
      } else {
        toast.error('Failed to update decision');
      }
    } catch (error) {
      console.error('Error updating decision:', error);
      toast.error('Failed to update decision');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailView = (decision: Decision) => {
    setViewingDecision(decision);
    setDetailDialogOpen(true);
  };

  const filteredSongs = formData.albumId
    ? songs.filter((s) => s.projectId === formData.albumId)
    : songs;

  const filteredDecisions = decisions.filter((decision) => {
    if (filter === 'all') return true;
    return decision.status === filter;
  });

  // Count by status for filter badges
  const statusCounts = decisions.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

      {/* Status Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {transitionType === 'lock' ? 'Lock Decision' : 'Reopen Decision'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {transitionType === 'lock'
                ? 'Record the final decision and lock it.'
                : 'Reopen this decision for re-evaluation.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDecision && (
              <div className="p-3 bg-zinc-800 rounded-lg">
                <p className="text-white font-medium">{selectedDecision.question}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={decisionTypeColors[selectedDecision.decisionType] || 'bg-zinc-700'}>
                    {selectedDecision.decisionType}
                  </Badge>
                  {selectedDecision.song && (
                    <span className="text-xs text-zinc-400">
                      <Music className="h-3 w-3 inline mr-1" />
                      {selectedDecision.song.title}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-300">
                {transitionType === 'lock' ? 'Outcome / Final Decision *' : 'Reason for Reopening'}
              </Label>
              <Textarea
                placeholder={
                  transitionType === 'lock'
                    ? "What was decided? (e.g., 'Using clean guitar tone in the verse')"
                    : "Why does this need to be revisited?"
                }
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={3}
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-zinc-300">
                  {transitionType === 'lock' ? 'Final Confidence' : 'New Confidence'}
                </Label>
                <span className="text-zinc-400 text-sm">{newConfidence}%</span>
              </div>
              <Slider
                value={[newConfidence]}
                onValueChange={(value) => setNewConfidence(value[0])}
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
              onClick={() => setTransitionDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransitionSubmit}
              disabled={submitting}
              className={transitionType === 'lock' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {submitting
                ? 'Updating...'
                : transitionType === 'lock'
                  ? 'Lock Decision'
                  : 'Reopen Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Decision Details</DialogTitle>
          </DialogHeader>

          {viewingDecision && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-lg font-medium text-white">{viewingDecision.question}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusColors[viewingDecision.status]}>
                    {viewingDecision.status}
                  </Badge>
                  <Badge className={decisionTypeColors[viewingDecision.decisionType] || 'bg-zinc-700'}>
                    {viewingDecision.decisionType}
                  </Badge>
                </div>
              </div>

              {viewingDecision.context && (
                <div>
                  <Label className="text-zinc-400 text-xs">Context</Label>
                  <p className="text-zinc-300 text-sm mt-1">{viewingDecision.context}</p>
                </div>
              )}

              {viewingDecision.outcome && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Label className="text-green-400 text-xs">Outcome</Label>
                  <p className="text-white text-sm mt-1">{viewingDecision.outcome}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-zinc-400 text-xs">Confidence</Label>
                  <p className="text-white">{viewingDecision.confidence}%</p>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Days Open</Label>
                  <p className="text-white">{viewingDecision.daysOpen}</p>
                </div>
                {viewingDecision.album && (
                  <div>
                    <Label className="text-zinc-400 text-xs">Album</Label>
                    <p className="text-white">{viewingDecision.album.name}</p>
                  </div>
                )}
                {viewingDecision.song && (
                  <div>
                    <Label className="text-zinc-400 text-xs">Song</Label>
                    <p className="text-white">{viewingDecision.song.title}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="border-t border-zinc-800 pt-4">
                <Label className="text-zinc-400 text-xs mb-2 block">Timeline</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-zinc-400">Proposed:</span>
                    <span className="text-white">
                      {new Date(viewingDecision.proposedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {viewingDecision.testedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <PlayCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-zinc-400">Testing started:</span>
                      <span className="text-white">
                        {new Date(viewingDecision.testedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {viewingDecision.lockedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-green-400" />
                      <span className="text-zinc-400">Locked:</span>
                      <span className="text-white">
                        {new Date(viewingDecision.lockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {viewingDecision.reopenedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <RotateCcw className="h-4 w-4 text-orange-400" />
                      <span className="text-zinc-400">Reopened:</span>
                      <span className="text-white">
                        {new Date(viewingDecision.reopenedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Close
            </Button>
            {viewingDecision && STATUS_FLOW[viewingDecision.status as keyof typeof STATUS_FLOW] && (
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  const flow = STATUS_FLOW[viewingDecision.status as keyof typeof STATUS_FLOW];
                  handleStatusTransition(viewingDecision, flow.next);
                }}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {STATUS_FLOW[viewingDecision.status as keyof typeof STATUS_FLOW].action}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
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
          All ({decisions.length})
        </Button>
        <Button
          variant={filter === 'proposed' ? 'default' : 'outline'}
          onClick={() => setFilter('proposed')}
          size="sm"
          className={filter !== 'proposed' ? 'border-blue-500/30' : ''}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Proposed ({statusCounts.proposed || 0})
        </Button>
        <Button
          variant={filter === 'testing' ? 'default' : 'outline'}
          onClick={() => setFilter('testing')}
          size="sm"
          className={filter !== 'testing' ? 'border-yellow-500/30' : ''}
        >
          <PlayCircle className="h-3 w-3 mr-1" />
          Testing ({statusCounts.testing || 0})
        </Button>
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          onClick={() => setFilter('locked')}
          size="sm"
          className={filter !== 'locked' ? 'border-green-500/30' : ''}
        >
          <Lock className="h-3 w-3 mr-1" />
          Locked ({statusCounts.locked || 0})
        </Button>
        <Button
          variant={filter === 'reopened' ? 'default' : 'outline'}
          onClick={() => setFilter('reopened')}
          size="sm"
          className={filter !== 'reopened' ? 'border-orange-500/30' : ''}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reopened ({statusCounts.reopened || 0})
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
          {filteredDecisions.map((decision) => {
            const StatusIcon = statusIcons[decision.status] || AlertCircle;
            const statusFlow = STATUS_FLOW[decision.status as keyof typeof STATUS_FLOW];

            return (
              <Card
                key={decision.id}
                className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => openDetailView(decision)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[decision.status] || 'bg-zinc-700'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                        {statusFlow && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusTransition(decision, statusFlow.next);
                              }}
                              className="cursor-pointer"
                            >
                              <statusFlow.icon className="h-4 w-4 mr-2" />
                              {statusFlow.action}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-700" />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailView(decision);
                          }}
                          className="cursor-pointer"
                        >
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {decision.context && (
                    <CardDescription className="text-zinc-400 mt-2 line-clamp-2">
                      {decision.context}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {decision.outcome && (
                      <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        {decision.outcome}
                      </div>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                      {decision.album && (
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Album className="h-3 w-3" />
                          <span className="text-xs">{decision.album.name}</span>
                        </div>
                      )}
                      {decision.song && (
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Music className="h-3 w-3" />
                          <span className="text-xs">{decision.song.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs">Confidence</span>
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${decision.confidence}%` }}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {decision.confidence}%
                        </span>
                      </div>
                      {decision.daysOpen > 0 && (
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{decision.daysOpen}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
