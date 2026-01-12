'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Mic2,
  Music,
  CheckSquare,
  Disc,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string | null;
  type: 'show' | 'rehearsal' | 'task' | 'release';
  color: string;
  metadata: Record<string, unknown>;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(calendarStart, 'yyyy-MM-dd');
      const end = format(calendarEnd, 'yyyy-MM-dd');
      const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
      if (!res.ok) throw new Error('Failed to fetch calendar');
      return res.json();
    },
  });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = format(new Date(event.start), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'show':
        return <Mic2 className="h-3 w-3" />;
      case 'rehearsal':
        return <Music className="h-3 w-3" />;
      case 'task':
        return <CheckSquare className="h-3 w-3" />;
      case 'release':
        return <Disc className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getEventLink = (event: CalendarEvent) => {
    switch (event.type) {
      case 'show':
        return `/shows`;
      case 'rehearsal':
        return `/rehearsals`;
      case 'task':
        return `/tasks`;
      case 'release':
        return `/projects/${event.id}`;
      default:
        return '#';
    }
  };

  // Count events by type for the current view
  const eventCounts = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <p className="text-zinc-400">View all your events in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-sm text-zinc-400">Shows ({eventCounts.show || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-sm text-zinc-400">Rehearsals ({eventCounts.rehearsal || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-zinc-400">Tasks ({eventCounts.task || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="text-sm text-zinc-400">Releases ({eventCounts.release || 0})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3 border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center text-zinc-400">
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-lg overflow-hidden">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="bg-zinc-900 p-2 text-center text-sm font-medium text-zinc-400"
                  >
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {days.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate.get(dateKey) || [];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        min-h-24 p-1 bg-zinc-900 text-left transition-colors
                        ${!isCurrentMonth ? 'opacity-40' : ''}
                        ${isSelected ? 'ring-2 ring-violet-500 ring-inset' : ''}
                        ${isTodayDate ? 'bg-zinc-800/50' : ''}
                        hover:bg-zinc-800
                      `}
                    >
                      <div className={`
                        text-sm mb-1 font-medium
                        ${isTodayDate ? 'text-violet-400' : 'text-zinc-300'}
                      `}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: `${event.color}20`, color: event.color }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-zinc-500 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={getEventLink(event)}
                      className="block p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg mt-0.5"
                          style={{ backgroundColor: `${event.color}20` }}
                        >
                          <span style={{ color: event.color }}>
                            {getEventIcon(event.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {event.title}
                          </h4>
                          <p className="text-sm text-zinc-400 capitalize">
                            {event.type}
                          </p>
                          {event.metadata.venue ? (
                            <p className="text-xs text-zinc-500 mt-1">
                              {String(event.metadata.venue)}
                              {event.metadata.city ? `, ${String(event.metadata.city)}` : ''}
                            </p>
                          ) : null}
                          {event.metadata.location ? (
                            <p className="text-xs text-zinc-500 mt-1">
                              {String(event.metadata.location)}
                            </p>
                          ) : null}
                          {event.metadata.priority ? (
                            <Badge
                              variant="outline"
                              className={`text-xs mt-1 ${
                                event.metadata.priority === 'urgent'
                                  ? 'border-red-500 text-red-400'
                                  : event.metadata.priority === 'high'
                                  ? 'border-orange-500 text-orange-400'
                                  : ''
                              }`}
                            >
                              {String(event.metadata.priority)}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No events on this day</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click on a day to see events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle>Upcoming This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {events.filter((e) => new Date(e.start) >= new Date()).length === 0 ? (
            <p className="text-zinc-400">No upcoming events this month</p>
          ) : (
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 5)
                .map((event) => (
                  <Link
                    key={event.id}
                    href={getEventLink(event)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      <span style={{ color: event.color }}>{getEventIcon(event.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{event.title}</h4>
                      <p className="text-sm text-zinc-400">
                        {format(new Date(event.start), 'EEEE, MMM d')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                      style={{ borderColor: event.color, color: event.color }}
                    >
                      {event.type}
                    </Badge>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
