import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { v4 as uuidv4 } from 'uuid';
import { getArchiveSummaries, createArchive, getProjects, getVotes } from '@/lib/kv';
import type { Archive } from '@/lib/types';

export async function GET() {
  const archives = await getArchiveSummaries();
  return NextResponse.json(archives);
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Archive name is required.' }, { status: 400 });
  }

  const [projects, votes] = await Promise.all([getProjects(), getVotes()]);

  const archive: Archive = {
    id: uuidv4(),
    name: name.trim(),
    archivedAt: Date.now(),
    projectCount: projects.length,
    voteCount: votes.length,
    projects,
    votes,
  };

  await createArchive(archive);
  return NextResponse.json(archive, { status: 201 });
}
