'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Play,
  Pause,
  Settings,
  Trash2,
  Loader2,
  Music,
  FolderKanban,
  Download,
  Upload,
  Sparkles,
  Palette,
  Sliders,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface VisualizationParams {
  colorScheme: string;
  backgroundColor: string;
  sensitivity: number;
  smoothing: number;
  barCount: number;
  barWidth: number;
  barGap: number;
  barRadius: number;
  particleCount: number;
  particleSize: number;
  particleSpeed: number;
  rotationSpeed: number;
  mirrorMode: boolean;
  glowIntensity: number;
  reactToAudio: boolean;
}

interface Visualization {
  id: string;
  name: string;
  description: string | null;
  visualType: string;
  parameters: VisualizationParams;
  previewUrl: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  songId: string | null;
  projectId: string | null;
  song: { id: string; title: string; bpm: number | null; duration: number | null } | null;
  project: { id: string; name: string } | null;
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
}

const COLOR_SCHEMES = [
  { value: 'neon', label: 'Neon', colors: ['#00ffff', '#ff00ff', '#00ff00'] },
  { value: 'sunset', label: 'Sunset', colors: ['#ff6b6b', '#ffa500', '#ffff00'] },
  { value: 'ocean', label: 'Ocean', colors: ['#0077be', '#00bfff', '#7fffd4'] },
  { value: 'forest', label: 'Forest', colors: ['#228b22', '#32cd32', '#90ee90'] },
  { value: 'fire', label: 'Fire', colors: ['#ff4500', '#ff6347', '#ffd700'] },
  { value: 'monochrome', label: 'Mono', colors: ['#ffffff', '#888888', '#ffffff'] },
  { value: 'rainbow', label: 'Rainbow', colors: ['#ff0000', '#00ff00', '#0000ff'] },
  { value: 'synthwave', label: 'Synthwave', colors: ['#ff00ff', '#00ffff', '#ff1493'] },
];

const VISUAL_TYPES = [
  { value: 'bars', label: 'Frequency Bars' },
  { value: 'waveform', label: 'Waveform' },
  { value: 'circular', label: 'Circular Spectrum' },
  { value: 'particles', label: 'Particles' },
  { value: 'kaleidoscope', label: 'Kaleidoscope' },
  { value: 'geometric', label: 'Geometric' },
];

