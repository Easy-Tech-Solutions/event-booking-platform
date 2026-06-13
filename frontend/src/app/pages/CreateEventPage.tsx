import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Check, ChevronLeft, ChevronRight, Calendar, MapPin, Image as ImageIcon,
  Ticket, Eye, Plus, Trash2, Globe, Users, Tag, X, CheckCircle, Upload,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { createEvent } from '../store/slices/eventsSlice';
import apiClient from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TicketDraft {
  name: string;
  price: string;
  quantity: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface EventDraft {
  title: string;
  category: string;
  format: 'in-person' | 'online' | 'hybrid';
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  onlineLink: string;
  description: string;
  coverImageUrl: string;
  tags: string[];
  capacity: string;
  ticketTypes: TicketDraft[];
  faqs: FAQ[];
  ageRestriction: string;
  dressCode: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  Music: '🎵', Technology: '💻', 'Food & Drink': '🍷', Sports: '⚽',
  'Arts & Culture': '🎨', Business: '💼', Education: '📚', Theater: '🎭',
  Comedy: '😄', Fitness: '🏃', Fashion: '👗', Networking: '🤝',
  Gaming: '🎮', Film: '🎬', Health: '🏥', Travel: '✈️',
};

const STEPS = [
  { number: 1, title: 'Event Type', icon: Tag },
  { number: 2, title: 'Date & Venue', icon: MapPin },
  { number: 3, title: 'Details', icon: ImageIcon },
  { number: 4, title: 'Tickets', icon: Ticket },
  { number: 5, title: 'Review', icon: Eye },
];


const DEFAULT_DRAFT: EventDraft = {
  title: '',
  category: '',
  format: 'in-person',
  startDate: '',
  endDate: '',
  venue: '',
  address: '',
  city: '',
  state: '',
  country: 'US',
  onlineLink: '',
  description: '',
  coverImageUrl: '',
  tags: [],
  capacity: '100',
  ticketTypes: [{ name: 'General Admission', price: '0', quantity: '100', description: '' }],
  faqs: [],
  ageRestriction: '',
  dressCode: '',
};

// ─── Main Component ──────────────────────────────────────────────────────────
export function CreateEventPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.events);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<EventDraft>(DEFAULT_DRAFT);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  const set = <K extends keyof EventDraft>(field: K, value: EventDraft[K]) =>
    setDraft((p) => ({ ...p, [field]: value }));

  // ── Validation ──────────────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return draft.title.trim().length >= 3 && !!draft.category;
      case 2:
        return !!draft.startDate && !!draft.endDate &&
          new Date(draft.endDate) > new Date(draft.startDate) &&
          (draft.format === 'online' || draft.city.trim().length > 0);
      case 3:
        return draft.description.trim().length >= 20;
      case 4:
        return parseInt(draft.capacity) >= 1 &&
          draft.ticketTypes.length >= 1 &&
          draft.ticketTypes.every(
            (tt) => tt.name.trim().length > 0 &&
              parseFloat(tt.price) >= 0 &&
              parseInt(tt.quantity) >= 1
          );
      default:
        return true;
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handlePublish = async (status: 'draft' | 'published') => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(createEvent({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        capacity: parseInt(draft.capacity),
        startDate: draft.startDate,
        endDate: draft.endDate,
        location: {
          venue: draft.venue.trim() || undefined,
          address: draft.address.trim() || undefined,
          city: draft.city.trim() || undefined,
          state: draft.state.trim() || undefined,
          country: draft.country.trim() || undefined,
        },
        isOnline: draft.format === 'online' || draft.format === 'hybrid',
        onlineLink: draft.onlineLink.trim() || undefined,
        images: draft.coverImageUrl ? [draft.coverImageUrl] : [],
        tags: draft.tags,
        status,
      } as any));

      if (createEvent.fulfilled.match(result)) {
        const eventId = result.payload.event?._id;
        if (eventId) {
          // Create ticket types in parallel
          await Promise.all(
            draft.ticketTypes
              .filter((tt) => tt.name.trim() && parseInt(tt.quantity) >= 1)
              .map((tt) =>
                apiClient.post('/ticket-types', {
                  event: eventId,
                  name: tt.name.trim(),
                  price: parseFloat(tt.price) || 0,
                  quantity: parseInt(tt.quantity),
                  description: tt.description.trim() || undefined,
                }).catch(() => {})
              )
          );
        }
        setSuccess(true);
        setTimeout(() => navigate('/organizer/events'), 2000);
      } else {
        setSubmitError((result.payload as string) || 'Failed to create event. Please try again.');
      }
    } catch {
      setSubmitError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#004406]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#004406]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Event Created!</h2>
            <p className="text-muted-foreground">Redirecting to your events…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizer/events')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to My Events
          </button>
          <h1 className="text-3xl font-bold">Create New Event</h1>
        </div>

        {/* Step Progress */}
        <div className="mb-10">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.number;
              const active = step === s.number;
              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                        ${done ? 'bg-[#004406] text-white' : active ? 'bg-[#004406] text-white ring-4 ring-[#004406]/20' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`mt-1.5 text-xs font-medium hidden sm:block ${active ? 'text-[#004406]' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-colors ${done ? 'bg-[#004406]' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && <Step1Basics draft={draft} set={set} categories={categories} tagInput={tagInput} setTagInput={setTagInput} />}
          {step === 2 && <Step2DateVenue draft={draft} set={set} />}
          {step === 3 && <Step3Details draft={draft} set={set} tagInput={tagInput} setTagInput={setTagInput} />}
          {step === 4 && <Step4Tickets draft={draft} set={set} />}
          {step === 5 && <Step5Review draft={draft} categories={categories} submitError={submitError} />}
        </div>

        {/* Footer Nav */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />Back
          </Button>

          {step < 5 ? (
            <Button
              className="bg-[#004406] hover:bg-[#003305] text-white"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" disabled={isSubmitting} onClick={() => handlePublish('draft')}>
                {isSubmitting ? 'Saving…' : 'Save as Draft'}
              </Button>
              <Button
                className="bg-[#004406] hover:bg-[#003305] text-white"
                disabled={isSubmitting}
                onClick={() => handlePublish('published')}
              >
                {isSubmitting ? 'Publishing…' : 'Publish Event'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Event Type & Basics ─────────────────────────────────────────────
function Step1Basics({ draft, set, categories, tagInput, setTagInput }: {
  draft: EventDraft;
  set: <K extends keyof EventDraft>(f: K, v: EventDraft[K]) => void;
  categories: { _id: string; name: string }[];
  tagInput: string;
  setTagInput: (v: string) => void;
}) {
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !draft.tags.includes(t) && draft.tags.length < 10) {
      set('tags', [...draft.tags, t]);
    }
    setTagInput('');
  };

  return (
    <div className="space-y-8">
      {/* Event Title */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">What's your event called?</h2>
        <p className="text-sm text-muted-foreground mb-4">A clear, descriptive title helps people find your event.</p>
        <Input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Summer Music Festival 2026"
          className="text-lg h-12"
          maxLength={100}
        />
        <div className="text-xs text-muted-foreground mt-1 text-right">{draft.title.length}/100</div>
      </Card>

      {/* Category */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">What type of event is this?</h2>
        <p className="text-sm text-muted-foreground mb-5">Choose the category that best fits your event.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(categories.length > 0 ? categories : Object.keys(CATEGORY_ICONS).map((n) => ({ _id: n, name: n }))).map((cat) => {
            const selected = draft.category === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => set('category', cat._id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-[#004406]/60 hover:bg-[#004406]/5
                  ${selected ? 'border-[#004406] bg-[#004406]/10' : 'border-gray-200 bg-white'}`}
              >
                <span className="text-2xl">{CATEGORY_ICONS[cat.name] || '🎪'}</span>
                <span className={`text-sm font-medium text-center leading-tight ${selected ? 'text-[#004406]' : 'text-gray-700'}`}>
                  {cat.name}
                </span>
                {selected && <Check className="w-4 h-4 text-[#004406]" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Format */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Event format</h2>
        <p className="text-sm text-muted-foreground mb-4">Where will your event take place?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { value: 'in-person', icon: MapPin, label: 'In Person', desc: 'Physical venue' },
            { value: 'online', icon: Globe, label: 'Online', desc: 'Virtual event' },
            { value: 'hybrid', icon: Users, label: 'Hybrid', desc: 'Both in-person & online' },
          ] as const).map(({ value, icon: Icon, label, desc }) => {
            const selected = draft.format === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('format', value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-[#004406]/60
                  ${selected ? 'border-[#004406] bg-[#004406]/10' : 'border-gray-200 bg-white'}`}
              >
                <div className={`p-2 rounded-lg ${selected ? 'bg-[#004406] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className={`font-medium text-sm ${selected ? 'text-[#004406]' : ''}`}>{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tags */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Tags <span className="text-muted-foreground font-normal text-base">(optional)</span></h2>
        <p className="text-sm text-muted-foreground mb-4">Add up to 10 keywords to help people discover your event.</p>
        <div className="flex gap-2 mb-3">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="e.g. outdoor, family-friendly, free"
            className="flex-1"
            maxLength={30}
          />
          <Button variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {draft.tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 py-1 px-3">
                {t}
                <button onClick={() => set('tags', draft.tags.filter((x) => x !== t))} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Step 2: Date & Location ──────────────────────────────────────────────────
function Step2DateVenue({ draft, set }: { draft: EventDraft; set: <K extends keyof EventDraft>(f: K, v: EventDraft[K]) => void }) {
  const isOnline = draft.format === 'online';
  const isHybrid = draft.format === 'hybrid';

  return (
    <div className="space-y-6">
      {/* Date & Time */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">When does it happen?</h2>
        <p className="text-sm text-muted-foreground mb-5">Set the start and end date/time for your event.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block">
              <Calendar className="w-4 h-4 inline mr-1" />Start Date & Time *
            </Label>
            <Input
              type="datetime-local"
              value={draft.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div>
            <Label className="mb-2 block">
              <Calendar className="w-4 h-4 inline mr-1" />End Date & Time *
            </Label>
            <Input
              type="datetime-local"
              value={draft.endDate}
              onChange={(e) => set('endDate', e.target.value)}
              min={draft.startDate || new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>
        {draft.startDate && draft.endDate && new Date(draft.endDate) <= new Date(draft.startDate) && (
          <p className="text-sm text-destructive mt-2">End date must be after start date.</p>
        )}
      </Card>

      {/* Location */}
      {!isOnline && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-1">Where is it?</h2>
          <p className="text-sm text-muted-foreground mb-5">Enter the venue and address details.</p>
          <div className="space-y-4">
            <div>
              <Label>Venue Name</Label>
              <Input
                value={draft.venue}
                onChange={(e) => set('venue', e.target.value)}
                placeholder="e.g. Madison Square Garden"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Street Address</Label>
              <Input
                value={draft.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="e.g. 4 Pennsylvania Plaza"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={draft.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="New York"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>State / Region</Label>
                <Input
                  value={draft.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="NY"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={draft.country}
                  onChange={(e) => set('country', e.target.value)}
                  placeholder="US"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Online Link */}
      {(isOnline || isHybrid) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-1">Online event link</h2>
          <p className="text-sm text-muted-foreground mb-4">Provide the link where attendees will join your event.</p>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              value={draft.onlineLink}
              onChange={(e) => set('onlineLink', e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Step 3: Description, Cover Image, FAQs ──────────────────────────────────
function Step3Details({ draft, set, tagInput, setTagInput }: {
  draft: EventDraft;
  set: <K extends keyof EventDraft>(f: K, v: EventDraft[K]) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.post('/upload?folder=events', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set('coverImageUrl', res.data.url);
    } catch {
      setUploadError('Upload failed. Check that Cloudinary is configured.');
    } finally {
      setUploading(false);
    }
  }, [set]);

  const addFaq = () => set('faqs', [...draft.faqs, { question: '', answer: '' }]);
  const updateFaq = (i: number, field: 'question' | 'answer', value: string) =>
    set('faqs', draft.faqs.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  const removeFaq = (i: number) =>
    set('faqs', draft.faqs.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Describe your event</h2>
        <p className="text-sm text-muted-foreground mb-4">Tell potential attendees what to expect. Aim for at least 100 characters.</p>
        <Textarea
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Describe what makes your event special, what attendees will experience, and any important details they should know…"
          rows={7}
          className="resize-none"
        />
        <div className={`text-xs mt-1 text-right ${draft.description.length < 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {draft.description.length} chars {draft.description.length < 20 ? '(minimum 20)' : ''}
        </div>
      </Card>

      {/* Cover Image */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Cover image</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a banner image to make your event stand out.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Upload event cover image"
          title="Upload event cover image"
          className="hidden"
          onChange={handleFileChange}
        />

        {draft.coverImageUrl ? (
          <div className="rounded-xl overflow-hidden aspect-video bg-gray-100 relative group mb-3">
            <img src={draft.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                type="button" size="sm" variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Change Image'}
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => set('coverImageUrl', '')}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 aspect-video flex flex-col items-center justify-center mb-3 bg-gray-50 hover:border-[#004406]/50 hover:bg-[#004406]/5 transition-colors group"
          >
            <Upload className={`w-10 h-10 mb-2 transition-colors ${uploading ? 'text-gray-400 animate-pulse' : 'text-gray-400 group-hover:text-[#004406]'}`} />
            <p className="text-sm font-medium text-muted-foreground group-hover:text-[#004406]">
              {uploading ? 'Uploading…' : 'Click to upload an image'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
          </button>
        )}

        {uploadError && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
      </Card>

      {/* Good to Know */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Good to know <span className="text-muted-foreground font-normal text-base">(optional)</span></h2>
        <p className="text-sm text-muted-foreground mb-5">Help attendees prepare with quick highlights.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Age Restriction</Label>
            <Input
              value={draft.ageRestriction}
              onChange={(e) => set('ageRestriction', e.target.value)}
              placeholder="e.g. 18+, All ages welcome"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Dress Code</Label>
            <Input
              value={draft.dressCode}
              onChange={(e) => set('dressCode', e.target.value)}
              placeholder="e.g. Smart casual, Formal"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* FAQs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold">Frequently asked questions <span className="text-muted-foreground font-normal text-base">(optional)</span></h2>
          <Button variant="outline" size="sm" onClick={addFaq}>
            <Plus className="w-4 h-4 mr-1" />Add FAQ
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Answer common questions to reduce support messages.</p>
        {draft.faqs.length === 0 ? (
          <button
            type="button"
            onClick={addFaq}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-sm text-muted-foreground hover:border-[#004406]/40 hover:text-[#004406] transition-colors"
          >
            <Plus className="w-5 h-5 mx-auto mb-1" />Add your first FAQ
          </button>
        ) : (
          <div className="space-y-4">
            {draft.faqs.map((faq, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">FAQ {i + 1}</span>
                  <button onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                  placeholder="e.g. Is parking available?"
                />
                <Textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  placeholder="Yes, free parking is available in Lot B…"
                  rows={2}
                  className="resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Step 4: Capacity & Tickets ───────────────────────────────────────────────
function Step4Tickets({ draft, set }: { draft: EventDraft; set: <K extends keyof EventDraft>(f: K, v: EventDraft[K]) => void }) {
  const updateTT = (i: number, field: keyof TicketDraft, value: string) =>
    set('ticketTypes', draft.ticketTypes.map((tt, idx) => idx === i ? { ...tt, [field]: value } : tt));

  const addTT = () =>
    set('ticketTypes', [...draft.ticketTypes, { name: '', price: '0', quantity: '50', description: '' }]);

  const removeTT = (i: number) => {
    if (draft.ticketTypes.length > 1) set('ticketTypes', draft.ticketTypes.filter((_, idx) => idx !== i));
  };

  const totalCapacity = draft.ticketTypes.reduce((s, tt) => s + (parseInt(tt.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Capacity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Event capacity</h2>
        <p className="text-sm text-muted-foreground mb-4">Maximum number of attendees for the whole event.</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={draft.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              min={1}
              className="pl-9 w-40"
              placeholder="100"
            />
          </div>
          <span className="text-sm text-muted-foreground">total spots</span>
        </div>
        {totalCapacity > parseInt(draft.capacity) && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ Ticket quantity total ({totalCapacity}) exceeds event capacity. Adjust below.
          </p>
        )}
      </Card>

      {/* Ticket Types */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold">Ticket types</h2>
          <Button variant="outline" size="sm" onClick={addTT}>
            <Plus className="w-4 h-4 mr-1" />Add tier
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Create one or more ticket tiers (e.g. General, VIP).</p>

        <div className="space-y-4">
          {draft.ticketTypes.map((tt, i) => (
            <div key={i} className="p-4 border rounded-xl bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#004406] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {tt.name || 'New Ticket Type'}
                  </span>
                </div>
                <button
                  onClick={() => removeTT(i)}
                  disabled={draft.ticketTypes.length === 1}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Label className="text-xs">Ticket Name *</Label>
                  <Input
                    value={tt.name}
                    onChange={(e) => updateTT(i, 'name', e.target.value)}
                    placeholder="General Admission"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price (USD)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={tt.price}
                      onChange={(e) => updateTT(i, 'price', e.target.value)}
                      min={0}
                      step={0.01}
                      className="pl-6"
                      placeholder="0.00"
                    />
                  </div>
                  {parseFloat(tt.price) === 0 && (
                    <span className="text-xs text-[#004406] mt-0.5 block">🎉 Free ticket</span>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    value={tt.quantity}
                    onChange={(e) => updateTT(i, 'quantity', e.target.value)}
                    min={1}
                    className="mt-1"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Description <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  value={tt.description}
                  onChange={(e) => updateTT(i, 'description', e.target.value)}
                  placeholder="e.g. Includes meet & greet, front-row access"
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <div className="bg-[#004406]/5 border border-[#004406]/20 rounded-xl p-4">
        <h4 className="font-semibold text-[#004406] mb-2">Pricing summary</h4>
        <div className="space-y-1">
          {draft.ticketTypes.map((tt, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{tt.name || `Ticket ${i + 1}`}</span>
              <span className="font-medium">
                {parseFloat(tt.price) === 0 ? 'Free' : `$${parseFloat(tt.price).toFixed(2)}`}
                {' '}&times; {tt.quantity || 0}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
            <span>Total available</span>
            <span>{totalCapacity} tickets</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Review ───────────────────────────────────────────────────────────
function Step5Review({ draft, categories, submitError }: {
  draft: EventDraft;
  categories: { _id: string; name: string }[];
  submitError: string;
}) {
  const catName = categories.find((c) => c._id === draft.category)?.name || draft.category;
  const fmt = (d: string) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">Review your event</h2>
        <p className="text-muted-foreground text-sm">Everything look good? You can always edit after publishing.</p>
      </div>

      {/* Cover Preview */}
      {draft.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden aspect-video max-h-64 bg-gray-100">
          <img src={draft.coverImageUrl} alt="Event cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main Info */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{draft.title || <span className="text-muted-foreground">Untitled Event</span>}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {catName && <Badge variant="outline">{catName}</Badge>}
            <Badge variant={draft.format === 'online' ? 'secondary' : 'outline'} className="capitalize">{draft.format}</Badge>
            {draft.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#004406] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Date & Time</div>
              <div className="text-sm font-medium">{fmt(draft.startDate)}</div>
              <div className="text-xs text-muted-foreground">to {fmt(draft.endDate)}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#004406] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Location</div>
              {draft.format === 'online' ? (
                <div className="text-sm font-medium">Online Event</div>
              ) : (
                <>
                  {draft.venue && <div className="text-sm font-medium">{draft.venue}</div>}
                  <div className="text-xs text-muted-foreground">
                    {[draft.city, draft.state, draft.country].filter(Boolean).join(', ') || 'Location TBD'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h4 className="font-semibold mb-2">Description</h4>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{draft.description || '—'}</p>
        {(draft.ageRestriction || draft.dressCode) && (
          <div className="flex gap-4 mt-4 pt-4 border-t">
            {draft.ageRestriction && (
              <div className="bg-[#004406]/5 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium text-[#004406]">Age:</span> {draft.ageRestriction}
              </div>
            )}
            {draft.dressCode && (
              <div className="bg-[#004406]/5 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium text-[#004406]">Dress:</span> {draft.dressCode}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Tickets */}
      <Card className="p-6">
        <h4 className="font-semibold mb-3">Tickets</h4>
        <div className="space-y-3">
          {draft.ticketTypes.map((tt, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <div className="font-medium text-sm">{tt.name}</div>
                {tt.description && <div className="text-xs text-muted-foreground">{tt.description}</div>}
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {parseFloat(tt.price) === 0 ? <span className="text-[#004406]">Free</span> : `$${parseFloat(tt.price).toFixed(2)}`}
                </div>
                <div className="text-xs text-muted-foreground">{tt.quantity} available</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex justify-between text-sm text-muted-foreground">
          <span>Total capacity</span>
          <span className="font-semibold text-foreground">{draft.capacity} attendees</span>
        </div>
      </Card>

      {/* FAQs */}
      {draft.faqs.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-3">FAQs</h4>
          <div className="space-y-3">
            {draft.faqs.map((faq, i) => (
              <div key={i}>
                <div className="font-medium text-sm">{faq.question || <span className="text-muted-foreground">Question {i + 1}</span>}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{faq.answer || '—'}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Note:</strong> Saving as draft lets you continue editing before going live. Publishing makes the event immediately visible to attendees.
      </div>
    </div>
  );
}
