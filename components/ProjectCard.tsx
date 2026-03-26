'use client';
import { useState } from 'react';
import type { Project } from '@/lib/types';

interface Props {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {index !== undefined && (
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Project #{index + 1}
              </span>
            )}
            <h3 className="text-lg font-bold text-white mt-1">{project.projectName}</h3>
            <p className="text-purple-300 text-sm font-medium">{project.teamName}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-xs text-gray-500">
              {new Date(project.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.teamMembers.map((member, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-md text-xs"
            >
              {member}
            </span>
          ))}
        </div>

        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
          {project.description}
        </p>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-gray-800 pt-4">
            <div>
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                Innovation
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">{project.innovative}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                Business Value
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">{project.businessValue}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
                Use Case
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {project.useCase}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          {expanded ? '▲ Show less' : '▼ Show full details'}
        </button>
      </div>
    </div>
  );
}
