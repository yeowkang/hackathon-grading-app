import Link from 'next/link';
import { getSettings, getProjects, getVotes } from '@/lib/kv';

export const dynamic = 'force-dynamic';

const phaseConfig = {
  submission: {
    badge: 'Submission Open',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
    headline: 'Submit Your Hackathon Project',
    sub: 'Share what you built, explain how it works, and why it matters.',
    cta: { label: 'Submit Your Project', href: '/submit', style: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500' },
  },
  voting: {
    badge: 'Voting Open',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    dot: 'bg-green-400',
    headline: 'Vote for Your Favorites',
    sub: 'Review the projects and cast your votes across three categories.',
    cta: { label: 'Cast Your Vote', href: '/vote', style: 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500' },
  },
  closed: {
    badge: 'Hackathon Closed',
    badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    dot: 'bg-gray-400',
    headline: 'The Hackathon Has Ended',
    sub: 'Browse all the amazing projects that were submitted.',
    cta: { label: 'View Projects', href: '/projects', style: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600' },
  },
};

export default async function Home() {
  let settings, projects, votes;
  try {
    [settings, projects, votes] = await Promise.all([
      getSettings(),
      getProjects(),
      getVotes(),
    ]);
  } catch {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Database not connected</h2>
          <p className="text-gray-400 text-sm">
            Go to your Vercel project → <strong className="text-gray-300">Storage</strong> → create a{' '}
            <strong className="text-gray-300">KV database</strong> and connect it to this project, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  const cfg = phaseConfig[settings.phase];
  const normalVoters = votes.filter((v) => v.voterType === 'normal').length;
  const judges = votes.filter((v) => v.voterType === 'judge').length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border mb-8 ${cfg.badgeColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
            {cfg.badge}
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            {cfg.headline}
          </h1>
          <p className="text-lg text-gray-400 mb-10">{cfg.sub}</p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={cfg.cta.href}
              className={`px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-all shadow-lg ${cfg.cta.style}`}
            >
              {cfg.cta.label}
            </Link>
            <Link
              href="/projects"
              className="px-8 py-3.5 rounded-xl bg-gray-800 text-white font-semibold text-base hover:bg-gray-700 transition-colors"
            >
              Browse Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projects', value: projects.length, sub: `/ 20 slots` },
            { label: 'Total Votes', value: votes.length, sub: 'cast so far' },
            { label: 'Normal Voters', value: normalVoters, sub: '50% weightage' },
            { label: 'Judges', value: judges, sub: '50% weightage' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center"
            >
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm font-medium text-gray-300 mt-0.5">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Project slots used</span>
              <span className="text-sm text-gray-400">{projects.length} / 20</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${(projects.length / 20) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
