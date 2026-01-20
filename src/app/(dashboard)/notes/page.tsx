'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { uploadFile } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Plus,
  Music,
  Album,
  Mic,
  FileText,
  Play,
  Pause,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { VoiceRecorder } from '@/components/audio/voice-recorder';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  albumId: string | null;
  songId: string | null;
  sectionId: string | null;
  noteType: string;
  content: string;
  audioUrl: string | null;
  linkedToTimestamp: number | null;
  createdAt: Date;
  createdByUser: { name: string; avatar: string | null } | null;
  song: { title: string } | null;
  album: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  projectId: string | null;
}

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    albumId: '',
    songId: '',
    content: '',
    noteType: 'text',
  });

  // Voice note state
  const [voiceFormData, setVoiceFormData] = useState({
    albumId: '',
    songId: '',
    content: '',
  });

  // Audio playback state
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchNotes();
      fetchProjects();
      fetchSongs();
    }
  }, [session]);

  useEffect(() => {
    // Cleanup audio element on unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
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

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (response.ok) {
        const data = await response.json();
        setSongs(data);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      toast.error('Please enter note content');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: formData.albumId || null,
          songId: formData.songId || null,
          content: formData.content,
          noteType: 'text',
        }),
      });

      if (response.ok) {
        toast.success('Note created successfully');
        setDialogOpen(false);
        setFormData({
          albumId: '',
          songId: '',
          content: '',
          noteType: 'text',
        });
        fetchNotes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceNoteUpload = async (file: File) => {
    // First upload the file
    const uploadRes = await uploadFile({
      file,
      endpoint: '/api/files',
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file');
    }

    const uploadedFile = await uploadRes.json();

    // Then create the note with the audio URL
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albumId: voiceFormData.albumId || null,
        songId: voiceFormData.songId || null,
        content: voiceFormData.content || 'Voice Note',
        noteType: 'voice',
        audioUrl: uploadedFile.path,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create voice note');
    }

    setVoiceDialogOpen(false);
    setVoiceFormData({
      albumId: '',
      songId: '',
      content: '',
    });
    fetchNotes();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Note deleted');
        fetchNotes();
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const togglePlayVoiceNote = (note: Note) => {
    if (!note.audioUrl) return;

    if (playingNoteId === note.id) {
      // Stop playing
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingNoteId(null);
    } else {
      // Start playing
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(note.audioUrl);
      audio.onended = () => setPlayingNoteId(null);
      audio.play();
      setAudioElement(audio);
      setPlayingNoteId(note.id);
    }
  };

  const filteredSongs = formData.albumId
    ? songs.filter((s) => s.projectId === formData.albumId)
    : songs;

  const voiceFilteredSongs = voiceFormData.albumId
    ? songs.filter((s) => s.projectId === voiceFormData.albumId)
    : songs;

  // Separate notes by type
  const textNotes = notes.filter((n) => n.noteType === 'text');
  const voiceNotes = notes.filter((n) => n.noteType === 'voice');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading notes...</p>
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
            <MessageSquare className="h-8 w-8 text-violet-400" />
            Notes
          </h1>
          <p className="text-zinc-400 mt-1">
            Capture ideas and feedback with text or voice
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-700"
            onClick={() => setVoiceDialogOpen(true)}
          >
            <Mic className="h-4 w-4 mr-2" />
            Voice Note
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Text Note
          </Button>
        </div>
      </div>

      {/* New Text Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Text Note</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Capture your creative thoughts and feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Album (optional)</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) =>
                  setFormData({ ...formData, albumId: value, songId: '' })
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
              <Label className="text-zinc-300">Song (optional)</Label>
              <Select
                value={formData.songId}
                onValueChange={(value) =>
                  setFormData({ ...formData, songId: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select a song" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {filteredSongs.map((song) => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Content *</Label>
              <Textarea
                placeholder="Write your note here..."
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={4}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
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
              {submitting ? 'Creating...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voice Note Dialog */}
      <Dialog open={voiceDialogOpen} onOpenChange={setVoiceDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Record Voice Note</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Record a quick voice note to capture your ideas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Album (optional)</Label>
                <Select
                  value={voiceFormData.albumId}
                  onValueChange={(value) =>
                    setVoiceFormData({ ...voiceFormData, albumId: value, songId: '' })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select album" />
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
                <Label className="text-zinc-300">Song (optional)</Label>
                <Select
                  value={voiceFormData.songId}
                  onValueChange={(value) =>
                    setVoiceFormData({ ...voiceFormData, songId: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select song" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {voiceFilteredSongs.map((song) => (
                      <SelectItem key={song.id} value={song.id}>
                        {song.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Description (optional)</Label>
              <Textarea
                placeholder="Brief description of this voice note..."
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                rows={2}
                value={voiceFormData.content}
                onChange={(e) =>
                  setVoiceFormData({ ...voiceFormData, content: e.target.value })
                }
              />
            </div>

            <VoiceRecorder
              onUpload={handleVoiceNoteUpload}
              maxDuration={180} // 3 minutes max
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes with Tabs */}
      {notes.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No notes yet</p>
            <p className="text-zinc-500 text-sm mb-4">
              Start capturing your creative thoughts with text or voice
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                className="border-zinc-700"
                onClick={() => setVoiceDialogOpen(true)}
              >
                <Mic className="h-4 w-4 mr-2" />
                Record Voice Note
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Text Note
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({notes.length})</TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-1" />
              Text ({textNotes.length})
            </TabsTrigger>
            <TabsTrigger value="voice">
              <Mic className="h-4 w-4 mr-1" />
              Voice ({voiceNotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isPlaying={playingNoteId === note.id}
                  onPlayToggle={() => togglePlayVoiceNote(note)}
                  onDelete={() => handleDeleteNote(note.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            {textNotes.length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-zinc-500">No text notes yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {textNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isPlaying={false}
                    onPlayToggle={() => {}}
                    onDelete={() => handleDeleteNote(note.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            {voiceNotes.length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-zinc-500">No voice notes yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-zinc-700"
                    onClick={() => setVoiceDialogOpen(true)}
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Record Voice Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {voiceNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isPlaying={playingNoteId === note.id}
                    onPlayToggle={() => togglePlayVoiceNote(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Note Card Component
function NoteCard({
  note,
  isPlaying,
  onPlayToggle,
  onDelete,
}: {
  note: Note;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onDelete: () => void;
}) {
  const isVoice = note.noteType === 'voice';

  return (
    <Card
      className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors ${
        isVoice ? 'border-l-4 border-l-orange-500/50' : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {isVoice && note.audioUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-orange-600/20 hover:bg-orange-600"
                onClick={onPlayToggle}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-orange-400" />
                ) : (
                  <Play className="h-5 w-5 text-orange-400 ml-0.5" />
                )}
              </Button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {new Date(note.createdAt).toLocaleDateString()}
                </Badge>
                <Badge
                  variant="outline"
                  className={isVoice ? 'bg-orange-500/20 text-orange-400' : ''}
                >
                  {isVoice ? <Mic className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                  {note.noteType}
                </Badge>
                {note.linkedToTimestamp !== null && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    @ {Math.floor(note.linkedToTimestamp)}s
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                {note.album && (
                  <div className="flex items-center gap-1">
                    <Album className="h-4 w-4" />
                    <span>{note.album.name}</span>
                  </div>
                )}
                {note.song && (
                  <div className="flex items-center gap-1">
                    <Music className="h-4 w-4" />
                    <span>{note.song.title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
              <DropdownMenuItem onClick={onDelete} className="text-red-400 cursor-pointer">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-300">{note.content}</p>
        {note.createdByUser && (
          <p className="text-xs text-zinc-500 mt-2">
            By {note.createdByUser.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
