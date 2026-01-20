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
  Piano,
  Mic,
  Ear,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PianoKeyboard } from '@/components/tools/piano-keyboard';
import { Tuner } from '@/components/tools/tuner';
import { EarTraining } from '@/components/tools/ear-training';

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

function playWaveform(type: 'sine' | 'sawtooth' | 'triangle', frequency: number = 440, duration: number = 0.1, volume: number = 0.5) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// ============================================
// METRONOME COMPONENT
// ============================================

function Metronome() {
  const [bpm, setBpm] = useState<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubdivision, setCurrentSubdivision] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [subdivision, setSubdivision] = useState(1); // 1 = quarter, 2 = eighth, 4 = sixteenth, 3 = triplets
  const [accentFirst, setAccentFirst] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [swing, setSwing] = useState(0); // 0 = straight, up to 0.5 = heavy swing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const beatCountRef = useRef(0);

  const startMetronome = useCallback(() => {
    if (!bpm || bpm <= 0) return;
    const baseInterval = (60 / bpm) * 1000;
    const subInterval = baseInterval / subdivision;
    beatCountRef.current = 0;

    const tick = () => {
      const subBeat = beatCountRef.current % subdivision;
      const mainBeat = Math.floor(beatCountRef.current / subdivision) % timeSignature;

      setCurrentBeat(mainBeat);
      setCurrentSubdivision(subBeat);

      if (!isMuted) {
        if (subBeat === 0) {
          // Main beat
          if (accentFirst && mainBeat === 0) {
            playClick(1200, 0.08, volume);
          } else {
            playClick(800, 0.05, volume * 0.7);
          }
        } else {
          // Subdivision click (softer, higher pitch)
          playClick(1000, 0.03, volume * 0.3);
        }
      }

      beatCountRef.current++;

      // Calculate next interval with swing
      let nextInterval = subInterval;
      if (swing > 0 && subdivision === 2) {
        // Apply swing only to eighth notes
        const isOffbeat = beatCountRef.current % 2 === 1;
        if (isOffbeat) {
          nextInterval = subInterval * (1 + swing);
        } else {
          nextInterval = subInterval * (1 - swing);
        }
      }

      intervalRef.current = setTimeout(tick, nextInterval);
    };

    tick();
  }, [bpm, timeSignature, subdivision, accentFirst, volume, isMuted, swing]);

  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      startMetronome();
    } else {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      setCurrentBeat(0);
      setCurrentSubdivision(0);
      beatCountRef.current = 0;
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isPlaying, startMetronome]);

  const togglePlay = () => {
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
      if (calculatedBpm >= 20 && calculatedBpm <= 999) {
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
        <CardDescription>Keep time with adjustable tempo, subdivisions and swing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BPM Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-2">{bpm ?? '--'}</div>
          <div className="text-zinc-400">BPM</div>
        </div>

        {/* Beat Indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: timeSignature }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
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
              {/* Subdivision dots */}
              {subdivision > 1 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: subdivision }).map((_, s) => (
                    <div
                      key={s}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        currentBeat === i && currentSubdivision === s && isPlaying
                          ? 'bg-cyan-400'
                          : 'bg-zinc-700'
                      )}
                    />
                  ))}
                </div>
              )}
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
            <span>300+</span>
          </div>
          <Slider
            value={[bpm ?? 120]}
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
            <Label className="text-zinc-400 mb-2 block">Subdivision</Label>
            <Select
              value={subdivision.toString()}
              onValueChange={(v) => setSubdivision(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Quarter ♩</SelectItem>
                <SelectItem value="2">Eighth ♪♪</SelectItem>
                <SelectItem value="3">Triplets ♪³</SelectItem>
                <SelectItem value="4">Sixteenth 𝅘𝅥𝅯</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <Label className="text-zinc-400 mb-2 block">Swing {swing > 0 ? `${Math.round(swing * 100)}%` : 'Off'}</Label>
            <Slider
              value={[swing * 100]}
              min={0}
              max={50}
              step={5}
              onValueChange={([v]) => setSwing(v / 100)}
              disabled={subdivision !== 2}
            />
            {subdivision !== 2 && (
              <p className="text-xs text-zinc-500 mt-1">Swing only works with eighth notes</p>
            )}
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

// Pattern presets
const DRUM_PRESETS: { name: string; pattern: Record<DrumType, boolean[]> }[] = [
  {
    name: 'Basic Rock',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Four on the Floor',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Disco',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Hip Hop',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Funk',
    pattern: {
      kick: [true, false, false, true, false, false, true, false, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, true, false],
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Reggae',
    pattern: {
      kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false],
      snare: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Latin',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      snare: Array(16).fill(false),
      hihat: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, false],
      clap: [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false],
      tom: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true],
    },
  },
  {
    name: 'Breakbeat',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, true, false, false, true, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Trap',
    pattern: {
      kick: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'House',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: Array(16).fill(false),
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Techno',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: Array(16).fill(false),
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
    },
  },
  {
    name: 'Shuffle',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Bossa Nova',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, true, false, false, false, false, true, false],
      snare: Array(16).fill(false),
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false],
      tom: [false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false],
    },
  },
  {
    name: 'Metal',
    pattern: {
      kick: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Punk',
    pattern: {
      kick: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Ska',
    pattern: {
      kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Dubstep',
    pattern: {
      kick: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Drill',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, false, false, true, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, true, false, false, true, false, false],
      hihat: [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Afrobeat',
    pattern: {
      kick: [true, false, false, false, true, false, false, true, false, false, true, false, false, false, true, false],
      snare: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false],
    },
  },
  {
    name: 'DnB',
    pattern: {
      kick: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, true, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Garage',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, true, false, false, true, false],
      hihat: [true, false, true, true, true, false, true, true, true, false, true, true, true, false, true, true],
      clap: Array(16).fill(false),
      tom: Array(16).fill(false),
    },
  },
  {
    name: 'Jazz',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      snare: Array(16).fill(false),
      hihat: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: [false, false, true, false, false, false, false, false, true, false, false, false, false, false, true, false],
    },
  },
  {
    name: 'Samba',
    pattern: {
      kick: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
      snare: [false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: Array(16).fill(false),
      tom: [false, false, false, false, false, true, false, true, false, false, false, false, false, true, false, true],
    },
  },
  {
    name: 'Motown',
    pattern: {
      kick: [true, false, false, false, true, false, false, true, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      clap: Array(16).fill(false),
      tom: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
    },
  },
  {
    name: 'New Wave',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom: Array(16).fill(false),
    },
  },
];

function DrumSequencer() {
  const [bpm, setBpm] = useState<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(16);
  const [pattern, setPattern] = useState<Record<DrumType, boolean[]>>(() => {
    const initial: Record<DrumType, boolean[]> = {} as any;
    DRUM_TRACKS.forEach((track) => {
      initial[track.type] = Array(16).fill(false);
    });
    // Default pattern (Basic Rock)
    initial.kick[0] = true;
    initial.kick[4] = true;
    initial.kick[8] = true;
    initial.kick[12] = true;
    initial.snare[4] = true;
    initial.snare[12] = true;
    initial.hihat = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
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
    setPattern(() => {
      const cleared: Record<DrumType, boolean[]> = {} as any;
      DRUM_TRACKS.forEach((track) => {
        cleared[track.type] = Array(steps).fill(false);
      });
      return cleared;
    });
  };

  const loadPreset = (preset: typeof DRUM_PRESETS[0]) => {
    setPattern({ ...preset.pattern });
  };

  useEffect(() => {
    if (isPlaying && bpm && bpm > 0) {
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
              value={bpm ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setBpm(val === '' ? undefined : Math.max(1, parseInt(val)));
              }}
              placeholder="120"
              className="w-24 sm:w-28"
            />
          </div>
        </div>

        {/* Pattern Presets */}
        <div>
          <Label className="text-zinc-400 mb-2 block text-sm">Pattern Presets</Label>
          <div className="flex flex-wrap gap-2">
            {DRUM_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                size="sm"
                variant="outline"
                onClick={() => loadPreset(preset)}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
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
  { value: 1, label: 'Whole', symbol: '𝅝', shortLabel: 'Whole' },
  { value: 0.5, label: 'Half', symbol: '𝅗𝅥', shortLabel: 'Half' },
  { value: 0.25, label: 'Quarter', symbol: '♩', shortLabel: '♩' },
  { value: 0.125, label: 'Eighth', symbol: '♪', shortLabel: '♪' },
  { value: 0.0625, label: 'Sixteenth', symbol: '𝅘𝅥𝅯', shortLabel: '16th' },
  { value: 1/3, label: 'Half Triplet', symbol: '𝅗𝅥³', shortLabel: 'Half³' },
  { value: 1/6, label: 'Quarter Triplet', symbol: '♩³', shortLabel: '♩³' },
  { value: 1/12, label: 'Eighth Triplet', symbol: '♪³', shortLabel: '♪³' },
  { value: 0.375, label: 'Dotted Quarter', symbol: '♩.', shortLabel: '♩.' },
  { value: 0.1875, label: 'Dotted Eighth', symbol: '♪.', shortLabel: '♪.' },
  { value: 0.09375, label: 'Dotted Sixteenth', symbol: '𝅘𝅥𝅯.', shortLabel: '16th.' },
];

// Modulation relationships - what the source note equals in the new tempo
const MODULATION_PAIRS = [
  { from: '♩', fromValue: 0.25, to: '♪', toValue: 0.125, desc: 'Quarter = Eighth (2x)' },
  { from: '♩', fromValue: 0.25, to: '♩³', toValue: 1/6, desc: 'Quarter = Quarter Triplet' },
  { from: '♩', fromValue: 0.25, to: '♩.', toValue: 0.375, desc: 'Quarter = Dotted Quarter' },
  { from: '♩', fromValue: 0.25, to: '♪.', toValue: 0.1875, desc: 'Quarter = Dotted Eighth' },
  { from: '♩', fromValue: 0.25, to: '♪³', toValue: 1/12, desc: 'Quarter = Eighth Triplet' },
  { from: '♪', fromValue: 0.125, to: '♪³', toValue: 1/12, desc: 'Eighth = Eighth Triplet' },
  { from: '♪', fromValue: 0.125, to: '♩³', toValue: 1/6, desc: 'Eighth = Quarter Triplet' },
  { from: '♪', fromValue: 0.125, to: '♪.', toValue: 0.1875, desc: 'Eighth = Dotted Eighth' },
  { from: '♩.', fromValue: 0.375, to: '♩', toValue: 0.25, desc: 'Dotted Quarter = Quarter' },
  { from: '♩.', fromValue: 0.375, to: '♪', toValue: 0.125, desc: 'Dotted Quarter = Eighth' },
  { from: '♩³', fromValue: 1/6, to: '♩', toValue: 0.25, desc: 'Quarter Triplet = Quarter' },
  { from: '♩³', fromValue: 1/6, to: '♪', toValue: 0.125, desc: 'Quarter Triplet = Eighth' },
  { from: '♪³', fromValue: 1/12, to: '♪', toValue: 0.125, desc: 'Eighth Triplet = Eighth' },
  { from: '♪³', fromValue: 1/12, to: '♩', toValue: 0.25, desc: 'Eighth Triplet = Quarter' },
];

function MetricModulationCalculator() {
  const [sourceBpm, setSourceBpm] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'calculator'>('table');
  const [sourceNote, setSourceNote] = useState(0.25); // Quarter note
  const [targetNote, setTargetNote] = useState(0.125); // Eighth note

  // Calculate all modulations for table view
  const allModulations = MODULATION_PAIRS.map((pair) => ({
    ...pair,
    newTempo: sourceBpm ? Math.round((sourceBpm * pair.fromValue) / pair.toValue) : 0,
  }));

  const targetBpm = sourceBpm ? Math.round((sourceBpm * sourceNote) / targetNote) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4 text-green-400" />
            Metric Modulation
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              className="h-7 text-xs px-2"
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'calculator' ? 'default' : 'ghost'}
              onClick={() => setViewMode('calculator')}
              className="h-7 text-xs px-2"
            >
              Calc
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Compact tempo input */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="number"
            value={sourceBpm ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setSourceBpm(val === '' ? undefined : Math.max(1, parseInt(val)));
            }}
            placeholder="120"
            className="text-xl h-10 text-center font-bold w-24 sm:w-28"
          />
          <span className="text-zinc-400 text-sm">BPM</span>
          <div className="flex gap-1 ml-auto">
            {[60, 90, 120, 140, 180].map((tempo) => (
              <Button
                key={tempo}
                size="sm"
                variant={sourceBpm === tempo ? 'default' : 'outline'}
                onClick={() => setSourceBpm(tempo)}
                className="h-7 px-2 text-xs"
              >
                {tempo}
              </Button>
            ))}
          </div>
        </div>

        {viewMode === 'table' ? (
          /* Compact grid view - all modulations visible */
          <div className="space-y-2">
            {/* Main modulations grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
              {allModulations.map((mod, i) => {
                const isIncrease = sourceBpm ? mod.newTempo > sourceBpm : false;
                return (
                  <div
                    key={i}
                    className="bg-zinc-800/50 rounded px-2 py-1.5 hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="text-xs text-zinc-400">
                      {mod.from}<span className="mx-1">=</span>{mod.to}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      isIncrease ? "text-red-400" : "text-cyan-400"
                    )}>
                      {mod.newTempo}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick reference - inline */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-zinc-800">
              <div className="text-center">
                <div className="text-[10px] text-zinc-500">½</div>
                <div className="text-sm font-bold text-white">{sourceBpm ? Math.round(sourceBpm / 2) : '--'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500">2×</div>
                <div className="text-sm font-bold text-white">{sourceBpm ? sourceBpm * 2 : '--'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500">×1.5</div>
                <div className="text-sm font-bold text-white">{sourceBpm ? Math.round(sourceBpm * 1.5) : '--'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500">×⅔</div>
                <div className="text-sm font-bold text-white">{sourceBpm ? Math.round(sourceBpm * 2/3) : '--'}</div>
              </div>
            </div>
          </div>
        ) : (
          /* Calculator view - compact */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-zinc-400 mb-1 block text-xs">Source</Label>
                <Select
                  value={sourceNote.toString()}
                  onValueChange={(v) => setSourceNote(parseFloat(v))}
                >
                  <SelectTrigger className="h-8">
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
              <div>
                <Label className="text-zinc-400 mb-1 block text-xs">Target</Label>
                <Select
                  value={targetNote.toString()}
                  onValueChange={(v) => setTargetNote(parseFloat(v))}
                >
                  <SelectTrigger className="h-8">
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

            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-zinc-400 text-sm">
                  {NOTE_VALUES.find((n) => n.value === sourceNote)?.symbol} @ {sourceBpm ?? '--'}
                </span>
                <span className="text-zinc-500">=</span>
                <span className="text-zinc-400 text-sm">
                  {NOTE_VALUES.find((n) => n.value === targetNote)?.symbol} @
                </span>
                <span className="text-3xl font-bold text-violet-400">{targetBpm || '--'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// DELAY TIME CALCULATOR
// ============================================

function DelayTimeCalculator() {
  const [bpm, setBpm] = useState<number | undefined>(undefined);

  const msPerBeat = bpm ? 60000 / bpm : 0;

  const delayTimes = [
    { name: 'Whole', multiplier: 4, symbol: '𝅝' },
    { name: 'Half', multiplier: 2, symbol: '𝅗𝅥' },
    { name: 'Quarter', multiplier: 1, symbol: '♩' },
    { name: 'Eighth', multiplier: 0.5, symbol: '♪' },
    { name: 'Sixteenth', multiplier: 0.25, symbol: '𝅘𝅥𝅯' },
    { name: 'Thirty-second', multiplier: 0.125, symbol: '𝅘𝅥𝅰' },
  ];

  const dotted = (ms: number) => ms * 1.5;
  const triplet = (ms: number) => ms * (2/3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-purple-400" />
          Delay Time Calculator
        </CardTitle>
        <CardDescription>Calculate delay/reverb times synced to your tempo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BPM Input */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div>
            <Label className="text-zinc-400 mb-2 block">Tempo</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={bpm ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setBpm(val === '' ? undefined : Math.max(1, parseInt(val)));
                }}
                placeholder="120"
                className="text-2xl h-14 text-center font-bold w-32 sm:w-36"
              />
              <span className="text-zinc-400 text-lg">BPM</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[80, 100, 120, 140, 160].map((tempo) => (
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
        </div>

        {/* Delay Times Table */}
        <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-2 p-3 bg-zinc-700/50 text-sm font-medium text-zinc-300">
            <div>Note</div>
            <div className="text-center">Normal</div>
            <div className="text-center">Dotted</div>
            <div className="text-center">Triplet</div>
          </div>
          <div className="divide-y divide-zinc-700/50">
            {delayTimes.map((note) => {
              const normalMs = msPerBeat * note.multiplier;
              return (
                <div key={note.name} className="grid grid-cols-4 gap-2 p-3 items-center">
                  <div className="text-sm">
                    <span className="text-white mr-2">{note.symbol}</span>
                    <span className="text-zinc-400 hidden sm:inline">{note.name}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-mono">{normalMs.toFixed(1)}</div>
                    <div className="text-zinc-500 text-xs">ms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-mono">{dotted(normalMs).toFixed(1)}</div>
                    <div className="text-zinc-500 text-xs">ms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-cyan-400 font-mono">{triplet(normalMs).toFixed(1)}</div>
                    <div className="text-zinc-500 text-xs">ms</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hz for reverb */}
        <div className="bg-zinc-800/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">Frequency Reference (Hz)</h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
            {delayTimes.slice(0, 6).map((note) => {
              const hz = 1000 / (msPerBeat * note.multiplier);
              return (
                <div key={note.name} className="bg-zinc-800/50 rounded p-2 text-center">
                  <div className="text-zinc-500 text-xs">{note.symbol}</div>
                  <div className="text-white font-mono">{hz.toFixed(2)}</div>
                  <div className="text-zinc-500 text-xs">Hz</div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SONG TIME CALCULATOR
// ============================================

function SongTimeCalculator() {
  const [bpm, setBpm] = useState<number | undefined>(undefined);
  const [bars, setBars] = useState(32);
  const [beatsPerBar, setBeatsPerBar] = useState(4);

  const totalBeats = bars * beatsPerBar;
  const totalSeconds = bpm ? (totalBeats / bpm) * 60 : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  // Reverse calculation
  const [targetMinutes, setTargetMinutes] = useState(3);
  const [targetSeconds, setTargetSeconds] = useState(30);
  const targetTotalSeconds = targetMinutes * 60 + targetSeconds;
  const barsNeeded = bpm ? Math.round((targetTotalSeconds * bpm) / (60 * beatsPerBar)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-emerald-400" />
          Song Time Calculator
        </CardTitle>
        <CardDescription>Calculate song duration from bars or bars from duration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shared BPM */}
        <div>
          <Label className="text-zinc-400 mb-2 block">Tempo (BPM)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={bpm ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setBpm(val === '' ? undefined : Math.max(1, parseInt(val)));
              }}
              placeholder="120"
              className="w-24 sm:w-28"
            />
            <Select value={beatsPerBar.toString()} onValueChange={(v) => setBeatsPerBar(parseInt(v))}>
              <SelectTrigger className="w-20 sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3/4</SelectItem>
                <SelectItem value="4">4/4</SelectItem>
                <SelectItem value="5">5/4</SelectItem>
                <SelectItem value="6">6/8</SelectItem>
                <SelectItem value="7">7/8</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bars to Time */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Bars → Time</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-400 text-sm">Number of bars</Label>
                <Input
                  type="number"
                  value={bars}
                  onChange={(e) => setBars(Math.max(1, parseInt(e.target.value) || 32))}
                />
              </div>
              <div className="text-center py-3">
                <div className="text-4xl font-bold text-emerald-400">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-zinc-500 text-sm mt-1">
                  {totalBeats} beats total
                </div>
              </div>
            </div>
          </div>

          {/* Time to Bars */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Time → Bars</h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-zinc-400 text-sm">Minutes</Label>
                  <Input
                    type="number"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-zinc-400 text-sm">Seconds</Label>
                  <Input
                    type="number"
                    value={targetSeconds}
                    onChange={(e) => setTargetSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                </div>
              </div>
              <div className="text-center py-3">
                <div className="text-4xl font-bold text-cyan-400">
                  {barsNeeded}
                </div>
                <div className="text-zinc-500 text-sm mt-1">
                  bars needed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common song sections */}
        <div className="bg-zinc-800/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">Common Sections at {bpm ?? '--'} BPM</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'Intro (4 bars)', bars: 4 },
              { name: 'Verse (16 bars)', bars: 16 },
              { name: 'Chorus (8 bars)', bars: 8 },
              { name: 'Bridge (8 bars)', bars: 8 },
            ].map((section) => {
              const secs = bpm ? (section.bars * beatsPerBar / bpm) * 60 : 0;
              return (
                <div key={section.name} className="bg-zinc-800/50 rounded p-2 text-center">
                  <div className="text-zinc-400 text-xs">{section.name}</div>
                  <div className="text-white font-bold">
                    {Math.floor(secs / 60)}:{Math.round(secs % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// POLYRHYTHM TOOL
// ============================================

type SoundType = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'sine' | 'sawtooth' | 'triangle';

interface RhythmConfig {
  id: number;
  rhythm: number;
  subdivision: number;
  sound: SoundType;
  volume: number;
  frequency: number;
  currentBeat: number;
  color: string;
}

function PolyrhythmTool() {
  const [rhythms, setRhythms] = useState<RhythmConfig[]>([
    { id: 1, rhythm: 3, subdivision: 1, sound: 'kick', volume: 0.7, frequency: 880, currentBeat: 0, color: 'amber' },
    { id: 2, rhythm: 2, subdivision: 1, sound: 'snare', volume: 0.7, frequency: 440, currentBeat: 0, color: 'violet' },
  ]);
  const [bpm, setBpm] = useState<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const nextId = useRef(3);

  const baseRhythm = rhythms.length > 0 ? rhythms[rhythms.length - 1].rhythm : 2;
  const cycleDuration = bpm && bpm > 0 ? (60 / bpm) * 1000 * baseRhythm : 1000000; // Full cycle in ms

  const playSound = (config: RhythmConfig) => {
    if (['sine', 'sawtooth', 'triangle'].includes(config.sound)) {
      playWaveform(config.sound as 'sine' | 'sawtooth' | 'triangle', config.frequency, 0.1, config.volume);
    } else {
      playDrumSound(config.sound as 'kick' | 'snare' | 'hihat' | 'clap' | 'tom', config.volume);
    }
  };

  useEffect(() => {
    // Clear all intervals
    intervalRefs.current.forEach((interval) => clearInterval(interval));
    intervalRefs.current.clear();

    if (isPlaying && bpm && bpm > 0) {
      rhythms.forEach((config) => {
        const totalBeats = config.rhythm * config.subdivision;
        const interval = cycleDuration / totalBeats;

        const intervalId = setInterval(() => {
          setRhythms((prev) =>
            prev.map((r) =>
              r.id === config.id
                ? { ...r, currentBeat: (r.currentBeat + 1) % totalBeats }
                : r
            )
          );
          playSound(config);
        }, interval);

        intervalRefs.current.set(config.id, intervalId);
      });
    } else {
      setRhythms((prev) => prev.map((r) => ({ ...r, currentBeat: 0 })));
    }

    return () => {
      intervalRefs.current.forEach((interval) => clearInterval(interval));
      intervalRefs.current.clear();
    };
  }, [isPlaying, bpm, rhythms.map(r => `${r.id}-${r.rhythm}-${r.subdivision}-${r.sound}-${r.volume}-${r.frequency}`).join(','), cycleDuration]);

  const togglePlay = () => {
    getAudioContext();
    setIsPlaying(!isPlaying);
  };

  const addRhythm = () => {
    const colors = ['amber', 'violet', 'cyan', 'rose', 'emerald', 'orange', 'blue', 'pink', 'green', 'yellow'];
    const newRhythm: RhythmConfig = {
      id: nextId.current++,
      rhythm: 3,
      subdivision: 1,
      sound: 'hihat',
      volume: 0.7,
      frequency: 660,
      currentBeat: 0,
      color: colors[rhythms.length % colors.length],
    };
    setRhythms([...rhythms, newRhythm]);
  };

  const removeRhythm = (id: number) => {
    if (rhythms.length > 1) {
      setRhythms(rhythms.filter((r) => r.id !== id));
    }
  };

  const updateRhythm = (id: number, updates: Partial<RhythmConfig>) => {
    setRhythms(rhythms.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const commonPolyrhythms = [
    { r1: 3, r2: 2, name: '3:2 (Hemiola)' },
    { r1: 4, r2: 3, name: '4:3' },
    { r1: 5, r2: 4, name: '5:4' },
    { r1: 5, r2: 3, name: '5:3' },
    { r1: 7, r2: 4, name: '7:4' },
    { r1: 6, r2: 4, name: '6:4 (3:2)' },
  ];

  const loadPreset = (r1: number, r2: number) => {
    setRhythms([
      { id: 1, rhythm: r1, subdivision: 1, sound: 'kick', volume: 0.7, frequency: 880, currentBeat: 0, color: 'amber' },
      { id: 2, rhythm: r2, subdivision: 1, sound: 'snare', volume: 0.7, frequency: 440, currentBeat: 0, color: 'violet' },
    ]);
    nextId.current = 3;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Drum className="h-5 w-5 text-amber-400" />
          Polyrhythm Tool
        </CardTitle>
        <CardDescription>Practice and understand polyrhythms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Polyrhythm display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white">
            {rhythms.map((r, idx) => (
              <span key={r.id}>
                <span className={`text-${r.color}-400`}>{r.rhythm}</span>
                {idx < rhythms.length - 1 && <span className="text-zinc-500 mx-2">:</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Visual representation */}
        <div className="space-y-3">
          {rhythms.map((config) => {
            const totalBeats = config.rhythm * config.subdivision;
            return (
              <div key={config.id} className="flex justify-center gap-1 flex-wrap">
                {Array.from({ length: totalBeats }).map((_, i) => {
                  const isMainBeat = i % config.subdivision === 0;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'rounded-full transition-all duration-75 flex items-center justify-center',
                        isMainBeat ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-6 h-6 sm:w-7 sm:h-7',
                        config.currentBeat === i && isPlaying
                          ? `bg-${config.color}-500 scale-110`
                          : isMainBeat
                          ? `bg-zinc-800 border-2 border-${config.color}-500/50`
                          : `bg-zinc-800 border border-${config.color}-500/20`
                      )}
                    >
                      {isMainBeat && <span className={`text-xs text-${config.color}-400`}>{Math.floor(i / config.subdivision) + 1}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            size="lg"
            variant={isPlaying ? 'destructive' : 'default'}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Play
              </>
            )}
          </Button>
        </div>

        {/* Global Settings */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 mb-2 block">BPM</Label>
              <Input
                type="number"
                value={bpm ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setBpm(val === '' ? undefined : Math.max(0, parseInt(val)));
                }}
                placeholder="Enter BPM"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRhythm} variant="outline" className="w-full">
                <span className="mr-2">+</span>Add Rhythm
              </Button>
            </div>
          </div>
        </div>

        {/* Individual Rhythm Settings */}
        <div className="space-y-4">
          {rhythms.map((config, idx) => (
            <div key={config.id} className="border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <Label className={`text-${config.color}-400 font-semibold`}>Rhythm {idx + 1}</Label>
                {rhythms.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRhythm(config.id)}
                    className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                  >
                    ×
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className={`text-${config.color}-400 mb-2 block text-xs`}>Beats</Label>
                  <Select value={config.rhythm.toString()} onValueChange={(v) => updateRhythm(config.id, { rhythm: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={`text-${config.color}-400 mb-2 block text-xs`}>Subdivision</Label>
                  <Select value={config.subdivision.toString()} onValueChange={(v) => updateRhythm(config.id, { subdivision: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Quarter</SelectItem>
                      <SelectItem value="2">8th</SelectItem>
                      <SelectItem value="4">16th</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={`text-${config.color}-400 mb-2 block text-xs`}>Sound</Label>
                  <Select value={config.sound} onValueChange={(v: any) => updateRhythm(config.id, { sound: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kick">Kick</SelectItem>
                      <SelectItem value="snare">Snare</SelectItem>
                      <SelectItem value="hihat">Hi-Hat</SelectItem>
                      <SelectItem value="clap">Clap</SelectItem>
                      <SelectItem value="tom">Tom</SelectItem>
                      <SelectItem value="sine">Sine</SelectItem>
                      <SelectItem value="sawtooth">Sawtooth</SelectItem>
                      <SelectItem value="triangle">Triangle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={`text-${config.color}-400 mb-2 block text-xs`}>Volume</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.volume}
                    onChange={(e) => updateRhythm(config.id, { volume: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-zinc-500 text-center">{Math.round(config.volume * 100)}%</div>
                </div>

                {['sine', 'sawtooth', 'triangle'].includes(config.sound) && (
                  <div>
                    <Label className={`text-${config.color}-400 mb-2 block text-xs`}>Frequency (Hz)</Label>
                    <Input
                      type="number"
                      value={config.frequency}
                      onChange={(e) => updateRhythm(config.id, { frequency: parseInt(e.target.value) || 440 })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Common polyrhythms */}
        <div>
          <Label className="text-zinc-400 mb-2 block">Common Polyrhythms</Label>
          <div className="flex flex-wrap gap-2">
            {commonPolyrhythms.map((p) => (
              <Button
                key={`${p.r1}:${p.r2}`}
                size="sm"
                variant="outline"
                onClick={() => loadPreset(p.r1, p.r2)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// TEMPO MARKING REFERENCE
// ============================================

const TEMPO_MARKINGS = [
  { name: 'Larghissimo', range: [1, 24], description: 'Extremely slow' },
  { name: 'Grave', range: [25, 45], description: 'Very slow, solemn' },
  { name: 'Largo', range: [40, 60], description: 'Slow and broad' },
  { name: 'Lento', range: [45, 60], description: 'Slow' },
  { name: 'Larghetto', range: [60, 66], description: 'Rather slow' },
  { name: 'Adagio', range: [66, 76], description: 'Slow, at ease' },
  { name: 'Adagietto', range: [72, 76], description: 'Slower than andante' },
  { name: 'Andante', range: [76, 108], description: 'Walking pace' },
  { name: 'Andantino', range: [80, 108], description: 'Slightly faster than andante' },
  { name: 'Moderato', range: [108, 120], description: 'Moderate speed' },
  { name: 'Allegretto', range: [112, 120], description: 'Moderately fast' },
  { name: 'Allegro', range: [120, 156], description: 'Fast, bright' },
  { name: 'Vivace', range: [156, 176], description: 'Lively and fast' },
  { name: 'Vivacissimo', range: [172, 176], description: 'Very fast, lively' },
  { name: 'Allegrissimo', range: [172, 176], description: 'Very fast' },
  { name: 'Presto', range: [168, 200], description: 'Very fast' },
  { name: 'Prestissimo', range: [200, 300], description: 'Extremely fast' },
];

function TempoMarkingReference() {
  const [currentBpm, setCurrentBpm] = useState<number | undefined>(undefined);

  const currentMarking = currentBpm ? TEMPO_MARKINGS.find(
    (m) => currentBpm >= m.range[0] && currentBpm <= m.range[1]
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-rose-400" />
          Tempo Markings
        </CardTitle>
        <CardDescription>Classical tempo marking reference</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current BPM lookup */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-zinc-400 mb-2 block">Your tempo</Label>
              <Input
                type="number"
                value={currentBpm ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrentBpm(val === '' ? undefined : Math.max(1, parseInt(val)));
                }}
                placeholder="120"
                className="w-24 sm:w-28"
              />
            </div>
            <div className="flex-1 text-center">
              {currentMarking ? (
                <>
                  <div className="text-2xl font-bold text-rose-400">{currentMarking.name}</div>
                  <div className="text-zinc-400 text-sm">{currentMarking.description}</div>
                </>
              ) : (
                <div className="text-zinc-500">Out of range</div>
              )}
            </div>
          </div>
        </div>

        {/* Full reference */}
        <div className="bg-zinc-800/50 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          <div className="divide-y divide-zinc-700/50">
            {TEMPO_MARKINGS.map((marking) => {
              const isActive = currentBpm ? currentBpm >= marking.range[0] && currentBpm <= marking.range[1] : false;
              return (
                <button
                  key={marking.name}
                  onClick={() => setCurrentBpm(Math.round((marking.range[0] + marking.range[1]) / 2))}
                  className={cn(
                    'w-full grid grid-cols-[1fr,auto,1fr] gap-2 p-3 items-center text-left hover:bg-zinc-700/30 transition-colors',
                    isActive && 'bg-rose-500/20'
                  )}
                >
                  <div>
                    <div className={cn('font-medium', isActive ? 'text-rose-400' : 'text-white')}>
                      {marking.name}
                    </div>
                    <div className="text-zinc-500 text-xs">{marking.description}</div>
                  </div>
                  <div className="text-zinc-400 text-sm font-mono">
                    {marking.range[0]}-{marking.range[1]}
                  </div>
                  <div className="text-right">
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden w-24 ml-auto">
                      <div
                        className={cn('h-full rounded-full', isActive ? 'bg-rose-400' : 'bg-zinc-500')}
                        style={{
                          width: `${((marking.range[1] - marking.range[0]) / 200) * 100}%`,
                          marginLeft: `${(marking.range[0] / 200) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
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
      if (calculatedBpm >= 20 && calculatedBpm <= 999) {
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
      <div data-onboarding="tools-header">
        <h1 className="text-3xl font-bold text-white">Music Tools</h1>
        <p className="mt-1 text-zinc-400">
          Practice and production tools for musicians
        </p>
      </div>

      <Tabs defaultValue="metronome" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex h-auto gap-1 bg-zinc-900/50 p-1 min-w-max sm:flex sm:flex-wrap">
            <TabsTrigger value="metronome" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Metronome</span>
            </TabsTrigger>
            <TabsTrigger value="drums" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Drum className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Drums</span>
            </TabsTrigger>
            <TabsTrigger value="polyrhythm" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Drum className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Polyrhythm</span>
            </TabsTrigger>
            <TabsTrigger value="modulation" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Modulation</span>
            </TabsTrigger>
            <TabsTrigger value="delay" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Delay</span>
            </TabsTrigger>
            <TabsTrigger value="songtime" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Duration</span>
            </TabsTrigger>
            <TabsTrigger value="markings" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Markings</span>
            </TabsTrigger>
            <TabsTrigger value="frequency" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Waves className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Frequency</span>
            </TabsTrigger>
            <TabsTrigger value="intervals" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Intervals</span>
            </TabsTrigger>
            <TabsTrigger value="piano" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Piano className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Piano</span>
            </TabsTrigger>
            <TabsTrigger value="tuner" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Tuner</span>
            </TabsTrigger>
            <TabsTrigger value="ear-training" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Ear className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Ear Training</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="metronome">
          <Metronome />
        </TabsContent>

        <TabsContent value="drums">
          <DrumSequencer />
        </TabsContent>

        <TabsContent value="polyrhythm">
          <PolyrhythmTool />
        </TabsContent>


        <TabsContent value="modulation">
          <MetricModulationCalculator />
        </TabsContent>

        <TabsContent value="delay">
          <DelayTimeCalculator />
        </TabsContent>

        <TabsContent value="songtime">
          <SongTimeCalculator />
        </TabsContent>

        <TabsContent value="markings">
          <TempoMarkingReference />
        </TabsContent>

        <TabsContent value="frequency">
          <NoteFrequencyCalculator />
        </TabsContent>

        <TabsContent value="intervals">
          <IntervalCalculator />
        </TabsContent>

        <TabsContent value="piano">
          <PianoKeyboard />
        </TabsContent>

        <TabsContent value="tuner">
          <Tuner />
        </TabsContent>

        <TabsContent value="ear-training">
          <EarTraining />
        </TabsContent>
      </Tabs>
    </div>
  );
}
