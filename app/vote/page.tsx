'use client';
import { useState, useEffect } from 'react';
import type { Project } from '@/lib/types';

type VoterType = 'normal' | 'judge';

type Step = 'identity' | 'vote' | 'done';

export default function VotePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [phase, setPhase] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('identity');
  const [voterName, setVoterName] = useState('');
  const [voterType, setVoterType] = useState<VoterType>('normal');

  const [mostInnovative, setMostInnovative] = useState('');
  const [bestBusinessValue, setBestBusinessValue] = useState('');
  const [mostLiked, setMostLiked] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([projectData, settingsData]) => {
      setProjects(projectData);
      setPhase(settingsData.phase);
      setLoading(false);
    });
  }, []);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName.trim()) return;
    setStep('vote');
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mostInnovative || !bestBusinessValue || !mostLiked) {
      setError('Please make a selection in all three categories.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterName,
          voterType,
          mostInnovative,
          bestBusinessValue,
          mostLiked,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      setStep('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (phase !== 'voting') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">{phase === 'submission' ? '📝' : '🔒'}</div>
          <h2 className="text-xl font-semibold text-white mb-2">Voting is not open yet</h2>
          <p className="text-gray-400">
            {phase === 'submission'
              ? 'Projects are still being submitted. Voting will open soon!'
              : 'This hackathon has ended. Voting is closed.'}
          </p>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Vote submitted!</h2>
          <p className="text-gray-400">
            Thanks for voting, <span className="text-purple-300 font-medium">{voterName}</span>!
          </p>
        </div>
      </div>
    );
  }

  if (step === 'identity') {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Cast Your Vote</h1>
          <p className="text-gray-400 mt-2">First, tell us who you are.</p>
        </div>

        <form onSubmit={handleIdentitySubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Voter Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['normal', 'judge'] as VoterType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVoterType(type)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    voterType === type
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-lg mb-1">{type === 'normal' ? '👤' : '⚖️'}</div>
                  <div className="font-medium text-white capitalize">{type}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all"
          >
            Continue to Voting →
          </button>
        </form>
      </div>
    );
  }

  // Vote step
  const categories = [
    {
      id: 'mostInnovative',
      label: 'Most Innovative',
      description: 'Which project impressed you most with its novel approach or technology?',
      icon: '💡',
      value: mostInnovative,
      setter: setMostInnovative,
      color: 'border-purple-500 bg-purple-500/10',
      selectedColor: 'text-purple-300',
    },
    {
      id: 'bestBusinessValue',
      label: 'Best Business Value',
      description: 'Which project delivers the strongest real-world business impact?',
      icon: '📈',
      value: bestBusinessValue,
      setter: setBestBusinessValue,
      color: 'border-blue-500 bg-blue-500/10',
      selectedColor: 'text-blue-300',
    },
    {
      id: 'mostLiked',
      label: 'Most Liked',
      description: 'Which project did you enjoy the most overall?',
      icon: '⭐',
      value: mostLiked,
      setter: setMostLiked,
      color: 'border-yellow-500 bg-yellow-500/10',
      selectedColor: 'text-yellow-300',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => setStep('identity')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Vote</h1>
        <p className="text-gray-400 mt-1">
          Voting as <span className="text-purple-300 font-medium">{voterName}</span>
          {' '}
          <span className="text-gray-500">({voterType})</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleVoteSubmit} className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-white">{cat.label}</h2>
                <p className="text-sm text-gray-400">{cat.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {projects.map((project) => {
                const selected = cat.value === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => cat.setter(project.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selected
                        ? cat.color
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                          selected ? 'border-current bg-current' : 'border-gray-600'
                        }`}
                      />
                      <div>
                        <div className={`font-medium ${selected ? cat.selectedColor : 'text-white'}`}>
                          {project.projectName}
                        </div>
                        <div className="text-xs text-gray-500">{project.teamName}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl mb-4 text-sm text-gray-400">
            <span>📋</span>
            <span>
              Votes: {[mostInnovative, bestBusinessValue, mostLiked].filter(Boolean).length} / 3 categories selected
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || !mostInnovative || !bestBusinessValue || !mostLiked}
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit My Votes'}
          </button>
        </div>
      </form>
    </div>
  );
}
