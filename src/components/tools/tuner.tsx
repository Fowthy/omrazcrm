'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Volume2, Music2 } from 'lucide-react';

// Note frequencies for standard tuning (A4 = 440Hz by default)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Common tuning references
const TUNING_REFERENCES = {
  '440': 440,
  '432': 432,
  '442': 442,
  '444': 444,
};

// Instrument presets with target notes
const INSTRUMENT_PRESETS: Record<string, { name: string; notes: string[] }> = {
  chromatic: { name: 'Chromatic', notes: [] },
  guitar: { name: 'Guitar (Standard)', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  bass: { name: 'Bass (Standard)', notes: ['E1', 'A1', 'D2', 'G2'] },
  ukulele: { name: 'Ukulele', notes: ['G4', 'C4', 'E4', 'A4'] },
  violin: { name: 'Violin', notes: ['G3', 'D4', 'A4', 'E5'] },
  cello: { name: 'Cello', notes: ['C2', 'G2', 'D3', 'A3'] },
};

interface DetectedNote {
  note: string;
  octave: number;
  frequency: number;
  cents: number; // How many cents off from perfect pitch
}

export function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<DetectedNote | null>(null);
  const [a4Reference, setA4Reference] = useState<keyof typeof TUNING_REFERENCES>('440');
  const [instrument, setInstrument] = useState('chromatic');
  const [sensitivity, setSensitivity] = useState(0.01);
  const [showFrequency, setShowFrequency] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Get frequency of a note
  const getNoteFrequency = useCallback((note: string, octave: number, a4: number = 440) => {
    const noteIndex = NOTE_NAMES.indexOf(note);
    const a4Index = NOTE_NAMES.indexOf('A');
    const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - a4Index);
    return a4 * Math.pow(2, semitonesFromA4 / 12);
  }, []);

  // Get note from frequency
  const getNote = useCallback((frequency: number, a4: number = 440): DetectedNote | null => {
    if (frequency < 20 || frequency > 5000) return null;

    // Calculate semitones from A4
    const semitones = 12 * Math.log2(frequency / a4);
    const roundedSemitones = Math.round(semitones);
    const cents = Math.round((semitones - roundedSemitones) * 100);

    // Calculate note and octave
    const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12; // A = 0, so offset by 9
    const octave = Math.floor((roundedSemitones + 9) / 12) + 4;
    const note = NOTE_NAMES[noteIndex];

    return {
      note,
      octave,
      frequency,
      cents,
    };
  }, []);

  // Autocorrelation pitch detection
  const autoCorrelate = useCallback((buffer: Float32Array, sampleRate: number): number => {
    // Find the RMS (root mean square) for volume check
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);

    // If too quiet, return -1
    if (rms < sensitivity) return -1;

    // Normalize the buffer
    const normalized = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      normalized[i] = buffer[i];
    }

    // Find the first zero crossing going down
    let start = 0;
    for (let i = 0; i < normalized.length / 2; i++) {
      if (normalized[i] > 0 && normalized[i + 1] <= 0) {
        start = i;
        break;
      }
    }

    // Autocorrelation
    const correlations = new Float32Array(normalized.length / 2);
    for (let lag = 0; lag < correlations.length; lag++) {
      let sum = 0;
      for (let i = 0; i < correlations.length; i++) {
        sum += normalized[i] * normalized[i + lag];
      }
      correlations[lag] = sum;
    }

    // Find the first peak after initial dip
    let foundPeak = false;
    let maxCorrelation = 0;
    let maxLag = 0;

    for (let i = Math.floor(sampleRate / 1000); i < correlations.length; i++) {
      if (correlations[i] > 0.9 * correlations[0] && !foundPeak) {
        foundPeak = true;
      }
      if (foundPeak && correlations[i] > maxCorrelation) {
        maxCorrelation = correlations[i];
        maxLag = i;
      }
      if (foundPeak && correlations[i] < 0.8 * maxCorrelation) {
        break;
      }
    }

    if (maxCorrelation < 0.3 * correlations[0]) return -1;

    // Quadratic interpolation for more accurate result
    const prev = correlations[maxLag - 1] || correlations[maxLag];
    const next = correlations[maxLag + 1] || correlations[maxLag];
    const adjustment = (prev - next) / (2 * (prev - 2 * maxCorrelation + next));
    const refinedLag = maxLag + adjustment;

    return sampleRate / refinedLag;
  }, [sensitivity]);

  // Start listening
  const startListening = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);

      // Start detection loop
      const detectPitch = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        const buffer = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buffer);

        const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);

        if (frequency > 0) {
          const note = getNote(frequency, TUNING_REFERENCES[a4Reference]);
          setDetectedNote(note);
        }

        animationRef.current = requestAnimationFrame(detectPitch);
      };

      detectPitch();
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.');
      console.error('Microphone error:', err);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setDetectedNote(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Update detection when reference changes
  useEffect(() => {
    // Reference change doesn't require restart
  }, [a4Reference]);

  // Get tuning indicator color and position
  const getTuningInfo = () => {
    if (!detectedNote) return { color: 'text-zinc-500', label: '---', inTune: false };

    const { cents } = detectedNote;
    const absCents = Math.abs(cents);

    if (absCents <= 3) {
      return { color: 'text-emerald-400', label: 'In Tune!', inTune: true };
    } else if (absCents <= 10) {
      return { color: 'text-yellow-400', label: cents > 0 ? 'Slightly Sharp' : 'Slightly Flat', inTune: false };
    } else if (absCents <= 25) {
      return { color: 'text-orange-400', label: cents > 0 ? 'Sharp' : 'Flat', inTune: false };
    } else {
      return { color: 'text-red-400', label: cents > 0 ? 'Very Sharp' : 'Very Flat', inTune: false };
    }
  };

  const tuningInfo = getTuningInfo();
  const instrumentNotes = INSTRUMENT_PRESETS[instrument]?.notes || [];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Reference (A4)</Label>
          <Select value={a4Reference} onValueChange={(v) => setA4Reference(v as keyof typeof TUNING_REFERENCES)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TUNING_REFERENCES).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value} Hz</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Instrument</Label>
          <Select value={instrument} onValueChange={setInstrument}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INSTRUMENT_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>{preset.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Sensitivity</Label>
          <Slider
            value={[sensitivity * 100]}
            onValueChange={([v]) => setSensitivity(v / 100)}
            min={0.1}
            max={5}
            step={0.1}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Hz</Label>
            <Switch checked={showFrequency} onCheckedChange={setShowFrequency} />
          </div>
        </div>
      </div>

      {/* Main tuner display */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Start/Stop button */}
          <div className="flex justify-center mb-6">
            <Button
              size="lg"
              variant={isListening ? 'destructive' : 'default'}
              onClick={isListening ? stopListening : startListening}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop Tuner
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Tuner
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="text-center text-red-400 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Note display */}
          <div className="text-center mb-6">
            <div className={cn(
              'text-7xl sm:text-9xl font-bold transition-colors',
              isListening && detectedNote ? tuningInfo.color : 'text-zinc-600'
            )}>
              {detectedNote ? `${detectedNote.note}${detectedNote.octave}` : '--'}
            </div>
            {showFrequency && detectedNote && (
              <div className="text-xl text-zinc-400 mt-2">
                {detectedNote.frequency.toFixed(1)} Hz
              </div>
            )}
          </div>

          {/* Tuning meter */}
          <div className="relative h-8 bg-zinc-800 rounded-full overflow-hidden mb-4">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-emerald-500/20" />
              <div className="flex-1 bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/20" />
            </div>
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50 -translate-x-1/2" />
            {/* Indicator */}
            {detectedNote && (
              <div
                className={cn(
                  'absolute top-1 bottom-1 w-3 rounded-full transition-all duration-100',
                  tuningInfo.inTune ? 'bg-emerald-400' : 'bg-white'
                )}
                style={{
                  left: `calc(50% + ${Math.max(-48, Math.min(48, detectedNote.cents))}%)`,
                  transform: 'translateX(-50%)',
                }}
              />
            )}
          </div>

          {/* Tuning status */}
          <div className="text-center">
            <Badge
              variant="outline"
              className={cn('text-lg px-4 py-1', tuningInfo.color)}
            >
              {tuningInfo.label}
            </Badge>
            {detectedNote && (
              <div className="text-sm text-zinc-500 mt-2">
                {detectedNote.cents > 0 ? '+' : ''}{detectedNote.cents} cents
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instrument strings */}
      {instrumentNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              {INSTRUMENT_PRESETS[instrument].name} Strings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {instrumentNotes.map((noteStr, i) => {
                const note = noteStr.slice(0, -1);
                const octave = parseInt(noteStr.slice(-1));
                const targetFreq = getNoteFrequency(note, octave, TUNING_REFERENCES[a4Reference]);
                const isActive = detectedNote &&
                  detectedNote.note === note &&
                  detectedNote.octave === octave;

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg border transition-colors min-w-[60px]',
                      isActive
                        ? tuningInfo.inTune
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-700'
                    )}
                  >
                    <span className="text-lg font-bold">{noteStr}</span>
                    <span className="text-xs text-zinc-500">{targetFreq.toFixed(1)} Hz</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-zinc-400 space-y-1">
          <p>1. Click "Start Tuner" and allow microphone access</p>
          <p>2. Play a note on your instrument</p>
          <p>3. The tuner will show the detected note and how close you are to perfect pitch</p>
          <p>4. Green = in tune, Yellow = slightly off, Red = way off</p>
          <p>5. Adjust the sensitivity if the tuner is picking up background noise</p>
        </CardContent>
      </Card>
    </div>
  );
}
