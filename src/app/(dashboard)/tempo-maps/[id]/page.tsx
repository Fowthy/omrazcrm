'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Timer,
  Music,
  FolderKanban,
  Loader2,
  Clock,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Save,
  Settings,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Audio utilities
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

interface TempoMapSection {
  id: string;
  tempoMapId: string;
  position: number;
  name: string | null;
  bars: number;
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  notes: string | null;
}

interface TempoMap {
  id: string;
  name: string;
  description: string | null;
  defaultBpm: number;
  defaultTimeSignature: string;
  projectId: string | null;
  songId: string | null;
  sections: TempoMapSection[];
  sectionCount: number;
  totalBars: number;
  totalDuration: number;
  project: { id: string; name: string } | null;
  song: { id: string; title: string; bpm: number | null; timeSignature: string | null } | null;
  createdBy: { name: string; avatar: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  bpm: number | null;
  timeSignature: string | null;
}

const TIME_SIGNATURES = [
  { value: '4/4', num: 4, denom: 4 },
  { value: '3/4', num: 3, denom: 4 },
  { value: '6/8', num: 6, denom: 8 },
  { value: '5/4', num: 5, denom: 4 },
  { value: '7/8', num: 7, denom: 8 },
  { value: '2/4', num: 2, denom: 4 },
  { value: '12/8', num: 12, denom: 8 },
  { value: '9/8', num: 9, denom: 8 },
  { value: '5/8', num: 5, denom: 8 },
];

const SECTION_PRESETS = [
  'Intro',
  'Verse',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Solo',
  'Breakdown',
  'Buildup',
  'Outro',
];

export default function TempoMapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // UI state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    defaultBpm: 120,
    defaultTimeSignature: '4/4',
    projectId: '',
    songId: '',
  });

  // New section state
  const [newSection, setNewSection] = useState({
    name: '',
    bars: 4,
    bpm: 120,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    notes: '',
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch tempo map
  const { data: tempoMap, isLoading, refetch } = useQuery<TempoMap>({
    queryKey: ['tempoMap', id],
    queryFn: async () => {
      const res = await fetch(`/api/tempo-maps/${id}`);
      if (!res.ok) throw new Error('Failed to fetch tempo map');
      return res.json();
    },
  });

  // Fetch projects for linking
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Fetch songs for linking
  const { data: songs } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) throw new Error('Failed to fetch songs');
      return res.json();
    },
  });

  // Initialize edit data when tempo map loads
  useEffect(() => {
    if (tempoMap) {
      setEditData({
        name: tempoMap.name,
        description: tempoMap.description || '',
        defaultBpm: tempoMap.defaultBpm,
        defaultTimeSignature: tempoMap.defaultTimeSignature,
        projectId: tempoMap.projectId || '',
        songId: tempoMap.songId || '',
      });
      setNewSection((prev) => ({
        ...prev,
        bpm: tempoMap.defaultBpm,
      }));
    }
  }, [tempoMap]);

  // Playback logic
  const startPlayback = useCallback(() => {
    if (!tempoMap || tempoMap.sections.length === 0) return;

    const playSection = (sectionIdx: number, barNum: number, beatNum: number) => {
      if (sectionIdx >= tempoMap.sections.length) {
        // End of tempo map
        setIsPlaying(false);
        setCurrentSectionIndex(0);
        setCurrentBar(0);
        setCurrentBeat(0);
        return;
      }

      const section = tempoMap.sections[sectionIdx];
      const beatsPerBar = section.timeSignatureNumerator;
      const beatDuration = (60 / section.bpm) * 1000;

      setCurrentSectionIndex(sectionIdx);
      setCurrentBar(barNum);
      setCurrentBeat(beatNum);

      // Play click sound
      if (!isMuted) {
        if (beatNum === 0) {
          // First beat of bar - accent
          playClick(1200, 0.08, volume);
        } else {
          playClick(800, 0.05, volume * 0.7);
        }
      }

      // Schedule next beat
      intervalRef.current = setTimeout(() => {
        let nextBeat = beatNum + 1;
        let nextBar = barNum;
        let nextSection = sectionIdx;

        if (nextBeat >= beatsPerBar) {
          nextBeat = 0;
          nextBar++;
        }

        if (nextBar >= section.bars) {
          nextBar = 0;
          nextSection++;
        }

        playSection(nextSection, nextBar, nextBeat);
      }, beatDuration);
    };

    playSection(currentSectionIndex, currentBar, currentBeat);
  }, [tempoMap, currentSectionIndex, currentBar, currentBeat, volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isPlaying]);

  const togglePlayback = () => {
    getAudioContext();
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentSectionIndex(0);
    setCurrentBar(0);
    setCurrentBeat(0);
    if (intervalRef.current) clearTimeout(intervalRef.current);
  };

  // Jump to section
  const jumpToSection = (index: number) => {
    stopPlayback();
    setCurrentSectionIndex(index);
    setCurrentBar(0);
    setCurrentBeat(0);
  };

  // Update tempo map
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tempo-maps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          projectId: editData.projectId || null,
          songId: editData.songId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast.success('Tempo map updated!');
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tempoMap', id] });
      queryClient.invalidateQueries({ queryKey: ['tempoMaps'] });
    } catch (error) {
      toast.error('Failed to update tempo map');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete tempo map
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/tempo-maps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Tempo map deleted');
      queryClient.invalidateQueries({ queryKey: ['tempoMaps'] });
      router.push('/tempo-maps');
    } catch (error) {
      toast.error('Failed to delete tempo map');
    }
  };

  // Add section
  const handleAddSection = async () => {
    try {
      const res = await fetch(`/api/tempo-maps/${id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSection.name || null,
          bars: newSection.bars,
          bpm: newSection.bpm,
          timeSignatureNumerator: newSection.timeSignatureNumerator,
          timeSignatureDenominator: newSection.timeSignatureDenominator,
          notes: newSection.notes || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to add section');

      toast.success('Section added!');
      setIsAddSectionDialogOpen(false);
      setNewSection({
        name: '',
        bars: 4,
        bpm: tempoMap?.defaultBpm || 120,
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        notes: '',
      });
      refetch();
    } catch (error) {
      toast.error('Failed to add section');
    }
  };

  // Update section
  const handleUpdateSection = async (sectionId: string, updates: Partial<TempoMapSection>) => {
    try {
      const res = await fetch(`/api/tempo-maps/${id}/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          ...updates,
        }),
      });

      if (!res.ok) throw new Error('Failed to update section');
      refetch();
    } catch (error) {
      toast.error('Failed to update section');
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionId: string) => {
    try {
      const res = await fetch(`/api/tempo-maps/${id}/sections?sectionId=${sectionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete section');

      toast.success('Section deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete section');
    }
  };

  // Move section up/down
  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!tempoMap) return;

    const currentIndex = tempoMap.sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === tempoMap.sections.length - 1)
    ) {
      return;
    }

    const newOrder = [...tempoMap.sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

    try {
      const res = await fetch(`/api/tempo-maps/${id}/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: newOrder.map((s) => s.id),
        }),
      });

      if (!res.ok) throw new Error('Failed to reorder');
      refetch();
    } catch (error) {
      toast.error('Failed to reorder sections');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!tempoMap) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/tempo-maps">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tempo Maps
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">Tempo map not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate cumulative time for each section
  let cumulativeTime = 0;
  const sectionsWithTime = tempoMap.sections.map((section) => {
    const sectionDuration = (section.bars * section.timeSignatureNumerator * 60) / section.bpm;
    const startTime = cumulativeTime;
    cumulativeTime += sectionDuration;
    return { ...section, startTime, duration: sectionDuration };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tempo-maps">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{tempoMap.name}</h1>
          {tempoMap.description && (
            <p className="text-sm text-zinc-400">{tempoMap.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          <Timer className="mr-1 h-3 w-3" />
          {tempoMap.defaultBpm} BPM
        </Badge>
        <Badge variant="secondary">{tempoMap.defaultTimeSignature}</Badge>
        <Badge variant="secondary">
          {tempoMap.totalBars} bars
        </Badge>
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          {formatDuration(tempoMap.totalDuration)}
        </Badge>
        {tempoMap.project && (
          <Badge variant="outline">
            <FolderKanban className="mr-1 h-3 w-3" />
            {tempoMap.project.name}
          </Badge>
        )}
        {tempoMap.song && (
          <Badge variant="outline">
            <Music className="mr-1 h-3 w-3" />
            {tempoMap.song.title}
          </Badge>
        )}
      </div>

      {/* Playback Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Playback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current position display */}
          {tempoMap.sections.length > 0 && (
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {tempoMap.sections[currentSectionIndex]?.name || `Section ${currentSectionIndex + 1}`}
              </div>
              <div className="text-2xl text-zinc-400">
                Bar {currentBar + 1} / {tempoMap.sections[currentSectionIndex]?.bars || 0}
                <span className="mx-2">·</span>
                Beat {currentBeat + 1}
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                {tempoMap.sections[currentSectionIndex]?.bpm} BPM ·{' '}
                {tempoMap.sections[currentSectionIndex]?.timeSignatureNumerator}/
                {tempoMap.sections[currentSectionIndex]?.timeSignatureDenominator}
              </div>
            </div>
          )}

          {/* Beat indicators */}
          {tempoMap.sections.length > 0 && tempoMap.sections[currentSectionIndex] && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: tempoMap.sections[currentSectionIndex].timeSignatureNumerator }).map(
                (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all duration-75 flex items-center justify-center text-sm font-bold',
                      currentBeat === i && isPlaying
                        ? i === 0
                          ? 'bg-violet-500 text-white scale-110'
                          : 'bg-cyan-500 text-white scale-110'
                        : 'bg-zinc-800 text-zinc-500'
                    )}
                  >
                    {i + 1}
                  </div>
                )
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              variant={isPlaying ? 'destructive' : 'default'}
              onClick={togglePlayback}
              disabled={tempoMap.sections.length === 0}
            >
              {isPlaying ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Play
                </>
              )}
            </Button>
            <Button size="lg" variant="outline" onClick={stopPlayback}>
              <RotateCcw className="mr-2 h-5 w-5" />
              Reset
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>

          {/* Visual timeline */}
          {tempoMap.sections.length > 0 && (
            <div className="flex gap-1 h-12 rounded-lg overflow-hidden bg-zinc-800/50">
              {sectionsWithTime.map((section, i) => {
                const widthPercent = (section.duration / tempoMap.totalDuration) * 100;
                const isActive = currentSectionIndex === i;
                const progress =
                  isActive && section.bars > 0
                    ? ((currentBar + currentBeat / section.timeSignatureNumerator) / section.bars) * 100
                    : 0;

                return (
                  <button
                    key={section.id}
                    onClick={() => jumpToSection(i)}
                    className={cn(
                      'relative h-full flex items-center justify-center text-xs font-medium transition-all overflow-hidden',
                      isActive
                        ? 'bg-violet-500/30 text-violet-200'
                        : currentSectionIndex > i
                        ? 'bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    )}
                    style={{ width: `${widthPercent}%`, minWidth: '40px' }}
                  >
                    {isActive && isPlaying && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-violet-500/40"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    <span className="relative z-10 truncate px-1">
                      {section.name || `S${i + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">Sections</CardTitle>
            <CardDescription>
              {tempoMap.sections.length} sections · Click to edit, drag to reorder
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddSectionDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent>
          {tempoMap.sections.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Timer className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No sections yet. Add your first section to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sectionsWithTime.map((section, index) => (
                <div
                  key={section.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    currentSectionIndex === index && isPlaying
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  )}
                >
                  {/* Position & reorder */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-bold text-zinc-500">{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === tempoMap.sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Section info - click to play from here */}
                  <button
                    className="flex-1 text-left"
                    onClick={() => jumpToSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {section.name || `Section ${index + 1}`}
                      </span>
                      {currentSectionIndex === index && isPlaying && (
                        <Badge variant="default" className="text-xs">
                          Playing
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-zinc-400 mt-1 flex items-center gap-3">
                      <span>{section.bars} bars</span>
                      <span>{section.bpm} BPM</span>
                      <span>
                        {section.timeSignatureNumerator}/{section.timeSignatureDenominator}
                      </span>
                      <span>{formatDuration(section.duration)}</span>
                    </div>
                    {section.notes && (
                      <p className="text-xs text-zinc-500 mt-1">{section.notes}</p>
                    )}
                  </button>

                  {/* Quick edit controls */}
                  <div className="flex items-center gap-2">
                    {/* Bars */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateSection(section.id, { bars: Math.max(1, section.bars - 1) })}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">{section.bars}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateSection(section.id, { bars: section.bars + 1 })}
                      >
                        +
                      </Button>
                    </div>

                    {/* BPM */}
                    <Input
                      type="number"
                      value={section.bpm}
                      onChange={(e) => handleUpdateSection(section.id, { bpm: parseInt(e.target.value) || 120 })}
                      className="w-20 h-8 text-center"
                    />

                    {/* Time signature */}
                    <Select
                      value={`${section.timeSignatureNumerator}/${section.timeSignatureDenominator}`}
                      onValueChange={(value) => {
                        const ts = TIME_SIGNATURES.find((t) => t.value === value);
                        if (ts) {
                          handleUpdateSection(section.id, {
                            timeSignatureNumerator: ts.num,
                            timeSignatureDenominator: ts.denom,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SIGNATURES.map((ts) => (
                          <SelectItem key={ts.value} value={ts.value}>
                            {ts.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tempo Map</DialogTitle>
            <DialogDescription>Update tempo map settings and links</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default BPM</Label>
                <Input
                  type="number"
                  value={editData.defaultBpm}
                  onChange={(e) =>
                    setEditData({ ...editData, defaultBpm: parseInt(e.target.value) || 120 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Default Time Signature</Label>
                <Select
                  value={editData.defaultTimeSignature}
                  onValueChange={(value) => setEditData({ ...editData, defaultTimeSignature: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SIGNATURES.map((ts) => (
                      <SelectItem key={ts.value} value={ts.value}>
                        {ts.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link to Project</Label>
              <Select
                value={editData.projectId || 'none'}
                onValueChange={(value) => setEditData({ ...editData, projectId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects?.filter((p) => p.id).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Link to Song</Label>
              <Select
                value={editData.songId || 'none'}
                onValueChange={(value) => setEditData({ ...editData, songId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a song" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {songs?.filter((s) => s.id).map((song) => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>Add a new section to your tempo map</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name (optional)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SECTION_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={newSection.name === preset ? 'default' : 'outline'}
                    onClick={() => setNewSection({ ...newSection, name: preset })}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <Input
                id="section-name"
                placeholder="e.g., Intro, Verse 1, Chorus..."
                value={newSection.name}
                onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bars</Label>
                <Input
                  type="number"
                  min={1}
                  value={newSection.bars}
                  onChange={(e) =>
                    setNewSection({ ...newSection, bars: parseInt(e.target.value) || 4 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>BPM</Label>
                <Input
                  type="number"
                  min={20}
                  max={300}
                  value={newSection.bpm}
                  onChange={(e) =>
                    setNewSection({ ...newSection, bpm: parseInt(e.target.value) || 120 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Time Signature</Label>
                <Select
                  value={`${newSection.timeSignatureNumerator}/${newSection.timeSignatureDenominator}`}
                  onValueChange={(value) => {
                    const ts = TIME_SIGNATURES.find((t) => t.value === value);
                    if (ts) {
                      setNewSection({
                        ...newSection,
                        timeSignatureNumerator: ts.num,
                        timeSignatureDenominator: ts.denom,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SIGNATURES.map((ts) => (
                      <SelectItem key={ts.value} value={ts.value}>
                        {ts.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes for this section..."
                value={newSection.notes}
                onChange={(e) => setNewSection({ ...newSection, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tempo Map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{tempoMap.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
