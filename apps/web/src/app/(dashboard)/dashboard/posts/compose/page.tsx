'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Image, X, Zap, Calendar, Clock, ChevronDown,
  Facebook, Instagram, Twitter, Youtube, Linkedin,
  Hash, AtSign, Smile, Send, Save, Loader2, AlertCircle,
  UploadCloud, Eye, Type, Film,
} from 'lucide-react';
import { postsApi, campaignsApi, aiApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { key: 'FACEBOOK', label: 'Facebook', color: '#1877F2', limit: 63206 },
  { key: 'INSTAGRAM', label: 'Instagram', color: '#E1306C', limit: 2200 },
  { key: 'TWITTER', label: 'Twitter', color: '#1DA1F2', limit: 280 },
  { key: 'TIKTOK', label: 'TikTok', color: '#010101', limit: 2200 },
  { key: 'LINKEDIN', label: 'LinkedIn', color: '#0A66C2', limit: 3000 },
  { key: 'YOUTUBE', label: 'YouTube', color: '#FF0000', limit: 5000 },
];

const TONES = ['Professional', 'Casual', 'Humorous', 'Inspiring'];

type ScheduleMode = 'now' | 'schedule';

function PlatformPreview({ platform, content, media }: { platform: typeof PLATFORMS[0]; content: string; media: string[] }) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 text-white text-xs font-medium"
        style={{ background: platform.color }}
      >
        <span className="font-semibold">{platform.label}</span>
        <span className="opacity-75">Preview</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: platform.color }}
          >
            Y
          </div>
          <div>
            <p className="text-xs font-semibold">Your Account</p>
            <p className="text-[10px] text-muted-foreground">Just now</p>
          </div>
        </div>
        {content ? (
          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
            {platform.key === 'TWITTER' && content.length > 280
              ? content.slice(0, 277) + '...'
              : content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Your post content will appear here...</p>
        )}
        {media.length > 0 && (
          <div className={cn('grid gap-1', media.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
            {media.slice(0, 4).map((url, i) => (
              <img key={i} src={url} alt="" className="rounded w-full h-24 object-cover" />
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 pt-1 border-t border-border text-[10px] text-muted-foreground">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>↗ Share</span>
        </div>
      </div>
    </div>
  );
}

export default function ComposePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['INSTAGRAM', 'FACEBOOK']);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // AI Generation
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Professional');
  const [aiPlatform, setAiPlatform] = useState('INSTAGRAM');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    campaignsApi.list().then((res: any) => {
      const data = res?.data ?? res;
      setCampaigns(data?.items ?? data ?? []);
    }).catch(() => {});
  }, []);

  function togglePlatform(key: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setMedia((prev) => [...prev, url]);
    });
  }

  function removeMedia(index: number) {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerateAI() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res: any = await aiApi.generateContent({
        platform: aiPlatform,
        topic: aiTopic,
        tone: aiTone.toUpperCase(),
        count: 3,
      });
      const data = res?.data ?? res;
      const results = data?.contents ?? data?.results ?? [];
      setAiResults(results.map((r: any) => r.content ?? r));
    } catch {
      setAiResults(['Could not generate content. Please try again.']);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(mode: 'draft' | 'schedule' | 'publish') {
    if (!content.trim()) { setError('Post content is required.'); return; }
    if (selectedPlatforms.length === 0) { setError('Select at least one platform.'); return; }
    if (mode === 'schedule' && !scheduledAt) { setError('Please select a schedule time.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        content,
        platforms: selectedPlatforms,
        status: mode === 'draft' ? 'DRAFT' : mode === 'schedule' ? 'SCHEDULED' : 'PUBLISHED',
        mediaUrls: media,
      };
      if (mode === 'schedule' && scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString();
      if (campaignId) payload.campaignId = campaignId;
      await postsApi.create(payload);
      router.push('/dashboard/posts');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const activePlatforms = PLATFORMS.filter((p) => selectedPlatforms.includes(p.key));
  const mainPlatform = activePlatforms[0];
  const charLimit = mainPlatform?.limit ?? 2200;
  const overLimit = content.length > charLimit;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compose Post</h1>
          <p className="text-sm text-muted-foreground">Create and schedule content across platforms</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => handleSubmit('draft')}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => handleSubmit(scheduleMode === 'schedule' ? 'schedule' : 'publish')}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {scheduleMode === 'schedule' ? 'Schedule Post' : 'Publish Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left panel — composer (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Platform selector */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Select Platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = selectedPlatforms.includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => togglePlatform(p.key)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                      active
                        ? 'text-white border-transparent shadow-sm'
                        : 'border-border text-muted-foreground hover:border-primary bg-background'
                    )}
                    style={active ? { background: p.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: active ? 'white' : p.color }}
                    />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content editor */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</p>
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Zap className="w-3.5 h-3.5" />
                AI Generate
              </button>
            </div>
            <textarea
              className={cn(
                'input w-full resize-none h-40 py-2 text-sm leading-relaxed',
                overLimit && 'border-destructive focus-visible:ring-destructive'
              )}
              placeholder="What's on your mind? Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="btn-ghost py-1 px-2 text-xs flex items-center gap-1 text-muted-foreground">
                  <Hash className="w-3.5 h-3.5" /> Hashtags
                </button>
                <button className="btn-ghost py-1 px-2 text-xs flex items-center gap-1 text-muted-foreground">
                  <AtSign className="w-3.5 h-3.5" /> Mention
                </button>
                <button className="btn-ghost py-1 px-2 text-xs flex items-center gap-1 text-muted-foreground">
                  <Smile className="w-3.5 h-3.5" /> Emoji
                </button>
              </div>
              <span className={cn('text-xs', overLimit ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                {content.length} / {charLimit.toLocaleString()}
                {mainPlatform && <span className="ml-1 opacity-60">({mainPlatform.label})</span>}
              </span>
            </div>
          </div>

          {/* AI generation panel */}
          {showAiPanel && (
            <div className="card p-4 space-y-3 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">AI Content Generator</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Platform</label>
                  <select
                    className="input w-full"
                    value={aiPlatform}
                    onChange={(e) => setAiPlatform(e.target.value)}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tone</label>
                  <select
                    className="input w-full"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                  >
                    {TONES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Topic / Context</label>
                <textarea
                  className="input w-full resize-none h-20 py-2 text-sm"
                  placeholder="Describe what you want to post about..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
              <button
                className="btn-primary flex items-center gap-2 w-full justify-center"
                onClick={handleGenerateAI}
                disabled={aiLoading || !aiTopic.trim()}
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {aiLoading ? 'Generating...' : 'Generate Content'}
              </button>
              {aiResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Generated options:</p>
                  {aiResults.map((result, i) => (
                    <div key={i} className="card p-3 space-y-2">
                      <p className="text-xs leading-relaxed">{result}</p>
                      <button
                        className="btn-secondary py-1 px-3 text-xs"
                        onClick={() => { setContent(result); setShowAiPanel(false); }}
                      >
                        Use This
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Media upload */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            {media.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <UploadCloud className="w-8 h-8" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload or drag & drop</p>
                  <p className="text-xs mt-0.5">PNG, JPG, MP4 up to 100MB</p>
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {media.map((url, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scheduling + Campaign */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Publishing</p>

            {/* Schedule toggle */}
            <div className="flex gap-2">
              {[
                { key: 'now', label: 'Post Now', icon: Send },
                { key: 'schedule', label: 'Schedule', icon: Calendar },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setScheduleMode(key as ScheduleMode)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all',
                    scheduleMode === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary bg-background'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {scheduleMode === 'schedule' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            {/* Campaign */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Campaign (optional)</label>
              <select
                className="input w-full"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              >
                <option value="">No campaign</option>
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right panel — previews (40%) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            Platform Previews
          </div>
          {activePlatforms.length === 0 ? (
            <div className="card p-8 text-center text-muted-foreground">
              <Eye className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select platforms to see previews</p>
            </div>
          ) : (
            activePlatforms.map((p) => (
              <PlatformPreview key={p.key} platform={p} content={content} media={media} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
