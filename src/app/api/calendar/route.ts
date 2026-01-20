import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shows, creativeSessions, decisions, projects } from '@/lib/db/schema';
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

    // Fetch creative sessions
    const sessionEvents = await db
      .select({
        id: creativeSessions.id,
        date: creativeSessions.date,
        startTime: creativeSessions.startTime,
        endTime: creativeSessions.endTime,
        intent: creativeSessions.preSessionIntent,
      })
      .from(creativeSessions)
      .where(and(gte(creativeSessions.date, start), lte(creativeSessions.date, end)))
      .all();

    // Fetch decisions locked in date range
    const decisionEvents = await db
      .select({
        id: decisions.id,
        question: decisions.question,
        date: decisions.lockedAt,
        status: decisions.status,
        decisionType: decisions.decisionType,
      })
      .from(decisions)
      .where(and(isNotNull(decisions.lockedAt), gte(decisions.lockedAt, start), lte(decisions.lockedAt, end)))
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
      ...sessionEvents.map((e) => ({
        id: e.id,
        title: e.intent || 'Creative Session',
        start: e.date,
        end: e.endTime,
        type: 'session' as const,
        color: '#06B6D4', // cyan
        metadata: { intent: e.intent },
      })),
      ...decisionEvents.map((e) => ({
        id: e.id,
        title: `Decision: ${e.question}`,
        start: e.date,
        type: 'decision' as const,
        color: '#10B981', // green
        metadata: { status: e.status, decisionType: e.decisionType },
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
