'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TeamMember {
  name: string;
  email: string;
}

interface FormData {
  teamName: string;
  teamMembers: TeamMember[];
  projectName: string;
  description: string;
  innovative: string;
  businessValue: string;
  useCase: string;
}

const INITIAL: FormData = {
  teamName: '',
  teamMembers: [{ name: '', email: '' }],
  projectName: '',
  description: '',
  innovative: '',
  businessValue: '',
  useCase: '',
};

const fields: { key: keyof Omit<FormData, 'teamMembers'>; label: string; hint: string; rows: number; maxLength?: number }[] = [
  { key: 'teamName', label: 'Team Name', hint: 'Your team or company name', rows: 1 },
  { key: 'projectName', label: 'Project Name', hint: 'What is your project called?', rows: 1 },
  { key: 'useCase', label: 'Example Use Case', hint: 'A one-liner on what your solution does — e.g. "Automates invoice approvals by routing them to the right approver based on amount and department."', rows: 1, maxLength: 100 },
  { key: 'description', label: 'Project Description', hint: 'Give a clear overview of what your project does', rows: 4, maxLength: 500 },
  { key: 'innovative', label: 'Innovation', hint: 'Explain how your project is innovative — what makes it unique or novel?', rows: 4, maxLength: 500 },
  { key: 'businessValue', label: 'Business Value', hint: 'Explain how your project delivers business value — who benefits and how?', rows: 4, maxLength: 500 },
];

export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateMember = (i: number, field: 'name' | 'email', value: string) => {
    const members = [...form.teamMembers];
    members[i] = { ...members[i], [field]: value };
    setForm((prev) => ({ ...prev, teamMembers: members }));
  };

  const addMember = () =>
    setForm((prev) => ({ ...prev, teamMembers: [...prev.teamMembers, { name: '', email: '' }] }));

  const removeMember = (i: number) => {
    if (form.teamMembers.length === 1) return;
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, idx) => idx !== i),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? 'Image upload failed.');
          setLoading(false);
          return;
        }
        imageUrl = uploadData.url;
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          teamMembers: form.teamMembers.map((m) => m.name),
          teamMemberEmails: form.teamMembers.map((m) => m.email),
          imageUrl,
        }),
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
          <div className="space-y-3">
            {form.teamMembers.map((member, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(i, 'name', e.target.value)}
                  placeholder={`Member ${i + 1} name`}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => updateMember(i, 'email', e.target.value)}
                  placeholder={`Member ${i + 1} email`}
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
        {fields.slice(1).map((field) => {
          const value = form[field.key] as string;
          return (
            <div key={field.key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  {field.label} <span className="text-red-400">*</span>
                </label>
                {field.maxLength && (
                  <span className={`text-xs tabular-nums ${value.length > field.maxLength ? 'text-red-400' : 'text-gray-500'}`}>
                    {value.length} / {field.maxLength}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">{field.hint}</p>
              {field.rows === 1 ? (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  maxLength={field.maxLength}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              ) : (
                <textarea
                  value={value}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  rows={field.rows}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  required
                />
              )}
            </div>
          );
        })}

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Workflow Image <span className="text-gray-500">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Upload a screenshot or diagram of your workflow. JPG, PNG, WebP or GIF, max 5 MB.</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                <p className="text-xs text-gray-400">{imageFile?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl">🖼️</div>
                <p className="text-sm text-gray-400">Click to upload an image</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />

          {imagePreview && (
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove image
            </button>
          )}
        </div>

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
