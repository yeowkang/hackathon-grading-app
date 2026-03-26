import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { v4 as uuidv4 } from 'uuid';
import { createVote, getVotes, getSettings } from '@/lib/kv';
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
  const { voterName, voterType, mostInnovative, bestBusinessValue, mostLiked } = body;

  if (!voterName?.trim() || !voterType || !mostInnovative || !bestBusinessValue || !mostLiked) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!['normal', 'judge'].includes(voterType)) {
    return NextResponse.json({ error: 'Invalid voter type.' }, { status: 400 });
  }

  const votes = await getVotes();
  const duplicate = votes.find(
    (v) => v.voterName.toLowerCase() === voterName.trim().toLowerCase()
  );
  if (duplicate) {
    return NextResponse.json(
      { error: `"${voterName.trim()}" has already voted.` },
      { status: 409 }
    );
  }

  const vote: Vote = {
    id: uuidv4(),
    voterName: voterName.trim(),
    voterType,
    mostInnovative,
    bestBusinessValue,
    mostLiked,
    votedAt: Date.now(),
  };

  await createVote(vote);
  return NextResponse.json(vote, { status: 201 });
}
