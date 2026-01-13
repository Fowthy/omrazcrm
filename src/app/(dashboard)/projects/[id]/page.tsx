'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Music,
  FileAudio,
  Calendar,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  Clock,
  FolderKanban,
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { projectStatuses, projectTypes, songStatuses, formatDate, formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  coverImage: string | null;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; avatar: string | null } | null;
}

interface Song {
  id: string;
  title: string;
  status: string;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  trackNumber: number | null;
  createdAt: string;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  path: string;
  description: string | null;
  createdAt: string;
  uploadedBy: { name: string; avatar: string | null } | null;
  currentVersion: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    type: 'album',
    status: 'idea',
  });

  const [newSong, setNewSong] = useState({
    title: '',
    status: 'idea',
    bpm: '',
    musicalKey: '',
  });

  // Fetch project
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
  });

  // Fetch songs for this project
  const { data: songs, isLoading: songsLoading } = useQuery<Song[]>({
    queryKey: ['songs', { projectId }],
    queryFn: async () => {
      const res = await fetch(`/api/songs?projectId=${projectId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch files for this project
  const { data: files, isLoading: filesLoading } = useQuery<FileItem[]>({
    queryKey: ['files', { projectId }],
    queryFn: async () => {
      const res = await fetch(`/api/files?projectId=${projectId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Initialize edit form when project loads
  if (project && !editForm.name && project.name !== editForm.name) {
    setEditForm({
      name: project.name,
      description: project.description || '',
      type: project.type,
      status: project.status,
    });
  }

  const handleUpdateProject = async () => {
    if (!editForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update project');

      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete project');

      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted!');
      router.push('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSong = async () => {
    if (!newSong.title.trim()) {
      toast.error('Song title is required');
      return;
    }

    setIsAddingSong(true);
    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSong,
          projectId,
          bpm: newSong.bpm ? parseInt(newSong.bpm) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to add song');

      await queryClient.invalidateQueries({ queryKey: ['songs', { projectId }] });
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song added!');
      setIsAddSongDialogOpen(false);
      setNewSong({ title: '', status: 'idea', bpm: '', musicalKey: '' });
    } catch (error) {
      toast.error('Failed to add song');
    } finally {
      setIsAddingSong(false);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploadingFile(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        const res = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['files', { projectId }] });
      toast.success(`${selectedFiles.length} file(s) uploaded!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <FileAudio className="h-5 w-5 text-violet-400" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-cyan-400" />;
      case 'document':
        return <FileText className="h-5 w-5 text-orange-400" />;
      default:
        return <File className="h-5 w-5 text-zinc-400" />;
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Project not found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This project may have been deleted or doesn&apos;t exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {projectStatuses.find(s => s.value === project.status)?.label || project.status}
            </Badge>
          </div>
          <p className="mt-1 text-zinc-400">
            {projectTypes.find(t => t.value === project.type)?.label} • Created {formatDate(project.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isAddSongDialogOpen} onOpenChange={setIsAddSongDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Song
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Song</DialogTitle>
                <DialogDescription>Add a new song to this project</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Song title"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newSong.status}
                      onValueChange={(value) => setNewSong({ ...newSong, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {songStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>BPM</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={newSong.bpm}
                      onChange={(e) => setNewSong({ ...newSong, bpm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    placeholder="e.g., C Major, Am"
                    value={newSong.musicalKey}
                    onChange={(e) => setNewSong({ ...newSong, musicalKey: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSongDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSong} disabled={isAddingSong}>
                  {isAddingSong ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Song'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-zinc-300">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="songs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="songs">Songs ({songs?.length || 0})</TabsTrigger>
          <TabsTrigger value="files">Files ({files?.length || 0})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="space-y-4">
          {songsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : songs?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">No songs yet</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Add your first song to this project
                </p>
                <Button className="mt-4" onClick={() => setIsAddSongDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Song
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {songs?.map((song, index) => (
                <Link key={song.id} href={`/songs/${song.id}`}>
                  <Card className="transition-colors hover:border-zinc-700">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                        {song.trackNumber || index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{song.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          {song.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(song.duration)}
                            </span>
                          )}
                          {song.bpm && <span>{song.bpm} BPM</span>}
                          {song.musicalKey && <span>{song.musicalKey}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(song.status)}>
                        {songStatuses.find(s => s.value === song.status)?.label || song.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />

          {filesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : files?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileAudio className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">No files yet</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Upload audio files, stems, and project files
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={handleFileUploadClick}
                  disabled={isUploadingFile}
                >
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleFileUploadClick}
                  disabled={isUploadingFile}
                >
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                {files?.map((file) => (
                  <Card key={file.id} className="transition-colors hover:border-zinc-700">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{file.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>v{file.currentVersion}</span>
                          {file.uploadedBy && <span>by {file.uploadedBy.name}</span>}
                          <span>{formatDate(file.createdAt)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {file.type}
                      </Badge>
                      <a
                        href={file.path}
                        download={file.name}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4 text-zinc-400" />
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-zinc-500" />
              <h3 className="mt-4 text-lg font-medium text-white">No activity yet</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Activity will appear here as you work on this project
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
              All songs and files in this project will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
