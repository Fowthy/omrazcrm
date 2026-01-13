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
    const { name, description, type, status, releaseDate } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const newProject = await db
      .insert(projects)
      .values({
        id: nanoid(),
        name,
        description: description || null,
        type: type || 'album',
        status: status || 'idea',
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
