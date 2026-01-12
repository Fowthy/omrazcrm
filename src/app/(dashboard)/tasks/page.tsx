'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Calendar,
  Flag,
  GripVertical,
  Loader2,
  CheckSquare,
  FolderKanban,
  Music,
} from 'lucide-react';
import { taskStatuses, taskPriorities, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; avatar: string | null } | null;
  project: { id: string; name: string } | null;
  song: { id: string; title: string } | null;
  subtasks: { id: string; title: string; completed: boolean }[];
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-zinc-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    projectId: '',
    dueDate: '',
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
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

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          projectId: newTask.projectId || null,
          dueDate: newTask.dueDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task');

      toast.success('Task created!');
      setIsCreateDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        projectId: '',
        dueDate: '',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const getTasksByStatus = (status: string) =>
    tasks?.filter((task) => task.status === status) || [];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-400',
      medium: 'text-blue-400',
      high: 'text-orange-400',
      urgent: 'text-red-400',
    };
    return colors[priority] || colors.medium;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskMutation.mutate({ id: taskId, status });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-onboarding="tasks-header">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="mt-1 text-zinc-400">
            Manage band tasks and track progress
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-onboarding="create-task">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your board
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task details..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskPriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select
                  value={newTask.projectId || 'none'}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, projectId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projectsList?.map((project: { id: string; name: string }) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Card className="border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <span className={`h-2 w-2 rounded-full ${column.color}`} />
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">
                      {getTasksByStatus(column.id).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {getTasksByStatus(column.id).map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-grab border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {task.project && (
                                <Badge variant="secondary" className="text-xs">
                                  <FolderKanban className="mr-1 h-3 w-3" />
                                  {task.project.name}
                                </Badge>
                              )}
                              {task.song && (
                                <Badge variant="secondary" className="text-xs">
                                  <Music className="mr-1 h-3 w-3" />
                                  {task.song.title}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Flag
                                  className={`h-3 w-3 ${getPriorityColor(task.priority)}`}
                                />
                                {task.dueDate && (
                                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>

                              {task.assignee && (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={task.assignee.avatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {task.assignee.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>

                            {task.subtasks.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                                <CheckSquare className="h-3 w-3" />
                                {task.subtasks.filter((s) => s.completed).length}/
                                {task.subtasks.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {getTasksByStatus(column.id).length === 0 && (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
                      No tasks
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
