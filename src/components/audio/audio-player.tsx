'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  onTimeUpdate?: (time: number) => void;
  onAddComment?: (timestamp: number) => void;
  className?: string;
}

export function AudioPlayer({
  src,
  title,
  artist,
  onTimeUpdate,
  onAddComment,
  className,
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [loopRegion, setLoopRegion] = useState<{ start: number; end: number } | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f4f4f',
      progressColor: '#8b5cf6',
      cursorColor: '#06b6d4',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.load(src);

    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('audioprocess', () => {
      const time = wavesurfer.getCurrentTime();
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Handle looping
      if (isLooping && loopRegion && time >= loopRegion.end) {
        wavesurfer.seekTo(loopRegion.start / duration);
      }
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      if (isLooping && !loopRegion) {
        wavesurfer.seekTo(0);
        wavesurfer.play();
      }
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [src]);

  // Update volume
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  // Update playback rate
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (wavesurferRef.current && duration > 0) {
      wavesurferRef.current.seekTo(time / duration);
    }
  }, [duration]);

  const skipBackward = useCallback(() => {
    seek(Math.max(0, currentTime - 10));
  }, [currentTime, seek]);

  const skipForward = useCallback(() => {
    seek(Math.min(duration, currentTime + 10));
  }, [currentTime, duration, seek]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleAddComment = useCallback(() => {
    onAddComment?.(currentTime);
  }, [currentTime, onAddComment]);

  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/50 p-4', className)}>
      {/* Header */}
      {(title || artist) && (
        <div className="mb-4">
          {title && <h4 className="font-medium text-white">{title}</h4>}
          {artist && <p className="text-sm text-zinc-400">{artist}</p>}
        </div>
      )}

      {/* Waveform */}
      <div className="relative mb-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        )}
        <div
          ref={containerRef}
          className="waveform-container cursor-pointer rounded-lg"
          onClick={(e) => {
            if (!wavesurferRef.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const progress = x / rect.width;
            wavesurferRef.current.seekTo(progress);
          }}
        />
      </div>

      {/* Time Display */}
      <div className="mb-4 flex items-center justify-between text-sm text-zinc-400">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Main Controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={skipBackward}>
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={skipForward}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center gap-4">
          {/* Loop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLooping(!isLooping)}
            className={isLooping ? 'text-violet-400' : ''}
          >
            <Repeat className="h-5 w-5" />
          </Button>

          {/* Playback Speed */}
          <Select
            value={playbackRate.toString()}
            onValueChange={(value) => setPlaybackRate(parseFloat(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={([value]) => {
                setVolume(value / 100);
                if (value > 0) setIsMuted(false);
              }}
              max={100}
              step={1}
              className="w-24"
            />
          </div>

          {/* Add Comment */}
          {onAddComment && (
            <Button variant="ghost" size="icon" onClick={handleAddComment}>
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
