'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, Target } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface Epic {
  id: string;
  key: string;
  title: string;
  description: string | null;
  status: string;
  color: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  progress: number;
  project: { id: string; name: string; key: string } | null;
}

const epicStatuses = [
  { value: 'planning', label: 'Planning', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export default function RoadmapPage() {
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const { data: epics, isLoading } = useQuery<Epic[]>({
    queryKey: ['epics', filterProject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== 'all') params.append('projectId', filterProject);
      const res = await fetch(`/api/epics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch epics');
      return res.json();
    },
  });

  const { data: projectsList } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const filteredEpics = epics?.filter(epic => {
    if (filterStatus !== 'all' && epic.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    const dateA = a.startDate || a.targetDate;
    const dateB = b.startDate || b.targetDate;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  }) || [];

  // Calculate timeline range
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const sixMonthsFromNow = new Date(now);
  sixMonthsFromNow.setMonth(now.getMonth() + 6);

  const getPositionOnTimeline = (date: string | null) => {
    if (!date) return 50;
    const d = new Date(date);
    const total = sixMonthsFromNow.getTime() - threeMonthsAgo.getTime();
    const offset = d.getTime() - threeMonthsAgo.getTime();
    return Math.max(0, Math.min(100, (offset / total) * 100));
  };

  const getTimelineWidth = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 10;
    const start = getPositionOnTimeline(startDate);
    const end = getPositionOnTimeline(endDate);
    return Math.max(5, end - start);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roadmap</h1>
          <p className="text-muted-foreground mt-1">
            Visualize epics and milestones on a timeline
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projectsList?.map((project: any) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {epicStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredEpics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No epics to display on roadmap</p>
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-4">
          {/* Timeline Header */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{threeMonthsAgo.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                <span>Today</span>
                <span>{sixMonthsFromNow.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-2 bg-muted rounded-full">
                <div
                  className="absolute top-0 w-0.5 h-4 bg-red-500 -mt-1"
                  style={{ left: `${getPositionOnTimeline(now.toISOString())}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Epics on Timeline */}
          <div className="space-y-2">
            {filteredEpics.map((epic) => {
              const hasTimeline = epic.startDate && epic.targetDate;
              const leftPosition = hasTimeline ? getPositionOnTimeline(epic.startDate) : 45;
              const width = hasTimeline ? getTimelineWidth(epic.startDate, epic.targetDate) : 10;

              return (
                <Card key={epic.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: epic.color }}
                          />
                          <Badge variant="outline" className="text-xs">
                            {epic.key}
                          </Badge>
                          <Badge className={epicStatuses.find(s => s.value === epic.status)?.color}>
                            {epicStatuses.find(s => s.value === epic.status)?.label}
                          </Badge>
                          {epic.project && (
                            <Badge variant="outline">{epic.project.name}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{epic.title}</h3>
                        {epic.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {epic.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right min-w-[120px]">
                        <div className="text-sm text-muted-foreground mb-1">
                          Progress: {epic.progress}%
                        </div>
                        <Progress value={epic.progress} className="h-2 w-24" />
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="mt-4 relative h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full rounded-full flex items-center px-2 text-xs text-white font-medium"
                        style={{
                          backgroundColor: epic.color,
                          left: `${leftPosition}%`,
                          width: `${width}%`,
                          minWidth: '60px',
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {hasTimeline && (
                            <>
                              <Calendar className="h-3 w-3" />
                              <span className="truncate">
                                {formatDate(epic.startDate!)} → {formatDate(epic.targetDate!)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredEpics.map((epic) => (
            <Card key={epic.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: epic.color }}
                      />
                      <Badge variant="outline" className="text-xs">
                        {epic.key}
                      </Badge>
                      <Badge className={epicStatuses.find(s => s.value === epic.status)?.color}>
                        {epicStatuses.find(s => s.value === epic.status)?.label}
                      </Badge>
                      {epic.project && (
                        <Badge variant="outline">{epic.project.name}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{epic.title}</CardTitle>
                    {epic.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {epic.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Start Date</p>
                    <p className="font-medium">
                      {epic.startDate ? formatDate(epic.startDate) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Target Date</p>
                    <p className="font-medium">
                      {epic.targetDate ? formatDate(epic.targetDate) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={epic.progress} className="h-2 flex-1" />
                      <span className="font-medium">{epic.progress}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
