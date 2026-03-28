import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { v4 as uuidv4 } from 'uuid';
import { createVote, getVotes, getSettings, getProjects } from '@/lib/kv';
import type { Vote } from '@/lib/types';

export async function GET() {
  const votes = await getVotes();
  return NextResponse.json(votes);
}

export async function POST(req: NextRequest) {
  const settings = await getSettings();
  if (settings.phase !== 'voting') {
    return NextResponse.json({ error: 'Voting is not currently open.' }, { status: 403 });
  }

  const body = await req.json();
  const { voterName, voterEmail, voterType, mostInnovative, bestBusinessValue, mostLiked } = body;

  const isJudge = voterType === 'judge';
  if (!voterName?.trim() || !voterEmail?.trim() || !voterType || !mostInnovative || !bestBusinessValue || (!isJudge && !mostLiked)) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!['normal', 'judge'].includes(voterType)) {
    return NextResponse.json({ error: 'Invalid voter type.' }, { status: 400 });
  }

  const normalizedEmail = voterEmail.trim().toLowerCase();

  const votes = await getVotes();
  const duplicate = votes.find((v) => v.voterEmail.toLowerCase() === normalizedEmail);
  if (duplicate) {
    return NextResponse.json({ error: 'already_voted' }, { status: 409 });
  }

  // Prevent voting for own project
  const projects = await getProjects();
  const votedProjectIds = [mostInnovative, bestBusinessValue, ...(mostLiked ? [mostLiked] : [])];
  for (const projectId of votedProjectIds) {
    const project = projects.find((p) => p.id === projectId);
    if (project?.teamMemberEmails?.includes(normalizedEmail)) {
      return NextResponse.json({ error: 'cannot_vote_own_project' }, { status: 400 });
    }
  }

  const vote: Vote = {
    id: uuidv4(),
    voterName: voterName.trim(),
    voterEmail: normalizedEmail,
    voterType,
    mostInnovative,
    bestBusinessValue,
    mostLiked,
    votedAt: Date.now(),
  };

  await createVote(vote);
  return NextResponse.json(vote, { status: 201 });
}
