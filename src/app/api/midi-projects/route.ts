import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { midiProjects } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

// GET /api/midi-projects - List all MIDI projects for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await db
      .select()
      .from(midiProjects)
      .where(eq(midiProjects.createdById, session.user.id))
      .orderBy(desc(midiProjects.updatedAt));

    // Parse tracks JSON for each project
    const parsedProjects = projects.map(project => ({
      ...project,
      tracks: JSON.parse(project.tracks),
    }));

    return NextResponse.json(parsedProjects);
  } catch (error) {
    console.error('Error fetching MIDI projects:', error);
    return NextResponse.json({ error: 'Failed to fetch MIDI projects' }, { status: 500 });
  }
}

// POST /api/midi-projects - Create a new MIDI project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, bpm, totalBeats, tracks, songId, projectId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!tracks || !Array.isArray(tracks)) {
      return NextResponse.json({ error: 'Tracks array is required' }, { status: 400 });
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(midiProjects).values({
      id,
      name,
      description: description || null,
      bpm: bpm || 120,
      totalBeats: totalBeats || 16,
      tracks: JSON.stringify(tracks),
      songId: songId || null,
      projectId: projectId || null,
      createdAt: now,
      updatedAt: now,
      createdById: session.user.id,
    });

    const [newProject] = await db
      .select()
      .from(midiProjects)
      .where(eq(midiProjects.id, id));

    return NextResponse.json({
      ...newProject,
      tracks: JSON.parse(newProject.tracks),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating MIDI project:', error);
    return NextResponse.json({ error: 'Failed to create MIDI project' }, { status: 500 });
  }
}
