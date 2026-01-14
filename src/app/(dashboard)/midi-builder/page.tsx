'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  Download,
  Trash2,
  Plus,
  Volume2,
  Music,
  Piano,
  Drum,
  Guitar,
  Waves,
  ChevronLeft,
  ChevronRight,
  Copy,
  Scissors,
  ClipboardPaste,
  Undo,
  Redo,
  Save,
  FileMusic,
  ZoomIn,
  ZoomOut,
  Grid,
  FolderOpen,
  FilePlus,
  Check,
  Loader2,
  MoreVertical,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types for saved projects
interface MidiProject {
  id: string;
  name: string;
  description: string | null;
  bpm: number;
  totalBeats: number;
  tracks: Track[];
  songId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Audio setup
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Note definitions
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [2, 3, 4, 5, 6];

// Instruments / Waveforms
const INSTRUMENTS: Record<string, { name: string; wave: OscillatorType; icon: typeof Piano }> = {
  piano: { name: 'Piano', wave: 'sine', icon: Piano },
  synth: { name: 'Synth', wave: 'sawtooth', icon: Waves },
  organ: { name: 'Organ', wave: 'square', icon: Music },
  bass: { name: 'Bass', wave: 'triangle', icon: Guitar },
};

// Note type
interface Note {
  id: string;
  pitch: number; // MIDI note number (0-127)
  start: number; // Start time in beats
  duration: number; // Duration in beats
  velocity: number; // 0-127
}

// Track type
interface Track {
  id: string;
  name: string;
  instrument: string;
  notes: Note[];
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}

// MIDI export helper
function createMidiFile(tracks: Track[], bpm: number): Uint8Array {
  // Simple MIDI file generation (Format 1)
  const ticksPerBeat = 480;

  // Helper to write variable length quantity
  const writeVLQ = (value: number): number[] => {
    if (value === 0) return [0];
    const bytes: number[] = [];
    let v = value;
    while (v > 0) {
      bytes.unshift(v & 0x7f);
      v >>= 7;
    }
    for (let i = 0; i < bytes.length - 1; i++) {
      bytes[i] |= 0x80;
    }
    return bytes;
  };

  // Create track chunks
  const trackChunks: number[][] = [];

  // Tempo track (track 0)
  const tempoTrack: number[] = [];
  // Set tempo (microseconds per beat)
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  tempoTrack.push(
    0, 0xff, 0x51, 0x03,
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff
  );
  // End of track
  tempoTrack.push(0, 0xff, 0x2f, 0x00);
  trackChunks.push(tempoTrack);

  // Note tracks (MIDI has max 16 channels, use channel 0-15)
  tracks.forEach((track, trackIndex) => {
    const events: { time: number; data: number[] }[] = [];
    const channel = Math.min(trackIndex, 15); // Limit to channels 0-15

    // Sort notes by start time
    const sortedNotes = [...track.notes].sort((a, b) => a.start - b.start);

    sortedNotes.forEach(note => {
      const startTick = Math.round(note.start * ticksPerBeat);
      const endTick = Math.round((note.start + note.duration) * ticksPerBeat);

      // Note on (channel is 0-15)
      events.push({
        time: startTick,
        data: [0x90 | channel, note.pitch, note.velocity],
      });

      // Note off
      events.push({
        time: endTick,
        data: [0x80 | channel, note.pitch, 0],
      });
    });

    // Sort events by time
    events.sort((a, b) => a.time - b.time);

    // Convert to delta times
    const trackData: number[] = [];
    let lastTime = 0;
    events.forEach(event => {
      const delta = event.time - lastTime;
      trackData.push(...writeVLQ(delta), ...event.data);
      lastTime = event.time;
    });

    // End of track
    trackData.push(0, 0xff, 0x2f, 0x00);
    trackChunks.push(trackData);
  });

  // Build MIDI file
  const midiData: number[] = [];

  // Header chunk
  midiData.push(
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // chunk length = 6
    0x00, 0x01, // format 1
    (trackChunks.length >> 8) & 0xff, trackChunks.length & 0xff, // number of tracks
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff // ticks per beat
  );

  // Track chunks
  trackChunks.forEach(trackData => {
    midiData.push(
      0x4d, 0x54, 0x72, 0x6b, // "MTrk"
      (trackData.length >> 24) & 0xff,
      (trackData.length >> 16) & 0xff,
      (trackData.length >> 8) & 0xff,
      trackData.length & 0xff,
      ...trackData
    );
  });

  return new Uint8Array(midiData);
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function MidiBuilderPage() {
  const queryClient = useQueryClient();

  // Project management state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Editor state
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: generateId(),
      name: 'Track 1',
      instrument: 'piano',
      notes: [],
      muted: false,
      solo: false,
      volume: 80,
      pan: 0,
    },
  ]);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [gridSize, setGridSize] = useState(0.25); // 1/16 notes
  const [zoom, setZoom] = useState(40); // pixels per beat
  const [totalBeats, setTotalBeats] = useState(16);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<'select' | 'draw' | 'erase'>('draw');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(4);

  // Drawing state for click-and-drag note creation
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingNoteId, setDrawingNoteId] = useState<string | null>(null);
  const [drawingTrackIndex, setDrawingTrackIndex] = useState<number | null>(null);
  const [drawStartBeat, setDrawStartBeat] = useState(0);

  // API queries and mutations
  const { data: savedProjects = [], isLoading: isLoadingProjects } = useQuery<MidiProject[]>({
    queryKey: ['midi-projects'],
    queryFn: async () => {
      const res = await fetch('/api/midi-projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; isNew: boolean }) => {
      const payload = {
        name: data.name,
        bpm,
        totalBeats,
        tracks,
      };

      if (data.isNew || !currentProjectId) {
        const res = await fetch('/api/midi-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save project');
        return res.json();
      } else {
        const res = await fetch(`/api/midi-projects/${currentProjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update project');
        return res.json();
      }
    },
    onSuccess: (data) => {
      setCurrentProjectId(data.id);
      setProjectName(data.name);
      setHasUnsavedChanges(false);
      setSaveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['midi-projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/midi-projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midi-projects'] });
    },
  });

  // Load a project
  const loadProject = useCallback((project: MidiProject) => {
    // Set flag to skip the unsaved changes effect
    isLoadingProjectRef.current = true;
    setCurrentProjectId(project.id);
    setProjectName(project.name);
    setBpm(project.bpm);
    setTotalBeats(project.totalBeats);
    setTracks(project.tracks);
    setSelectedTrack(0);
    setCurrentBeat(0);
    setSelectedNotes(new Set());
    setHasUnsavedChanges(false);
    setLoadDialogOpen(false);
  }, []);

  // Create new project
  const newProject = useCallback(() => {
    setCurrentProjectId(null);
    setProjectName('Untitled Project');
    setBpm(120);
    setTotalBeats(16);
    setTracks([{
      id: generateId(),
      name: 'Track 1',
      instrument: 'piano',
      notes: [],
      muted: false,
      solo: false,
      volume: 80,
      pan: 0,
    }]);
    setSelectedTrack(0);
    setCurrentBeat(0);
    setSelectedNotes(new Set());
    setHasUnsavedChanges(false);
  }, []);

  // Ref to track if we're currently loading a project (to skip unsaved changes effect)
  const isLoadingProjectRef = useRef(false);

  // Mark as having unsaved changes when tracks/bpm/totalBeats change
  useEffect(() => {
    // Skip if we're loading a project (the changes are from loading, not user edits)
    if (isLoadingProjectRef.current) {
      isLoadingProjectRef.current = false;
      return;
    }
    if (currentProjectId) {
      setHasUnsavedChanges(true);
    }
  }, [tracks, bpm, totalBeats]);

  // Auto-load most recent project on page load
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  useEffect(() => {
    if (!hasAutoLoaded && !isLoadingProjects && savedProjects.length > 0) {
      // Sort by updatedAt descending and load the most recent
      const sortedProjects = [...savedProjects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const mostRecent = sortedProjects[0];
      loadProject(mostRecent);
      setHasAutoLoaded(true);
    }
  }, [savedProjects, isLoadingProjects, hasAutoLoaded, loadProject]);

  // Refs
  const pianoRollRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<{ interval: NodeJS.Timeout | null; oscillators: Map<string, OscillatorNode> }>({
    interval: null,
    oscillators: new Map(),
  });

  // Note height in pixels
  const noteHeight = 16;
  const pianoKeyWidth = 60;

  // Get MIDI note number
  const getMidiNote = (note: string, octave: number): number => {
    return (octave + 1) * 12 + NOTE_NAMES.indexOf(note);
  };

  // Get note name from MIDI number
  const getNoteFromMidi = (midi: number): { note: string; octave: number } => {
    const note = NOTE_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return { note, octave };
  };

  // Play a single note
  const playNote = useCallback((pitch: number, duration: number, velocity: number, instrument: string) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    osc.frequency.value = freq;
    osc.type = INSTRUMENTS[instrument]?.wave || 'sine';

    const vol = (velocity / 127) * 0.3;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, []);

  // Start playback
  const startPlayback = useCallback(() => {
    getAudioContext(); // Ensure audio context is initialized
    const msPerBeat = 60000 / bpm;

    setIsPlaying(true);

    const scheduledNotes = new Set<string>();

    playbackRef.current.interval = setInterval(() => {
      setCurrentBeat(prev => {
        const next = prev + 0.05; // Advance by 1/20 of a beat

        // Check for notes to play
        tracks.forEach(track => {
          if (track.muted) return;
          const hasSolo = tracks.some(t => t.solo);
          if (hasSolo && !track.solo) return;

          track.notes.forEach(note => {
            const noteKey = `${track.id}-${note.id}`;
            if (!scheduledNotes.has(noteKey) && note.start >= prev && note.start < next) {
              scheduledNotes.add(noteKey);
              const durationSec = (note.duration * 60) / bpm;
              playNote(note.pitch, durationSec, note.velocity * (track.volume / 100), track.instrument);
            }
          });
        });

        // Loop handling
        if (loopEnabled && next >= loopEnd) {
          scheduledNotes.clear();
          return loopStart;
        }

        // End of song
        if (next >= totalBeats) {
          stopPlayback();
          return 0;
        }

        return next;
      });
    }, (msPerBeat * 0.05));
  }, [bpm, tracks, currentBeat, loopEnabled, loopStart, loopEnd, totalBeats, playNote]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (playbackRef.current.interval) {
      clearInterval(playbackRef.current.interval);
    }
    playbackRef.current.oscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    playbackRef.current.oscillators.clear();
    setIsPlaying(false);
  }, []);

  // Stop all audio
  const stopAll = useCallback(() => {
    stopPlayback();
    setCurrentBeat(0);
  }, [stopPlayback]);

  // Add track
  const addTrack = () => {
    setTracks(prev => [...prev, {
      id: generateId(),
      name: `Track ${prev.length + 1}`,
      instrument: 'piano',
      notes: [],
      muted: false,
      solo: false,
      volume: 80,
      pan: 0,
    }]);
    setSelectedTrack(tracks.length);
  };

  // Delete track
  const deleteTrack = (index: number) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter((_, i) => i !== index));
    if (selectedTrack >= index && selectedTrack > 0) {
      setSelectedTrack(selectedTrack - 1);
    }
  };

  // Add note
  const addNote = (trackIndex: number, pitch: number, start: number) => {
    const snap = snapToGrid ? Math.round(start / gridSize) * gridSize : start;
    const note: Note = {
      id: generateId(),
      pitch,
      start: snap,
      duration: gridSize * 2, // Default to 2 grid units
      velocity: 100,
    };

    setTracks(prev => prev.map((track, i) =>
      i === trackIndex
        ? { ...track, notes: [...track.notes, note] }
        : track
    ));

    // Play preview
    playNote(pitch, 0.3, 100, tracks[trackIndex].instrument);
  };

  // Delete note
  const deleteNote = (trackIndex: number, noteId: string) => {
    setTracks(prev => prev.map((track, i) =>
      i === trackIndex
        ? { ...track, notes: track.notes.filter(n => n.id !== noteId) }
        : track
    ));
    setSelectedNotes(prev => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  };

  // Handle piano roll mouse down - start drawing a note
  const handlePianoRollMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'draw') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0) return;

    const beat = x / zoom;
    const snap = snapToGrid ? Math.round(beat / gridSize) * gridSize : beat;
    const noteIndex = Math.floor(y / noteHeight);
    const pitch = (OCTAVES[OCTAVES.length - 1] + 1) * 12 + 11 - noteIndex;

    if (pitch >= 0 && pitch < 128) {
      // Create a new note with minimum duration
      const noteId = generateId();
      const note: Note = {
        id: noteId,
        pitch,
        start: snap,
        duration: gridSize, // Start with minimum grid size duration
        velocity: 100,
      };

      setTracks(prev => prev.map((track, i) =>
        i === selectedTrack
          ? { ...track, notes: [...track.notes, note] }
          : track
      ));

      // Play preview
      playNote(pitch, 0.3, 100, tracks[selectedTrack].instrument);

      // Set drawing state
      setIsDrawing(true);
      setDrawingNoteId(noteId);
      setDrawingTrackIndex(selectedTrack);
      setDrawStartBeat(snap);
    }
  };

  // Handle piano roll mouse move - extend note while drawing
  const handlePianoRollMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawingNoteId || drawingTrackIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x < 0) return;

    const beat = x / zoom;
    const snap = snapToGrid ? Math.round(beat / gridSize) * gridSize : beat;

    // Calculate new duration (minimum of 1 grid unit)
    const newDuration = Math.max(gridSize, snap - drawStartBeat);

    // Update the note's duration
    setTracks(prev => prev.map((track, i) =>
      i === drawingTrackIndex
        ? {
            ...track,
            notes: track.notes.map(n =>
              n.id === drawingNoteId
                ? { ...n, duration: newDuration }
                : n
            )
          }
        : track
    ));
  };

  // Handle piano roll mouse up - finish drawing
  const handlePianoRollMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawingNoteId(null);
      setDrawingTrackIndex(null);
    }
  };

  // Handle mouse leave - also stop drawing
  const handlePianoRollMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawingNoteId(null);
      setDrawingTrackIndex(null);
    }
  };

  // Export MIDI
  const exportMidi = () => {
    const midiData = createMidiFile(tracks, bpm);
    const blob = new Blob([midiData as Uint8Array<ArrayBuffer>], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'composition.mid';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Global mouseup handler for drawing - ensures drawing stops even if mouse released outside
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setDrawingNoteId(null);
        setDrawingTrackIndex(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing]);

  const currentTrack = tracks[selectedTrack];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-4 sm:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50" data-onboarding="midi-header">
        <div className="flex items-center gap-4">
          {/* File menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <FileMusic className="h-4 w-4" />
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={newProject}>
                <FilePlus className="h-4 w-4 mr-2" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Open Project...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (currentProjectId) {
                    saveMutation.mutate({ name: projectName, isNew: false });
                  } else {
                    setNewProjectName(projectName);
                    setSaveDialogOpen(true);
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setNewProjectName(projectName === 'Untitled Project' ? '' : projectName);
                setSaveDialogOpen(true);
              }}>
                <Save className="h-4 w-4 mr-2" />
                Save As...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Project name */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-[200px]">{projectName}</span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/50">
                Unsaved
              </Badge>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Transport controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={isPlaying ? 'destructive' : 'default'}
              onClick={isPlaying ? stopPlayback : startPlayback}
              className="gap-1"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={stopAll}>
              <Square className="h-4 w-4" />
            </Button>
          </div>

          {/* BPM */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-zinc-400">BPM</Label>
            <Input
              type="number"
              value={bpm}
              onChange={e => setBpm(Math.max(20, Math.min(300, parseInt(e.target.value) || 120)))}
              className="w-16 h-7 text-sm"
            />
          </div>

          {/* Current position */}
          <Badge variant="outline" className="font-mono">
            {Math.floor(currentBeat)}.{Math.floor((currentBeat % 1) * 4) + 1}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Tool selection */}
          <div className="flex border border-zinc-700 rounded-md overflow-hidden">
            {(['select', 'draw', 'erase'] as const).map(t => (
              <Button
                key={t}
                size="sm"
                variant={tool === t ? 'default' : 'ghost'}
                className="rounded-none h-7 px-2"
                onClick={() => setTool(t)}
              >
                {t === 'select' ? 'Select' : t === 'draw' ? 'Draw' : 'Erase'}
              </Button>
            ))}
          </div>

          {/* Grid size */}
          <Select value={gridSize.toString()} onValueChange={v => setGridSize(parseFloat(v))}>
            <SelectTrigger className="w-20 h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1/1</SelectItem>
              <SelectItem value="0.5">1/2</SelectItem>
              <SelectItem value="0.25">1/4</SelectItem>
              <SelectItem value="0.125">1/8</SelectItem>
              <SelectItem value="0.0625">1/16</SelectItem>
            </SelectContent>
          </Select>

          {/* Snap */}
          <div className="flex items-center gap-1">
            <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} id="snap" />
            <Label htmlFor="snap" className="text-xs">Snap</Label>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.max(20, z - 10))}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.min(100, z + 10))}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* Export */}
          <Button size="sm" variant="outline" onClick={exportMidi} className="gap-1">
            <Download className="h-4 w-4" />
            Export MIDI
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Track list sidebar */}
        <div className="w-48 border-r border-zinc-800 bg-zinc-900/30 flex flex-col">
          <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tracks</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addTrack}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className={cn(
                  'p-2 border-b border-zinc-800/50 cursor-pointer transition-colors',
                  selectedTrack === i ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                )}
                onClick={() => setSelectedTrack(i)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{track.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 opacity-50 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); deleteTrack(i); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {INSTRUMENTS[track.instrument]?.name}
                  </Badge>
                  <button
                    className={cn('px-1 rounded', track.muted && 'text-red-400')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTracks(prev => prev.map((t, idx) =>
                        idx === i ? { ...t, muted: !t.muted } : t
                      ));
                    }}
                  >
                    M
                  </button>
                  <button
                    className={cn('px-1 rounded', track.solo && 'text-yellow-400')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTracks(prev => prev.map((t, idx) =>
                        idx === i ? { ...t, solo: !t.solo } : t
                      ));
                    }}
                  >
                    S
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Track settings */}
          {currentTrack && (
            <div className="p-2 border-t border-zinc-800 space-y-2">
              <div>
                <Label className="text-xs text-zinc-400">Instrument</Label>
                <Select
                  value={currentTrack.instrument}
                  onValueChange={v => setTracks(prev => prev.map((t, i) =>
                    i === selectedTrack ? { ...t, instrument: v } : t
                  ))}
                >
                  <SelectTrigger className="h-7 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSTRUMENTS).map(([key, inst]) => (
                      <SelectItem key={key} value={key}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Volume</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Volume2 className="h-3 w-3 text-zinc-500" />
                  <Slider
                    value={[currentTrack.volume]}
                    onValueChange={([v]) => setTracks(prev => prev.map((t, i) =>
                      i === selectedTrack ? { ...t, volume: v } : t
                    ))}
                    max={100}
                    className="flex-1"
                  />
                  <span className="text-xs w-6 text-right">{currentTrack.volume}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Piano roll */}
        <div className="flex-1 overflow-auto" ref={pianoRollRef}>
          <div
            className="relative flex"
            style={{
              width: pianoKeyWidth + totalBeats * zoom,
              height: OCTAVES.length * 12 * noteHeight,
            }}
          >
            {/* Piano keys - sticky so they stay visible when scrolling */}
            <div
              className="sticky left-0 top-0 bg-zinc-900 border-r border-zinc-700 z-10 shrink-0"
              style={{ width: pianoKeyWidth }}
            >
              {OCTAVES.slice().reverse().map(octave =>
                NOTE_NAMES.slice().reverse().map(note => {
                  const isBlack = note.includes('#');
                  const midi = getMidiNote(note, octave);
                  return (
                    <div
                      key={`${note}${octave}`}
                      className={cn(
                        'flex items-center justify-end pr-2 text-[10px] border-b border-zinc-800 cursor-pointer transition-colors',
                        isBlack
                          ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
                      )}
                      style={{ height: noteHeight }}
                      onClick={(e) => {
                        e.stopPropagation();
                        playNote(midi, 0.3, 100, currentTrack?.instrument || 'piano');
                      }}
                    >
                      {note}{octave}
                    </div>
                  );
                })
              )}
            </div>

            {/* Grid */}
            <div
              className={cn(
                "relative flex-1",
                tool === 'draw' && 'cursor-crosshair',
                tool === 'erase' && 'cursor-pointer',
                isDrawing && 'cursor-ew-resize'
              )}
              style={{ width: totalBeats * zoom }}
              onMouseDown={handlePianoRollMouseDown}
              onMouseMove={handlePianoRollMouseMove}
              onMouseUp={handlePianoRollMouseUp}
              onMouseLeave={handlePianoRollMouseLeave}
            >
              {/* Beat lines */}
              {Array.from({ length: totalBeats + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute top-0 bottom-0',
                    i % 4 === 0 ? 'border-l border-zinc-600' : 'border-l border-zinc-800'
                  )}
                  style={{ left: i * zoom }}
                />
              ))}

              {/* Row lines */}
              {OCTAVES.slice().reverse().map(octave =>
                NOTE_NAMES.slice().reverse().map((note, noteIdx) => {
                  const isBlack = note.includes('#');
                  return (
                    <div
                      key={`row-${note}${octave}`}
                      className={cn(
                        'absolute left-0 right-0 border-b border-zinc-800/50',
                        isBlack ? 'bg-zinc-900/50' : ''
                      )}
                      style={{
                        top: (OCTAVES.length - 1 - OCTAVES.indexOf(octave)) * 12 * noteHeight + (11 - NOTE_NAMES.indexOf(note)) * noteHeight,
                        height: noteHeight,
                      }}
                    />
                  );
                })
              )}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: currentBeat * zoom }}
              />

              {/* Notes from all tracks */}
              {tracks.map((track, trackIdx) =>
                track.notes.map(note => {
                  const { note: noteName, octave } = getNoteFromMidi(note.pitch);
                  const rowIndex = (OCTAVES.length - 1 - OCTAVES.indexOf(octave)) * 12 + (11 - NOTE_NAMES.indexOf(noteName));
                  const isSelected = selectedNotes.has(note.id);
                  const isCurrentTrack = trackIdx === selectedTrack;

                  // Skip notes outside visible octave range
                  if (rowIndex < 0 || rowIndex >= OCTAVES.length * 12) return null;

                  return (
                    <div
                      key={`${track.id}-${note.id}`}
                      className={cn(
                        'absolute rounded-sm transition-colors',
                        isCurrentTrack ? 'cursor-pointer z-10' : 'opacity-40 z-0',
                        isSelected
                          ? 'bg-primary ring-2 ring-primary'
                          : isCurrentTrack
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : 'bg-blue-500'
                      )}
                      style={{
                        left: note.start * zoom,
                        top: rowIndex * noteHeight + 1,
                        width: note.duration * zoom - 2,
                        height: noteHeight - 2,
                      }}
                      onMouseDown={e => {
                        e.stopPropagation();
                        if (!isCurrentTrack) {
                          // Click on other track's note selects that track
                          setSelectedTrack(trackIdx);
                          return;
                        }
                        if (tool === 'erase') {
                          deleteNote(selectedTrack, note.id);
                        } else if (tool === 'select') {
                          setSelectedNotes(prev => {
                            const next = new Set(prev);
                            if (next.has(note.id)) {
                              next.delete(note.id);
                            } else {
                              next.add(note.id);
                            }
                            return next;
                          });
                        }
                      }}
                    >
                      <div className="text-[8px] text-white px-1 truncate">
                        {noteName}{octave}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>{tracks.length} tracks</span>
          <span>{currentTrack?.notes.length || 0} notes in current track</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Bars</Label>
            <Input
              type="number"
              value={totalBeats / 4}
              onChange={e => setTotalBeats(Math.max(1, parseInt(e.target.value) || 4) * 4)}
              className="w-12 h-6 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <Switch checked={loopEnabled} onCheckedChange={setLoopEnabled} id="loop" />
            <Label htmlFor="loop" className="text-xs">Loop</Label>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Give your MIDI project a name to save it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newProjectName.trim()) {
                  saveMutation.mutate({ name: newProjectName.trim(), isNew: true });
                }
              }}
              disabled={!newProjectName.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Open Project</DialogTitle>
            <DialogDescription>
              Select a saved MIDI project to open.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : savedProjects.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <FileMusic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved projects yet.</p>
                <p className="text-sm">Create and save a project to see it here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedProjects.map(project => (
                  <div
                    key={project.id}
                    className={cn(
                      'p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors',
                      currentProjectId === project.id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => loadProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {project.name}
                          {currentProjectId === project.id && (
                            <Badge variant="secondary" className="text-[10px]">Current</Badge>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                          <span>{project.bpm} BPM</span>
                          <span>{project.totalBeats / 4} bars</span>
                          <span>{project.tracks.length} tracks</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm('Delete this project? This cannot be undone.')) {
                                deleteMutation.mutate(project.id);
                                if (currentProjectId === project.id) {
                                  newProject();
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