export default function VisualizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // UI State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    projectId: '',
    songId: '',
  });

  // Local params for real-time preview
  const [localParams, setLocalParams] = useState<VisualizationParams | null>(null);
  const [localType, setLocalType] = useState<string>('bars');

  // Fetch visualization
  const { data: visualization, isLoading, refetch } = useQuery<Visualization>({
    queryKey: ['visualization', id],
    queryFn: async () => {
      const res = await fetch(`/api/visualizations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch visualization');
      return res.json();
    },
  });

  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Fetch songs
  const { data: songs } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const res = await fetch('/api/songs');
      if (!res.ok) throw new Error('Failed to fetch songs');
      return res.json();
    },
  });

  // Initialize local params when visualization loads
  useEffect(() => {
    if (visualization) {
      setLocalParams(visualization.parameters);
      setLocalType(visualization.visualType);
      setEditData({
        name: visualization.name,
        description: visualization.description || '',
        projectId: visualization.projectId || '',
        songId: visualization.songId || '',
      });
    }
  }, [visualization]);

  // Get color scheme colors
  const getColors = useCallback(() => {
    const scheme = COLOR_SCHEMES.find((s) => s.value === localParams?.colorScheme) || COLOR_SCHEMES[0];
    return scheme.colors;
  }, [localParams?.colorScheme]);

  // Draw visualization
  const draw = useCallback(() => {
    if (!canvasRef.current || !localParams) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = localParams.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Get audio data
    let dataArray: Uint8Array<ArrayBuffer>;
    if (analyserRef.current && localParams.reactToAudio) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
      analyserRef.current.getByteFrequencyData(dataArray);
    } else {
      // Generate fake data for preview
      dataArray = new Uint8Array(128) as Uint8Array<ArrayBuffer>;
      const time = Date.now() / 1000;
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.sin(time * 2 + i * 0.1) * 50 + Math.sin(time * 3 + i * 0.2) * 50 + 100;
      }
    }

    const colors = getColors();

    // Apply glow
    if (localParams.glowIntensity > 0) {
      ctx.shadowBlur = 20 * localParams.glowIntensity;
      ctx.shadowColor = colors[0];
    } else {
      ctx.shadowBlur = 0;
    }

    // Draw based on type
    switch (localType) {
      case 'bars':
        drawBars(ctx, dataArray, width, height, colors);
        break;
      case 'waveform':
        drawWaveform(ctx, dataArray, width, height, colors);
        break;
      case 'circular':
        drawCircular(ctx, dataArray, width, height, colors);
        break;
      case 'particles':
        drawParticles(ctx, dataArray, width, height, colors);
        break;
      case 'kaleidoscope':
        drawKaleidoscope(ctx, dataArray, width, height, colors);
        break;
      case 'geometric':
        drawGeometric(ctx, dataArray, width, height, colors);
        break;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [localParams, localType, getColors]);

  // Draw functions
  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    if (!localParams) return;

    const barCount = Math.min(localParams.barCount, data.length);
    const totalBarWidth = width / barCount;
    const barWidth = totalBarWidth * localParams.barWidth;
    const gap = totalBarWidth * localParams.barGap;

    for (let i = 0; i < barCount; i++) {
      const value = data[Math.floor((i / barCount) * data.length)] * localParams.sensitivity;
      const barHeight = (value / 255) * height * 0.8;

      const x = i * totalBarWidth + gap / 2;
      const y = height - barHeight;

      // Gradient
      const gradient = ctx.createLinearGradient(x, height, x, y);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[2] || colors[0]);

      ctx.fillStyle = gradient;

      // Draw rounded bar
      if (localParams.barRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, localParams.barRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // Mirror mode
      if (localParams.mirrorMode) {
        ctx.fillRect(x, 0, barWidth, barHeight);
      }
    }
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    if (!localParams) return;

    ctx.lineWidth = 3;
    ctx.strokeStyle = colors[0];
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 255) * localParams.sensitivity;
      const y = (v * height) / 2 + height / 4;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw second wave with offset
    ctx.strokeStyle = colors[1];
    ctx.beginPath();
    x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 255) * localParams.sensitivity;
      const y = height - ((v * height) / 2 + height / 4);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    if (!localParams) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    ctx.lineWidth = 2;

    const barCount = Math.min(localParams.barCount, data.length);
    const angleStep = (Math.PI * 2) / barCount;

    for (let i = 0; i < barCount; i++) {
      const value = data[Math.floor((i / barCount) * data.length)] * localParams.sensitivity;
      const barHeight = (value / 255) * radius;

      const angle = i * angleStep - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);

      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Inner circle
    ctx.strokeStyle = colors[2] || colors[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  };

  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number }>>([]);

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    if (!localParams) return;

    // Initialize particles
    if (particlesRef.current.length !== localParams.particleCount) {
      particlesRef.current = Array.from({ length: localParams.particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * localParams.particleSize + 1,
      }));
    }

    // Get average audio value
    const avgValue = data.reduce((a, b) => a + b, 0) / data.length;
    const intensity = (avgValue / 255) * localParams.sensitivity;

    particlesRef.current.forEach((p, i) => {
      // Update position
      p.x += p.vx * localParams.particleSpeed * (1 + intensity);
      p.y += p.vy * localParams.particleSpeed * (1 + intensity);

      // Wrap around
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Draw particle
      const colorIndex = i % colors.length;
      ctx.fillStyle = colors[colorIndex];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + intensity * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw connections
    ctx.strokeStyle = colors[0] + '40';
    ctx.lineWidth = 1;
    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const dx = particlesRef.current[i].x - particlesRef.current[j].x;
        const dy = particlesRef.current[i].y - particlesRef.current[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
          ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
          ctx.stroke();
        }
      }
    }
  };

  const drawKaleidoscope = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    if (!localParams) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() / 1000;
    const segments = 8;

    ctx.save();
    ctx.translate(centerX, centerY);

    for (let s = 0; s < segments; s++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * s) / segments + time * localParams.rotationSpeed);

      for (let i = 0; i < 32; i++) {
        const value = data[i % data.length] * localParams.sensitivity;
        const size = (value / 255) * 50 + 10;
        const dist = i * 8 + 50;
        const angle = i * 0.2;

        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(
          Math.cos(angle + time) * dist,
          Math.sin(angle + time) * dist,
          size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  };

  const drawGeometric = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    if (!localParams) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() / 1000;

    // Get average
    const avgValue = data.reduce((a, b) => a + b, 0) / data.length;
    const scale = 1 + (avgValue / 255) * localParams.sensitivity * 0.5;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * localParams.rotationSpeed);
    ctx.scale(scale, scale);

    // Draw nested shapes
    for (let layer = 0; layer < 5; layer++) {
      const layerValue = data[layer * 10] || 128;
      const layerScale = 1 - layer * 0.15;
      const sides = 3 + layer;
      const radius = 100 * layerScale * (0.5 + (layerValue / 255) * localParams.sensitivity);

      ctx.strokeStyle = colors[layer % colors.length];
      ctx.lineWidth = 3 - layer * 0.5;
      ctx.beginPath();

      for (let i = 0; i <= sides; i++) {
        const angle = (Math.PI * 2 * i) / sides + layer * 0.2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  };

  // Start animation loop
  useEffect(() => {
    if (localParams) {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, localParams]);

  // Handle audio file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  // Setup audio context
  const setupAudio = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    analyserRef.current.smoothingTimeConstant = localParams?.smoothing || 0.8;

    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
  }, [localParams?.smoothing]);

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (!audioContextRef.current) {
      setupAudio();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update params
  const updateParam = (key: keyof VisualizationParams, value: any) => {
    if (!localParams) return;
    setLocalParams({ ...localParams, [key]: value });
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/visualizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualType: localType,
          parameters: localParams,
          ...editData,
          projectId: editData.projectId || null,
          songId: editData.songId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Visualization saved!');
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['visualization', id] });
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
    } catch (error) {
      toast.error('Failed to save visualization');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/visualizations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Visualization deleted');
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
      router.push('/visualizations');
    } catch (error) {
      toast.error('Failed to delete visualization');
    }
  };

  // Export video
  const startRecording = () => {
    if (!canvasRef.current) return;

    const stream = canvasRef.current.captureStream(30);
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recordedChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${visualization?.name || 'visualization'}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      toast.success('Video exported!');
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    toast.success('Recording started...');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  if (isLoading || !localParams) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!visualization) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/visualizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Visualizations
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">Visualization not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/visualizations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{visualization.name}</h1>
          {visualization.description && (
            <p className="text-sm text-zinc-400">{visualization.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {visualization.project && (
          <Badge variant="outline">
            <FolderKanban className="mr-1 h-3 w-3" />
            {visualization.project.name}
          </Badge>
        )}
        {visualization.song && (
          <Badge variant="outline">
            <Music className="mr-1 h-3 w-3" />
            {visualization.song.title}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
        {/* Canvas Preview */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full aspect-video bg-black"
            />
            {/* Controls */}
            <div className="p-4 border-t border-zinc-800 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="audio-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Load Audio</span>
                  </div>
                </Label>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
              </div>

              {audioUrl && (
                <>
                  <Button onClick={togglePlayback} size="sm">
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-zinc-400">
                    {audioFile?.name}
                  </span>
                </>
              )}

              <div className="ml-auto flex items-center gap-2">
                {isRecording ? (
                  <Button onClick={stopRecording} variant="destructive" size="sm">
                    <Video className="mr-2 h-4 w-4 animate-pulse" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button onClick={startRecording} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export Video
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Parameters</CardTitle>
            <CardDescription>Customize the visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="style" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="style">
                  <Palette className="h-4 w-4 mr-1" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Music className="h-4 w-4 mr-1" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="effects">
                  <Sliders className="h-4 w-4 mr-1" />
                  Effects
                </TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-4 mt-4">
                {/* Visual Type */}
                <div className="space-y-2">
                  <Label>Visual Type</Label>
                  <Select value={localType} onValueChange={setLocalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISUAL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Scheme */}
                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_SCHEMES.map((scheme) => (
                      <button
                        key={scheme.value}
                        onClick={() => updateParam('colorScheme', scheme.value)}
                        className={cn(
                          'p-2 rounded-lg border transition-all',
                          localParams.colorScheme === scheme.value
                            ? 'border-violet-500 ring-2 ring-violet-500/20'
                            : 'border-zinc-700 hover:border-zinc-600'
                        )}
                      >
                        <div className="flex gap-0.5 mb-1">
                          {scheme.colors.map((c, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-zinc-400">{scheme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label>Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localParams.backgroundColor}
                      onChange={(e) => updateParam('backgroundColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={localParams.backgroundColor}
                      onChange={(e) => updateParam('backgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Bar Count (for bars type) */}
                {localType === 'bars' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Bar Count</Label>
                      <span className="text-sm text-zinc-400">{localParams.barCount}</span>
                    </div>
                    <Slider
                      value={[localParams.barCount]}
                      onValueChange={([v]) => updateParam('barCount', v)}
                      min={8}
                      max={128}
                      step={1}
                    />
                  </div>
                )}

                {/* Particle Count */}
                {localType === 'particles' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Particle Count</Label>
                      <span className="text-sm text-zinc-400">{localParams.particleCount}</span>
                    </div>
                    <Slider
                      value={[localParams.particleCount]}
                      onValueChange={([v]) => updateParam('particleCount', v)}
                      min={20}
                      max={200}
                      step={10}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="audio" className="space-y-4 mt-4">
                {/* Sensitivity */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Sensitivity</Label>
                    <span className="text-sm text-zinc-400">{localParams.sensitivity.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[localParams.sensitivity]}
                    onValueChange={([v]) => updateParam('sensitivity', v)}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>

                {/* Smoothing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Smoothing</Label>
                    <span className="text-sm text-zinc-400">{localParams.smoothing.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[localParams.smoothing]}
                    onValueChange={([v]) => updateParam('smoothing', v)}
                    min={0}
                    max={0.99}
                    step={0.01}
                  />
                </div>

                {/* React to Audio */}
                <div className="flex items-center justify-between">
                  <Label>React to Audio</Label>
                  <Switch
                    checked={localParams.reactToAudio}
                    onCheckedChange={(v) => updateParam('reactToAudio', v)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4 mt-4">
                {/* Glow */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Glow Intensity</Label>
                    <span className="text-sm text-zinc-400">{localParams.glowIntensity.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[localParams.glowIntensity]}
                    onValueChange={([v]) => updateParam('glowIntensity', v)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                {/* Rotation Speed */}
                {(localType === 'kaleidoscope' || localType === 'geometric') && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Rotation Speed</Label>
                      <span className="text-sm text-zinc-400">{localParams.rotationSpeed.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[localParams.rotationSpeed]}
                      onValueChange={([v]) => updateParam('rotationSpeed', v)}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                )}

                {/* Mirror Mode */}
                {localType === 'bars' && (
                  <div className="flex items-center justify-between">
                    <Label>Mirror Mode</Label>
                    <Switch
                      checked={localParams.mirrorMode}
                      onCheckedChange={(v) => updateParam('mirrorMode', v)}
                    />
                  </div>
                )}

                {/* Particle Speed */}
                {localType === 'particles' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Particle Speed</Label>
                      <span className="text-sm text-zinc-400">{localParams.particleSpeed.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[localParams.particleSpeed]}
                      onValueChange={([v]) => updateParam('particleSpeed', v)}
                      min={0.1}
                      max={3}
                      step={0.1}
                    />
                  </div>
                )}

                {/* Bar Settings */}
                {localType === 'bars' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Bar Width</Label>
                        <span className="text-sm text-zinc-400">{(localParams.barWidth * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[localParams.barWidth]}
                        onValueChange={([v]) => updateParam('barWidth', v)}
                        min={0.3}
                        max={1}
                        step={0.05}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Bar Radius</Label>
                        <span className="text-sm text-zinc-400">{localParams.barRadius}px</span>
                      </div>
                      <Slider
                        value={[localParams.barRadius]}
                        onValueChange={([v]) => updateParam('barRadius', v)}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Visualization</DialogTitle>
            <DialogDescription>Update visualization settings and links</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Link to Project</Label>
              <Select
                value={editData.projectId || 'none'}
                onValueChange={(value) =>
                  setEditData({ ...editData, projectId: value === 'none' ? '' : value })
                }
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
                onValueChange={(value) =>
                  setEditData({ ...editData, songId: value === 'none' ? '' : value })
                }
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
            <Button onClick={handleSave} disabled={isSaving}>
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
            <AlertDialogTitle>Delete Visualization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{visualization.name}&quot;? This action cannot be undone.
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
