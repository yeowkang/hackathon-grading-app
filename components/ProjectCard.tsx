'use client';
import { useState } from 'react';
import type { Project } from '@/lib/types';

interface Props {
  project: Project;
  index?: number;
}

function Field({ label, value, color = 'text-gray-400' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</span>
      <p className="text-gray-300 text-sm leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}

export default function ProjectCard({ project, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
      <div className="p-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {index !== undefined && (
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Project #{index + 1}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {new Date(project.submittedAt).toLocaleDateString()}
          </span>
        </div>

        <Field label="Project Name" value={project.projectName} color="text-purple-400" />
        <Field label="Team Name" value={project.teamName} color="text-purple-400" />

        {/* Team Members */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Team Members</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {project.teamMembers.map((member, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-md text-xs">
                {member}{project.teamMemberEmails?.[i] ? ` (${project.teamMemberEmails[i]})` : ''}
              </span>
            ))}
          </div>
        </div>

        <Field label="Use Case" value={project.useCase} color="text-green-400" />
        <Field label="Project Description" value={project.description} color="text-gray-400" />

        {expanded && (
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <Field label="Innovation" value={project.innovative} color="text-purple-400" />
            <Field label="Business Value" value={project.businessValue} color="text-blue-400" />
          </div>
        )}

        {project.imageUrl && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Workflow</span>
            <img
              src={project.imageUrl}
              alt="Workflow diagram"
              className="mt-1.5 w-full rounded-lg border border-gray-800 object-contain max-h-64"
            />
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          {expanded ? '▲ Show less' : '▼ Show innovation & business value'}
        </button>
      </div>
    </div>
  );
}
