'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Drum,
  Calculator,
  Music,
  Waves,
  Hand,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// AUDIO UTILITIES
// ============================================

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

function playClick(frequency: number = 1000, duration: number = 0.05, volume: number = 0.5) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playDrumSound(type: 'kick' | 'snare' | 'hihat' | 'clap' | 'tom', volume: number = 0.7) {
  const ctx = getAudioContext();

  switch (type) {
    case 'kick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      break;
    }
    case 'snare': {
      // Noise for snare
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.2);

      // Tone for body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.frequency.value = 200;
      oscGain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
      break;
    }
    case 'hihat': {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.05);
      break;
    }
    case 'clap': {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2500;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.8, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.15);
      break;
    }
    case 'tom': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      break;
    }
  }
}

// ============================================
// METRONOME COMPONENT
// ============================================

function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [accentFirst, setAccentFirst] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMetronome = useCallback(() => {
    const interval = (60 / bpm) * 1000;

    intervalRef.current = setInterval(() => {
      setCurrentBeat((prev) => {
        const nextBeat = (prev + 1) % timeSignature;
        if (!isMuted) {
          if (accentFirst && nextBeat === 0) {
            playClick(1200, 0.08, volume);
          } else {
            playClick(800, 0.05, volume * 0.7);
          }
        }
        return nextBeat;
      });
    }, interval);
  }, [bpm, timeSignature, accentFirst, volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startMetronome();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, startMetronome]);

  const togglePlay = () => {
    // Ensure audio context is started on user interaction
    getAudioContext();
    setIsPlaying(!isPlaying);
  };

  // Tap tempo
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...tapTimes, now].filter((t) => now - t < 3000).slice(-8);
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 30 && calculatedBpm <= 300) {
        setBpm(calculatedBpm);
      }
    }
    playClick(1000, 0.03, 0.5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-violet-400" />
          Metronome
        </CardTitle>
        <CardDescription>Keep time with adjustable tempo and time signature</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BPM Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-2">{bpm}</div>
          <div className="text-zinc-400">BPM</div>
        </div>

        {/* Beat Indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: timeSignature }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-100 flex items-center justify-center text-sm font-bold',
                currentBeat === i && isPlaying
                  ? i === 0 && accentFirst
                    ? 'bg-violet-500 text-white scale-110'
                    : 'bg-cyan-500 text-white scale-110'
                  : 'bg-zinc-800 text-zinc-500'
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            size="lg"
            variant={isPlaying ? 'destructive' : 'default'}
            onClick={togglePlay}
            className="w-32"
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={handleTap}>
            <Hand className="mr-2 h-5 w-5" />
            Tap
          </Button>
        </div>

        {/* BPM Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>30</span>
            <span>Tempo</span>
            <span>300</span>
          </div>
          <Slider
            value={[bpm]}
            min={30}
            max={300}
            step={1}
            onValueChange={([value]) => setBpm(value)}
          />
        </div>

        {/* Quick BPM Buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          {[60, 80, 100, 120, 140, 160, 180].map((tempo) => (
            <Button
              key={tempo}
              size="sm"
              variant={bpm === tempo ? 'default' : 'outline'}
              onClick={() => setBpm(tempo)}
            >
              {tempo}
            </Button>
          ))}
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-400 mb-2 block">Time Signature</Label>
            <Select
              value={timeSignature.toString()}
              onValueChange={(v) => setTimeSignature(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2/4</SelectItem>
                <SelectItem value="3">3/4</SelectItem>
                <SelectItem value="4">4/4</SelectItem>
                <SelectItem value="5">5/4</SelectItem>
                <SelectItem value="6">6/8</SelectItem>
                <SelectItem value="7">7/8</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 mb-2 block">Volume</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                onValueChange={([v]) => setVolume(v / 100)}
                disabled={isMuted}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="accent" className="text-zinc-400">Accent first beat</Label>
          <Switch
            id="accent"
            checked={accentFirst}
            onCheckedChange={setAccentFirst}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// DRUM SEQUENCER COMPONENT
// ============================================

type DrumType = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom';

const DRUM_TRACKS: { type: DrumType; label: string; color: string }[] = [
  { type: 'kick', label: 'Kick', color: 'bg-red-500' },
  { type: 'snare', label: 'Snare', color: 'bg-orange-500' },
  { type: 'hihat', label: 'Hi-Hat', color: 'bg-yellow-500' },
  { type: 'clap', label: 'Clap', color: 'bg-green-500' },
  { type: 'tom', label: 'Tom', color: 'bg-blue-500' },
];

function DrumSequencer() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(16);
  const [pattern, setPattern] = useState<Record<DrumType, boolean[]>>(() => {
    const initial: Record<DrumType, boolean[]> = {} as any;
    DRUM_TRACKS.forEach((track) => {
      initial[track.type] = Array(16).fill(false);
    });
    // Default pattern
    initial.kick[0] = true;
    initial.kick[4] = true;
    initial.kick[8] = true;
    initial.kick[12] = true;
    initial.snare[4] = true;
    initial.snare[12] = true;
    initial.hihat = Array(16).fill(true);
    return initial;
  });
  const [volume, setVolume] = useState(0.7);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleStep = (track: DrumType, step: number) => {
    setPattern((prev) => ({
      ...prev,
      [track]: prev[track].map((v, i) => (i === step ? !v : v)),
    }));
  };

  const clearPattern = () => {
    setPattern((prev) => {
      const cleared: Record<DrumType, boolean[]> = {} as any;
      DRUM_TRACKS.forEach((track) => {
        cleared[track.type] = Array(steps).fill(false);
      });
      return cleared;
    });
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm / 4) * 1000; // 16th notes
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const nextStep = (prev + 1) % steps;
          // Play sounds for active tracks
          DRUM_TRACKS.forEach((track) => {
            if (pattern[track.type][nextStep]) {
              playDrumSound(track.type, volume);
            }
          });
          return nextStep;
        });
      }, interval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentStep(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm, steps, pattern, volume]);

  const togglePlay = () => {
    getAudioContext();
    setIsPlaying(!isPlaying);
  };

  const previewSound = (type: DrumType) => {
    getAudioContext();
    playDrumSound(type, volume);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Drum className="h-5 w-5 text-orange-400" />
          Drum Sequencer
        </CardTitle>
        <CardDescription>Create drum patterns with a 16-step sequencer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isPlaying ? 'destructive' : 'default'}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>
          <Button variant="outline" onClick={clearPattern}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <div className="flex items-center gap-2">
            <Label className="text-zinc-400 whitespace-nowrap">BPM:</Label>
            <Input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Math.max(30, Math.min(300, parseInt(e.target.value) || 120)))}
              className="w-20"
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-2 ml-20">
              {Array.from({ length: steps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-8 h-6 flex items-center justify-center text-xs rounded',
                    currentStep === i && isPlaying
                      ? 'bg-violet-500 text-white'
                      : i % 4 === 0
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-zinc-800 text-zinc-500'
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Tracks */}
            {DRUM_TRACKS.map((track) => (
              <div key={track.type} className="flex items-center gap-1 mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-20 justify-start text-xs"
                  onClick={() => previewSound(track.type)}
                >
                  <div className={cn('w-2 h-2 rounded-full mr-2', track.color)} />
                  {track.label}
                </Button>
                {Array.from({ length: steps }).map((_, step) => (
                  <button
                    key={step}
                    onClick={() => toggleStep(track.type, step)}
                    className={cn(
                      'w-8 h-8 rounded transition-all border',
                      pattern[track.type][step]
                        ? `${track.color} border-transparent`
                        : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500',
                      currentStep === step && isPlaying && 'ring-2 ring-white'
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-zinc-400" />
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            onValueChange={([v]) => setVolume(v / 100)}
            className="w-32"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// METRIC MODULATION CALCULATOR
// ============================================

const NOTE_VALUES = [
  { value: 1, label: 'Whole', symbol: '𝅝' },
  { value: 0.5, label: 'Half', symbol: '𝅗𝅥' },
  { value: 0.25, label: 'Quarter', symbol: '♩' },
  { value: 0.125, label: 'Eighth', symbol: '♪' },
  { value: 0.0625, label: 'Sixteenth', symbol: '𝅘𝅥𝅯' },
  { value: 1/3, label: 'Half Triplet', symbol: '𝅗𝅥³' },
  { value: 1/6, label: 'Quarter Triplet', symbol: '♩³' },
  { value: 1/12, label: 'Eighth Triplet', symbol: '♪³' },
  { value: 0.375, label: 'Dotted Quarter', symbol: '♩.' },
  { value: 0.1875, label: 'Dotted Eighth', symbol: '♪.' },
];

function MetricModulationCalculator() {
  const [sourceBpm, setSourceBpm] = useState(120);
  const [sourceNote, setSourceNote] = useState(0.25); // Quarter note
  const [targetNote, setTargetNote] = useState(0.125); // Eighth note

  const targetBpm = Math.round((sourceBpm * sourceNote) / targetNote);

  const commonModulations = [
    { from: 0.25, to: 1/6, label: '♩ = ♩³ (Quarter = Quarter Triplet)' },
    { from: 0.25, to: 0.375, label: '♩ = ♩. (Quarter = Dotted Quarter)' },
    { from: 0.125, to: 1/12, label: '♪ = ♪³ (Eighth = Eighth Triplet)' },
    { from: 0.25, to: 0.1875, label: '♩ = ♪. (Quarter = Dotted Eighth)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-green-400" />
          Metric Modulation Calculator
        </CardTitle>
        <CardDescription>Calculate tempo changes between note values</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-400 mb-2 block">Source Tempo (BPM)</Label>
            <Input
              type="number"
              value={sourceBpm}
              onChange={(e) => setSourceBpm(Math.max(1, parseInt(e.target.value) || 120))}
            />
          </div>
          <div>
            <Label className="text-zinc-400 mb-2 block">Source Note Value</Label>
            <Select
              value={sourceNote.toString()}
              onValueChange={(v) => setSourceNote(parseFloat(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_VALUES.map((note) => (
                  <SelectItem key={note.value} value={note.value.toString()}>
                    {note.symbol} {note.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Equals sign */}
        <div className="text-center text-4xl text-zinc-500">=</div>

        {/* Target */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-400 mb-2 block">Target Tempo (BPM)</Label>
            <div className="text-4xl font-bold text-violet-400">{targetBpm}</div>
          </div>
          <div>
            <Label className="text-zinc-400 mb-2 block">Target Note Value</Label>
            <Select
              value={targetNote.toString()}
              onValueChange={(v) => setTargetNote(parseFloat(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_VALUES.map((note) => (
                  <SelectItem key={note.value} value={note.value.toString()}>
                    {note.symbol} {note.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-sm text-zinc-300">
            At <strong>{sourceBpm} BPM</strong>, one{' '}
            <strong>{NOTE_VALUES.find((n) => n.value === sourceNote)?.label}</strong> note equals one{' '}
            <strong>{NOTE_VALUES.find((n) => n.value === targetNote)?.label}</strong> note at{' '}
            <strong className="text-violet-400">{targetBpm} BPM</strong>.
          </p>
        </div>

        {/* Common Modulations */}
        <div>
          <Label className="text-zinc-400 mb-2 block">Common Modulations</Label>
          <div className="flex flex-wrap gap-2">
            {commonModulations.map((mod, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => {
                  setSourceNote(mod.from);
                  setTargetNote(mod.to);
                }}
              >
                {mod.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// NOTE FREQUENCY CALCULATOR
// ============================================

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function NoteFrequencyCalculator() {
  const [note, setNote] = useState('A');
  const [octave, setOctave] = useState(4);

  const noteIndex = NOTES.indexOf(note);
  const semitonesFromA4 = noteIndex - 9 + (octave - 4) * 12;
  const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);
  const wavelength = 34300 / frequency; // Speed of sound in cm/s divided by frequency

  const playNote = () => {
    getAudioContext();
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-cyan-400" />
          Note Frequency Calculator
        </CardTitle>
        <CardDescription>Find the frequency of any musical note</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-400 mb-2 block">Note</Label>
            <Select value={note} onValueChange={setNote}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 mb-2 block">Octave</Label>
            <Select value={octave.toString()} onValueChange={(v) => setOctave(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((o) => (
                  <SelectItem key={o} value={o.toString()}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center">
          <div className="text-5xl font-bold text-white mb-1">
            {note}
            <sub className="text-2xl">{octave}</sub>
          </div>
          <div className="text-3xl font-mono text-cyan-400">{frequency.toFixed(2)} Hz</div>
          <div className="text-sm text-zinc-400 mt-2">
            Wavelength: {wavelength.toFixed(2)} cm
          </div>
        </div>

        <Button onClick={playNote} className="w-full">
          <Volume2 className="mr-2 h-4 w-4" />
          Play Note
        </Button>

        {/* Reference notes */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { note: 'A', octave: 4, label: 'A4 = 440Hz' },
            { note: 'C', octave: 4, label: 'Middle C' },
            { note: 'E', octave: 2, label: 'Low E (guitar)' },
            { note: 'E', octave: 4, label: 'High E (guitar)' },
          ].map((ref, i) => (
            <Button
              key={i}
              size="sm"
              variant="outline"
              onClick={() => {
                setNote(ref.note);
                setOctave(ref.octave);
              }}
            >
              {ref.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// TAP TEMPO TOOL
// ============================================

function TapTempo() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState<number | null>(null);

  const handleTap = () => {
    getAudioContext();
    playClick(1000, 0.03, 0.5);

    const now = Date.now();
    const newTaps = [...taps, now].filter((t) => now - t < 5000).slice(-12);
    setTaps(newTaps);
    setLastTap(now);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 20 && calculatedBpm <= 400) {
        setBpm(calculatedBpm);
      }
    }
  };

  const reset = () => {
    setTaps([]);
    setBpm(null);
    setLastTap(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="h-5 w-5 text-pink-400" />
          Tap Tempo
        </CardTitle>
        <CardDescription>Tap to find the tempo of a song</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          {bpm ? (
            <>
              <div className="text-6xl font-bold text-white mb-2">{bpm}</div>
              <div className="text-zinc-400">BPM</div>
              <div className="text-sm text-zinc-500 mt-2">
                {taps.length} taps recorded
              </div>
            </>
          ) : (
            <div className="text-2xl text-zinc-500">Tap to start</div>
          )}
        </div>

        <Button
          size="lg"
          className="w-full h-32 text-2xl"
          onClick={handleTap}
        >
          <Hand className="mr-3 h-8 w-8" />
          TAP
        </Button>

        <Button variant="outline" onClick={reset} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>

        {bpm && (
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Ms per beat:</span>
              <span className="text-white font-mono">{Math.round(60000 / bpm)} ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Beats per second:</span>
              <span className="text-white font-mono">{(bpm / 60).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Bars per minute (4/4):</span>
              <span className="text-white font-mono">{(bpm / 4).toFixed(1)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// INTERVAL CALCULATOR
// ============================================

const INTERVALS = [
  { semitones: 0, name: 'Unison', abbr: 'P1' },
  { semitones: 1, name: 'Minor 2nd', abbr: 'm2' },
  { semitones: 2, name: 'Major 2nd', abbr: 'M2' },
  { semitones: 3, name: 'Minor 3rd', abbr: 'm3' },
  { semitones: 4, name: 'Major 3rd', abbr: 'M3' },
  { semitones: 5, name: 'Perfect 4th', abbr: 'P4' },
  { semitones: 6, name: 'Tritone', abbr: 'TT' },
  { semitones: 7, name: 'Perfect 5th', abbr: 'P5' },
  { semitones: 8, name: 'Minor 6th', abbr: 'm6' },
  { semitones: 9, name: 'Major 6th', abbr: 'M6' },
  { semitones: 10, name: 'Minor 7th', abbr: 'm7' },
  { semitones: 11, name: 'Major 7th', abbr: 'M7' },
  { semitones: 12, name: 'Octave', abbr: 'P8' },
];

function IntervalCalculator() {
  const [rootNote, setRootNote] = useState('C');
  const [rootOctave, setRootOctave] = useState(4);
  const [selectedInterval, setSelectedInterval] = useState(7); // Perfect 5th

  const rootIndex = NOTES.indexOf(rootNote);
  const targetIndex = (rootIndex + selectedInterval) % 12;
  const targetNote = NOTES[targetIndex];
  const targetOctave = rootOctave + Math.floor((rootIndex + selectedInterval) / 12);

  const getRootFreq = () => {
    const semitonesFromA4 = rootIndex - 9 + (rootOctave - 4) * 12;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  };

  const getTargetFreq = () => {
    const semitonesFromA4 = targetIndex - 9 + (targetOctave - 4) * 12;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  };

  const playInterval = () => {
    getAudioContext();
    const ctx = getAudioContext();

    // Play root
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = getRootFreq();
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1);

    // Play target after short delay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = getTargetFreq();
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc2.start(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 1.5);
  };

  const playTogether = () => {
    getAudioContext();
    const ctx = getAudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.frequency.value = getRootFreq();
    osc2.frequency.value = getTargetFreq();
    osc1.type = 'sine';
    osc2.type = 'sine';

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-yellow-400" />
          Interval Calculator
        </CardTitle>
        <CardDescription>Learn and hear musical intervals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-400 mb-2 block">Root Note</Label>
            <Select value={rootNote} onValueChange={setRootNote}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 mb-2 block">Octave</Label>
            <Select value={rootOctave.toString()} onValueChange={(v) => setRootOctave(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((o) => (
                  <SelectItem key={o} value={o.toString()}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-zinc-400 mb-2 block">Interval</Label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {INTERVALS.map((interval) => (
              <Button
                key={interval.semitones}
                size="sm"
                variant={selectedInterval === interval.semitones ? 'default' : 'outline'}
                onClick={() => setSelectedInterval(interval.semitones)}
                className="text-xs"
              >
                {interval.abbr}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center py-4">
          <div className="text-lg text-zinc-400 mb-2">
            {INTERVALS.find((i) => i.semitones === selectedInterval)?.name}
          </div>
          <div className="text-3xl font-bold text-white">
            {rootNote}{rootOctave} → {targetNote}{targetOctave}
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            {getRootFreq().toFixed(1)} Hz → {getTargetFreq().toFixed(1)} Hz
          </div>
          <div className="text-sm text-zinc-500">
            Ratio: {(getTargetFreq() / getRootFreq()).toFixed(4)}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={playInterval} className="flex-1">
            <Volume2 className="mr-2 h-4 w-4" />
            Play Separately
          </Button>
          <Button onClick={playTogether} variant="outline" className="flex-1">
            <Volume2 className="mr-2 h-4 w-4" />
            Play Together
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN TOOLS PAGE
// ============================================

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Music Tools</h1>
        <p className="mt-1 text-zinc-400">
          Practice and production tools for musicians
        </p>
      </div>

      <Tabs defaultValue="metronome" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="metronome" className="gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Metronome</span>
          </TabsTrigger>
          <TabsTrigger value="drums" className="gap-2">
            <Drum className="h-4 w-4" />
            <span className="hidden sm:inline">Drums</span>
          </TabsTrigger>
          <TabsTrigger value="tempo" className="gap-2">
            <Hand className="h-4 w-4" />
            <span className="hidden sm:inline">Tap Tempo</span>
          </TabsTrigger>
          <TabsTrigger value="modulation" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Modulation</span>
          </TabsTrigger>
          <TabsTrigger value="frequency" className="gap-2">
            <Waves className="h-4 w-4" />
            <span className="hidden sm:inline">Frequency</span>
          </TabsTrigger>
          <TabsTrigger value="intervals" className="gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Intervals</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metronome">
          <Metronome />
        </TabsContent>

        <TabsContent value="drums">
          <DrumSequencer />
        </TabsContent>

        <TabsContent value="tempo">
          <TapTempo />
        </TabsContent>

        <TabsContent value="modulation">
          <MetricModulationCalculator />
        </TabsContent>

        <TabsContent value="frequency">
          <NoteFrequencyCalculator />
        </TabsContent>

        <TabsContent value="intervals">
          <IntervalCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
