import { kv } from '@vercel/kv';
import type { Project, Vote, Settings, Archive, ArchiveSummary } from './types';

const K = {
  projects: 'hackathon:projects',
  project: (id: string) => `hackathon:project:${id}`,
  votes: 'hackathon:votes',
  vote: (id: string) => `hackathon:vote:${id}`,
  settings: 'hackathon:settings',
  archives: 'hackathon:archives',
  archive: (id: string) => `hackathon:archive:${id}`,
};

export async function getProjects(): Promise<Project[]> {
  const ids = (await kv.get<string[]>(K.projects)) ?? [];
  if (ids.length === 0) return [];
  const projects = await Promise.all(ids.map((id) => kv.get<Project>(K.project(id))));
  return projects.filter(Boolean) as Project[];
}

export async function createProject(project: Project): Promise<void> {
  const ids = (await kv.get<string[]>(K.projects)) ?? [];
  await kv.set(K.project(project.id), project);
  await kv.set(K.projects, [...ids, project.id]);
}

export async function getVotes(): Promise<Vote[]> {
  const ids = (await kv.get<string[]>(K.votes)) ?? [];
  if (ids.length === 0) return [];
  const votes = await Promise.all(ids.map((id) => kv.get<Vote>(K.vote(id))));
  return votes.filter(Boolean) as Vote[];
}

export async function createVote(vote: Vote): Promise<void> {
  const ids = (await kv.get<string[]>(K.votes)) ?? [];
  await kv.set(K.vote(vote.id), vote);
  await kv.set(K.votes, [...ids, vote.id]);
}

export async function getSettings(): Promise<Settings> {
  return (await kv.get<Settings>(K.settings)) ?? { phase: 'submission' };
}

export async function updateSettings(settings: Settings): Promise<void> {
  await kv.set(K.settings, settings);
}

export async function getArchiveSummaries(): Promise<ArchiveSummary[]> {
  return (await kv.get<ArchiveSummary[]>(K.archives)) ?? [];
}

export async function getArchive(id: string): Promise<Archive | null> {
  return kv.get<Archive>(K.archive(id));
}

export async function createArchive(archive: Archive): Promise<void> {
  const summaries = await getArchiveSummaries();
  const summary: ArchiveSummary = {
    id: archive.id,
    name: archive.name,
    archivedAt: archive.archivedAt,
    projectCount: archive.projects.length,
    voteCount: archive.votes.length,
  };
  await kv.set(K.archive(archive.id), archive);
  await kv.set(K.archives, [...summaries, summary]);
}

export async function resetCurrentData(): Promise<void> {
  const ids = (await kv.get<string[]>(K.projects)) ?? [];
  const voteIds = (await kv.get<string[]>(K.votes)) ?? [];
  await Promise.all([
    ...ids.map((id) => kv.del(K.project(id))),
    ...voteIds.map((id) => kv.del(K.vote(id))),
  ]);
  await kv.set(K.projects, []);
  await kv.set(K.votes, []);
  await kv.set(K.settings, { phase: 'submission' });
}
