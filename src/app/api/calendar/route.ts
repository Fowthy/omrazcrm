import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shows, rehearsals, tasks, projects } from '@/lib/db/schema';
import { gte, lte, and, isNotNull } from 'drizzle-orm';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Fetch shows
    const showEvents = await db
      .select({
        id: shows.id,
        title: shows.title,
        date: shows.date,
        venue: shows.venue,
        city: shows.city,
        status: shows.status,
      })
      .from(shows)
      .where(and(gte(shows.date, start), lte(shows.date, end)))
      .all();

    // Fetch rehearsals
    const rehearsalEvents = await db
      .select({
        id: rehearsals.id,
        title: rehearsals.title,
        date: rehearsals.scheduledAt,
        endTime: rehearsals.endTime,
        location: rehearsals.location,
      })
      .from(rehearsals)
      .where(and(gte(rehearsals.scheduledAt, start), lte(rehearsals.scheduledAt, end)))
      .all();

    // Fetch tasks with due dates
    const taskEvents = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        date: tasks.dueDate,
        status: tasks.status,
        priority: tasks.priority,
      })
      .from(tasks)
      .where(and(isNotNull(tasks.dueDate), gte(tasks.dueDate, start), lte(tasks.dueDate, end)))
      .all();

    // Fetch project release dates
    const projectEvents = await db
      .select({
        id: projects.id,
        title: projects.name,
        date: projects.releaseDate,
        status: projects.status,
      })
      .from(projects)
      .where(and(isNotNull(projects.releaseDate), gte(projects.releaseDate, start), lte(projects.releaseDate, end)))
      .all();

    // Combine and format events
    const events = [
      ...showEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.date,
        type: 'show' as const,
        color: '#8B5CF6', // violet
        metadata: { venue: e.venue, city: e.city, status: e.status },
      })),
      ...rehearsalEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.date,
        end: e.endTime,
        type: 'rehearsal' as const,
        color: '#06B6D4', // cyan
        metadata: { location: e.location },
      })),
      ...taskEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.date,
        type: 'task' as const,
        color: e.priority === 'urgent' ? '#EF4444' : e.priority === 'high' ? '#F97316' : '#22C55E',
        metadata: { status: e.status, priority: e.priority },
      })),
      ...projectEvents.map((e) => ({
        id: e.id,
        title: `Release: ${e.title}`,
        start: e.date,
        type: 'release' as const,
        color: '#EC4899', // pink
        metadata: { status: e.status },
      })),
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}
