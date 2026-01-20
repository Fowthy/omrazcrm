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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  Plus,
  MoreVertical,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  Music,
  Waves,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StyleParameter {
  id: string;
  albumId: string;
  dimension: string;
  parameterName: string;
  startValue: string | null;
  endValue: string | null;
  currentState: string;
  evolutionNotes: string | null;
  locked: boolean;
  lockedAt: Date | null;
  album: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

const DIMENSIONS = [
  { value: 'musical', label: 'Musical', icon: Music, description: 'Tempo, key, time signatures' },
  { value: 'sonic', label: 'Sonic', icon: Waves, description: 'Tone, texture, effects' },
  { value: 'conceptual', label: 'Conceptual', icon: Lightbulb, description: 'Themes, emotions, narrative' },
];

const STATE_COLORS: Record<string, string> = {
  undecided: 'bg-zinc-500/20 text-zinc-400',
  exploring: 'bg-blue-500/20 text-blue-400',
  locked: 'bg-green-500/20 text-green-400',
};

const DIMENSION_COLORS: Record<string, string> = {
  musical: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  sonic: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  conceptual: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const EXAMPLE_PARAMETERS: Record<string, string[]> = {
  musical: ['Tempo Range', 'Key Palette', 'Time Signature', 'Harmonic Density', 'Melodic Style'],
  sonic: ['Distortion Level', 'Reverb Space', 'Brightness', 'Bass Presence', 'Compression'],
  conceptual: ['Intimacy', 'Energy', 'Narrative Arc', 'Mood Spectrum', 'Lyrical Density'],
};

export default function StyleParametersPage() {
  const { data: session } = useSession();
  const [parameters, setParameters] = useState<StyleParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<StyleParameter | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    albumId: '',
    dimension: 'musical',
    parameterName: '',
    startValue: '',
    endValue: '',
    currentState: 'undecided',
    evolutionNotes: '',
  });

  useEffect(() => {
    if (session?.user) {
      fetchParameters();
      fetchProjects();
    }
  }, [session]);

  const fetchParameters = async () => {
    try {
      const response = await fetch('/api/style-parameters');
      if (response.ok) {
        const data = await response.json();
        setParameters(data);
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
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
    if (!formData.parameterName.trim()) {
      toast.error('Please enter a parameter name');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/style-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: formData.albumId,
          dimension: formData.dimension,
          parameterName: formData.parameterName,
          startValue: formData.startValue || null,
          endValue: formData.endValue || null,
          currentState: formData.currentState,
          evolutionNotes: formData.evolutionNotes || null,
        }),
      });

      if (response.ok) {
        toast.success('Parameter created successfully');
        setDialogOpen(false);
        setFormData({
          albumId: '',
          dimension: 'musical',
          parameterName: '',
          startValue: '',
          endValue: '',
          currentState: 'undecided',
          evolutionNotes: '',
        });
        fetchParameters();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create parameter');
      }
    } catch (error) {
      console.error('Error creating parameter:', error);
      toast.error('Failed to create parameter');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (param: StyleParameter) => {
    setEditingParam(param);
    setFormData({
      albumId: param.albumId,
      dimension: param.dimension,
      parameterName: param.parameterName,
      startValue: param.startValue || '',
      endValue: param.endValue || '',
      currentState: param.currentState,
      evolutionNotes: param.evolutionNotes || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingParam) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/style-parameters/${editingParam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameterName: formData.parameterName,
          startValue: formData.startValue || null,
          endValue: formData.endValue || null,
          currentState: formData.currentState,
          evolutionNotes: formData.evolutionNotes || null,
        }),
      });

      if (response.ok) {
        toast.success('Parameter updated');
        setEditDialogOpen(false);
        setEditingParam(null);
        fetchParameters();
      } else {
        toast.error('Failed to update parameter');
      }
    } catch (error) {
      console.error('Error updating parameter:', error);
      toast.error('Failed to update parameter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (param: StyleParameter) => {
    try {
      const response = await fetch(`/api/style-parameters/${param.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locked: !param.locked,
          currentState: !param.locked ? 'locked' : 'exploring',
        }),
      });

      if (response.ok) {
        toast.success(param.locked ? 'Parameter unlocked' : 'Parameter locked');
        fetchParameters();
      } else {
        toast.error('Failed to update parameter');
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Failed to update parameter');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this parameter?')) return;

    try {
      const response = await fetch(`/api/style-parameters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Parameter deleted');
        fetchParameters();
      } else {
        toast.error('Failed to delete parameter');
      }
    } catch (error) {
      console.error('Error deleting parameter:', error);
      toast.error('Failed to delete parameter');
    }
  };

  const filteredParameters = selectedAlbum === 'all'
    ? parameters
    : parameters.filter(p => p.albumId === selectedAlbum);

  const groupedByDimension = DIMENSIONS.reduce((acc, dim) => {
    acc[dim.value] = filteredParameters.filter(p => p.dimension === dim.value);
    return acc;
  }, {} as Record<string, StyleParameter[]>);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading style parameters...</p>
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
            <Palette className="h-8 w-8 text-violet-400" />
            Style Parameters
          </h1>
          <p className="text-zinc-400 mt-1">
            Define the sonic and conceptual boundaries of your album
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Parameter
        </Button>
      </div>

      {/* New Parameter Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Style Parameter</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Define a creative parameter that shapes your album&apos;s identity.
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
              <Label className="text-zinc-300">Dimension</Label>
              <div className="grid grid-cols-3 gap-2">
                {DIMENSIONS.map((dim) => {
                  const Icon = dim.icon;
                  const isSelected = formData.dimension === dim.value;
                  return (
                    <button
                      key={dim.value}
                      onClick={() => setFormData({ ...formData, dimension: dim.value })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? `${DIMENSION_COLORS[dim.value]} border-current`
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">{dim.label}</p>
                    </button>
                  );
                })}
              </div>
              {formData.dimension && (
                <p className="text-xs text-zinc-500">
                  Examples: {EXAMPLE_PARAMETERS[formData.dimension].join(', ')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Parameter Name *</Label>
              <Input
                placeholder="e.g., Tempo Range, Distortion Level, Intimacy"
                className="bg-zinc-800 border-zinc-700 text-white"
                value={formData.parameterName}
                onChange={(e) =>
                  setFormData({ ...formData, parameterName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Start Value</Label>
                <Input
                  placeholder="e.g., 80 BPM, Low, Distant"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={formData.startValue}
                  onChange={(e) =>
                    setFormData({ ...formData, startValue: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">End Value (optional)</Label>
                <Input
                  placeholder="e.g., 140 BPM, High, Intimate"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={formData.endValue}
                  onChange={(e) =>
                    setFormData({ ...formData, endValue: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Current State</Label>
              <Select
                value={formData.currentState}
                onValueChange={(value) =>
                  setFormData({ ...formData, currentState: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="undecided">Undecided</SelectItem>
                  <SelectItem value="exploring">Exploring</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Evolution Notes</Label>
              <Textarea
                placeholder="How should this parameter evolve across the album?"
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={2}
                value={formData.evolutionNotes}
                onChange={(e) =>
                  setFormData({ ...formData, evolutionNotes: e.target.value })
                }
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
              {submitting ? 'Creating...' : 'Create Parameter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Parameter</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Parameter Name</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white"
                value={formData.parameterName}
                onChange={(e) =>
                  setFormData({ ...formData, parameterName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Start Value</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={formData.startValue}
                  onChange={(e) =>
                    setFormData({ ...formData, startValue: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">End Value</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={formData.endValue}
                  onChange={(e) =>
                    setFormData({ ...formData, endValue: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Current State</Label>
              <Select
                value={formData.currentState}
                onValueChange={(value) =>
                  setFormData({ ...formData, currentState: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="undecided">Undecided</SelectItem>
                  <SelectItem value="exploring">Exploring</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Evolution Notes</Label>
              <Textarea
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={2}
                value={formData.evolutionNotes}
                onChange={(e) =>
                  setFormData({ ...formData, evolutionNotes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Album Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-zinc-400">Filter by Album:</Label>
        <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
          <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="All Albums" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">All Albums</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parameters by Dimension */}
      {filteredParameters.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Palette className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No style parameters yet</p>
            <p className="text-zinc-500 text-sm mb-4">
              Define the sonic and conceptual boundaries of your album
            </p>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Parameter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="musical" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            {DIMENSIONS.map((dim) => (
              <TabsTrigger key={dim.value} value={dim.value} className="flex items-center gap-2">
                <dim.icon className="h-4 w-4" />
                {dim.label} ({groupedByDimension[dim.value]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          {DIMENSIONS.map((dim) => (
            <TabsContent key={dim.value} value={dim.value} className="space-y-4">
              <Card className={`border-l-4 ${DIMENSION_COLORS[dim.value].replace('bg-', 'border-').replace('/20', '')}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <dim.icon className={`h-5 w-5 ${DIMENSION_COLORS[dim.value].split(' ')[1]}`} />
                    <CardTitle className="text-lg text-white">{dim.label} Parameters</CardTitle>
                  </div>
                  <CardDescription className="text-zinc-400">
                    {dim.description}
                  </CardDescription>
                </CardHeader>
              </Card>

              {groupedByDimension[dim.value]?.length === 0 ? (
                <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-zinc-500">No {dim.label.toLowerCase()} parameters defined</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-zinc-700"
                      onClick={() => {
                        setFormData({ ...formData, dimension: dim.value });
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add {dim.label} Parameter
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedByDimension[dim.value]?.map((param) => (
                    <Card
                      key={param.id}
                      className={`bg-zinc-900/50 border-zinc-800 ${
                        param.locked ? 'border-green-500/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base text-white">
                                {param.parameterName}
                              </CardTitle>
                              {param.locked && (
                                <Lock className="h-4 w-4 text-green-400" />
                              )}
                            </div>
                            {param.album && (
                              <p className="text-xs text-zinc-500 mt-1">
                                {param.album.name}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                              <DropdownMenuItem
                                onClick={() => handleToggleLock(param)}
                                className="cursor-pointer"
                              >
                                {param.locked ? (
                                  <>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Unlock
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Lock
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(param)}
                                className="cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-zinc-700" />
                              <DropdownMenuItem
                                onClick={() => handleDelete(param.id)}
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
                        <div className="space-y-3">
                          {/* Value Range */}
                          {(param.startValue || param.endValue) && (
                            <div className="flex items-center gap-2 text-sm">
                              {param.startValue && (
                                <Badge variant="outline" className="bg-zinc-800">
                                  {param.startValue}
                                </Badge>
                              )}
                              {param.startValue && param.endValue && (
                                <ArrowRight className="h-4 w-4 text-zinc-500" />
                              )}
                              {param.endValue && (
                                <Badge variant="outline" className="bg-zinc-800">
                                  {param.endValue}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* State Badge */}
                          <Badge className={STATE_COLORS[param.currentState] || STATE_COLORS.undecided}>
                            {param.currentState}
                          </Badge>

                          {/* Evolution Notes */}
                          {param.evolutionNotes && (
                            <p className="text-xs text-zinc-400 line-clamp-2">
                              {param.evolutionNotes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
