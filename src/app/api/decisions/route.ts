import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, decisions, songs, projects, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const songId = searchParams.get('songId');
    const status = searchParams.get('status');

    let query = db
      .select({
        id: decisions.id,
        songId: decisions.songId,
        albumId: decisions.albumId,
        decisionType: decisions.decisionType,
        question: decisions.question,
        context: decisions.context,
        status: decisions.status,
        proposedAt: decisions.proposedAt,
        testedAt: decisions.testedAt,
        lockedAt: decisions.lockedAt,
        reopenedAt: decisions.reopenedAt,
        proposedBy: decisions.proposedBy,
        audioProofId: decisions.audioProofId,
        linkedSectionId: decisions.linkedSectionId,
        instrumentOrRole: decisions.instrumentOrRole,
        outcome: decisions.outcome,
        confidence: decisions.confidence,
        daysOpen: decisions.daysOpen,
        createdAt: decisions.createdAt,
        updatedAt: decisions.updatedAt,
      })
      .from(decisions);

    // Apply filters
    const conditions = [];
    if (albumId) {
      conditions.push(eq(decisions.albumId, albumId));
    }
    if (songId) {
      conditions.push(eq(decisions.songId, songId));
    }
    if (status) {
      conditions.push(eq(decisions.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allDecisions = await query.orderBy(desc(decisions.createdAt));

    // Enrich with related data
    const decisionsWithRelations = await Promise.all(
      allDecisions.map(async (decision) => {
        const proposer = await db
          .select({ name: users.name, avatar: users.avatar })
          .from(users)
          .where(eq(users.id, decision.proposedBy))
          .limit(1);

        let song = null;
        if (decision.songId) {
          const songData = await db
            .select({ title: songs.title })
            .from(songs)
            .where(eq(songs.id, decision.songId))
            .limit(1);
          song = songData[0] || null;
        }

        let album = null;
        const albumData = await db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, decision.albumId))
          .limit(1);
        album = albumData[0] || null;

        return {
          ...decision,
          proposedByUser: proposer[0] || null,
          song,
          album,
        };
      })
    );

    return NextResponse.json(decisionsWithRelations);
  } catch (error) {
    console.error('Error fetching decisions:', error);
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
    const {
      songId,
      albumId,
      decisionType,
      question,
      context,
      status,
      audioProofId,
      linkedSectionId,
      instrumentOrRole,
      outcome,
      confidence,
    } = body;

    if (!albumId) {
      return NextResponse.json(
        { error: 'Album ID is required' },
        { status: 400 }
      );
    }

    if (!decisionType) {
      return NextResponse.json(
        { error: 'Decision type is required' },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const newDecision = await db
      .insert(decisions)
      .values({
        id: nanoid(),
        songId: songId || null,
        albumId,
        decisionType,
        question,
        context: context || null,
        status: status || 'proposed',
        proposedAt: new Date(),
        proposedBy: session.user.id,
        audioProofId: audioProofId || null,
        linkedSectionId: linkedSectionId || null,
        instrumentOrRole: instrumentOrRole || null,
        outcome: outcome || null,
        confidence: confidence || 50,
        daysOpen: 0,
      })
      .returning();

    const result = Array.isArray(newDecision) ? newDecision[0] : newDecision;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating decision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
