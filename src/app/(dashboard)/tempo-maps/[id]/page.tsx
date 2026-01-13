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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
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
  Settings,
  Copy,
  Download,
  Zap,
  Keyboard,
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

// Quick add presets with default bars
const QUICK_ADD_PRESETS = [
  { name: 'Intro', bars: 4, color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' },
  { name: 'Verse', bars: 8, color: 'bg-green-500/20 hover:bg-green-500/30 text-green-300' },
  { name: 'Pre-Chorus', bars: 4, color: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300' },
  { name: 'Chorus', bars: 8, color: 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300' },
  { name: 'Bridge', bars: 8, color: 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300' },
  { name: 'Solo', bars: 8, color: 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300' },
  { name: 'Breakdown', bars: 4, color: 'bg-red-500/20 hover:bg-red-500/30 text-red-300' },
  { name: 'Buildup', bars: 4, color: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300' },
  { name: 'Outro', bars: 4, color: 'bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-300' },
];

// Demo templates
const DEMO_TEMPLATES = [
  {
    name: 'Pop Song (Standard)',
    description: 'Classic verse-chorus structure',
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse 1', bars: 8 },
      { name: 'Pre-Chorus', bars: 4 },
      { name: 'Chorus', bars: 8 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Pre-Chorus', bars: 4 },
      { name: 'Chorus', bars: 8 },
      { name: 'Bridge', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Rock Song',
    description: 'With guitar solo section',
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Verse 1', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Solo', bars: 16 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Outro', bars: 8 },
    ],
  },
  {
    name: 'EDM Drop',
    description: 'Build-drop structure',
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Buildup 1', bars: 8 },
      { name: 'Drop 1', bars: 16 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Buildup 2', bars: 8 },
      { name: 'Drop 2', bars: 16 },
      { name: 'Outro', bars: 8 },
    ],
  },
  {
    name: 'Ballad',
    description: 'Slow emotional structure',
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse 1', bars: 8 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Verse 3', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Bridge', bars: 8 },
      { name: 'Final Chorus', bars: 12 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Metal Song',
    description: 'Heavy with breakdowns',
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Riff', bars: 8 },
      { name: 'Verse 1', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Riff', bars: 4 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Solo', bars: 8 },
      { name: 'Final Chorus', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Simple (4 Sections)',
    description: 'Minimal structure',
    sections: [
      { name: 'A', bars: 8 },
      { name: 'B', bars: 8 },
      { name: 'A', bars: 8 },
      { name: 'B', bars: 8 },
    ],
  },
];

export default function TempoMapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // UI state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    defaultBpm: 120,
    defaultTimeSignature: '4/4',
    projectId: '',
    songId: '',
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
    }
  }, [tempoMap]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'r':
          stopPlayback();
          break;
        case 'm':
          setIsMuted(!isMuted);
          break;
        case '?':
          setShowShortcuts(!showShortcuts);
          break;
        case 'arrowleft':
          if (currentSectionIndex > 0) {
            jumpToSection(currentSectionIndex - 1);
          }
          break;
        case 'arrowright':
          if (tempoMap && currentSectionIndex < tempoMap.sections.length - 1) {
            jumpToSection(currentSectionIndex + 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, currentSectionIndex, tempoMap, showShortcuts]);

  // Playback logic
  const startPlayback = useCallback(() => {
    if (!tempoMap || tempoMap.sections.length === 0) return;

    const playSection = (sectionIdx: number, barNum: number, beatNum: number) => {
      if (sectionIdx >= tempoMap.sections.length) {
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

      if (!isMuted) {
        if (beatNum === 0) {
          playClick(1200, 0.08, volume);
        } else {
          playClick(800, 0.05, volume * 0.7);
        }
      }

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

  const jumpToSection = (index: number) => {
    stopPlayback();
    setCurrentSectionIndex(index);
    setCurrentBar(0);
    setCurrentBeat(0);
  };

  // Quick add section (no dialog)
  const handleQuickAddSection = async (name: string, bars: number) => {
    if (!tempoMap) return;

    try {
      const res = await fetch(`/api/tempo-maps/${id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bars,
          bpm: tempoMap.defaultBpm,
          timeSignatureNumerator: parseInt(tempoMap.defaultTimeSignature.split('/')[0]) || 4,
          timeSignatureDenominator: parseInt(tempoMap.defaultTimeSignature.split('/')[1]) || 4,
          notes: null,
        }),
      });

      if (!res.ok) throw new Error('Failed to add section');
      toast.success(`Added ${name} (${bars} bars)`);
      refetch();
    } catch (error) {
      toast.error('Failed to add section');
    }
  };

  // Duplicate section
  const handleDuplicateSection = async (section: TempoMapSection) => {
    try {
      const res = await fetch(`/api/tempo-maps/${id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: section.name ? `${section.name} (copy)` : null,
          bars: section.bars,
          bpm: section.bpm,
          timeSignatureNumerator: section.timeSignatureNumerator,
          timeSignatureDenominator: section.timeSignatureDenominator,
          notes: section.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to duplicate');
      toast.success('Section duplicated');
      refetch();
    } catch (error) {
      toast.error('Failed to duplicate section');
    }
  };

  // Import template
  const handleImportTemplate = async (template: typeof DEMO_TEMPLATES[0]) => {
    if (!tempoMap) return;

    try {
      // Add each section from template
      for (const section of template.sections) {
        await fetch(`/api/tempo-maps/${id}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: section.name,
            bars: section.bars,
            bpm: tempoMap.defaultBpm,
            timeSignatureNumerator: parseInt(tempoMap.defaultTimeSignature.split('/')[0]) || 4,
            timeSignatureDenominator: parseInt(tempoMap.defaultTimeSignature.split('/')[1]) || 4,
            notes: null,
          }),
        });
      }

      toast.success(`Imported "${template.name}" template`);
      refetch();
    } catch (error) {
      toast.error('Failed to import template');
    }
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

  // Clear all sections
  const handleClearAll = async () => {
    if (!tempoMap || tempoMap.sections.length === 0) return;

    try {
      for (const section of tempoMap.sections) {
        await fetch(`/api/tempo-maps/${id}/sections?sectionId=${section.id}`, {
          method: 'DELETE',
        });
      }
      toast.success('All sections cleared');
      refetch();
    } catch (error) {
      toast.error('Failed to clear sections');
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
    <TooltipProvider>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(!showShortcuts)}>
                <Keyboard className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        {/* Keyboard shortcuts panel */}
        {showShortcuts && (
          <Card className="bg-zinc-900/50 border-zinc-700">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">Space</kbd> Play/Pause</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">R</kbd> Reset</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">M</kbd> Mute</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">←</kbd><kbd className="px-2 py-1 bg-zinc-800 rounded ml-1">→</kbd> Navigate sections</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">?</kbd> Toggle shortcuts</div>
              </div>
            </CardContent>
          </Card>
        )}

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
          <CardContent className="py-6 space-y-4">
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

        {/* Quick Add Bar */}
        <Card className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-violet-500/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Quick Add:</span>
              </div>
              {QUICK_ADD_PRESETS.map((preset) => (
                <Tooltip key={preset.name}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn('h-8', preset.color)}
                      onClick={() => handleQuickAddSection(preset.name, preset.bars)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {preset.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{preset.bars} bars</TooltipContent>
                </Tooltip>
              ))}

              {/* Import template dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 ml-auto">
                    <Download className="h-3 w-3 mr-1" />
                    Import Template
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Demo Templates</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {DEMO_TEMPLATES.map((template) => (
                    <DropdownMenuItem
                      key={template.name}
                      onClick={() => handleImportTemplate(template)}
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-zinc-400">{template.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {tempoMap.sections.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleClearAll}
                        className="text-red-400 focus:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear all sections
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sections</CardTitle>
                <CardDescription>
                  {tempoMap.sections.length} sections · Click section to play from there
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tempoMap.sections.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <Timer className="mx-auto h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg mb-2">No sections yet</p>
                <p className="text-sm mb-6">Use the Quick Add bar above or import a template</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sectionsWithTime.map((section, index) => (
                  <div
                    key={section.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors group',
                      currentSectionIndex === index && isPlaying
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    )}
                  >
                    {/* Position & reorder */}
                    <div className="flex flex-col items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-bold text-zinc-500 w-6 text-center">{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === tempoMap.sections.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Section name - editable */}
                    <div className="w-32">
                      <Input
                        value={section.name || ''}
                        onChange={(e) => handleUpdateSection(section.id, { name: e.target.value || null })}
                        placeholder="Section name"
                        className="h-8 bg-transparent border-transparent hover:border-zinc-700 focus:border-zinc-600"
                      />
                    </div>

                    {/* Click to play */}
                    <button
                      className="flex-1 text-left px-2"
                      onClick={() => jumpToSection(index)}
                    >
                      <div className="text-sm text-zinc-400 flex items-center gap-3">
                        <span>{section.bars} bars</span>
                        <span>·</span>
                        <span>{formatDuration(section.duration)}</span>
                        {currentSectionIndex === index && isPlaying && (
                          <Badge variant="default" className="text-xs animate-pulse">
                            Playing
                          </Badge>
                        )}
                      </div>
                    </button>

                    {/* Quick edit controls */}
                    <div className="flex items-center gap-1">
                      {/* Bars - +/- buttons */}
                      <div className="flex items-center bg-zinc-800/50 rounded">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateSection(section.id, { bars: Math.max(1, section.bars - 1) })}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{section.bars}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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

                      {/* Duplicate */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-50 hover:opacity-100"
                            onClick={() => handleDuplicateSection(section)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate</TooltipContent>
                      </Tooltip>

                      {/* Delete */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 opacity-50 hover:opacity-100 hover:text-red-300"
                            onClick={() => handleDeleteSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
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
                    {(projects ?? []).map((project) =>
                      project.id && project.id.length > 0 ? (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ) : null
                    )}
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
                    {(songs ?? []).map((song) =>
                      song.id && song.id.length > 0 ? (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title}
                        </SelectItem>
                      ) : null
                    )}
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
    </TooltipProvider>
  );
}
