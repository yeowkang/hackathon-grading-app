import type { Project, Vote, CategoryScore, Scores } from './types';

export function calculateScores(projects: Project[], votes: Vote[]): Scores {
  const normalVoters = votes.filter((v) => v.voterType === 'normal');
  const judges = votes.filter((v) => v.voterType === 'judge');
  const N = normalVoters.length;
  const J = judges.length;

  // Weight distribution: 50/50 if both groups exist, else 100% to whichever exists
  const normalWeight = N > 0 && J > 0 ? 0.5 : N > 0 ? 1.0 : 0;
  const judgeWeight = N > 0 && J > 0 ? 0.5 : J > 0 ? 1.0 : 0;

  const calcCategory = (getter: (v: Vote) => string): CategoryScore[] =>
    projects
      .map((project) => {
        const nv = normalVoters.filter((v) => getter(v) === project.id).length;
        const jv = judges.filter((v) => getter(v) === project.id).length;
        const score =
          (N > 0 ? (nv / N) * normalWeight : 0) +
          (J > 0 ? (jv / J) * judgeWeight : 0);
        return {
          projectId: project.id,
          projectName: project.projectName,
          teamName: project.teamName,
          score,
          normalVotes: nv,
          judgeVotes: jv,
        };
      })
      .sort((a, b) => b.score - a.score);

  return {
    mostInnovative: calcCategory((v) => v.mostInnovative),
    bestBusinessValue: calcCategory((v) => v.bestBusinessValue),
    mostLiked: calcCategory((v) => v.mostLiked),
    totalNormalVoters: N,
    totalJudges: J,
  };
}
