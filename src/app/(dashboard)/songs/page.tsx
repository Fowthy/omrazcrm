'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  Music,
  Plus,
  Search,
  Play,
  Pause,
  FileAudio,
  MessageSquare,
  Clock,
  Loader2,
  FolderKanban,
  Volume2,
  X,
} from 'lucide-react';
import { projectStatuses, musicalKeys, formatDuration, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Song {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  bpm: number | null;
  musicalKey: string | null;
  timeSignature: string;
  status: string;
  trackNumber: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  fileCount: number;
  commentCount: number;
  project: { id: string; name: string } | null;
  createdBy: { name: string; avatar: string | null } | null;
}

export default function SongsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSong, setNewSong] = useState({
    title: '',
    description: '',
    bpm: '',
    musicalKey: '',
    status: 'idea',
    projectId: '',
  });

  // Audio player state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [playingSongTitle, setPlayingSongTitle] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlaySong = async (song: Song) => {
    // If clicking on currently playing song, toggle play/pause
    if (playingSongId === song.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Load new song
    if (song.fileCount === 0) {
      toast.error('No audio files for this song');
      return;
    }

    setIsLoadingAudio(true);
    try {
      // Fetch files for the song
      const res = await fetch(`/api/songs/${song.id}`);
      if (!res.ok) throw new Error('Failed to fetch song');
      const songData = await res.json();

      // Find first audio file
      const audioFile = songData.files?.find((f: { type: string; url: string }) =>
        f.type?.startsWith('audio/') || f.url?.endsWith('.mp3') || f.url?.endsWith('.wav')
      );

      if (!audioFile) {
        toast.error('No audio files found');
        setIsLoadingAudio(false);
        return;
      }

      setPlayingSongId(song.id);
      setPlayingSongTitle(song.title);

      if (audioRef.current) {
        audioRef.current.src = audioFile.url;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      toast.error('Failed to play song');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPlayingSongId(null);
    setPlayingSongTitle('');
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { data: songs, isLoading, refetch } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) throw new Error('Failed to fetch songs');
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

  const filteredSongs = songs?.filter((song) => {
    const matchesSearch = song.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || song.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSong = async () => {
    if (!newSong.title.trim()) {
      toast.error('Song title is required');
      return;
    }

    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSong,
          bpm: newSong.bpm ? parseInt(newSong.bpm) : null,
          projectId: newSong.projectId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create song');

      toast.success('Song created!');
      setIsCreateDialogOpen(false);
      setNewSong({
        title: '',
        description: '',
        bpm: '',
        musicalKey: '',
        status: 'idea',
        projectId: '',
      });
      refetch();
    } catch (error) {
      toast.error('Failed to create song');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      writing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      recording: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      mixing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      mastering: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      released: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const statusConfig = projectStatuses.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={colors[status] || colors.idea}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Songs</h1>
          <p className="mt-1 text-zinc-400">
            Manage your songs, lyrics, and audio files
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Song
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Song</DialogTitle>
              <DialogDescription>
                Add a new song to your library
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Song Title</Label>
                <Input
                  id="title"
                  placeholder="Enter song title"
                  value={newSong.title}
                  onChange={(e) =>
                    setNewSong({ ...newSong, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Notes & Ideas</Label>
                <Textarea
                  id="description"
                  placeholder="Add prompts, ideas, notes for this song..."
                  value={newSong.description}
                  onChange={(e) =>
                    setNewSong({ ...newSong, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BPM</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={newSong.bpm}
                    onChange={(e) =>
                      setNewSong({ ...newSong, bpm: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Key</Label>
                  <Select
                    value={newSong.musicalKey}
                    onValueChange={(value) =>
                      setNewSong({ ...newSong, musicalKey: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {musicalKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select
                  value={newSong.projectId || 'none'}
                  onValueChange={(value) =>
                    setNewSong({ ...newSong, projectId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projectsList?.filter((p: { id: string }) => p.id).map((project: { id: string; name: string }) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newSong.status}
                  onValueChange={(value) =>
                    setNewSong({ ...newSong, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.slice(0, -1).map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
              <Button onClick={handleCreateSong}>
                Create Song
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {projectStatuses.slice(0, -1).map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Songs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filteredSongs?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-zinc-500" />
            <h3 className="mt-4 text-lg font-medium text-white">No songs found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first song to get started'}
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Song
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredSongs?.map((song) => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <Card className="transition-all hover:border-zinc-700">
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlaySong(song);
                    }}
                    disabled={isLoadingAudio}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/20 text-violet-500 transition-colors hover:bg-violet-600 hover:text-white disabled:opacity-50"
                  >
                    {isLoadingAudio && playingSongId === song.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : playingSongId === song.id && isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </button>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">
                        {song.title}
                      </h3>
                      {getStatusBadge(song.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      {song.project && (
                        <span className="flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" />
                          {song.project.name}
                        </span>
                      )}
                      {song.bpm && <span>{song.bpm} BPM</span>}
                      {song.musicalKey && <span>{song.musicalKey}</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
                    {song.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(song.duration)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FileAudio className="h-4 w-4" />
                      {song.fileCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {song.commentCount}
                    </div>
                    <div className="text-xs text-zinc-500 w-24 text-right">
                      {formatDate(song.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Audio Player Bar */}
      {playingSongId && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={() => {
                if (audioRef.current) {
                  if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    audioRef.current.play();
                    setIsPlaying(true);
                  }
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>

            {/* Song Info */}
            <div className="min-w-0 flex-shrink-0">
              <p className="text-sm font-medium text-white truncate">{playingSongTitle}</p>
              <p className="text-xs text-zinc-400">Now Playing</p>
            </div>

            {/* Progress */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-10">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
            </div>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-zinc-400" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="w-24"
              />
            </div>

            {/* Close */}
            <button
              onClick={closePlayer}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
