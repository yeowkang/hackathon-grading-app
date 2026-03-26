import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getSettings, updateSettings } from '@/lib/kv';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Workato123!';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phase } = await req.json();
  if (!['submission', 'voting', 'closed'].includes(phase)) {
    return NextResponse.json({ error: 'Invalid phase.' }, { status: 400 });
  }

  await updateSettings({ phase });
  return NextResponse.json({ phase });
}
