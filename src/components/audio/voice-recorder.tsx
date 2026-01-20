'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onUpload?: (file: File) => Promise<void>;
  maxDuration?: number; // in seconds
  className?: string;
}

export function VoiceRecorder({
  onRecordingComplete,
  onUpload,
  maxDuration = 300, // 5 minutes default
  className = '',
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      // Start visualizing audio levels
      const visualize = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        if (isRecording) {
          animationRef.current = requestAnimationFrame(visualize);
        }
      };

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob, duration);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const newDuration = d + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      visualize();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setAudioLevel(0);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  };

  const playRecording = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob || !onUpload) return;

    setIsUploading(true);
    try {
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      await onUpload(file);
      discardRecording();
      toast.success('Voice note uploaded!');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload voice note');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`bg-zinc-900/50 border-zinc-800 ${className}`}>
      <CardContent className="p-4">
        {/* Hidden audio element for playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Recording state */}
        {isRecording ? (
          <div className="space-y-4">
            {/* Audio level visualization */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-75"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-mono text-sm">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Recording controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePause}
                className="h-12 w-12 rounded-full border-zinc-700"
              >
                {isPaused ? (
                  <Mic className="h-5 w-5 text-red-400" />
                ) : (
                  <Pause className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={stopRecording}
                className="h-14 w-14 rounded-full"
              >
                <Square className="h-6 w-6" />
              </Button>
            </div>

            <p className="text-center text-xs text-zinc-500">
              {isPaused ? 'Paused' : 'Recording...'} (max {formatTime(maxDuration)})
            </p>
          </div>
        ) : audioUrl ? (
          /* Playback state */
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={playRecording}
                className="h-12 w-12 rounded-full bg-violet-600/20 hover:bg-violet-600"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-violet-400" />
                ) : (
                  <Play className="h-5 w-5 text-violet-400 ml-0.5" />
                )}
              </Button>
              <div className="flex-1">
                <p className="text-white font-medium">Voice Recording</p>
                <p className="text-sm text-zinc-400">{formatTime(duration)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={discardRecording}
                className="border-zinc-700 text-zinc-400"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Discard
              </Button>
              {onUpload && (
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Save Note
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Ready to record state */
          <div className="text-center space-y-4">
            <Button
              onClick={startRecording}
              className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
            >
              <Mic className="h-7 w-7" />
            </Button>
            <p className="text-sm text-zinc-400">Tap to record a voice note</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
