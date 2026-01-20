'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  GitBranch,
  CalendarDays,
  MessageSquare,
  Music,
  Album,
  Play,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AudioPlayer } from '@/components/audio/audio-player';

interface TimelineEvent {
  id: string;
  type: 'decision' | 'session' | 'version' | 'note';
  date: Date;
  title: string;
  description: string | null;
  status?: string;
  albumName?: string;
  songTitle?: string;
  audioUrl?: string;
  metadata?: Record<string, any>;
}

interface Project {
  id: string;
  name: string;
}

const eventTypeIcons = {
  decision: GitBranch,
  session: CalendarDays,
  version: Music,
  note: MessageSquare,
};

const eventTypeColors = {
  decision: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  session: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  version: 'bg-green-500/20 text-green-400 border-green-500/30',
  note: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const statusColors: Record<string, string> = {
  proposed: 'bg-blue-500/20 text-blue-400',
  testing: 'bg-yellow-500/20 text-yellow-400',
  locked: 'bg-green-500/20 text-green-400',
  reopened: 'bg-orange-500/20 text-orange-400',
};

type ViewMode = 'day' | 'week' | 'month';

export default function TimelinePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
      fetchTimelineEvents();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTimelineEvents = async () => {
    setLoading(true);
    try {
      // Fetch all event types in parallel
      const [decisionsRes, sessionsRes, versionsRes, notesRes] = await Promise.all([
        fetch('/api/decisions'),
        fetch('/api/sessions'),
        fetch('/api/song-versions'),
        fetch('/api/notes'),
      ]);

      const allEvents: TimelineEvent[] = [];

      // Process decisions
      if (decisionsRes.ok) {
        const decisions = await decisionsRes.json();
        decisions.forEach((d: any) => {
          allEvents.push({
            id: `decision-${d.id}`,
            type: 'decision',
            date: new Date(d.proposedAt || d.createdAt),
            title: d.question,
            description: d.context,
            status: d.status,
            albumName: d.album?.name,
            songTitle: d.song?.title,
            metadata: { decisionType: d.decisionType, confidence: d.confidence },
          });
        });
      }

      // Process sessions
      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        sessions.forEach((s: any) => {
          allEvents.push({
            id: `session-${s.id}`,
            type: 'session',
            date: new Date(s.startTime || s.date),
            title: s.preSessionIntent || 'Creative Session',
            description: s.postSessionReflection,
            albumName: s.album?.name,
            metadata: {
              endTime: s.endTime,
              preSessionEnergy: s.preSessionEnergy,
              postSessionEnergy: s.postSessionEnergy,
              postSessionMomentum: s.postSessionMomentum,
            },
          });
        });
      }

      // Process song versions
      if (versionsRes.ok) {
        const versions = await versionsRes.json();
        versions.forEach((v: any) => {
          allEvents.push({
            id: `version-${v.id}`,
            type: 'version',
            date: new Date(v.recordedAt || v.createdAt),
            title: `Version ${v.versionNumber}${v.isMainVersion ? ' (Main)' : ''}`,
            description: v.versionIntent,
            songTitle: v.song?.title,
            audioUrl: v.file?.path,
            metadata: {
              durationSeconds: v.durationSeconds,
              listenCount: v.listenCount,
              versionNumber: v.versionNumber,
            },
          });
        });
      }

      // Process notes
      if (notesRes.ok) {
        const notes = await notesRes.json();
        notes.forEach((n: any) => {
          allEvents.push({
            id: `note-${n.id}`,
            type: 'note',
            date: new Date(n.createdAt),
            title: n.noteType === 'voice' ? 'Voice Note' : 'Note',
            description: n.content,
            albumName: n.album?.name,
            songTitle: n.song?.title,
            audioUrl: n.noteType === 'voice' ? n.audioUrl : undefined,
            metadata: {
              noteType: n.noteType,
              linkedToTimestamp: n.linkedToTimestamp,
            },
          });
        });
      }

      // Sort by date descending
      allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Album filter
      if (selectedAlbum !== 'all' && event.albumName) {
        const album = projects.find((p) => p.id === selectedAlbum);
        if (album && event.albumName !== album.name) return false;
      }
      // Event type filter
      if (eventFilter !== 'all' && event.type !== eventFilter) return false;
      return true;
    });
  }, [events, selectedAlbum, eventFilter, projects]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    filteredEvents.forEach((event) => {
      const dateKey = event.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  // Get date range for current view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }
    return { start, end };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    const { start, end } = getDateRange();
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (viewMode === 'day') {
      return start.toLocaleDateString('en-US', { ...options, year: 'numeric', weekday: 'long' });
    }
    if (viewMode === 'month') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-violet-400" />
            Timeline
          </h1>
          <p className="text-zinc-400 mt-1">
            View your creative journey over time
          </p>
        </div>
      </div>

      {/* Filters and Navigation */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-zinc-400" />
                <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
                  <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="All Albums" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">All Albums</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="decision">Decisions</SelectItem>
                  <SelectItem value="session">Sessions</SelectItem>
                  <SelectItem value="version">Versions</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white font-medium min-w-[200px] text-center">
                  {formatDateRange()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-zinc-700"
              >
                Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Type Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(eventTypeColors).map(([type, color]) => {
          const Icon = eventTypeIcons[type as keyof typeof eventTypeIcons];
          return (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div className={`p-1.5 rounded-md border ${color}`}>
                <Icon className="h-3 w-3" />
              </div>
              <span className="text-zinc-400 capitalize">{type}s</span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No events found</p>
            <p className="text-zinc-500 text-sm">
              Start creating decisions, sessions, notes, or recording versions to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-800" />

          {/* Event groups by date */}
          {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
            <div key={dateStr} className="mb-8">
              {/* Date header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center z-10">
                  <span className="text-white font-bold text-sm">
                    {new Date(dateStr).getDate()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {new Date(dateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Events for this date */}
              <div className="ml-16 space-y-4">
                {dayEvents.map((event) => {
                  const Icon = eventTypeIcons[event.type];
                  const colorClass = eventTypeColors[event.type];

                  return (
                    <Card
                      key={event.id}
                      className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg border ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {event.type}
                                </Badge>
                                {event.status && (
                                  <Badge className={statusColors[event.status] || 'bg-zinc-700'}>
                                    {event.status}
                                  </Badge>
                                )}
                                {event.metadata?.decisionType && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.metadata.decisionType}
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-base text-white mt-1">
                                {event.title}
                              </CardTitle>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-500">
                            {event.date.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {event.description && (
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {/* Context badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {event.albumName && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Album className="h-3 w-3" />
                              {event.albumName}
                            </div>
                          )}
                          {event.songTitle && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Music className="h-3 w-3" />
                              {event.songTitle}
                            </div>
                          )}
                        </div>

                        {/* Audio player for versions and voice notes */}
                        {event.audioUrl && (
                          <div className="mt-3">
                            {playingAudio === event.id ? (
                              <AudioPlayer
                                src={event.audioUrl}
                                title={event.songTitle || event.title}
                                className="bg-zinc-800/50"
                              />
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPlayingAudio(event.id)}
                                className="border-zinc-700"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Play Audio
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Session-specific info */}
                        {event.type === 'session' && event.metadata && (
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            {event.metadata.preSessionEnergy && (
                              <span className="text-zinc-500">
                                Energy: {event.metadata.preSessionEnergy}/5
                                {event.metadata.postSessionEnergy && ` → ${event.metadata.postSessionEnergy}/5`}
                              </span>
                            )}
                            {event.metadata.postSessionMomentum && (
                              <Badge variant="outline" className="text-xs">
                                {event.metadata.postSessionMomentum}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Version-specific info */}
                        {event.type === 'version' && event.metadata && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            {event.metadata.durationSeconds && (
                              <span>
                                {Math.floor(event.metadata.durationSeconds / 60)}:
                                {String(Math.floor(event.metadata.durationSeconds % 60)).padStart(2, '0')}
                              </span>
                            )}
                            {event.metadata.listenCount > 0 && (
                              <span>{event.metadata.listenCount} listens</span>
                            )}
                          </div>
                        )}

                        {/* Decision confidence */}
                        {event.type === 'decision' && event.metadata?.confidence && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-zinc-500">Confidence:</span>
                            <div className="flex-1 max-w-[100px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500 rounded-full"
                                style={{ width: `${event.metadata.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400">{event.metadata.confidence}%</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
