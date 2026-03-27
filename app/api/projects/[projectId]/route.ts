import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { deleteProject, updateProject } from '@/lib/kv';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (req.headers.get('authorization') !== `Bearer ${ADMIN_PASSWORD}`) return unauthorized();
  await deleteProject(params.projectId);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  if (req.headers.get('authorization') !== `Bearer ${ADMIN_PASSWORD}`) return unauthorized();

  const body = await req.json();
  const allowed = ['teamName', 'teamMembers', 'teamMemberEmails', 'projectName', 'useCase', 'description', 'innovative', 'businessValue', 'imageUrl'];
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  await updateProject(params.projectId, update);
  return NextResponse.json({ success: true });
}
