'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lock,
  Loader2,
  AlertCircle,
  Music,
  FolderKanban,
  FileText,
  ListMusic,
  Calendar,
  Mic2,
  Image as ImageIcon,
  Timer,
  Clock,
  User,
  Download,
  Eye,
  Play,
  ExternalLink,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import Link from 'next/link';

// Format date helper
function formatDate(date: string | Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Type icons map
const TYPE_ICONS: Record<string, any> = {
  project: FolderKanban,
  song: Music,
  file: FileText,
  setlist: ListMusic,
  rehearsal: Calendar,
  show: Mic2,
  media: ImageIcon,
  'tempo-map': Timer,
};

// Project View Component
function ProjectView({ data, allowDownload }: { data: any; allowDownload: boolean }) {
  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Badge variant="secondary">{data.type}</Badge>
          <Badge variant={data.status === 'released' ? 'default' : 'outline'}>
            {data.status}
          </Badge>
        </div>
        {data.description && <p className="text-zinc-300">{data.description}</p>}
        {data.releaseDate && (
          <p className="text-sm text-zinc-500 mt-2">
            Release Date: {formatDate(data.releaseDate)}
          </p>
        )}
        {data.createdBy && (
          <p className="text-sm text-zinc-500">By: {data.createdBy.name}</p>
        )}
      </div>

      {/* Songs */}
      {data.songs && data.songs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Music className="h-5 w-5" />
            Songs ({data.songs.length})
          </h3>
          <div className="space-y-2">
            {data.songs.map((song: any, index: number) => (
              <Card key={song.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 w-6">{index + 1}</span>
                      <div>
                        <p className="font-medium text-white">{song.title}</p>
                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                          {song.duration && <span>{formatDuration(song.duration)}</span>}
                          {song.bpm && <span>{song.bpm} BPM</span>}
                          {song.musicalKey && <span>{song.musicalKey}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {song.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {data.files && data.files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Files ({data.files.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.files.map((file: any) => (
              <Card key={file.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{file.type}</p>
                  </div>
                  {allowDownload && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Song View Component
function SongView({ data, allowDownload }: { data: any; allowDownload: boolean }) {
  return (
    <div className="space-y-6">
      {/* Song Header */}
      <div>
        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-2">
          {data.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(data.duration)}
            </span>
          )}
          {data.bpm && <span>{data.bpm} BPM</span>}
          {data.musicalKey && <span>Key: {data.musicalKey}</span>}
          {data.timeSignature && <span>{data.timeSignature}</span>}
        </div>
        {data.description && <p className="text-zinc-300">{data.description}</p>}
        {data.project && (
          <p className="text-sm text-zinc-500 mt-2">
            From project: {data.project.name}
          </p>
        )}
        {data.createdBy && (
          <p className="text-sm text-zinc-500">By: {data.createdBy.name}</p>
        )}
      </div>

      {/* Credits */}
      {data.credits && data.credits.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Credits</h3>
          <div className="flex flex-wrap gap-2">
            {data.credits.map((credit: any) => (
              <Badge key={credit.id} variant="secondary">
                {credit.userName} - {credit.role}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Lyrics */}
      {data.lyrics && data.lyrics.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Lyrics</h3>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-4">
              <pre className="whitespace-pre-wrap font-sans text-zinc-300">
                {data.lyrics[0].content}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Files */}
      {data.files && data.files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Files</h3>
          <div className="grid gap-2">
            {data.files.map((file: any) => (
              <Card key={file.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-xs text-zinc-500">{file.type}</p>
                  </div>
                  {allowDownload && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Setlist View Component
function SetlistView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        {data.description && <p className="text-zinc-300">{data.description}</p>}
        <div className="flex items-center gap-4 text-sm text-zinc-400 mt-2">
          {data.venue && <span>Venue: {data.venue}</span>}
          {data.eventDate && <span>Date: {formatDate(data.eventDate)}</span>}
          {data.totalDuration && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(data.totalDuration)}
            </span>
          )}
        </div>
      </div>

      {data.items && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((item: any, index: number) => (
            <Card key={item.id} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono w-6">{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.songTitle}</p>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      {item.songDuration && <span>{formatDuration(item.customDuration || item.songDuration)}</span>}
                      {item.songBpm && <span>{item.songBpm} BPM</span>}
                      {item.songKey && <span>{item.songKey}</span>}
                    </div>
                    {item.notes && <p className="text-xs text-zinc-500 mt-1">{item.notes}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Rehearsal View Component
function RehearsalView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          {data.location && <span>Location: {data.location}</span>}
          {data.scheduledAt && <span>Date: {formatDate(data.scheduledAt)}</span>}
        </div>
        {data.notes && <p className="text-zinc-300 mt-2">{data.notes}</p>}
        {data.goals && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-white mb-2">Goals</h4>
            <p className="text-zinc-400">{data.goals}</p>
          </div>
        )}
      </div>

      {data.attendees && data.attendees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Attendees</h3>
          <div className="flex flex-wrap gap-2">
            {data.attendees.map((attendee: any) => (
              <Badge
                key={attendee.id}
                variant={attendee.status === 'confirmed' ? 'default' : 'outline'}
              >
                {attendee.userName}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Show View Component
function ShowView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-medium">{data.venue}</p>
            {data.city && data.country && (
              <p className="text-sm text-zinc-400">{data.city}, {data.country}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-medium">{formatDate(data.date)}</p>
            {data.doors && <p className="text-sm text-zinc-400">Doors: {new Date(data.doors).toLocaleTimeString()}</p>}
          </CardContent>
        </Card>
      </div>

      {data.ticketLink && (
        <Button asChild className="w-full">
          <a href={data.ticketLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Get Tickets {data.ticketPrice && `- $${data.ticketPrice}`}
          </a>
        </Button>
      )}

      {data.notes && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
          <p className="text-zinc-300">{data.notes}</p>
        </div>
      )}

      {data.setlist && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Setlist</h3>
          <SetlistView data={data.setlist} />
        </div>
      )}
    </div>
  );
}

// Media View Component
function MediaView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {data.type === 'youtube' && data.youtubeVideoId && (
        <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900">
          <iframe
            src={`https://www.youtube.com/embed/${data.youtubeVideoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {data.description && <p className="text-zinc-300">{data.description}</p>}

      <div className="flex items-center gap-4 text-sm text-zinc-400">
        <Badge variant="secondary">{data.category}</Badge>
        {data.date && <span>Date: {formatDate(data.date)}</span>}
        {data.duration && <span>{formatDuration(data.duration)}</span>}
      </div>

      {data.tags && (
        <div className="flex flex-wrap gap-2">
          {data.tags.split(',').map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Tempo Map View Component
function TempoMapView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-zinc-400">
        <span>Default: {data.defaultBpm} BPM</span>
        <span>{data.defaultTimeSignature}</span>
        {data.totalBars && <span>{data.totalBars} bars</span>}
        {data.totalDuration && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(Math.round(data.totalDuration))}
          </span>
        )}
      </div>

      {data.description && <p className="text-zinc-300">{data.description}</p>}

      {data.song && (
        <p className="text-sm text-zinc-500">For song: {data.song.title}</p>
      )}

      {data.sections && data.sections.length > 0 && (
        <div className="space-y-2">
          {data.sections.map((section: any, index: number) => (
            <Card key={section.id} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 w-6">{index + 1}</span>
                    <div>
                      <p className="font-medium text-white">
                        {section.name || `Section ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <span>{section.bars} bars</span>
                        <span>{section.bpm} BPM</span>
                        <span>
                          {section.timeSignatureNumerator}/{section.timeSignatureDenominator}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// File View Component
function FileView({ data, allowDownload }: { data: any; allowDownload: boolean }) {
  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-zinc-800 flex items-center justify-center">
              <FileText className="h-8 w-8 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-medium text-white">{data.name}</p>
              <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                <Badge variant="secondary">{data.type}</Badge>
                {data.size && <span>{(data.size / 1024 / 1024).toFixed(2)} MB</span>}
              </div>
            </div>
            {allowDownload && (
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {data.description && <p className="text-zinc-300">{data.description}</p>}

      {data.uploadedBy && (
        <p className="text-sm text-zinc-500">Uploaded by: {data.uploadedBy.name}</p>
      )}
    </div>
  );
}

// Main Share Page Component
export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [shareData, setShareData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Check share status on load
  useEffect(() => {
    async function checkShare() {
      try {
        const res = await fetch(`/api/public/share/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Share not found');
          setLoading(false);
          return;
        }

        setShareInfo(data);

        if (!data.isActive) {
          setError('This share link has been deactivated');
        } else if (data.isExpired) {
          setError('This share link has expired');
        } else if (data.isMaxViews) {
          setError('This share link has reached its view limit');
        } else if (!data.requiresPassword) {
          // No password required, fetch data immediately
          await fetchShareData();
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load share');
        setLoading(false);
      }
    }

    checkShare();
  }, [token]);

  // Fetch share data (with optional password)
  async function fetchShareData(pwd?: string) {
    setIsSubmitting(true);
    setPasswordError(null);

    try {
      const res = await fetch(`/api/public/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd || password }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.requiresPassword) {
          setPasswordError('Password required');
        } else {
          setPasswordError(result.error || 'Failed to access share');
        }
        setIsSubmitting(false);
        return;
      }

      setShareData(result);
      setShareInfo((prev: any) => ({ ...prev, ...result.share }));
    } catch (err) {
      setPasswordError('Failed to access share');
    }

    setIsSubmitting(false);
  }

  // Handle password submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShareData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Unable to Access</h2>
            <p className="text-zinc-400">{error}</p>
            <Button className="mt-6" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password required state
  if (shareInfo?.requiresPassword && !shareData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-zinc-400" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>
              This {shareInfo.shareType} is password protected. Enter the password to view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Access Content
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Content loaded
  const Icon = TYPE_ICONS[shareData?.data?.type] || FileText;
  const data = shareData?.data;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {shareInfo?.name || data?.name || data?.title || 'Shared Content'}
              </h1>
              <p className="text-sm text-zinc-400 capitalize">{shareInfo?.shareType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Eye className="h-4 w-4" />
            <span>{shareInfo?.viewCount || 0} views</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {data?.type === 'project' && (
          <ProjectView data={data} allowDownload={shareInfo?.allowDownload} />
        )}
        {data?.type === 'song' && (
          <SongView data={data} allowDownload={shareInfo?.allowDownload} />
        )}
        {data?.type === 'file' && (
          <FileView data={data} allowDownload={shareInfo?.allowDownload} />
        )}
        {data?.type === 'setlist' && <SetlistView data={data} />}
        {data?.type === 'rehearsal' && <RehearsalView data={data} />}
        {data?.type === 'show' && <ShowView data={data} />}
        {data?.type === 'media' && <MediaView data={data} />}
        {data?.type === 'tempo-map' && <TempoMapView data={data} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-zinc-500">
            Shared via{' '}
            <Link href="/" className="text-violet-400 hover:underline">
              Omraz Studio
            </Link>
          </p>
          {shareInfo?.expiresAt && (
            <p className="text-xs text-zinc-600 mt-1">
              This link expires on {formatDate(shareInfo.expiresAt)}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
