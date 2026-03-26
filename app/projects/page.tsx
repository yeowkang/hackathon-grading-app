import Link from 'next/link';
import { getProjects } from '@/lib/kv';
import ProjectCard from '@/components/ProjectCard';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { submitted?: string };
}) {
  let projects;
  try {
    projects = await getProjects();
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
  const sorted = [...projects].sort((a, b) => a.submittedAt - b.submittedAt);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Submitted Projects</h1>
          <p className="text-gray-400 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} submitted
            {projects.length < 20 ? ` · ${20 - projects.length} slots remaining` : ' · Full'}
          </p>
        </div>
        <Link
          href="/submit"
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-sm"
        >
          + Submit Project
        </Link>
      </div>

      {searchParams.submitted && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          Your project has been submitted successfully!
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No projects yet</h2>
          <p className="text-gray-500 mb-6">Be the first to submit a project!</p>
          <Link
            href="/submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
          >
            Submit Your Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
