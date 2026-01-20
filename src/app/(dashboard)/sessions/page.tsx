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
  CalendarDays,
  Plus,
  Clock,
  MoreVertical,
  Play,
  Square,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CreativeSession {
  id: string;
  albumId: string;
  date: Date;
  startTime: Date;
  endTime: Date | null;
  preSessionIntent: string | null;
  postSessionReflection: string | null;
  preSessionEnergy: number | null;
  postSessionEnergy: number | null;
  postSessionMomentum: string | null;
  stuckPoints: string | null;
  album: { name: string } | null;
  createdBy: { name: string; avatar: string | null } | null;
}

interface Project {
  id: string;
  name: string;
}

const momentumColors: Record<string, string> = {
  stalled: 'bg-red-500/20 text-red-400',
  slow: 'bg-orange-500/20 text-orange-400',
  steady: 'bg-blue-500/20 text-blue-400',
  flowing: 'bg-green-500/20 text-green-400',
  breakthrough: 'bg-purple-500/20 text-purple-400',
};

const momentumIcons: Record<string, any> = {
  stalled: AlertTriangle,
  slow: Clock,
  steady: TrendingUp,
  flowing: Zap,
  breakthrough: Sparkles,
};

const MOMENTUM_OPTIONS = [
  { value: 'stalled', label: 'Stalled', description: 'Stuck, no progress' },
  { value: 'slow', label: 'Slow', description: 'Some progress, but sluggish' },
  { value: 'steady', label: 'Steady', description: 'Good consistent progress' },
  { value: 'flowing', label: 'Flowing', description: 'Great flow, easy progress' },
  { value: 'breakthrough', label: 'Breakthrough', description: 'Major creative breakthrough!' },
];

