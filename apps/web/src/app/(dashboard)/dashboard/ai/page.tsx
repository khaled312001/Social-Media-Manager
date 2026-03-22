'use client';

import { useState } from 'react';
import {
  Zap, Bot, TrendingUp, BarChart2, Target, Radar, MessageCircle,
  Play, ToggleLeft, ToggleRight, Clock, Hash, RefreshCw, Check,
  Sparkles, ChevronDown, Loader2, Copy, ArrowRight,
} from 'lucide-react';
import { aiApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN', 'YOUTUBE'];
const TONES = ['Professional', 'Casual', 'Humorous', 'Inspiring'];

const AGENTS = [
  {
    id: 'content',
    name: 'Content Generator',
    description: 'Creates engaging social media posts tailored to each platform and audience.',
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  {
    id: 'engagement',
    name: 'Engagement Agent',
    description: 'Automatically responds to comments and messages to boost engagement.',
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'analytics',
    name: 'Analytics Agent',
    description: 'Analyzes performance data and generates actionable insights and recommendations.',
    icon: BarChart2,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    id: 'optimizer',
    name: 'Campaign Optimizer',
    description: 'Continuously improves campaign performance by testing and adjusting parameters.',
    icon: Target,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  {
    id: 'trends',
    name: 'Trend Detection',
    description: 'Monitors social media trends and alerts you to relevant opportunities.',
    icon: TrendingUp,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  {
    id: 'support',
    name: 'Support Bot',
    description: 'Handles customer support queries with AI-powered responses and escalation.',
    icon: Bot,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
];

export default function AIPage() {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, boolean>>({
    content: true,
    engagement: false,
    analytics: true,
    optimizer: false,
    trends: true,
    support: false,
  });
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  // Content Generator state
  const [cgPlatform, setCgPlatform] = useState('INSTAGRAM');
  const [cgTopic, setCgTopic] = useState('');
  const [cgTone, setCgTone] = useState('Professional');
  const [cgLoading, setCgLoading] = useState(false);
  const [cgResults, setCgResults] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function toggleAgent(id: string) {
    setAgentStatuses((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleGenerate() {
    if (!cgTopic.trim()) return;
    setCgLoading(true);
    setCgResults([]);
    try {
      const res: any = await aiApi.generateContent({
        platform: cgPlatform,
        topic: cgTopic,
        tone: cgTone.toUpperCase(),
        count: 3,
      });
      const data = res?.data ?? res;
      const results = data?.contents ?? data?.results ?? [];
      setCgResults(results.map((r: any) => (typeof r === 'string' ? r : r.content)));
    } catch {
      setCgResults(['Unable to generate content. Please try again.']);
    } finally {
      setCgLoading(false);
    }
  }

  async function copyToClipboard(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* ignore */ }
  }

  const usageStats = [
    { label: 'Total AI Calls', value: '2,847', icon: Zap, color: 'text-violet-500' },
    { label: 'Tokens Used', value: '1.2M', icon: Hash, color: 'text-blue-500' },
    { label: 'Est. Cost', value: '$18.40', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Active Agents', value: String(Object.values(agentStatuses).filter(Boolean).length), icon: Bot, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground">Automate and enhance your social media with AI</p>
        </div>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {usageStats.map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', 'bg-muted/60')}>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Available Agents</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent) => {
            const active = agentStatuses[agent.id] ?? false;
            return (
              <div
                key={agent.id}
                className={cn(
                  'card p-5 space-y-4 border',
                  activeAgent === agent.id && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', agent.bgColor)}>
                      <agent.icon className={cn('w-5 h-5', agent.color)} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{agent.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            active ? 'bg-green-500' : 'bg-muted-foreground'
                          )}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className={cn('transition-colors', active ? 'text-green-500' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {active ? (
                      <ToggleRight className="w-7 h-7" />
                    ) : (
                      <ToggleLeft className="w-7 h-7" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Last run: 2 hours ago</span>
                  <span className="ml-auto">847 runs</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs flex-1 justify-center"
                    onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
                  >
                    {agent.id === 'content' ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Open
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Run
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Generator panel */}
      {activeAgent === 'content' && (
        <div className="card border-primary/30">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold">Content Generator</h2>
            </div>
            <button
              onClick={() => setActiveAgent(null)}
              className="btn-ghost p-1.5 text-muted-foreground"
            >
              ×
            </button>
          </div>
          <div className="p-5 grid lg:grid-cols-2 gap-5">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCgPlatform(p)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg border font-medium transition-all',
                        cgPlatform === p
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary bg-background'
                      )}
                    >
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tone
                </label>
                <div className="flex gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setCgTone(t)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg border font-medium transition-all flex-1',
                        cgTone === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary bg-background'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Topic / Context
                </label>
                <textarea
                  className="input w-full resize-none h-28 py-2 text-sm"
                  placeholder="Describe what you want to post about. E.g., 'Launching our new product line for summer 2026...'"
                  value={cgTopic}
                  onChange={(e) => setCgTopic(e.target.value)}
                />
              </div>

              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleGenerate}
                disabled={cgLoading || !cgTopic.trim()}
              >
                {cgLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {cgLoading ? 'Generating content...' : 'Generate Content'}
              </button>
            </div>

            {/* Results */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated Results
              </p>
              {cgLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse space-y-2">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                      <div className="h-3 bg-muted rounded w-3/5" />
                    </div>
                  ))}
                </div>
              ) : cgResults.length === 0 ? (
                <div className="card p-8 text-center text-muted-foreground border-dashed">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Generated content will appear here</p>
                </div>
              ) : (
                cgResults.map((result, i) => (
                  <div key={i} className="card p-4 space-y-3">
                    <p className="text-xs leading-relaxed">{result}</p>
                    <div className="flex gap-2">
                      <button
                        className="btn-ghost flex items-center gap-1.5 py-1 px-2.5 text-xs text-muted-foreground"
                        onClick={() => copyToClipboard(result, i)}
                      >
                        {copiedIdx === i ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedIdx === i ? 'Copied!' : 'Copy'}
                      </button>
                      <button className="btn-secondary flex items-center gap-1.5 py-1 px-2.5 text-xs">
                        <ArrowRight className="w-3.5 h-3.5" />
                        Use in Composer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
