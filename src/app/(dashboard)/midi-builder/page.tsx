'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
} from 'lucide-react';

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

  // Note tracks
  tracks.forEach((track, trackIndex) => {
    const events: { time: number; data: number[] }[] = [];

    // Sort notes by start time
    const sortedNotes = [...track.notes].sort((a, b) => a.start - b.start);

    sortedNotes.forEach(note => {
      const startTick = Math.round(note.start * ticksPerBeat);
      const endTick = Math.round((note.start + note.duration) * ticksPerBeat);

      // Note on
      events.push({
        time: startTick,
        data: [0x90 | trackIndex, note.pitch, note.velocity],
      });

      // Note off
      events.push({
        time: endTick,
        data: [0x80 | trackIndex, note.pitch, 0],
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
  // State
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
    const ctx = getAudioContext();
    const msPerBeat = 60000 / bpm;
    const startTime = currentBeat;

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

  // Handle piano roll click
  const handlePianoRollClick = (e: React.MouseEvent) => {
    if (tool !== 'draw') return;

    const rect = pianoRollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - pianoKeyWidth;
    const y = e.clientY - rect.top;

    if (x < 0) return;

    const beat = x / zoom;
    const totalNotes = OCTAVES.length * 12;
    const noteIndex = Math.floor(y / noteHeight);
    const pitch = (OCTAVES[OCTAVES.length - 1] + 1) * 12 + 11 - noteIndex;

    if (pitch >= 0 && pitch < 128) {
      addNote(selectedTrack, pitch, beat);
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

  const currentTrack = tracks[selectedTrack];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <FileMusic className="h-5 w-5" />
            MIDI Builder
          </h1>

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
        <div className="flex-1 overflow-auto bg-zinc-950" ref={pianoRollRef}>
          <div
            className="relative"
            style={{
              width: pianoKeyWidth + totalBeats * zoom,
              height: OCTAVES.length * 12 * noteHeight,
            }}
            onClick={handlePianoRollClick}
          >
            {/* Piano keys */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-zinc-900 border-r border-zinc-700 z-10"
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
                        'flex items-center justify-end pr-2 text-[10px] border-b border-zinc-800',
                        isBlack ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-900'
                      )}
                      style={{ height: noteHeight }}
                    >
                      {note}{octave}
                    </div>
                  );
                })
              )}
            </div>

            {/* Grid */}
            <div
              className="absolute top-0 bottom-0"
              style={{ left: pianoKeyWidth, width: totalBeats * zoom }}
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

              {/* Notes */}
              {currentTrack?.notes.map(note => {
                const { note: noteName, octave } = getNoteFromMidi(note.pitch);
                const rowIndex = (OCTAVES.length - 1 - OCTAVES.indexOf(octave)) * 12 + (11 - NOTE_NAMES.indexOf(noteName));
                const isSelected = selectedNotes.has(note.id);

                return (
                  <div
                    key={note.id}
                    className={cn(
                      'absolute rounded-sm cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary ring-2 ring-primary'
                        : 'bg-emerald-500 hover:bg-emerald-400'
                    )}
                    style={{
                      left: note.start * zoom,
                      top: rowIndex * noteHeight + 1,
                      width: note.duration * zoom - 2,
                      height: noteHeight - 2,
                    }}
                    onClick={e => {
                      e.stopPropagation();
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
              })}
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
    </div>
  );
}
