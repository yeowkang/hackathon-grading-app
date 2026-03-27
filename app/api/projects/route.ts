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
  const { teamName, teamMembers, teamMemberEmails, projectName, description, innovative, businessValue, useCase, imageUrl } = body;

  if (!teamName?.trim() || !teamMembers?.length || !projectName?.trim() || !description?.trim() || !innovative?.trim() || !businessValue?.trim() || !useCase?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (useCase.trim().length > 100) {
    return NextResponse.json({ error: 'Use Case must be 100 characters or fewer.' }, { status: 400 });
  }

  for (const [field, label] of [['description', 'Project Description'], ['innovative', 'Innovation'], ['businessValue', 'Business Value']] as const) {
    if (body[field]?.trim().length > 500) {
      return NextResponse.json({ error: `${label} must be 500 characters or fewer.` }, { status: 400 });
    }
  }

  const filteredNames = (teamMembers as string[]).filter((m) => m.trim());
  if (filteredNames.length === 0) {
    return NextResponse.json({ error: 'At least one team member is required.' }, { status: 400 });
  }

  if (!Array.isArray(teamMemberEmails) || teamMemberEmails.length !== filteredNames.length) {
    return NextResponse.json({ error: 'Each team member must have an email address.' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const filteredEmails = (teamMemberEmails as string[]).map((e) => e.trim().toLowerCase());
  for (const email of filteredEmails) {
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: `Invalid email address: ${email}` }, { status: 400 });
    }
  }

  const project: Project = {
    id: uuidv4(),
    teamName: teamName.trim(),
    teamMembers: filteredNames,
    teamMemberEmails: filteredEmails,
    projectName: projectName.trim(),
    description: description.trim(),
    innovative: innovative.trim(),
    businessValue: businessValue.trim(),
    useCase: useCase.trim(),
    ...(imageUrl ? { imageUrl } : {}),
    submittedAt: Date.now(),
  };

  await createProject(project);
  return NextResponse.json(project, { status: 201 });
}
