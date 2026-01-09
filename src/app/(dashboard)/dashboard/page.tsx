'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Music,
  FolderKanban,
  ListMusic,
  CalendarDays,
  CheckSquare,
  Plus,
  Clock,
  TrendingUp,
  PlayCircle,
  Mic2,
  ArrowRight,
} from 'lucide-react';

// Mock data for demonstration
const stats = [
  { label: 'Active Projects', value: '3', icon: FolderKanban, href: '/projects', change: '+1 this week' },
  { label: 'Total Songs', value: '24', icon: Music, href: '/songs', change: '+3 this month' },
  { label: 'Upcoming Rehearsals', value: '2', icon: CalendarDays, href: '/rehearsals', change: 'Next: Tomorrow' },
  { label: 'Open Tasks', value: '12', icon: CheckSquare, href: '/tasks', change: '5 high priority' },
];

const recentProjects = [
  { id: '1', name: 'New Album 2024', type: 'Album', status: 'recording', progress: 45 },
  { id: '2', name: 'Summer Single', type: 'Single', status: 'mixing', progress: 80 },
  { id: '3', name: 'Live Session EP', type: 'EP', status: 'idea', progress: 10 },
];

const upcomingEvents = [
  { id: '1', title: 'Band Rehearsal', type: 'rehearsal', date: 'Tomorrow, 7:00 PM', location: 'Studio A' },
  { id: '2', title: 'Live Show @ The Venue', type: 'show', date: 'Jan 15, 8:00 PM', location: 'Downtown' },
  { id: '3', title: 'Recording Session', type: 'recording', date: 'Jan 18, 2:00 PM', location: 'Red Room Studios' },
];

const recentActivity = [
  { id: '1', user: 'Alex', action: 'uploaded new mix', target: 'Midnight Dreams', time: '2 hours ago' },
  { id: '2', user: 'Sam', action: 'commented on', target: 'Guitar Solo v2', time: '5 hours ago' },
  { id: '3', user: 'Jordan', action: 'created task', target: 'Finalize album artwork', time: 'Yesterday' },
  { id: '4', user: 'Taylor', action: 'updated lyrics for', target: 'Breaking Through', time: '2 days ago' },
];

const quickActions = [
  { label: 'New Project', href: '/projects/new', icon: FolderKanban },
  { label: 'Add Song', href: '/songs/new', icon: Music },
  { label: 'Create Task', href: '/tasks/new', icon: CheckSquare },
  { label: 'Schedule Rehearsal', href: '/rehearsals/new', icon: CalendarDays },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-gray-500',
      writing: 'bg-blue-500',
      recording: 'bg-yellow-500',
      mixing: 'bg-orange-500',
      mastering: 'bg-purple-500',
      released: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-zinc-400">
            Here&apos;s what&apos;s happening with Omraz today.
          </p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Button key={action.href} asChild variant="outline" size="sm">
              <Link href={action.href}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <p className="mt-1 text-xs text-zinc-500">{stat.change}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Your current work in progress</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                      <FolderKanban className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">{project.type}</span>
                        <Badge variant="secondary" className="text-xs">
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${getStatusColor(project.status)}`} />
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">{project.progress}%</span>
                    <Progress value={project.progress} className="mt-1 w-24" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Events & sessions</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/calendar">
                <CalendarDays className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 p-3"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  event.type === 'rehearsal' ? 'bg-blue-600/20' :
                  event.type === 'show' ? 'bg-green-600/20' : 'bg-orange-600/20'
                }`}>
                  {event.type === 'rehearsal' ? (
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                  ) : event.type === 'show' ? (
                    <Mic2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{event.title}</h4>
                  <p className="text-sm text-zinc-400">{event.date}</p>
                  <p className="text-xs text-zinc-500">{event.location}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>What&apos;s been happening in the studio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-600/20 text-violet-400 text-xs">
                    {activity.user[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="font-medium text-violet-400">{activity.target}</span>
                  </p>
                </div>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Now Playing / Quick Player Preview */}
      <Card className="border-violet-500/20 bg-gradient-to-r from-violet-950/50 to-cyan-950/50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
              <Music className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Ready to create?</h3>
              <p className="text-sm text-zinc-400">
                Upload your latest mix or start a new project
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/songs/new">
                <Plus className="mr-2 h-4 w-4" />
                Upload Song
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
