import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Sparkles, Copy, RotateCcw, Loader } from 'lucide-react';
import { aiAPI } from '../../api/ai';

const TYPES = [
  { value: 'event_description', label: 'Event Description', hint: 'Compelling 2-3 paragraph description with CTA' },
  { value: 'email_copy', label: 'Promotional Email', hint: 'Subject line + persuasive email body' },
  { value: 'landing_page', label: 'Landing Page Copy', hint: 'Headline, tagline, and 3 bullet highlights' },
];

const AIDescription = () => {
  const [generated, setGenerated] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('event_description');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { type: 'event_description' },
  });

  const onSubmit = async (data) => {
    setIsGenerating(true);
    setGenerated('');
    try {
      const context = {
        title: data.title,
        date: data.date,
        location: data.location,
        description: data.description,
        targetAudience: data.targetAudience,
        keyHighlights: data.keyHighlights,
      };
      const res = await aiAPI.generate(data.type, context);
      setGenerated(res.data.generated || '');
    } catch (err) {
      if (err.response?.status === 503) {
        toast.error('AI generation is not configured. Ask your admin to add OPENAI_API_KEY.');
      } else {
        toast.error(err.response?.data?.message || 'Generation failed. Try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated).then(() => toast.success('Copied to clipboard.'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          AI Content Generator
        </h1>
        <p className="text-gray-600 text-sm mt-0.5">Generate compelling event copy using AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Output type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Generate</label>
              <div className="space-y-2">
                {TYPES.map((t) => (
                  <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedType === t.value ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      {...register('type')}
                      type="radio"
                      value={t.value}
                      onChange={() => setSelectedType(t.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="input"
                placeholder="e.g. Summer Jazz Night"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input {...register('date')} type="date" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input {...register('location')} className="input" placeholder="City or Online" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input"
                placeholder="A few sentences about what this event is about…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <input {...register('targetAudience')} className="input" placeholder="e.g. Jazz lovers, professionals, families" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Highlights (comma-separated)</label>
              <input {...register('keyHighlights')} className="input" placeholder="Live band, Open bar, Networking" />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><Loader className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate</>
              )}
            </button>
          </form>
        </div>

        {/* Output */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Generated Copy</h2>
            {generated && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button
                  onClick={() => setGenerated('')}
                  className="text-gray-400 hover:text-gray-600"
                  title="Clear"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 py-12">
              <Loader className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm">Writing your copy…</p>
            </div>
          ) : generated ? (
            <div className="flex-1">
              <textarea
                value={generated}
                onChange={(e) => setGenerated(e.target.value)}
                className="w-full h-full min-h-[300px] input text-sm leading-relaxed resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">You can edit the generated text before copying.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-300 py-12">
              <Sparkles className="h-10 w-10" />
              <p className="text-sm text-gray-400">Fill in your event details and click Generate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDescription;
