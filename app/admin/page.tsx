'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Project, Vote, Scores, ArchiveSummary } from '@/lib/types';

type EditForm = Omit<Project, 'id' | 'submittedAt'>;

type Tab = 'overview' | 'audit' | 'scores' | 'archives';
type Phase = 'submission' | 'voting' | 'closed';

function medal(rank: number) {
  return rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-mono text-gray-300 w-16 text-right">{score} pts</span>
    </div>
  );
}

function ScoresSection({ scores }: { scores: Scores | null }) {
  if (!scores) return <div className="text-gray-400 text-sm">Loading scores...</div>;

  const categories = [
    { key: 'mostInnovative' as const, label: 'Most Innovative', icon: '💡' },
    { key: 'bestBusinessValue' as const, label: 'Best Business Value', icon: '📈' },
    { key: 'mostLiked' as const, label: 'Most Liked', icon: '⭐' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 text-sm text-gray-400 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <span>👤 Normal voters: <strong className="text-white">{scores.totalNormalVoters}</strong> (1 pt each)</span>
        <span>⚖️ Judges: <strong className="text-white">{scores.totalJudges}</strong> (5 pts each)</span>
      </div>

      {categories.map((cat) => {
        const list = scores[cat.key];
        return (
          <div key={cat.key} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
              <span className="text-xl">{cat.icon}</span>
              <h3 className="font-semibold text-white">{cat.label}</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {list.map((item, rank) => (
                <div key={item.projectId} className="px-6 py-4 flex items-center gap-4">
                  <span className="text-xl w-8 text-center flex-shrink-0">{medal(rank)}</span>
                  <div className="w-52 flex-shrink-0">
                    <div className="font-medium text-white text-sm truncate">{item.projectName}</div>
                    <div className="text-xs text-gray-500 truncate">{item.teamName}</div>
                  </div>
                  <ScoreBar score={item.score} maxScore={list[0]?.score ?? 1} />
                  <div className="text-xs text-gray-500 flex-shrink-0 w-36 text-right">
                    {item.normalVotes}×1 + {item.judgeVotes}×5
                  </div>
                </div>
              ))}
              {list.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">No votes yet</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  const [phase, setPhase] = useState<Phase>('submission');
  const [projects, setProjects] = useState<Project[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [scores, setScores] = useState<Scores | null>(null);
  const [archives, setArchives] = useState<ArchiveSummary[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [deletingVoteId, setDeletingVoteId] = useState<string | null>(null);
  const [deletingArchiveId, setDeletingArchiveId] = useState<string | null>(null);
  const [deleteArchiveConfirm, setDeleteArchiveConfirm] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [archiveName, setArchiveName] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [archiveAndReset, setArchiveAndReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const loadAll = useCallback(async () => {
    setDataLoading(true);
    try {
      const [p, v, s, a, settings] = await Promise.all([
        fetch('/api/projects').then((r) => r.json()),
        fetch('/api/votes').then((r) => r.json()),
        fetch('/api/scores').then((r) => r.json()),
        fetch('/api/archives').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);
      setProjects(p);
      setVotes(v);
      setScores(s);
      setArchives(a);
      setPhase(settings.phase);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const SESSION_KEY = 'hackathon_admin_session';
  const SESSION_TTL = 60 * 60 * 1000; // 1 hour in ms

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const { password, expiresAt } = JSON.parse(raw);
        if (expiresAt > Date.now()) {
          setAdminPassword(password);
          setAuthed(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) {
      setAdminPassword(pwInput);
      setAuthed(true);
      setPwError('');
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ password: pwInput, expiresAt: Date.now() + SESSION_TTL })
      );
    } else {
      setPwError('Incorrect password.');
    }
  };

  const authHeader = { Authorization: `Bearer ${adminPassword}` };

  const setPhaseHandler = async (newPhase: Phase) => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ phase: newPhase }),
    });
    setPhase(newPhase);
    setActionMsg(`Phase changed to "${newPhase}".`);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleArchive = async () => {
    if (!archiveName.trim()) return;
    setArchiving(true);
    try {
      const res = await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ name: archiveName }),
      });
      if (!res.ok) {
        const d = await res.json();
        setActionMsg(`Error: ${d.error}`);
        return;
      }
      if (archiveAndReset) {
        await fetch('/api/admin/reset', { method: 'POST', headers: authHeader });
        setActionMsg(`Archived as "${archiveName}" and reset for next hackathon.`);
      } else {
        setActionMsg(`Archived as "${archiveName}".`);
      }
      setArchiveName('');
      setArchiveAndReset(false);
      await loadAll();
    } finally {
      setArchiving(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      teamName: project.teamName,
      teamMembers: project.teamMembers,
      projectName: project.projectName,
      useCase: project.useCase,
      description: project.description,
      innovative: project.innovative,
      businessValue: project.businessValue,
      imageUrl: project.imageUrl,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editForm) return;
    setEditSaving(true);
    await fetch(`/api/projects/${editingProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(editForm),
    });
    setEditingProject(null);
    setEditForm(null);
    setEditSaving(false);
    await loadAll();
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProjectId(projectId);
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE', headers: authHeader });
    setDeleteProjectConfirm(null);
    await loadAll();
    setDeletingProjectId(null);
  };

  const handleDeleteArchive = async (archiveId: string) => {
    setDeletingArchiveId(archiveId);
    await fetch(`/api/archives/${archiveId}`, { method: 'DELETE', headers: authHeader });
    setDeleteArchiveConfirm(null);
    await loadAll();
    setDeletingArchiveId(null);
  };

  const handleDeleteVote = async (voteId: string) => {
    setDeletingVoteId(voteId);
    await fetch(`/api/votes/${voteId}`, { method: 'DELETE', headers: authHeader });
    await loadAll();
    setDeletingVoteId(null);
  };

  const handleReset = async () => {
    await fetch('/api/admin/reset', { method: 'POST', headers: authHeader });
    setResetConfirm(false);
    setActionMsg('All data reset. Ready for next hackathon.');
    await loadAll();
    setTimeout(() => setActionMsg(''), 4000);
  };

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 mt-1 text-sm">Enter your password to continue</p>
          </div>
          <form onSubmit={login} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Admin password"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
            {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'audit', label: 'Audit Log', icon: '📋' },
    { key: 'scores', label: 'Scores', icon: '🏆' },
    { key: 'archives', label: 'Archives', icon: '🗂️' },
  ];

  const normalVoters = votes.filter((v) => v.voterType === 'normal');
  const judges = votes.filter((v) => v.voterType === 'judge');

  const phaseOptions: { value: Phase; label: string; color: string }[] = [
    { value: 'submission', label: 'Submission', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30' },
    { value: 'voting', label: 'Voting', color: 'bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500/20 text-gray-300 border-gray-500/40 hover:bg-gray-500/30' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage the hackathon</p>
        </div>
        <button
          onClick={loadAll}
          disabled={dataLoading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {dataLoading ? 'Refreshing...' : '↺ Refresh'}
        </button>
      </div>

      {actionMsg && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Projects', value: projects.length, sub: '/ 20 max' },
              { label: 'Total Votes', value: votes.length, sub: 'cast' },
              { label: 'Normal Voters', value: normalVoters.length, sub: '50% weight' },
              { label: 'Judges', value: judges.length, sub: '50% weight' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-gray-300 mt-0.5">{s.label}</div>
                <div className="text-xs text-gray-500">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Hackathon Phase</h2>
            <div className="flex flex-wrap gap-3">
              {phaseOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPhaseHandler(opt.value)}
                  className={`px-5 py-2.5 rounded-xl border font-medium text-sm transition-all ${opt.color} ${
                    phase === opt.value ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-purple-500' : ''
                  }`}
                >
                  {phase === opt.value && '✓ '}{opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Current phase: <strong className="text-gray-300">{phase}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <div className="space-y-8">
          {/* Submissions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">Project Submissions ({projects.length})</h2>
            </div>
            {projects.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500 text-sm">No projects submitted yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">#</th>
                      <th className="px-6 py-3 text-left">Project</th>
                      <th className="px-6 py-3 text-left">Team</th>
                      <th className="px-6 py-3 text-left">Members</th>
                      <th className="px-6 py-3 text-left">Submitted</th>
                      <th className="px-6 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[...projects]
                      .sort((a, b) => a.submittedAt - b.submittedAt)
                      .map((p, i) => (
                        <tr key={p.id} className="hover:bg-gray-800/50">
                          <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-white font-medium">{p.projectName}</td>
                          <td className="px-6 py-4 text-gray-300">{p.teamName}</td>
                          <td className="px-6 py-4 text-gray-400">{p.teamMembers.join(', ')}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                            {new Date(p.submittedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(p)}
                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                              >
                                Edit
                              </button>
                              {deleteProjectConfirm === p.id ? (
                                <>
                                  <button
                                    onClick={() => handleDeleteProject(p.id)}
                                    disabled={deletingProjectId === p.id}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                                  >
                                    {deletingProjectId === p.id ? 'Deleting…' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setDeleteProjectConfirm(null)}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setDeleteProjectConfirm(p.id)}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Voters */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">Voters ({votes.length})</h2>
            </div>
            {votes.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500 text-sm">No votes cast yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">#</th>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Most Innovative</th>
                      <th className="px-6 py-3 text-left">Best Business Value</th>
                      <th className="px-6 py-3 text-left">Most Liked</th>
                      <th className="px-6 py-3 text-left">Voted At</th>
                      <th className="px-6 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[...votes]
                      .sort((a, b) => a.votedAt - b.votedAt)
                      .map((v, i) => {
                        const proj = (id: string) =>
                          projects.find((p) => p.id === id)?.projectName ?? id.slice(0, 8);
                        return (
                          <tr key={v.id} className="hover:bg-gray-800/50">
                            <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                            <td className="px-6 py-4 text-white font-medium">{v.voterName}</td>
                            <td className="px-6 py-4 text-gray-400">{v.voterEmail}</td>
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
                            <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate">
                              {proj(v.mostInnovative)}
                            </td>
                            <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate">
                              {proj(v.bestBusinessValue)}
                            </td>
                            <td className="px-6 py-4 text-gray-300 max-w-[150px] truncate">
                              {proj(v.mostLiked)}
                            </td>
                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                              {new Date(v.votedAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleDeleteVote(v.id)}
                                disabled={deletingVoteId === v.id}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                              >
                                {deletingVoteId === v.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scores */}
      {tab === 'scores' && <ScoresSection scores={scores} />}

      {/* Archives */}
      {tab === 'archives' && (
        <div className="space-y-6">
          {/* Create Archive */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Create Archive</h2>
            <p className="text-sm text-gray-400 mb-4">
              Save a snapshot of all current projects and votes with a name. This allows you to reuse this
              website for future hackathons.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="e.g. Workato Hackathon Q1 2025"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
              <button
                onClick={() => { setArchiveAndReset(false); handleArchive(); }}
                disabled={archiving || !archiveName.trim()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
              >
                Archive Only
              </button>
              <button
                onClick={() => { setArchiveAndReset(true); handleArchive(); }}
                disabled={archiving || !archiveName.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
              >
                Archive & Reset
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <strong className="text-gray-400">Archive Only</strong>: saves snapshot, keeps current data intact.{' '}
              <strong className="text-gray-400">Archive & Reset</strong>: saves snapshot, then clears all projects/votes and resets phase to submission.
            </p>
          </div>

          {/* Reset without archiving */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <h2 className="font-semibold text-red-400 mb-2">Reset Without Archiving</h2>
            <p className="text-sm text-gray-400 mb-4">
              Clears all current projects and votes permanently. This cannot be undone.
            </p>
            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="px-5 py-2.5 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 font-medium rounded-xl transition-colors text-sm"
              >
                Reset All Data
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-400">Are you sure? This is irreversible.</span>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Archive List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">Past Archives ({archives.length})</h2>
            </div>
            {archives.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500 text-sm">No archives yet</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {[...archives]
                  .sort((a, b) => b.archivedAt - a.archivedAt)
                  .map((archive) => (
                    <div key={archive.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-white">{archive.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(archive.archivedAt).toLocaleString()} ·{' '}
                          {archive.projectCount} projects · {archive.voteCount} votes
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/admin/archives/${archive.id}`}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
                        >
                          View →
                        </Link>
                        {deleteArchiveConfirm === archive.id ? (
                          <>
                            <button
                              onClick={() => handleDeleteArchive(archive.id)}
                              disabled={deletingArchiveId === archive.id}
                              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
                            >
                              {deletingArchiveId === archive.id ? 'Deleting…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteArchiveConfirm(null)}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteArchiveConfirm(archive.id)}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && editForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {([
                { key: 'teamName', label: 'Team Name', rows: 1 },
                { key: 'projectName', label: 'Project Name', rows: 1 },
                { key: 'useCase', label: 'Use Case', rows: 2 },
                { key: 'description', label: 'Project Description', rows: 3 },
                { key: 'innovative', label: 'Innovation', rows: 3 },
                { key: 'businessValue', label: 'Business Value', rows: 3 },
              ] as { key: keyof EditForm; label: string; rows: number }[]).map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{field.label}</label>
                  {field.rows === 1 ? (
                    <input
                      type="text"
                      value={editForm[field.key] as string}
                      onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  ) : (
                    <textarea
                      rows={field.rows}
                      value={editForm[field.key] as string}
                      onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                  )}
                </div>
              ))}

              {/* Team Members */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Team Members</label>
                <div className="space-y-2">
                  {editForm.teamMembers.map((member, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={member}
                        onChange={(e) => {
                          const updated = [...editForm.teamMembers];
                          updated[i] = e.target.value;
                          setEditForm({ ...editForm, teamMembers: updated });
                        }}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      {editForm.teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, teamMembers: editForm.teamMembers.filter((_, idx) => idx !== i) })}
                          className="px-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, teamMembers: [...editForm.teamMembers, ''] })}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >+ Add member</button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingProject(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