export default function SessionsPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<CreativeSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // End session dialog state
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CreativeSession | null>(null);
  const [reflectionData, setReflectionData] = useState({
    postSessionReflection: '',
    postSessionEnergy: 3,
    postSessionMomentum: 'steady',
    stuckPoints: '',
  });

  // Detail view state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<CreativeSession | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    albumId: '',
    preSessionIntent: '',
    preSessionEnergy: 3,
  });

  useEffect(() => {
    if (session?.user) {
      fetchSessions();
      fetchProjects();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
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

  const handleSubmit = async () => {
    if (!formData.albumId) {
      toast.error('Please select an album');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: formData.albumId,
          date: now.toISOString(),
          startTime: now.toISOString(),
          preSessionIntent: formData.preSessionIntent || null,
          preSessionEnergy: formData.preSessionEnergy,
        }),
      });

      if (response.ok) {
        toast.success('Session started successfully');
        setDialogOpen(false);
        setFormData({
          albumId: '',
          preSessionIntent: '',
          preSessionEnergy: 3,
        });
        fetchSessions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally {
      setSubmitting(false);
    }
  };

  const openEndSessionDialog = (sess: CreativeSession) => {
    setSelectedSession(sess);
    setReflectionData({
      postSessionReflection: sess.postSessionReflection || '',
      postSessionEnergy: sess.postSessionEnergy || 3,
      postSessionMomentum: sess.postSessionMomentum || 'steady',
      stuckPoints: sess.stuckPoints || '',
    });
    setEndSessionDialogOpen(true);
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          postSessionReflection: reflectionData.postSessionReflection || null,
          postSessionEnergy: reflectionData.postSessionEnergy,
          postSessionMomentum: reflectionData.postSessionMomentum,
          stuckPoints: reflectionData.stuckPoints || null,
        }),
      });

      if (response.ok) {
        toast.success('Session ended successfully');
        setEndSessionDialogOpen(false);
        setSelectedSession(null);
        fetchSessions();
      } else {
        toast.error('Failed to end session');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Session deleted');
        fetchSessions();
      } else {
        toast.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const openDetailView = (sess: CreativeSession) => {
    setViewingSession(sess);
    setDetailDialogOpen(true);
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getSessionDurationMinutes = (start: Date, end: Date | null) => {
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - new Date(start).getTime();
    return Math.floor(duration / (1000 * 60));
  };

  // Separate active and completed sessions
  const activeSessions = sessions.filter((s) => !s.endTime);
  const completedSessions = sessions.filter((s) => s.endTime);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading sessions...</p>
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
            <CalendarDays className="h-8 w-8 text-violet-400" />
            Creative Sessions
          </h1>
          <p className="text-zinc-400 mt-1">
            Track your creative work with intent and reflection
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* New Session Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Start New Session</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Begin a creative session with intent. What do you plan to work on?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Album *</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) =>
                  setFormData({ ...formData, albumId: value })
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
              <Label className="text-zinc-300">Session Intent</Label>
              <Textarea
                placeholder="What do you plan to work on today?"
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={3}
                value={formData.preSessionIntent}
                onChange={(e) =>
                  setFormData({ ...formData, preSessionIntent: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-zinc-300">Energy Level</Label>
                <span className="text-zinc-400 text-sm">
                  {formData.preSessionEnergy}/5
                </span>
              </div>
              <Slider
                value={[formData.preSessionEnergy]}
                onValueChange={(value) =>
                  setFormData({ ...formData, preSessionEnergy: value[0] })
                }
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Low</span>
                <span>High</span>
              </div>
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
              {submitting ? 'Starting...' : 'Start Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Session Dialog */}
      <Dialog open={endSessionDialogOpen} onOpenChange={setEndSessionDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">End Session</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Reflect on your session. What happened? How do you feel?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSession && (
              <div className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {selectedSession.album?.name || 'Session'}
                    </p>
                    {selectedSession.preSessionIntent && (
                      <p className="text-zinc-400 text-sm mt-1">
                        Intent: {selectedSession.preSessionIntent}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400 text-sm">Duration</p>
                    <p className="text-white font-medium">
                      {getSessionDurationMinutes(selectedSession.startTime, null)} min
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-300">Reflection</Label>
              <Textarea
                placeholder="What did you work on? What did you accomplish?"
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={3}
                value={reflectionData.postSessionReflection}
                onChange={(e) =>
                  setReflectionData({ ...reflectionData, postSessionReflection: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-zinc-300">Energy Level After</Label>
                <span className="text-zinc-400 text-sm">
                  {reflectionData.postSessionEnergy}/5
                </span>
              </div>
              <Slider
                value={[reflectionData.postSessionEnergy]}
                onValueChange={(value) =>
                  setReflectionData({ ...reflectionData, postSessionEnergy: value[0] })
                }
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Drained</span>
                <span>Energized</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Momentum</Label>
              <div className="grid grid-cols-5 gap-2">
                {MOMENTUM_OPTIONS.map((option) => {
                  const Icon = momentumIcons[option.value];
                  const isSelected = reflectionData.postSessionMomentum === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setReflectionData({ ...reflectionData, postSessionMomentum: option.value })
                      }
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isSelected
                          ? `${momentumColors[option.value]} border-current`
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Stuck Points (optional)</Label>
              <Textarea
                placeholder="What blocked your progress? Any issues to note?"
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={2}
                value={reflectionData.stuckPoints}
                onChange={(e) =>
                  setReflectionData({ ...reflectionData, stuckPoints: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEndSessionDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndSession}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Square className="h-4 w-4 mr-2" />
              {submitting ? 'Ending...' : 'End Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Session Details</DialogTitle>
          </DialogHeader>

          {viewingSession && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-white">
                    {viewingSession.album?.name || 'Session'}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    {new Date(viewingSession.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Badge variant={viewingSession.endTime ? 'outline' : 'default'}>
                  {viewingSession.endTime ? (
                    formatDuration(viewingSession.startTime, viewingSession.endTime)
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Active
                    </>
                  )}
                </Badge>
              </div>

              {viewingSession.preSessionIntent && (
                <div>
                  <Label className="text-zinc-400 text-xs">Intent</Label>
                  <p className="text-zinc-300 text-sm mt-1">{viewingSession.preSessionIntent}</p>
                </div>
              )}

              {viewingSession.postSessionReflection && (
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <Label className="text-zinc-400 text-xs">Reflection</Label>
                  <p className="text-white text-sm mt-1">{viewingSession.postSessionReflection}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Energy Before</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${((viewingSession.preSessionEnergy || 3) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm">{viewingSession.preSessionEnergy || 3}/5</span>
                  </div>
                </div>
                {viewingSession.postSessionEnergy && (
                  <div>
                    <Label className="text-zinc-400 text-xs">Energy After</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(viewingSession.postSessionEnergy / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{viewingSession.postSessionEnergy}/5</span>
                    </div>
                  </div>
                )}
              </div>

              {viewingSession.postSessionMomentum && (
                <div>
                  <Label className="text-zinc-400 text-xs">Momentum</Label>
                  <div className="mt-1">
                    <Badge className={momentumColors[viewingSession.postSessionMomentum]}>
                      {momentumIcons[viewingSession.postSessionMomentum] && (
                        <>
                          {(() => {
                            const Icon = momentumIcons[viewingSession.postSessionMomentum];
                            return <Icon className="h-3 w-3 mr-1" />;
                          })()}
                        </>
                      )}
                      {viewingSession.postSessionMomentum}
                    </Badge>
                  </div>
                </div>
              )}

              {viewingSession.stuckPoints && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <Label className="text-red-400 text-xs">Stuck Points</Label>
                  <p className="text-zinc-300 text-sm mt-1">{viewingSession.stuckPoints}</p>
                </div>
              )}
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
            {viewingSession && !viewingSession.endTime && (
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  openEndSessionDialog(viewingSession);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Square className="h-4 w-4 mr-2" />
                End Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-green-400" />
            Active Sessions ({activeSessions.length})
          </h2>
          <div className="grid gap-4">
            {activeSessions.map((sess) => (
              <Card
                key={sess.id}
                className="bg-green-500/5 border-green-500/30 hover:border-green-500/50 transition-colors cursor-pointer"
                onClick={() => openDetailView(sess)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-400 animate-pulse">
                          <Play className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                        <span className="text-zinc-400 text-sm">
                          {getSessionDurationMinutes(sess.startTime, null)} min
                        </span>
                      </div>
                      <CardTitle className="text-lg text-white">
                        {sess.album?.name || 'Untitled Album'}
                      </CardTitle>
                      {sess.preSessionIntent && (
                        <CardDescription className="text-zinc-400 mt-2">
                          Intent: {sess.preSessionIntent}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEndSessionDialog(sess);
                          }}
                          className="cursor-pointer text-green-400"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          End Session
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-700" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(sess.id);
                          }}
                          className="cursor-pointer text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEndSessionDialog(sess);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Session & Reflect
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions */}
      <div className="space-y-4">
        {activeSessions.length > 0 && (
          <h2 className="text-lg font-semibold text-white">
            Previous Sessions ({completedSessions.length})
          </h2>
        )}

        {sessions.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-12 text-center">
              <CalendarDays className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg mb-2">No sessions yet</p>
              <p className="text-zinc-500 text-sm mb-4">
                Start tracking your creative sessions with intent and reflection
              </p>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start First Session
              </Button>
            </CardContent>
          </Card>
        ) : completedSessions.length === 0 && activeSessions.length > 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-8 text-center">
              <p className="text-zinc-400">
                Complete your active session to see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedSessions.map((sess) => {
              const MomentumIcon = sess.postSessionMomentum
                ? momentumIcons[sess.postSessionMomentum]
                : null;

              return (
                <Card
                  key={sess.id}
                  className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                  onClick={() => openDetailView(sess)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {new Date(sess.date).toLocaleDateString()}
                          </Badge>
                          {sess.postSessionMomentum && (
                            <Badge className={momentumColors[sess.postSessionMomentum]}>
                              {MomentumIcon && <MomentumIcon className="h-3 w-3 mr-1" />}
                              {sess.postSessionMomentum}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-white">
                          {sess.album?.name || 'Untitled Album'}
                        </CardTitle>
                        {sess.preSessionIntent && (
                          <CardDescription className="text-zinc-400 mt-2">
                            Intent: {sess.preSessionIntent}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDuration(sess.startTime, sess.endTime)}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailView(sess);
                              }}
                              className="cursor-pointer"
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-700" />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(sess.id);
                              }}
                              className="cursor-pointer text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  {sess.postSessionReflection && (
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-zinc-300">Reflection:</p>
                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {sess.postSessionReflection}
                        </p>
                        {sess.preSessionEnergy !== null && sess.postSessionEnergy !== null && (
                          <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">Energy:</span>
                              <span className="text-sm text-white">
                                {sess.preSessionEnergy}/5
                              </span>
                              <ArrowRight className="h-3 w-3 text-zinc-500" />
                              <span className="text-sm text-white">
                                {sess.postSessionEnergy}/5
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
