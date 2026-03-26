import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getProjects, getVotes } from '@/lib/kv';
import { calculateScores } from '@/lib/scoring';

export async function GET() {
  const [projects, votes] = await Promise.all([getProjects(), getVotes()]);
  return NextResponse.json(calculateScores(projects, votes));
}
