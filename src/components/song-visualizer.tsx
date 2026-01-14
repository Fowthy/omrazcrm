'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Maximize2, Minimize2, X } from 'lucide-react';
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
  visualType: string;
  parameters: VisualizationParams;
}

interface SongVisualizerProps {
  visualization: Visualization;
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onClose?: () => void;
}

const COLOR_SCHEMES: Record<string, string[]> = {
  neon: ['#00ffff', '#ff00ff', '#00ff00'],
  sunset: ['#ff6b6b', '#ffa500', '#ffff00'],
  ocean: ['#0077be', '#00bfff', '#7fffd4'],
  forest: ['#228b22', '#32cd32', '#90ee90'],
  fire: ['#ff4500', '#ff6347', '#ffd700'],
  monochrome: ['#ffffff', '#888888', '#ffffff'],
  rainbow: ['#ff0000', '#00ff00', '#0000ff'],
  synthwave: ['#ff00ff', '#00ffff', '#ff1493'],
  cyberpunk: ['#f0f000', '#ff00ff', '#00ffff'],
  aurora: ['#00ff88', '#00ffcc', '#8800ff'],
  lava: ['#ff0000', '#ff4400', '#ffcc00'],
  ice: ['#88eeff', '#ffffff', '#aaddff'],
};

export function SongVisualizer({ visualization, audioElement, isPlaying, onClose }: SongVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number }>>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const params = visualization.parameters;
  const visualType = visualization.visualType;

  // Get colors from scheme
  const getColors = useCallback(() => {
    return COLOR_SCHEMES[params.colorScheme] || COLOR_SCHEMES.neon;
  }, [params.colorScheme]);

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioElement || isInitialized) return;

    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (!sourceRef.current && audioElement) {
        try {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = params.smoothing;

          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          setIsInitialized(true);
        } catch (e) {
          // Source already connected
          console.log('Audio source already connected');
        }
      }
    };

    // Initialize on first play
    audioElement.addEventListener('play', initAudio, { once: true });

    return () => {
      audioElement.removeEventListener('play', initAudio);
    };
  }, [audioElement, params.smoothing, isInitialized]);

  // Initialize particles
  useEffect(() => {
    if (visualType === 'particles' && canvasRef.current) {
      const canvas = canvasRef.current;
      particlesRef.current = Array.from({ length: params.particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * params.particleSpeed,
        vy: (Math.random() - 0.5) * params.particleSpeed,
        size: params.particleSize + Math.random() * 2,
      }));
    }
  }, [visualType, params.particleCount, params.particleSpeed, params.particleSize]);

  // Draw visualization
  const draw = useCallback(() => {
    if (!canvasRef.current || !params) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Get audio data
    let dataArray: Uint8Array<ArrayBuffer>;
    if (analyserRef.current && params.reactToAudio && isPlaying) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
      analyserRef.current.getByteFrequencyData(dataArray);
    } else {
      // Generate animated preview data
      dataArray = new Uint8Array(128) as Uint8Array<ArrayBuffer>;
      const time = Date.now() / 1000;
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.sin(time * 2 + i * 0.1) * 50 + Math.sin(time * 3 + i * 0.2) * 50 + 100;
      }
    }

    const colors = getColors();

    // Apply glow
    if (params.glowIntensity > 0) {
      ctx.shadowBlur = 20 * params.glowIntensity;
      ctx.shadowColor = colors[0];
    } else {
      ctx.shadowBlur = 0;
    }

    // Draw based on type
    switch (visualType) {
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
      case 'spiral':
        drawSpiral(ctx, dataArray, width, height, colors);
        break;
      case 'matrix':
        drawMatrix(ctx, dataArray, width, height, colors);
        break;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [params, visualType, getColors, isPlaying]);

  // Draw functions
  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    const barCount = Math.min(params.barCount, data.length);
    const totalBarWidth = width / barCount;
    const barWidth = totalBarWidth * params.barWidth;
    const gap = totalBarWidth * params.barGap;

    for (let i = 0; i < barCount; i++) {
      const value = data[Math.floor((i / barCount) * data.length)] * params.sensitivity;
      const barHeight = (value / 255) * height * 0.8;

      const x = i * totalBarWidth + gap / 2;
      const y = height - barHeight;

      const gradient = ctx.createLinearGradient(x, height, x, y);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[2] || colors[0]);

      ctx.fillStyle = gradient;

      if (params.barRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, params.barRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      if (params.mirrorMode) {
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
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors[0];
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i] * params.sensitivity;
      const y = (value / 255) * height * 0.4 + height * 0.3;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.stroke();

    // Mirror
    ctx.strokeStyle = colors[1];
    ctx.beginPath();
    x = 0;
    for (let i = 0; i < data.length; i++) {
      const value = data[i] * params.sensitivity;
      const y = height - ((value / 255) * height * 0.4 + height * 0.3);

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
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    for (let i = 0; i < data.length; i++) {
      const value = data[i] * params.sensitivity;
      const barHeight = (value / 255) * radius * 0.8;
      const angle = (i / data.length) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const colorIndex = Math.floor((i / data.length) * colors.length);
      ctx.strokeStyle = colors[colorIndex % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    const avgValue = data.reduce((a, b) => a + b, 0) / data.length;
    const intensity = (avgValue / 255) * params.sensitivity;

    particlesRef.current.forEach((particle, i) => {
      // Update position
      particle.x += particle.vx * (1 + intensity * 2);
      particle.y += particle.vy * (1 + intensity * 2);

      // Wrap around
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      // Draw particle
      const colorIndex = i % colors.length;
      ctx.fillStyle = colors[colorIndex];
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 + intensity), 0, Math.PI * 2);
      ctx.fill();

      // Draw connections
      particlesRef.current.slice(i + 1).forEach((other) => {
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          ctx.strokeStyle = `rgba(${parseInt(colors[0].slice(1, 3), 16)}, ${parseInt(colors[0].slice(3, 5), 16)}, ${parseInt(colors[0].slice(5, 7), 16)}, ${1 - dist / 100})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      });
    });
  };

  const drawKaleidoscope = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() / 1000 * params.rotationSpeed;
    const segments = 8;

    for (let s = 0; s < segments; s++) {
      const segmentAngle = (Math.PI * 2 * s) / segments + time;

      for (let i = 0; i < data.length / 4; i++) {
        const value = data[i] * params.sensitivity;
        const radius = (i / (data.length / 4)) * Math.min(width, height) * 0.4;
        const size = (value / 255) * 15 + 3;

        const x = centerX + Math.cos(segmentAngle + i * 0.1) * radius;
        const y = centerY + Math.sin(segmentAngle + i * 0.1) * radius;

        const colorIndex = i % colors.length;
        ctx.fillStyle = colors[colorIndex];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawGeometric = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() / 1000 * params.rotationSpeed;
    const avgValue = data.reduce((a, b) => a + b, 0) / data.length;
    const scale = 0.5 + (avgValue / 255) * params.sensitivity * 0.5;

    const shapes = [3, 4, 5, 6, 7];
    shapes.forEach((sides, shapeIndex) => {
      const radius = (shapeIndex + 1) * 30 * scale;
      const rotation = time * (shapeIndex % 2 === 0 ? 1 : -1);

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = (Math.PI * 2 * i) / sides + rotation;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = colors[shapeIndex % colors.length];
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const drawSpiral = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() / 1000 * params.rotationSpeed;

    for (let arm = 0; arm < 6; arm++) {
      ctx.beginPath();
      ctx.strokeStyle = colors[arm % colors.length];
      ctx.lineWidth = 2;

      for (let i = 0; i < data.length; i++) {
        const value = data[i] * params.sensitivity;
        const angle = (i / data.length) * Math.PI * 4 + (arm * Math.PI * 2) / 6 + time;
        const radius = (i / data.length) * Math.min(width, height) * 0.4 + (value / 255) * 20;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  };

  const drawMatrix = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    colors: string[]
  ) => {
    const chars = 'OMRAZ01アイウエオカキクケコ';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);

    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < columns; i++) {
      const value = data[i % data.length] * params.sensitivity;
      const y = (Date.now() / 50 + i * 20) % height;
      const char = chars[Math.floor(Math.random() * chars.length)];

      const brightness = value / 255;
      ctx.fillStyle = `rgba(${parseInt(colors[0].slice(1, 3), 16)}, ${parseInt(colors[0].slice(3, 5), 16)}, ${parseInt(colors[0].slice(5, 7), 16)}, ${brightness})`;
      ctx.fillText(char, i * fontSize, y);
    }
  };

  // Start/stop animation
  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  // Resume audio context if suspended
  useEffect(() => {
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [isPlaying]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <Link href={`/visualizations/${visualization.id}`}>
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="absolute bottom-4 left-4">
          <Badge variant="outline" className="bg-black/50">
            {visualization.name}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-cyan-500/5">
      <CardContent className="p-0 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-[200px] object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Link href={`/visualizations/${visualization.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70">
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="bg-black/50 text-xs">
            {visualization.name}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
