'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  teamName: string;
  teamMembers: string[];
  projectName: string;
  description: string;
  innovative: string;
  businessValue: string;
  useCase: string;
}

const INITIAL: FormData = {
  teamName: '',
  teamMembers: [''],
  projectName: '',
  description: '',
  innovative: '',
  businessValue: '',
  useCase: '',
};

const fields: { key: keyof Omit<FormData, 'teamMembers'>; label: string; hint: string; rows: number }[] = [
  { key: 'teamName', label: 'Team Name', hint: 'Your team or company name', rows: 1 },
  { key: 'projectName', label: 'Project Name', hint: 'What is your project called?', rows: 1 },
  { key: 'description', label: 'Project Description', hint: 'Give a clear overview of what your project does', rows: 4 },
  { key: 'innovative', label: 'Innovation', hint: 'Explain how your project is innovative — what makes it unique or novel?', rows: 4 },
  { key: 'businessValue', label: 'Business Value', hint: 'Explain how your project delivers business value — who benefits and how?', rows: 4 },
  { key: 'useCase', label: 'Example Use Case', hint: 'Describe a user journey or workflow showing your project in action', rows: 5 },
];

export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateMember = (i: number, value: string) => {
    const members = [...form.teamMembers];
    members[i] = value;
    setForm((prev) => ({ ...prev, teamMembers: members }));
  };

  const addMember = () =>
    setForm((prev) => ({ ...prev, teamMembers: [...prev.teamMembers, ''] }));

  const removeMember = (i: number) => {
    if (form.teamMembers.length === 1) return;
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, idx) => idx !== i),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      router.push('/projects?submitted=1');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Submit Your Project</h1>
        <p className="text-gray-400 mt-2">Fill in all the details below to enter your project.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Team Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.teamName}
            onChange={(e) => updateField('teamName', e.target.value)}
            placeholder="e.g. Team Rocket"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        {/* Team Members */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Team Members <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {form.teamMembers.map((member, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => updateMember(i, e.target.value)}
                  placeholder={`Member ${i + 1} name`}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                {form.teamMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    className="px-3 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMember}
            className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            + Add team member
          </button>
        </div>

        {/* Other fields */}
        {fields.slice(1).map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {field.label} <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">{field.hint}</p>
            {field.rows === 1 ? (
              <input
                type="text"
                value={form[field.key] as string}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            ) : (
              <textarea
                value={form[field.key] as string}
                onChange={(e) => updateField(field.key, e.target.value)}
                rows={field.rows}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                required
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
        >
          {loading ? 'Submitting...' : 'Submit Project'}
        </button>
      </form>
    </div>
  );
}
