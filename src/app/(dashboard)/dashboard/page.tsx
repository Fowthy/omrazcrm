'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Music,
  CheckSquare,
  ListMusic,
  Plus,
  ArrowRight,
  Loader2,
  Sparkles,
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

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

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

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
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

  const isLoading = projectsLoading || songsLoading || tasksLoading || setlistsLoading;

  const stats = {
    projects: projects?.length || 0,
    songs: songs?.length || 0,
    tasks: tasks?.length || 0,
    setlists: setlists?.length || 0,
  };

  const recentProjects = projects?.slice(0, 3) || [];
  const pendingTasks = tasks?.filter(t => t.status !== 'done').slice(0, 5) || [];

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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-400',
      medium: 'text-blue-400',
      high: 'text-orange-400',
      urgent: 'text-red-400',
    };
    return colors[priority] || colors.medium;
  };

  const isEmpty = stats.projects === 0 && stats.songs === 0 && stats.tasks === 0;

  return (
    <div className="space-y-6" data-onboarding="welcome">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Welcome back! Here&apos;s what&apos;s happening with your band.
          </p>
        </div>

        <div className="flex gap-2" data-onboarding="quick-actions">
          <Link href="/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
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
              Your studio is empty. Create your first project to start organizing your music,
              tracking tasks, and collaborating with your band.
            </p>
            <div className="flex gap-3">
              <Link href="/projects">
                <Button size="lg">
                  <FolderKanban className="mr-2 h-5 w-5" />
                  Create First Project
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="outline" size="lg">
                  <CheckSquare className="mr-2 h-5 w-5" />
                  Add Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/projects">
              <Card className="transition-colors hover:border-violet-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Projects
                  </CardTitle>
                  <FolderKanban className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.projects}</div>
                  <p className="text-xs text-zinc-500">
                    Albums, EPs & singles
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
                    Across all projects
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tasks">
              <Card className="transition-colors hover:border-green-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Open Tasks
                  </CardTitle>
                  <CheckSquare className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {tasks?.filter(t => t.status !== 'done').length || 0}
                  </div>
                  <p className="text-xs text-zinc-500">
                    To be completed
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/setlists">
              <Card className="transition-colors hover:border-orange-500/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Setlists
                  </CardTitle>
                  <ListMusic className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.setlists}</div>
                  <p className="text-xs text-zinc-500">
                    For shows & rehearsals
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Projects</CardTitle>
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
                    <p className="text-sm text-zinc-500">No projects yet</p>
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

            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pending Tasks</CardTitle>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {pendingTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckSquare className="h-10 w-10 text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-500">No pending tasks</p>
                    <Link href="/tasks">
                      <Button variant="link" size="sm">Add one</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"
                      >
                        <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority).replace('text-', 'bg-')}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">
                            {task.title}
                          </h4>
                          {task.dueDate && (
                            <p className="text-xs text-zinc-500">
                              Due {formatDate(task.dueDate)}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
