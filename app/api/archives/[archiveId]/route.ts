import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getArchive } from '@/lib/kv';

export async function GET(
  _req: NextRequest,
  { params }: { params: { archiveId: string } }
) {
  const archive = await getArchive(params.archiveId);
  if (!archive) {
    return NextResponse.json({ error: 'Archive not found.' }, { status: 404 });
  }
  return NextResponse.json(archive);
}
