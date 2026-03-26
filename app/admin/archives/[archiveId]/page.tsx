import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArchive } from '@/lib/kv';
import { calculateScores } from '@/lib/scoring';
import ProjectCard from '@/components/ProjectCard';
import type { Vote } from '@/lib/types';

export const dynamic = 'force-dynamic';

function medal(rank: number) {
  return rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="text-sm font-mono text-gray-300 w-14 text-right">
        {(score * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export default async function ArchivePage({
  params,
}: {
  params: { archiveId: string };
}) {
  const archive = await getArchive(params.archiveId);
  if (!archive) notFound();

  const scores = calculateScores(archive.projects, archive.votes);
  const sorted = [...archive.projects].sort((a, b) => a.submittedAt - b.submittedAt);
  const normalVoters = archive.votes.filter((v) => v.voterType === 'normal');
  const judges = archive.votes.filter((v: Vote) => v.voterType === 'judge');

  const categories = [
    { key: 'mostInnovative' as const, label: 'Most Innovative', icon: '💡' },
    { key: 'bestBusinessValue' as const, label: 'Best Business Value', icon: '📈' },
    { key: 'mostLiked' as const, label: 'Most Liked', icon: '⭐' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white mt-4">{archive.name}</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Archived on {new Date(archive.archivedAt).toLocaleString()} ·{' '}
          {archive.projectCount} projects · {archive.voteCount} votes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Projects', value: archive.projects.length },
          { label: 'Total Votes', value: archive.votes.length },
          { label: 'Normal Voters', value: normalVoters.length },
          { label: 'Judges', value: judges.length },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scores */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Final Results</h2>
        <div className="mb-4 flex items-center gap-6 text-sm text-gray-400 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span>👤 Normal voters: <strong className="text-white">{scores.totalNormalVoters}</strong></span>
          <span>⚖️ Judges: <strong className="text-white">{scores.totalJudges}</strong></span>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.key} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <h3 className="font-semibold text-white">{cat.label}</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {scores[cat.key].map((item, rank) => (
                  <div key={item.projectId} className="px-6 py-4 flex items-center gap-4">
                    <span className="text-xl w-8 text-center flex-shrink-0">{medal(rank)}</span>
                    <div className="w-52 flex-shrink-0">
                      <div className="font-medium text-white text-sm truncate">{item.projectName}</div>
                      <div className="text-xs text-gray-500 truncate">{item.teamName}</div>
                    </div>
                    <ScoreBar score={item.score} />
                    <div className="text-xs text-gray-500 flex-shrink-0 w-36 text-right">
                      {item.normalVotes} normal · {item.judgeVotes} judge
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voters */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Voters ({archive.votes.length})</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Most Innovative</th>
                  <th className="px-6 py-3 text-left">Best Business Value</th>
                  <th className="px-6 py-3 text-left">Most Liked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {archive.votes.map((v, i) => {
                  const proj = (id: string) =>
                    archive.projects.find((p) => p.id === id)?.projectName ?? 'Unknown';
                  return (
                    <tr key={v.id}>
                      <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                      <td className="px-6 py-4 text-white font-medium">{v.voterName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            v.voterType === 'judge'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {v.voterType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate">{proj(v.mostInnovative)}</td>
                      <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate">{proj(v.bestBusinessValue)}</td>
                      <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate">{proj(v.mostLiked)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Projects ({archive.projects.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
