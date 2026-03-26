import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { v4 as uuidv4 } from 'uuid';
import { createProject, getProjects, getSettings } from '@/lib/kv';
import type { Project } from '@/lib/types';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const settings = await getSettings();
  if (settings.phase !== 'submission') {
    return NextResponse.json({ error: 'Project submission is currently closed.' }, { status: 403 });
  }

  const projects = await getProjects();
  if (projects.length >= 20) {
    return NextResponse.json({ error: 'Maximum of 20 projects has been reached.' }, { status: 400 });
  }

  const body = await req.json();
  const { teamName, teamMembers, projectName, description, innovative, businessValue, useCase } = body;

  if (!teamName?.trim() || !teamMembers?.length || !projectName?.trim() || !description?.trim() || !innovative?.trim() || !businessValue?.trim() || !useCase?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  const filtered = (teamMembers as string[]).filter((m) => m.trim());
  if (filtered.length === 0) {
    return NextResponse.json({ error: 'At least one team member is required.' }, { status: 400 });
  }

  const project: Project = {
    id: uuidv4(),
    teamName: teamName.trim(),
    teamMembers: filtered,
    projectName: projectName.trim(),
    description: description.trim(),
    innovative: innovative.trim(),
    businessValue: businessValue.trim(),
    useCase: useCase.trim(),
    submittedAt: Date.now(),
  };

  await createProject(project);
  return NextResponse.json(project, { status: 201 });
}
