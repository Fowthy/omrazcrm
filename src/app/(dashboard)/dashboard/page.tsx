'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Music,
  GitBranch,
  CalendarDays,
  ListMusic,
  Plus,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
  AlertTriangle,
  Clock,
  Lock,
  PlayCircle,
  Activity,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  status: string;
  type: string;
  updatedAt: string;
  songCount: number;
}

interface Decision {
  id: string;
  question: string;
  status: string;
  decisionType: string;
  confidence: number;
  proposedAt: string;
  album: { name: string } | null;
  song: { title: string } | null;
}

interface CreativeSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  preSessionIntent: string | null;
  postSessionReflection: string | null;
  postSessionMomentum: string | null;
  postSessionEnergy: number | null;
  preSessionEnergy: number | null;
  album: { name: string } | null;
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

const statusColors: Record<string, string> = {
  proposed: 'bg-blue-500/20 text-blue-400',
  testing: 'bg-yellow-500/20 text-yellow-400',
  locked: 'bg-green-500/20 text-green-400',
  reopened: 'bg-orange-500/20 text-orange-400',
};

const statusIcons: Record<string, any> = {
  proposed: AlertTriangle,
  testing: PlayCircle,
  locked: Lock,
  reopened: Activity,
};

export default function DashboardPage() {
  // Fetch real stats from APIs
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: songs, isLoading: songsLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: decisions, isLoading: decisionsLoading } = useQuery<Decision[]>({
    queryKey: ['decisions'],
    queryFn: async () => {
      const res = await fetch('/api/decisions');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<CreativeSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await fetch('/api/sessions');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: setlists, isLoading: setlistsLoading } = useQuery({
    queryKey: ['setlists'],
    queryFn: async () => {
      const res = await fetch('/api/setlists');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const isLoading = projectsLoading || songsLoading || decisionsLoading || sessionsLoading || setlistsLoading;

  // Calculate stats
  const openDecisions = decisions?.filter(d => d.status !== 'locked').length || 0;
  const lockedDecisions = decisions?.filter(d => d.status === 'locked').length || 0;
  const recentSessions = sessions?.filter(s => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }) || [];

  // Calculate momentum distribution
  const momentumCounts = recentSessions
    .filter(s => s.postSessionMomentum)
    .reduce((acc, s) => {
      acc[s.postSessionMomentum!] = (acc[s.postSessionMomentum!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Calculate average energy
  const avgEnergy = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.postSessionEnergy || s.preSessionEnergy || 3), 0) / recentSessions.length
    : 0;

  // Determine overall momentum
  const getOverallMomentum = () => {
    if (recentSessions.length === 0) return null;
    const momenta = ['stalled', 'slow', 'steady', 'flowing', 'breakthrough'];
    let maxCount = 0;
    let dominantMomentum = 'steady';
    momenta.forEach(m => {
      if ((momentumCounts[m] || 0) > maxCount) {
        maxCount = momentumCounts[m] || 0;
        dominantMomentum = m;
      }
    });
    return dominantMomentum;
  };

  const overallMomentum = getOverallMomentum();

  const stats = {
    projects: projects?.length || 0,
    songs: songs?.length || 0,
    openDecisions,
    lockedDecisions,
    sessionsThisWeek: recentSessions.length,
    setlists: setlists?.length || 0,
  };

  const recentProjects = projects?.slice(0, 3) || [];
  const recentDecisions = decisions?.filter(d => d.status !== 'locked').slice(0, 5) || [];
  const latestSessions = sessions?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-gray-500/20 text-gray-400',
      writing: 'bg-blue-500/20 text-blue-400',
      recording: 'bg-yellow-500/20 text-yellow-400',
      mixing: 'bg-orange-500/20 text-orange-400',
      mastering: 'bg-purple-500/20 text-purple-400',
      released: 'bg-green-500/20 text-green-400',
    };
    return colors[status] || colors.idea;
  };

  const isEmpty = stats.projects === 0 && stats.songs === 0;

  return (
    <div className="space-y-6" data-onboarding="welcome">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Welcome back! Here&apos;s your creative momentum.
          </p>
        </div>

        <div className="flex gap-2" data-onboarding="quick-actions">
          <Link href="/sessions">
            <Button variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Start Session
            </Button>
          </Link>
          <Link href="/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Album
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : isEmpty ? (
        /* Empty State for New Users */
        <Card className="border-dashed border-2 border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/20 to-cyan-600/20 mb-4">
              <Sparkles className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Let&apos;s Get Started!
            </h3>
            <p className="text-zinc-400 text-center max-w-md mb-6">
              Your creative space is empty. Create your first album to start making decisions,
              tracking sessions, and building your music.
            </p>
            <div className="flex gap-3">
              <Link href="/projects">
                <Button size="lg">
                  <FolderKanban className="mr-2 h-5 w-5" />
                  Create First Album
                </Button>
              </Link>
              <Link href="/decisions">
                <Button variant="outline" size="lg">
                  <GitBranch className="mr-2 h-5 w-5" />
                  Make a Decision
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Momentum Overview Card */}
          {recentSessions.length > 0 && overallMomentum && (
            <Card className={`border-l-4 ${momentumColors[overallMomentum].replace('bg-', 'border-').replace('/20', '')}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${momentumColors[overallMomentum]}`}>
                      {(() => {
                        const Icon = momentumIcons[overallMomentum];
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">This Week&apos;s Momentum</p>
                      <p className="text-xl font-bold text-white capitalize">{overallMomentum}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{recentSessions.length}</p>
                      <p className="text-xs text-zinc-400">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{avgEnergy.toFixed(1)}</p>
                      <p className="text-xs text-zinc-400">Avg Energy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{lockedDecisions}</p>
                      <p className="text-xs text-zinc-400">Locked</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/projects">
              <Card className="transition-colors hover:border-violet-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Albums
                  </CardTitle>
                  <FolderKanban className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.projects}</div>
                  <p className="text-xs text-zinc-500">
                    Creative projects
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/songs">
              <Card className="transition-colors hover:border-cyan-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Songs
                  </CardTitle>
                  <Music className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.songs}</div>
                  <p className="text-xs text-zinc-500">
                    Across all albums
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/decisions">
              <Card className="transition-colors hover:border-green-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Open Decisions
                  </CardTitle>
                  <GitBranch className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.openDecisions}</div>
                  <p className="text-xs text-zinc-500">
                    Awaiting resolution
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sessions">
              <Card className="transition-colors hover:border-orange-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Sessions This Week
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.sessionsThisWeek}</div>
                  <p className="text-xs text-zinc-500">
                    Creative sessions
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Open Decisions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Open Decisions</CardTitle>
                  <Link href="/decisions">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>Creative decisions awaiting resolution</CardDescription>
              </CardHeader>
              <CardContent>
                {recentDecisions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <GitBranch className="h-10 w-10 text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-500">No open decisions</p>
                    <Link href="/decisions">
                      <Button variant="link" size="sm">Create one</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDecisions.map((decision) => {
                      const StatusIcon = statusIcons[decision.status] || AlertTriangle;
                      return (
                        <Link
                          key={decision.id}
                          href="/decisions"
                          className="block"
                        >
                          <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-zinc-800/50">
                            <div className={`p-2 rounded-lg ${statusColors[decision.status] || 'bg-zinc-700'}`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm truncate">
                                {decision.question}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                {decision.album?.name || 'No album'}
                                {decision.song && ` • ${decision.song.title}`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className={statusColors[decision.status]}>
                                {decision.status}
                              </Badge>
                              <span className="text-xs text-zinc-500">
                                {decision.confidence}% confident
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Sessions</CardTitle>
                  <Link href="/sessions">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>Your creative work sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {latestSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarDays className="h-10 w-10 text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-500">No sessions yet</p>
                    <Link href="/sessions">
                      <Button variant="link" size="sm">Start one</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {latestSessions.map((session) => {
                      const MomentumIcon = session.postSessionMomentum
                        ? momentumIcons[session.postSessionMomentum]
                        : Clock;
                      const isActive = !session.endTime;
                      return (
                        <Link
                          key={session.id}
                          href="/sessions"
                          className="block"
                        >
                          <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-zinc-800/50">
                            <div className={`p-2 rounded-lg ${
                              isActive
                                ? 'bg-green-500/20 text-green-400'
                                : session.postSessionMomentum
                                  ? momentumColors[session.postSessionMomentum]
                                  : 'bg-zinc-700'
                            }`}>
                              {isActive ? (
                                <PlayCircle className="h-4 w-4" />
                              ) : (
                                <MomentumIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm truncate">
                                {session.album?.name || 'Session'}
                              </h4>
                              <p className="text-xs text-zinc-500 truncate">
                                {session.preSessionIntent || 'No intent recorded'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {isActive ? (
                                <Badge className="bg-green-500/20 text-green-400 animate-pulse">
                                  Active
                                </Badge>
                              ) : session.postSessionMomentum ? (
                                <Badge className={momentumColors[session.postSessionMomentum]}>
                                  {session.postSessionMomentum}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Completed</Badge>
                              )}
                              <span className="text-xs text-zinc-500">
                                {formatDate(session.date)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom row: Recent Projects and Quick Links */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Albums</CardTitle>
                  <Link href="/projects">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FolderKanban className="h-10 w-10 text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-500">No albums yet</p>
                    <Link href="/projects">
                      <Button variant="link" size="sm">Create one</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-zinc-800/50">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-cyan-600/20">
                            <FolderKanban className="h-5 w-5 text-violet-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">
                              {project.name}
                            </h4>
                            <p className="text-sm text-zinc-500">
                              {project.songCount} songs • {project.type}
                            </p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Jump into your creative flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/sessions">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <CalendarDays className="h-6 w-6 text-orange-400" />
                      <span>Start Session</span>
                    </Button>
                  </Link>
                  <Link href="/decisions">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <GitBranch className="h-6 w-6 text-green-400" />
                      <span>New Decision</span>
                    </Button>
                  </Link>
                  <Link href="/notes">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Music className="h-6 w-6 text-cyan-400" />
                      <span>Add Note</span>
                    </Button>
                  </Link>
                  <Link href="/timeline">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Activity className="h-6 w-6 text-violet-400" />
                      <span>Timeline</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
