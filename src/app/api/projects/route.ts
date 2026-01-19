import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, projects, songs, files, users } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
// Use Node.js runtime for file:// database URLs (local SQLite)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        type: projects.type,
        status: projects.status,
        coverImage: projects.coverImage,
        releaseDate: projects.releaseDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        createdById: projects.createdById,
      })
      .from(projects)
      .orderBy(desc(projects.updatedAt));

    // Get song counts for each project
    const projectsWithCounts = await Promise.all(
      allProjects.map(async (project) => {
        const songCount = await db
          .select()
          .from(songs)
          .where(eq(songs.projectId, project.id));

        const fileCount = await db
          .select()
          .from(files)
          .where(eq(files.projectId, project.id));

        const creator = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, project.createdById))
          .limit(1);

        return {
          ...project,
          songCount: songCount.length,
          fileCount: fileCount.length,
          createdBy: creator[0] || null,
        };
      })
    );

    return NextResponse.json(projectsWithCounts);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, key, description, type, status, releaseDate, startDate, budget, currency } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      );
    }

    const newProject = await db
      .insert(projects)
      .values({
        id: nanoid(),
        key: key.toUpperCase(),
        name,
        description: description || null,
        type: type || 'album',
        status: status || 'idea',
        startDate: startDate ? new Date(startDate) : null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        budget: budget || null,
        spentBudget: 0,
        currency: currency || 'USD',
        progress: 0,
        createdById: session.user.id,
      })
      .returning();

    const result = Array.isArray(newProject) ? newProject[0] : newProject;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
