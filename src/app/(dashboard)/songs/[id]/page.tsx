'use client';

import { useState, useRef } from 'react';
import { uploadFile } from '@/lib/upload';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeft,
  Plus,
  Music,
  FileAudio,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  Clock,
  Gauge,
  FolderKanban,
  MessageSquare,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { songStatuses, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { SongVisualizer } from '@/components/song-visualizer';

interface SongFile {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  path: string;
  size: number;
  createdAt: string;
}

interface Song {
  id: string;
  title: string;
  description: string | null;
  lyrics: string | null;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  timeSignature: string | null;
  status: string;
  trackNumber: number | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string } | null;
  createdBy: { id: string; name: string; avatar: string | null } | null;
  files: SongFile[];
  comments: Array<{
    id: string;
    content: string;
    timestamp: number | null;
    createdAt: string;
  }>;
}

interface VisualizationParams {
  colorScheme: string;
  backgroundColor: string;
  sensitivity: number;
  smoothing: number;
  barCount: number;
  barWidth: number;
  barGap: number;
  barRadius: number;
  particleCount: number;
  particleSize: number;
  particleSpeed: number;
  rotationSpeed: number;
  mirrorMode: boolean;
  glowIntensity: number;
  reactToAudio: boolean;
}

interface Visualization {
  id: string;
  name: string;
  visualType: string;
  parameters: VisualizationParams;
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const songId = params.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileState, setUploadFileState] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'idea',
    bpm: '',
    musicalKey: '',
    timeSignature: '4/4',
  });

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState<number | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Lyrics state
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState('');
  const [isSavingLyrics, setIsSavingLyrics] = useState(false);

  // Notes state (pinned sidebar)
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Visualizer state
  const [showVisualizer, setShowVisualizer] = useState(true);

  // Fetch song
  const { data: song, isLoading, refetch } = useQuery<Song>({
    queryKey: ['song', songId],
    queryFn: async () => {
      const res = await fetch(`/api/songs/${songId}`);
      if (!res.ok) throw new Error('Failed to fetch song');
      return res.json();
    },
  });

  // Fetch linked visualizations
  const { data: visualizations } = useQuery<Visualization[]>({
    queryKey: ['visualizations', 'song', songId],
    queryFn: async () => {
      const res = await fetch('/api/visualizations');
      if (!res.ok) throw new Error('Failed to fetch visualizations');
      const all = await res.json();
      // Filter visualizations linked to this song
      return all.filter((v: { songId: string | null }) => v.songId === songId);
    },
  });

  // Get the first linked visualization (could add selector later)
  const linkedVisualization = visualizations?.[0] || null;

  // Initialize edit form when song loads
  if (song && !editForm.title && song.title !== editForm.title) {
    setEditForm({
      title: song.title,
      description: song.description || '',
      status: song.status,
      bpm: song.bpm?.toString() || '',
      musicalKey: song.musicalKey || '',
      timeSignature: song.timeSignature || '4/4',
    });
  }

  const handleUpdateSong = async () => {
    if (!editForm.title.trim()) {
      toast.error('Song title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          bpm: editForm.bpm ? parseInt(editForm.bpm) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update song');

      await queryClient.invalidateQueries({ queryKey: ['song', songId] });
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song updated!');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update song');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSong = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete song');

      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song deleted!');

      if (song?.project) {
        router.push(`/projects/${song.project.id}`);
      } else {
        router.push('/songs');
      }
    } catch (error) {
      toast.error('Failed to delete song');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileState(file);
      setIsUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFileState) return;

    setIsUploading(true);
    try {
      const res = await uploadFile({
        file: uploadFileState,
        endpoint: '/api/files',
        metadata: { songId },
        onProgress: (progress) => {
          // Could add progress indicator here
          console.log(`Upload progress: ${progress}%`);
        },
      });

      if (!res.ok) throw new Error('Failed to upload file');

      await refetch();
      toast.success('File uploaded!');
      setIsUploadDialogOpen(false);
      setUploadFileState(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Comment functions
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const res = await fetch(`/api/songs/${songId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          timestamp: commentTimestamp,
        }),
      });

      if (!res.ok) throw new Error('Failed to add comment');

      await refetch();
      setNewComment('');
      setCommentTimestamp(null);
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/songs/${songId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      await refetch();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addTimestampComment = () => {
    if (audioRef.current) {
      setCommentTimestamp(audioRef.current.currentTime);
    }
  };

  // Lyrics functions
  const handleEditLyrics = () => {
    setLyricsText(song?.lyrics || '');
    setIsEditingLyrics(true);
  };

  const handleSaveLyrics = async () => {
    setIsSavingLyrics(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics: lyricsText }),
      });

      if (!res.ok) throw new Error('Failed to save lyrics');

      await refetch();
      setIsEditingLyrics(false);
      toast.success('Lyrics saved!');
    } catch (error) {
      toast.error('Failed to save lyrics');
    } finally {
      setIsSavingLyrics(false);
    }
  };

  // Notes functions (pinned sidebar)
  const handleEditNotes = () => {
    setNotesText(song?.description || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: notesText }),
      });

      if (!res.ok) throw new Error('Failed to save notes');

      await refetch();
      setIsEditingNotes(false);
      toast.success('Notes saved!');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Audio player functions
  const playAudio = (file: SongFile) => {
    if (currentlyPlaying === file.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentlyPlaying !== file.id) {
        setCurrentlyPlaying(file.id);
        setCurrentTime(0);
        // Need to load the new audio source
        setTimeout(() => {
          audioRef.current?.play();
          setIsPlaying(true);
        }, 100);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
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

  const formatDurationTime = (seconds: number | null | undefined) => {
    if (!seconds || isNaN(seconds)) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isAudioFile = (file: SongFile) => {
    return file.type === 'audio' || file.mimeType?.startsWith('audio/');
  };

  const getCurrentPlayingFile = () => {
    return song?.files?.find((f) => f.id === currentlyPlaying);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/songs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Songs
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">Song not found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This song may have been deleted or doesn&apos;t exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentFile = getCurrentPlayingFile();

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
        onChange={handleFileSelect}
      />

      {/* Hidden audio element */}
      {currentFile && (
        <audio
          ref={audioRef}
          src={currentFile.path}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => song.project ? router.push(`/projects/${song.project.id}`) : router.push('/songs')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{song.title}</h1>
            <Badge variant="outline" className={getStatusColor(song.status)}>
              {songStatuses.find((s) => s.value === song.status)?.label || song.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-zinc-400">
            {song.project && (
              <Link href={`/projects/${song.project.id}`} className="flex items-center gap-1 hover:text-white">
                <FolderKanban className="h-4 w-4" />
                {song.project.name}
              </Link>
            )}
            <span>•</span>
            <span>Created {formatDate(song.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Audio
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Song
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

      {/* Visualizer (shown when linked and audio is playing) */}
      {linkedVisualization && currentFile && showVisualizer && (
        <SongVisualizer
          visualization={linkedVisualization}
          audioElement={audioRef.current}
          isPlaying={isPlaying}
          onClose={() => setShowVisualizer(false)}
        />
      )}

      {/* Audio Player (shown when playing) */}
      {currentFile && (
        <Card className="border-violet-500/50 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full bg-violet-600 hover:bg-violet-700"
                onClick={() => playAudio(currentFile)}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white" />
                ) : (
                  <Play className="h-6 w-6 text-white ml-0.5" />
                )}
              </Button>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{currentFile.name}</span>
                  <span className="text-xs text-zinc-400">
                    {formatDurationTime(currentTime)} / {formatDurationTime(audioDuration)}
                  </span>
                </div>
                <Slider
                  value={[currentTime]}
                  max={audioDuration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                {linkedVisualization && !showVisualizer && (
                  <Button variant="ghost" size="icon" onClick={() => setShowVisualizer(true)} title="Show visualizer">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24 cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Song Info */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatDurationTime(song.duration)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Gauge className="h-4 w-4" />
              <span className="text-sm">BPM</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {song.bpm || '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <Music className="h-4 w-4" />
              <span className="text-sm">Key</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {song.musicalKey || '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileAudio className="h-4 w-4" />
              <span className="text-sm">Files</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {song.files?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Pinned Notes Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Tabs */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">Files ({song.files?.length || 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({song.comments?.length || 0})</TabsTrigger>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          {song.files?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileAudio className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">No files yet</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Upload audio files, stems, and mixes
                </p>
                <Button className="mt-4" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {song.files?.map((file) => (
                <Card key={file.id} className={currentlyPlaying === file.id ? 'border-violet-500' : ''}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {isAudioFile(file) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-violet-600/20 hover:bg-violet-600"
                        onClick={() => playAudio(file)}
                      >
                        {currentlyPlaying === file.id && isPlaying ? (
                          <Pause className="h-5 w-5 text-violet-400" />
                        ) : (
                          <Play className="h-5 w-5 text-violet-400 ml-0.5" />
                        )}
                      </Button>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                        <FileAudio className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{file.name}</h4>
                      <p className="text-sm text-zinc-500">
                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <a href={file.path} download={file.name}>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment Form */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment or note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {commentTimestamp !== null ? (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(commentTimestamp)}
                        <button
                          onClick={() => setCommentTimestamp(null)}
                          className="ml-1 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addTimestampComment}
                        disabled={!currentlyPlaying}
                        title={!currentlyPlaying ? "Play audio first to add timestamp" : "Add current timestamp"}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Add Timestamp
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                    size="sm"
                  >
                    {isAddingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          {song.comments && song.comments.length > 0 ? (
            <div className="space-y-3">
              {song.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {comment.timestamp !== null && (
                          <Badge
                            variant="outline"
                            className="gap-1 cursor-pointer hover:bg-violet-500/20"
                            onClick={() => {
                              if (audioRef.current && currentlyPlaying) {
                                audioRef.current.currentTime = comment.timestamp!;
                                setCurrentTime(comment.timestamp!);
                              }
                            }}
                          >
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(comment.timestamp)}
                          </Badge>
                        )}
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-10 w-10 text-zinc-500" />
                <p className="mt-3 text-sm text-zinc-400">
                  No comments yet. Add your first note above!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lyrics" className="space-y-4">
          {isEditingLyrics ? (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <Textarea
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  placeholder="Enter lyrics here...

[Verse 1]
Your lyrics go here...

[Chorus]
The chorus goes here..."
                  rows={20}
                  className="resize-none font-mono text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingLyrics(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveLyrics}
                    disabled={isSavingLyrics}
                  >
                    {isSavingLyrics ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save Lyrics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : song?.lyrics ? (
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-white">Lyrics</h3>
                  <Button variant="outline" size="sm" onClick={handleEditLyrics}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300 leading-relaxed">
                  {song.lyrics}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileAudio className="h-12 w-12 text-zinc-500" />
                <h3 className="mt-4 text-lg font-medium text-white">No lyrics yet</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Add lyrics for this song
                </p>
                <Button className="mt-4" variant="outline" onClick={handleEditLyrics}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lyrics
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Pinned Notes */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-6">
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-semibold text-white">Notes & Ideas</h3>
                  </div>
                  {!isEditingNotes && (
                    <Button variant="ghost" size="sm" onClick={handleEditNotes}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add notes, ideas, prompts for this song..."
                      rows={8}
                      className="resize-none text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingNotes(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                      >
                        {isSavingNotes ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : song.description ? (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{song.description}</p>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-zinc-500 mb-2">No notes yet</p>
                    <Button variant="outline" size="sm" onClick={handleEditNotes}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
            <DialogDescription>Update song details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes & Ideas</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add notes, ideas, prompts for this song..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  value={editForm.bpm}
                  onChange={(e) => setEditForm({ ...editForm, bpm: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={editForm.musicalKey}
                  onChange={(e) => setEditForm({ ...editForm, musicalKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Signature</Label>
                <Input
                  value={editForm.timeSignature}
                  onChange={(e) => setEditForm({ ...editForm, timeSignature: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSong} disabled={isUpdating}>
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

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Audio File</DialogTitle>
            <DialogDescription>
              Upload an audio file to this song
            </DialogDescription>
          </DialogHeader>

          {uploadFileState && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800">
                <FileAudio className="h-8 w-8 text-violet-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{uploadFileState.name}</p>
                  <p className="text-sm text-zinc-400">{formatFileSize(uploadFileState.size)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUploadDialogOpen(false);
              setUploadFileState(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Song</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{song.title}&quot;? This action cannot be undone.
              All files and comments associated with this song will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSong} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Song'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
