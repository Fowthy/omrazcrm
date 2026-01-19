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
import { Plus, Target, Calendar, Loader2, Trash2, Edit2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

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
  projectId: string | null;
  project: { id: string; name: string; key: string } | null;
  createdBy: { id: string; name: string; avatar: string | null } | null;
}

const epicStatuses = [
  { value: 'planning', label: 'Planning', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const epicColors = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#6366F1', '#A855F7', '#22C55E'
];

export default function EpicsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newEpic, setNewEpic] = useState({
    title: '',
    description: '',
    status: 'planning',
    color: '#8B5CF6',
    projectId: '',
    startDate: '',
    targetDate: '',
  });

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

  const createEpicMutation = useMutation({
    mutationFn: async (epic: typeof newEpic) => {
      const res = await fetch('/api/epics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epic),
      });
      if (!res.ok) throw new Error('Failed to create epic');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      toast.success('Epic created successfully!');
      setIsCreateDialogOpen(false);
      setNewEpic({
        title: '',
        description: '',
        status: 'planning',
        color: '#8B5CF6',
        projectId: '',
        startDate: '',
        targetDate: '',
      });
    },
    onError: () => {
      toast.error('Failed to create epic');
    },
  });

  const updateEpicMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Epic> & { id: string }) => {
      const res = await fetch(`/api/epics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update epic');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      toast.success('Epic updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedEpic(null);
    },
    onError: () => {
      toast.error('Failed to update epic');
    },
  });

  const deleteEpicMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/epics/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete epic');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      toast.success('Epic deleted successfully!');
      setIsEditDialogOpen(false);
      setSelectedEpic(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreateEpic = async () => {
    if (!newEpic.title.trim()) {
      toast.error('Epic title is required');
      return;
    }
    setIsCreating(true);
    await createEpicMutation.mutateAsync(newEpic);
    setIsCreating(false);
  };

  const handleUpdateEpic = async () => {
    if (!selectedEpic) return;
    await updateEpicMutation.mutateAsync(selectedEpic);
  };

  const filteredEpics = epics?.filter(epic => {
    if (filterStatus !== 'all' && epic.status !== filterStatus) return false;
    return true;
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Epics</h1>
          <p className="text-muted-foreground mt-1">
            Manage large initiatives and group related work
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Epic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Epic</DialogTitle>
              <DialogDescription>
                Create a large body of work to group related tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newEpic.title}
                  onChange={(e) => setNewEpic({ ...newEpic, title: e.target.value })}
                  placeholder="e.g., Album Release Campaign"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEpic.description}
                  onChange={(e) => setNewEpic({ ...newEpic, description: e.target.value })}
                  placeholder="Describe the epic's goals and scope..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={newEpic.projectId}
                    onValueChange={(value) => setNewEpic({ ...newEpic, projectId: value })}
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
                    value={newEpic.status}
                    onValueChange={(value) => setNewEpic({ ...newEpic, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {epicStatuses.map((status) => (
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
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newEpic.startDate}
                    onChange={(e) => setNewEpic({ ...newEpic, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newEpic.targetDate}
                    onChange={(e) => setNewEpic({ ...newEpic, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {epicColors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newEpic.color === color ? 'border-white ring-2 ring-offset-2' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewEpic({ ...newEpic, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEpic} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Epic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Epics Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredEpics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No epics found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first epic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEpics.map((epic) => (
            <Card
              key={epic.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedEpic(epic);
                setIsEditDialogOpen(true);
              }}
            >
              <CardHeader>
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
                    </div>
                    <CardTitle className="text-lg">{epic.title}</CardTitle>
                    {epic.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {epic.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={epicStatuses.find(s => s.value === epic.status)?.color}>
                    {epicStatuses.find(s => s.value === epic.status)?.label}
                  </Badge>
                  {epic.project && (
                    <Badge variant="outline">{epic.project.name}</Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{epic.progress}%</span>
                  </div>
                  <Progress value={epic.progress} className="h-2" />
                </div>

                {(epic.startDate || epic.targetDate) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {epic.startDate && formatDate(epic.startDate)}
                      {epic.startDate && epic.targetDate && ' → '}
                      {epic.targetDate && formatDate(epic.targetDate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Epic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Epic</DialogTitle>
            <DialogDescription>
              Update epic details and track progress
            </DialogDescription>
          </DialogHeader>
          {selectedEpic && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedEpic.title}
                  onChange={(e) => setSelectedEpic({ ...selectedEpic, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedEpic.description || ''}
                  onChange={(e) => setSelectedEpic({ ...selectedEpic, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedEpic.status}
                    onValueChange={(value) => setSelectedEpic({ ...selectedEpic, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {epicStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedEpic.progress}
                    onChange={(e) => setSelectedEpic({ ...selectedEpic, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={selectedEpic.startDate?.split('T')[0] || ''}
                    onChange={(e) => setSelectedEpic({ ...selectedEpic, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-targetDate">Target Date</Label>
                  <Input
                    id="edit-targetDate"
                    type="date"
                    value={selectedEpic.targetDate?.split('T')[0] || ''}
                    onChange={(e) => setSelectedEpic({ ...selectedEpic, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {epicColors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedEpic.color === color ? 'border-white ring-2 ring-offset-2' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedEpic({ ...selectedEpic, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="justify-between">
            <Button
              variant="destructive"
              onClick={() => selectedEpic && deleteEpicMutation.mutate(selectedEpic.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Epic
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEpic}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
