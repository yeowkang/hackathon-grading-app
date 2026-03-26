export interface Project {
  id: string;
  teamName: string;
  teamMembers: string[];
  projectName: string;
  description: string;
  innovative: string;
  businessValue: string;
  useCase: string;
  submittedAt: number;
}

export interface Vote {
  id: string;
  voterName: string;
  voterType: 'normal' | 'judge';
  mostInnovative: string;
  bestBusinessValue: string;
  mostLiked: string;
  votedAt: number;
}

export interface Settings {
  phase: 'submission' | 'voting' | 'closed';
}

export interface ArchiveSummary {
  id: string;
  name: string;
  archivedAt: number;
  projectCount: number;
  voteCount: number;
}

export interface Archive extends ArchiveSummary {
  projects: Project[];
  votes: Vote[];
}

export interface CategoryScore {
  projectId: string;
  projectName: string;
  teamName: string;
  score: number;
  normalVotes: number;
  judgeVotes: number;
}

export interface Scores {
  mostInnovative: CategoryScore[];
  bestBusinessValue: CategoryScore[];
  mostLiked: CategoryScore[];
  totalNormalVoters: number;
  totalJudges: number;
}
