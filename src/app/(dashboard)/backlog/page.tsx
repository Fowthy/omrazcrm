'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  GripVertical,
  Calendar,
  User,
  FolderKanban,
  Target,
} from 'lucide-react';
import { taskPriorities, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Task {
  id: string;
  key: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  project: { id: string; name: string; key: string } | null;
  epic: { id: string; key: string; title: string; color: string } | null;
  sprint: { id: string; name: string } | null;
}

const taskTypes = [
  { value: 'story', label: 'Story', icon: '📖' },
  { value: 'task', label: 'Task', icon: '✓' },
  { value: 'bug', label: 'Bug', icon: '🐛' },
  { value: 'recording', label: 'Recording', icon: '🎙️' },
  { value: 'mixing', label: 'Mixing', icon: '🎚️' },
  { value: 'mastering', label: 'Mastering', icon: '✨' },
  { value: 'writing', label: 'Writing', icon: '✍️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'live_show', label: 'Live Show', icon: '🎸' },
];

export default function BacklogPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Fetch tasks without a sprint (backlog items)
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['backlog-tasks', filterProject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterProject !== 'all') params.append('projectId', filterProject);
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const allTasks = await res.json();
      // Filter for backlog items (no sprint or sprint is null)
      return allTasks.filter((task: Task) => !task.sprint && task.status !== 'done');
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

  const { data: sprints } = useQuery({
    queryKey: ['sprints'],
    queryFn: async () => {
      const res = await fetch('/api/sprints');
      if (!res.ok) throw new Error('Failed to fetch sprints');
      return res.json();
    },
  });

  const assignToSprintMutation = useMutation({
    mutationFn: async ({ taskId, sprintId }: { taskId: string; sprintId: string }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId }),
      });
      if (!res.ok) throw new Error('Failed to assign task to sprint');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task assigned to sprint!');
    },
    onError: () => {
      toast.error('Failed to assign task');
    },
  });

  const updateStoryPointsMutation = useMutation({
    mutationFn: async ({ taskId, storyPoints }: { taskId: string; storyPoints: number }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyPoints }),
      });
      if (!res.ok) throw new Error('Failed to update story points');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-tasks'] });
      toast.success('Story points updated!');
    },
    onError: () => {
      toast.error('Failed to update story points');
    },
  });

  const filteredTasks = tasks?.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && task.type !== filterType) {
      return false;
    }
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }
    return true;
  }) || [];

  const totalPoints = filteredTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backlog</h1>
          <p className="text-muted-foreground mt-1">
            Prioritize and groom upcoming work • {filteredTasks.length} tasks • {totalPoints} points
          </p>
        </div>
        <Link href="/tasks">
          <Button variant="outline">
            <FolderKanban className="mr-2 h-4 w-4" />
            View Board
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {taskTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.icon} {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {taskPriorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No backlog items found</p>
            <p className="text-sm text-muted-foreground mt-2">
              All tasks are either in sprints or completed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <div className="flex items-start gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {task.key}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {taskTypes.find(t => t.value === task.type)?.icon}{' '}
                            {taskTypes.find(t => t.value === task.type)?.label}
                          </Badge>
                          <Badge
                            className={taskPriorities.find(p => p.value === task.priority)?.color}
                          >
                            {taskPriorities.find(p => p.value === task.priority)?.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          placeholder="SP"
                          value={task.storyPoints || ''}
                          onChange={(e) => {
                            const points = parseInt(e.target.value) || 0;
                            updateStoryPointsMutation.mutate({ taskId: task.id, storyPoints: points });
                          }}
                          className="w-16 text-center"
                          title="Story Points"
                        />
                        <Select
                          onValueChange={(sprintId) => {
                            assignToSprintMutation.mutate({ taskId: task.id, sprintId });
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Assign to sprint" />
                          </SelectTrigger>
                          <SelectContent>
                            {sprints?.filter((s: any) => s.status !== 'completed').map((sprint: any) => (
                              <SelectItem key={sprint.id} value={sprint.id}>
                                {sprint.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.epic && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: task.epic.color }}
                          />
                          <span>{task.epic.key}: {task.epic.title}</span>
                        </div>
                      )}
                      {task.project && (
                        <div className="flex items-center gap-1">
                          <FolderKanban className="h-4 w-4" />
                          <span>{task.project.name}</span>
                        </div>
                      )}
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.avatar || ''} />
                            <AvatarFallback>
                              {task.assignee.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignee.name}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
