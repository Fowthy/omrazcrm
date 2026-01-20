'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Zap, Calendar, Loader2, Trash2, PlayCircle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string;
  endDate: string;
  projectId: string | null;
  project: { id: string; name: string; key: string } | null;
  taskCount: number;
  completedTaskCount: number;
  totalPoints: number;
  completedPoints: number;
}

const sprintStatuses = [
  { value: 'planning', label: 'Planning', color: 'bg-gray-500', icon: Calendar },
  { value: 'active', label: 'Active', color: 'bg-blue-500', icon: PlayCircle },
  { value: 'completed', label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
];

export default function SprintsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    projectId: '',
  });

  const { data: sprints, isLoading } = useQuery<Sprint[]>({
    queryKey: ['sprints', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await fetch(`/api/sprints?${params}`);
      if (!res.ok) throw new Error('Failed to fetch sprints');
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

  const createSprintMutation = useMutation({
    mutationFn: async (sprint: typeof newSprint) => {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sprint),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create sprint');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint created successfully!');
      setIsCreateDialogOpen(false);
      setNewSprint({
        name: '',
        goal: '',
        status: 'planning',
        startDate: '',
        endDate: '',
        projectId: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sprint> & { id: string }) => {
      const res = await fetch(`/api/sprints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update sprint');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedSprint(null);
    },
    onError: () => {
      toast.error('Failed to update sprint');
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sprints/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete sprint');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint deleted successfully!');
      setIsEditDialogOpen(false);
      setSelectedSprint(null);
    },
    onError: () => {
      toast.error('Failed to delete sprint');
    },
  });

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) {
      toast.error('Sprint name is required');
      return;
    }
    if (!newSprint.startDate || !newSprint.endDate) {
      toast.error('Start and end dates are required');
      return;
    }
    try {
      await createSprintMutation.mutateAsync(newSprint);
    } catch (error) {
      // Error already handled by onError in mutation
    }
  };

  const handleUpdateSprint = async () => {
    if (!selectedSprint) return;
    await updateSprintMutation.mutateAsync(selectedSprint);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sprints</h1>
          <p className="text-muted-foreground mt-1">
            Plan and track time-boxed work iterations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Create a time-boxed iteration for focused work
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Sprint Name *</Label>
                <Input
                  id="name"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  placeholder="e.g., Recording Sprint 1"
                />
              </div>
              <div>
                <Label htmlFor="goal">Sprint Goal</Label>
                <Textarea
                  id="goal"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  placeholder="What do you want to achieve in this sprint?"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={newSprint.projectId}
                    onValueChange={(value) => setNewSprint({ ...newSprint, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {projectsList?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newSprint.status}
                    onValueChange={(value) => setNewSprint({ ...newSprint, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sprintStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint} disabled={createSprintMutation.isPending}>
                {createSprintMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Sprint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {sprintStatuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sprints Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !sprints || sprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No sprints found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map((sprint) => {
            const StatusIcon = sprintStatuses.find(s => s.value === sprint.status)?.icon || Zap;
            const daysRemaining = getDaysRemaining(sprint.endDate);
            const velocity = sprint.totalPoints > 0
              ? Math.round((sprint.completedPoints / sprint.totalPoints) * 100)
              : 0;

            return (
              <Card
                key={sprint.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setIsEditDialogOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge className={sprintStatuses.find(s => s.value === sprint.status)?.color}>
                          {sprintStatuses.find(s => s.value === sprint.status)?.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{sprint.name}</CardTitle>
                      {sprint.goal && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {sprint.goal}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sprint.project && (
                    <Badge variant="outline">{sprint.project.name}</Badge>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tasks</p>
                      <p className="text-lg font-semibold">
                        {sprint.completedTaskCount}/{sprint.taskCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Points</p>
                      <p className="text-lg font-semibold">
                        {sprint.completedPoints}/{sprint.totalPoints}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Velocity</span>
                      <span className="font-medium">{velocity}%</span>
                    </div>
                    <Progress value={velocity} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                    </span>
                  </div>

                  {sprint.status === 'active' && (
                    <div className="text-sm">
                      {daysRemaining > 0 ? (
                        <span className="text-blue-600 font-medium">
                          {daysRemaining} days remaining
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Overdue by {Math.abs(daysRemaining)} days
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Sprint Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
            <DialogDescription>
              Update sprint details and track progress
            </DialogDescription>
          </DialogHeader>
          {selectedSprint && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Sprint Name</Label>
                <Input
                  id="edit-name"
                  value={selectedSprint.name}
                  onChange={(e) => setSelectedSprint({ ...selectedSprint, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-goal">Sprint Goal</Label>
                <Textarea
                  id="edit-goal"
                  value={selectedSprint.goal || ''}
                  onChange={(e) => setSelectedSprint({ ...selectedSprint, goal: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedSprint.status}
                  onValueChange={(value) => setSelectedSprint({ ...selectedSprint, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sprintStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={selectedSprint.startDate.split('T')[0]}
                    onChange={(e) => setSelectedSprint({ ...selectedSprint, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={selectedSprint.endDate.split('T')[0]}
                    onChange={(e) => setSelectedSprint({ ...selectedSprint, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Sprint Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Tasks</p>
                    <p className="text-xl font-bold">{selectedSprint.taskCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold">{selectedSprint.completedTaskCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Points</p>
                    <p className="text-xl font-bold">{selectedSprint.totalPoints}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed Points</p>
                    <p className="text-xl font-bold">{selectedSprint.completedPoints}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="justify-between">
            <Button
              variant="destructive"
              onClick={() => selectedSprint && deleteSprintMutation.mutate(selectedSprint.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Sprint
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSprint}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
