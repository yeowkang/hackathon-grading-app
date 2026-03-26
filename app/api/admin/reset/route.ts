import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { resetCurrentData } from '@/lib/kv';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Workato123!';

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await resetCurrentData();
  return NextResponse.json({ success: true });
}
