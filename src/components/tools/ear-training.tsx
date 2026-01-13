'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Play, RotateCcw, Volume2, Trophy, Target, Ear, CheckCircle2, XCircle } from 'lucide-react';

// Note frequencies
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Intervals with semitone distances
const INTERVALS: Record<string, { semitones: number; quality: string }> = {
  'P1': { semitones: 0, quality: 'Perfect Unison' },
  'm2': { semitones: 1, quality: 'Minor 2nd' },
  'M2': { semitones: 2, quality: 'Major 2nd' },
  'm3': { semitones: 3, quality: 'Minor 3rd' },
  'M3': { semitones: 4, quality: 'Major 3rd' },
  'P4': { semitones: 5, quality: 'Perfect 4th' },
  'TT': { semitones: 6, quality: 'Tritone' },
  'P5': { semitones: 7, quality: 'Perfect 5th' },
  'm6': { semitones: 8, quality: 'Minor 6th' },
  'M6': { semitones: 9, quality: 'Major 6th' },
  'm7': { semitones: 10, quality: 'Minor 7th' },
  'M7': { semitones: 11, quality: 'Major 7th' },
  'P8': { semitones: 12, quality: 'Perfect Octave' },
};

// Chord types
const CHORD_TYPES: Record<string, { intervals: number[]; name: string }> = {
  'major': { intervals: [0, 4, 7], name: 'Major' },
  'minor': { intervals: [0, 3, 7], name: 'Minor' },
  'dim': { intervals: [0, 3, 6], name: 'Diminished' },
  'aug': { intervals: [0, 4, 8], name: 'Augmented' },
  'maj7': { intervals: [0, 4, 7, 11], name: 'Major 7th' },
  'min7': { intervals: [0, 3, 7, 10], name: 'Minor 7th' },
  'dom7': { intervals: [0, 4, 7, 10], name: 'Dominant 7th' },
  'dim7': { intervals: [0, 3, 6, 9], name: 'Diminished 7th' },
  'sus2': { intervals: [0, 2, 7], name: 'Sus2' },
  'sus4': { intervals: [0, 5, 7], name: 'Sus4' },
};

// Training modes
type TrainingMode = 'intervals' | 'chords' | 'notes';

// Difficulty levels
const DIFFICULTY_LEVELS = {
  beginner: {
    intervals: ['P1', 'P4', 'P5', 'P8'],
    chords: ['major', 'minor'],
    noteRange: 1, // 1 octave
  },
  intermediate: {
    intervals: ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'],
    chords: ['major', 'minor', 'dim', 'aug', 'dom7'],
    noteRange: 2,
  },
  advanced: {
    intervals: Object.keys(INTERVALS),
    chords: Object.keys(CHORD_TYPES),
    noteRange: 3,
  },
};

interface GameState {
  currentQuestion: {
    type: TrainingMode;
    answer: string;
    rootNote: number; // MIDI note number
    notes: number[];
  } | null;
  userAnswer: string | null;
  isCorrect: boolean | null;
  score: number;
  streak: number;
  bestStreak: number;
  totalQuestions: number;
  correctAnswers: number;
}

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

