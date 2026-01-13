'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Volume2 } from 'lucide-react';

// Audio context singleton
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

// Note frequencies (A4 = 440Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
  'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
  'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
  'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
  'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
  'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50,
};

// Keyboard mapping (computer key -> note)
const KEY_MAP: Record<string, string> = {
  // Lower octave (C3-B3)
  'z': 'C3', 's': 'C#3', 'x': 'D3', 'd': 'D#3', 'c': 'E3',
  'v': 'F3', 'g': 'F#3', 'b': 'G3', 'h': 'G#3', 'n': 'A3',
  'j': 'A#3', 'm': 'B3',
  // Upper octave (C4-C5)
  'q': 'C4', '2': 'C#4', 'w': 'D4', '3': 'D#4', 'e': 'E4',
  'r': 'F4', '5': 'F#4', 't': 'G4', '6': 'G#4', 'y': 'A4',
  '7': 'A#4', 'u': 'B4', 'i': 'C5',
};

// Scale patterns (intervals from root)
const SCALES: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'pentatonic-major': [0, 2, 4, 7, 9],
  'pentatonic-minor': [0, 3, 5, 7, 10],
  'blues': [0, 3, 5, 6, 7, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

// Chord patterns
const CHORDS: Record<string, number[]> = {
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'diminished': [0, 3, 6],
  'augmented': [0, 4, 8],
  'major7': [0, 4, 7, 11],
  'minor7': [0, 3, 7, 10],
  'dom7': [0, 4, 7, 10],
  'dim7': [0, 3, 6, 9],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  'add9': [0, 4, 7, 14],
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface ActiveOscillator {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export function PianoKeyboard() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(0.5);
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [selectedChord, setSelectedChord] = useState('major');
  const [showScale, setShowScale] = useState(true);
  const [showChord, setShowChord] = useState(false);
  const [waveform, setWaveform] = useState<OscillatorType>('triangle');
  const [sustainMode, setSustainMode] = useState(false);

  const oscillatorsRef = useRef<Map<string, ActiveOscillator>>(new Map());

  // Get notes in current scale
  const getScaleNotes = useCallback(() => {
    const rootIndex = ALL_NOTES.indexOf(selectedRoot);
    const pattern = SCALES[selectedScale] || SCALES['major'];
    return pattern.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
  }, [selectedRoot, selectedScale]);

  // Get notes in current chord
  const getChordNotes = useCallback(() => {
    const rootIndex = ALL_NOTES.indexOf(selectedRoot);
    const pattern = CHORDS[selectedChord] || CHORDS['major'];
    return pattern.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
  }, [selectedRoot, selectedChord]);

  // Play a note
  const playNote = useCallback((note: string) => {
    const frequency = NOTE_FREQUENCIES[note];
    if (!frequency) return;

    // Don't play if already playing
    if (oscillatorsRef.current.has(note)) return;

    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = waveform;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);

    oscillator.start(ctx.currentTime);
    oscillatorsRef.current.set(note, { oscillator, gainNode });

    setActiveNotes(prev => new Set(prev).add(note));
  }, [volume, waveform]);

  // Stop a note
  const stopNote = useCallback((note: string) => {
    if (sustainMode) return;

    const active = oscillatorsRef.current.get(note);
    if (active) {
      const ctx = getAudioContext();
      active.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      setTimeout(() => {
        active.oscillator.stop();
        oscillatorsRef.current.delete(note);
      }, 100);

      setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }
  }, [sustainMode]);

  // Stop all notes
  const stopAllNotes = useCallback(() => {
    oscillatorsRef.current.forEach((active, note) => {
      const ctx = getAudioContext();
      active.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      setTimeout(() => {
        active.oscillator.stop();
      }, 50);
    });
    oscillatorsRef.current.clear();
    setActiveNotes(new Set());
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const note = KEY_MAP[e.key.toLowerCase()];
      if (note) {
        e.preventDefault();
        playNote(note);
      }

      // Space to stop all notes
      if (e.code === 'Space') {
        e.preventDefault();
        stopAllNotes();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = KEY_MAP[e.key.toLowerCase()];
      if (note) {
        stopNote(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playNote, stopNote, stopAllNotes]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllNotes();
    };
  }, [stopAllNotes]);

  const scaleNotes = getScaleNotes();
  const chordNotes = getChordNotes();

  // Check if a note should be highlighted
  const isNoteHighlighted = (noteName: string) => {
    const noteBase = noteName.replace(/[0-9]/g, '');
    if (showScale && scaleNotes.includes(noteBase)) return 'scale';
    if (showChord && chordNotes.includes(noteBase)) return 'chord';
    return null;
  };

  // Get keyboard key for a note
  const getKeyboardKey = (note: string) => {
    return Object.entries(KEY_MAP).find(([key, n]) => n === note)?.[0]?.toUpperCase();
  };

  // Render a key
  const renderKey = (note: string, isBlack: boolean) => {
    const isActive = activeNotes.has(note);
    const highlight = isNoteHighlighted(note);
    const keyboardKey = getKeyboardKey(note);
    const noteBase = note.replace(/[0-9]/g, '');
    const isRoot = noteBase === selectedRoot;

    return (
      <button
        key={note}
        onMouseDown={() => playNote(note)}
        onMouseUp={() => stopNote(note)}
        onMouseLeave={() => stopNote(note)}
        onTouchStart={(e) => { e.preventDefault(); playNote(note); }}
        onTouchEnd={() => stopNote(note)}
        className={cn(
          'relative flex flex-col items-center justify-end pb-2 transition-all duration-75 select-none touch-none',
          isBlack ? [
            'w-8 sm:w-10 h-24 sm:h-32 -mx-4 sm:-mx-5 z-10 rounded-b-md',
            isActive ? 'bg-violet-600' : 'bg-zinc-800',
            highlight === 'scale' && !isActive && 'bg-violet-900',
            highlight === 'chord' && !isActive && 'bg-pink-900',
            isRoot && !isActive && 'bg-emerald-800',
          ] : [
            'w-10 sm:w-14 h-36 sm:h-48 rounded-b-lg border border-zinc-700',
            isActive ? 'bg-violet-400' : 'bg-white',
            highlight === 'scale' && !isActive && 'bg-violet-200',
            highlight === 'chord' && !isActive && 'bg-pink-200',
            isRoot && !isActive && 'bg-emerald-200',
          ]
        )}
      >
        {keyboardKey && (
          <span className={cn(
            'text-[10px] sm:text-xs font-mono px-1 py-0.5 rounded mb-1',
            isBlack ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
          )}>
            {keyboardKey}
          </span>
        )}
        <span className={cn(
          'text-[10px] sm:text-xs font-medium',
          isBlack ? 'text-white' : 'text-zinc-700'
        )}>
          {noteBase}
        </span>
      </button>
    );
  };

  // Build keyboard layout
  const octaves = [3, 4, 5];
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeyPositions: Record<string, boolean> = {
    'C': true, 'D': true, 'F': true, 'G': true, 'A': true
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Root Note</Label>
          <Select value={selectedRoot} onValueChange={setSelectedRoot}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_NOTES.map(note => (
                <SelectItem key={note} value={note}>{note}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Scale</Label>
          <Select value={selectedScale} onValueChange={setSelectedScale}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(SCALES).map(scale => (
                <SelectItem key={scale} value={scale}>
                  {scale.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Chord</Label>
          <Select value={selectedChord} onValueChange={setSelectedChord}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CHORDS).map(chord => (
                <SelectItem key={chord} value={chord}>{chord}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Sound</Label>
          <Select value={waveform} onValueChange={(v) => setWaveform(v as OscillatorType)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sine">Sine</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="sawtooth">Sawtooth</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> Volume
          </Label>
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            min={0}
            max={1}
            step={0.1}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Scale</Label>
            <Switch checked={showScale} onCheckedChange={setShowScale} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Chord</Label>
            <Switch checked={showChord} onCheckedChange={setShowChord} />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-emerald-200 text-emerald-800 text-xs">
          Root
        </Badge>
        {showScale && (
          <Badge variant="outline" className="bg-violet-200 text-violet-800 text-xs">
            Scale: {selectedRoot} {selectedScale.replace(/-/g, ' ')}
          </Badge>
        )}
        {showChord && (
          <Badge variant="outline" className="bg-pink-200 text-pink-800 text-xs">
            Chord: {selectedRoot} {selectedChord}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          Press Space to stop all
        </Badge>
      </div>

      {/* Piano */}
      <Card className="overflow-x-auto">
        <CardContent className="p-4">
          <div className="flex justify-center min-w-max">
            {octaves.map(octave => (
              <div key={octave} className="relative flex">
                {whiteKeys.map((note, i) => {
                  const fullNote = `${note}${octave}`;
                  return (
                    <div key={fullNote} className="relative">
                      {renderKey(fullNote, false)}
                      {blackKeyPositions[note] && (
                        <div className="absolute top-0 right-0 translate-x-1/2 z-10">
                          {renderKey(`${note}#${octave}`, true)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Final C6 */}
            {renderKey('C6', false)}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard mapping reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Keyboard Mapping</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-zinc-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-zinc-300">Lower octave (C3-B3):</span>{' '}
              Z X C V B N M (white), S D G H J (black)
            </div>
            <div>
              <span className="font-medium text-zinc-300">Upper octave (C4-C5):</span>{' '}
              Q W E R T Y U I (white), 2 3 5 6 7 (black)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