export function EarTraining() {
  const [mode, setMode] = useState<TrainingMode>('intervals');
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_LEVELS>('beginner');
  const [volume, setVolume] = useState(0.5);
  const [playArpeggio, setPlayArpeggio] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    userAnswer: null,
    isCorrect: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalQuestions: 0,
    correctAnswers: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert MIDI note to frequency
  const midiToFrequency = (midi: number): number => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  // Play a single note
  const playNote = useCallback((midiNote: number, startTime: number, duration: number = 0.8) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = midiToFrequency(midiNote);
    osc.type = 'sine';

    const now = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.setValueAtTime(volume, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }, [volume]);

  // Play notes (together or as arpeggio)
  const playNotes = useCallback((notes: number[], asArpeggio: boolean = false) => {
    if (asArpeggio) {
      notes.forEach((note, i) => {
        playNote(note, i * 0.4, 0.5);
      });
    } else {
      notes.forEach(note => {
        playNote(note, 0, 1);
      });
    }
  }, [playNote]);

  // Generate a new question
  const generateQuestion = useCallback(() => {
    const diffSettings = DIFFICULTY_LEVELS[difficulty];
    const baseNote = 60 + Math.floor(Math.random() * (diffSettings.noteRange * 12)); // C4 = 60

    let question: GameState['currentQuestion'];

    if (mode === 'intervals') {
      const availableIntervals = diffSettings.intervals;
      const intervalKey = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
      const interval = INTERVALS[intervalKey];
      const secondNote = baseNote + interval.semitones;

      question = {
        type: 'intervals',
        answer: intervalKey,
        rootNote: baseNote,
        notes: [baseNote, secondNote],
      };
    } else if (mode === 'chords') {
      const availableChords = diffSettings.chords;
      const chordKey = availableChords[Math.floor(Math.random() * availableChords.length)];
      const chord = CHORD_TYPES[chordKey];
      const notes = chord.intervals.map(i => baseNote + i);

      question = {
        type: 'chords',
        answer: chordKey,
        rootNote: baseNote,
        notes,
      };
    } else {
      // Note identification
      const noteIndex = baseNote % 12;
      question = {
        type: 'notes',
        answer: NOTE_NAMES[noteIndex],
        rootNote: baseNote,
        notes: [baseNote],
      };
    }

    setGameState(prev => ({
      ...prev,
      currentQuestion: question,
      userAnswer: null,
      isCorrect: null,
    }));

    // Play the question
    setTimeout(() => {
      if (question) {
        playNotes(question.notes, mode === 'chords' && playArpeggio);
      }
    }, 300);
  }, [mode, difficulty, playNotes, playArpeggio]);

  // Handle answer
  const handleAnswer = useCallback((answer: string) => {
    if (!gameState.currentQuestion || gameState.userAnswer) return;

    const isCorrect = answer === gameState.currentQuestion.answer;

    setGameState(prev => ({
      ...prev,
      userAnswer: answer,
      isCorrect,
      score: prev.score + (isCorrect ? 10 * (prev.streak + 1) : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
    }));

    if (autoAdvance) {
      timeoutRef.current = setTimeout(() => {
        generateQuestion();
      }, isCorrect ? 1000 : 2000);
    }
  }, [gameState.currentQuestion, gameState.userAnswer, autoAdvance, generateQuestion]);

  // Replay current question
  const replayQuestion = useCallback(() => {
    if (gameState.currentQuestion) {
      playNotes(gameState.currentQuestion.notes, mode === 'chords' && playArpeggio);
    }
  }, [gameState.currentQuestion, playNotes, mode, playArpeggio]);

  // Reset game
  const resetGame = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setGameState({
      currentQuestion: null,
      userAnswer: null,
      isCorrect: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      totalQuestions: 0,
      correctAnswers: 0,
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get available options for current mode
  const getOptions = () => {
    const diffSettings = DIFFICULTY_LEVELS[difficulty];

    if (mode === 'intervals') {
      return diffSettings.intervals.map(key => ({
        key,
        label: INTERVALS[key].quality,
      }));
    } else if (mode === 'chords') {
      return diffSettings.chords.map(key => ({
        key,
        label: CHORD_TYPES[key].name,
      }));
    } else {
      return NOTE_NAMES.map(note => ({
        key: note,
        label: note,
      }));
    }
  };

  const options = getOptions();
  const accuracy = gameState.totalQuestions > 0
    ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Mode</Label>
          <Select value={mode} onValueChange={(v) => { setMode(v as TrainingMode); resetGame(); }}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="intervals">Intervals</SelectItem>
              <SelectItem value="chords">Chords</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Difficulty</Label>
          <Select value={difficulty} onValueChange={(v) => { setDifficulty(v as keyof typeof DIFFICULTY_LEVELS); resetGame(); }}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Volume</Label>
          <div className="flex items-center gap-2">
            <Volume2 className="h-3 w-3 text-zinc-500" />
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              min={0}
              max={100}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {mode === 'chords' && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Arpeggio</Label>
              <Switch checked={playArpeggio} onCheckedChange={setPlayArpeggio} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Auto-advance</Label>
            <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-primary">{gameState.score}</div>
          <div className="text-[10px] text-zinc-500 uppercase">Score</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-orange-400">{gameState.streak}</div>
          <div className="text-[10px] text-zinc-500 uppercase">Streak</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-yellow-400">{gameState.bestStreak}</div>
          <div className="text-[10px] text-zinc-500 uppercase">Best</div>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-emerald-400">{accuracy}%</div>
          <div className="text-[10px] text-zinc-500 uppercase">Accuracy</div>
        </Card>
      </div>

      {/* Game area */}
      <Card>
        <CardContent className="p-6">
          {!gameState.currentQuestion ? (
            <div className="text-center py-8">
              <Ear className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {mode === 'intervals' ? 'Interval Training' : mode === 'chords' ? 'Chord Recognition' : 'Note Identification'}
              </h3>
              <p className="text-zinc-400 text-sm mb-6">
                {mode === 'intervals'
                  ? 'Listen to two notes and identify the interval between them'
                  : mode === 'chords'
                  ? 'Listen to a chord and identify its type'
                  : 'Listen to a note and identify its name'}
              </p>
              <Button size="lg" onClick={generateQuestion} className="gap-2">
                <Play className="h-5 w-5" />
                Start Training
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question display */}
              <div className="text-center">
                <div className="text-zinc-400 text-sm mb-2">
                  Question {gameState.totalQuestions + 1}
                </div>
                <div className="text-2xl font-bold mb-4">
                  {mode === 'intervals'
                    ? 'What interval is this?'
                    : mode === 'chords'
                    ? 'What chord is this?'
                    : 'What note is this?'}
                </div>

                {/* Replay button */}
                <Button variant="outline" size="sm" onClick={replayQuestion} className="gap-2">
                  <Play className="h-4 w-4" />
                  Play Again
                </Button>

                {/* Hint */}
                {showHint && gameState.currentQuestion && (
                  <div className="mt-4 text-sm text-zinc-500">
                    Root note: {NOTE_NAMES[gameState.currentQuestion.rootNote % 12]}
                  </div>
                )}
              </div>

              {/* Answer feedback */}
              {gameState.userAnswer && (
                <div className={cn(
                  'text-center p-4 rounded-lg',
                  gameState.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
                )}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {gameState.isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <span className={cn(
                      'text-lg font-bold',
                      gameState.isCorrect ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {gameState.isCorrect ? 'Correct!' : 'Wrong!'}
                    </span>
                  </div>
                  {!gameState.isCorrect && (
                    <div className="text-sm text-zinc-400">
                      The answer was: {
                        mode === 'intervals'
                          ? INTERVALS[gameState.currentQuestion.answer].quality
                          : mode === 'chords'
                          ? CHORD_TYPES[gameState.currentQuestion.answer].name
                          : gameState.currentQuestion.answer
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Answer options */}
              <div className={cn(
                'grid gap-2',
                mode === 'notes' ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'
              )}>
                {options.map(option => {
                  const isSelected = gameState.userAnswer === option.key;
                  const isCorrectAnswer = gameState.currentQuestion?.answer === option.key;
                  const showResult = gameState.userAnswer !== null;

                  return (
                    <Button
                      key={option.key}
                      variant="outline"
                      className={cn(
                        'h-auto py-3 transition-colors',
                        showResult && isCorrectAnswer && 'border-emerald-500 bg-emerald-500/20',
                        showResult && isSelected && !gameState.isCorrect && 'border-red-500 bg-red-500/20',
                        !showResult && 'hover:bg-zinc-800'
                      )}
                      onClick={() => handleAnswer(option.key)}
                      disabled={gameState.userAnswer !== null}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{option.key}</div>
                        {mode !== 'notes' && (
                          <div className="text-[10px] text-zinc-500">{option.label}</div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>

              {/* Next button (when not auto-advancing) */}
              {gameState.userAnswer && !autoAdvance && (
                <div className="text-center">
                  <Button onClick={generateQuestion} className="gap-2">
                    Next Question
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={showHint} onCheckedChange={setShowHint} id="hint" />
          <Label htmlFor="hint" className="text-xs">Show Hints</Label>
        </div>
        <Button variant="outline" size="sm" onClick={resetGame} className="gap-1">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Progress for session */}
      {gameState.totalQuestions > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Session Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{gameState.correctAnswers} / {gameState.totalQuestions} correct</span>
                <span>{accuracy}% accuracy</span>
              </div>
              <Progress value={accuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
