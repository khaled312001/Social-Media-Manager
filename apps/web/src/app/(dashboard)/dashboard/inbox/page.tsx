'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare, Filter, Search, Send, UserPlus, StickyNote,
  Facebook, Instagram, Twitter, Youtube, Linkedin, AtSign,
  ThumbsUp, Minus, ThumbsDown, Circle, ChevronDown, Inbox,
  RefreshCw, CheckCheck, Tag,
} from 'lucide-react';
import { inboxApi } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

const PLATFORM_LABELS = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN', 'YOUTUBE'];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'DM', label: 'DM' },
  { key: 'COMMENT', label: 'Comments' },
  { key: 'MENTION', label: 'Mentions' },
  { key: 'REVIEW', label: 'Reviews' },
];

function getInitials(name: string) {
  return name
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === 'POSITIVE') {
    return (
      <span className="badge-success flex items-center gap-1">
        <ThumbsUp className="w-3 h-3" />
        Positive
      </span>
    );
  }
  if (sentiment === 'NEGATIVE') {
    return (
      <span className="badge-destructive flex items-center gap-1">
        <ThumbsDown className="w-3 h-3" />
        Negative
      </span>
    );
  }
  return (
    <span className="badge badge-secondary flex items-center gap-1">
      <Minus className="w-3 h-3" />
      Neutral
    </span>
  );
}

function SkeletonMessage() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border animate-pulse">
      <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [replying, setReplying] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page: 1, limit: 20 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (platformFilter) params.platform = platformFilter;

    inboxApi
      .list(params)
      .then((res: any) => {
        const data = res?.data ?? res;
        setMessages(data?.items ?? data ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [statusFilter, platformFilter]);

  const filtered = messages.filter((m: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.authorName?.toLowerCase().includes(q) ||
      m.content?.toLowerCase().includes(q)
    );
  });

  const selectedMessage = filtered.find((m: any) => m.id === selectedId) ?? null;

  const unreadCount = messages.filter((m: any) => m.status === 'UNREAD').length;

  async function handleReply() {
    if (!selectedId || !replyText.trim()) return;
    setReplying(true);
    try {
      await inboxApi.reply(selectedId, replyText);
      setReplyText('');
    } catch {
      // ignore
    } finally {
      setReplying(false);
    }
  }

  async function handleAddNote() {
    if (!selectedId || !noteText.trim()) return;
    setAddingNote(true);
    try {
      await inboxApi.addNote(selectedId, noteText);
      setNoteText('');
    } catch {
      // ignore
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Unified Inbox</h1>
          {unreadCount > 0 && (
            <span className="badge-destructive">{unreadCount} unread</span>
          )}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input pl-8 w-64"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-card flex-shrink-0 overflow-x-auto scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors',
              statusFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {f.label}
            {f.key === 'UNREAD' && unreadCount > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Platform filter chips */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card flex-shrink-0 overflow-x-auto scrollbar-hide">
        <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <button
          onClick={() => setPlatformFilter(null)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-full border transition-colors whitespace-nowrap',
            !platformFilter
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:border-primary'
          )}
        >
          All Platforms
        </button>
        {PLATFORM_LABELS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full border transition-colors whitespace-nowrap font-medium',
              platformFilter === p ? 'text-white border-transparent' : 'text-muted-foreground hover:border-primary border-border'
            )}
            style={platformFilter === p ? { background: PLATFORM_COLORS[p] } : {}}
          >
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Message list */}
        <div className="w-80 xl:w-96 border-r border-border flex flex-col flex-shrink-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonMessage key={i} />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">No messages found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              filtered.map((msg: any) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors',
                    selectedId === msg.id && 'bg-accent'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: PLATFORM_COLORS[msg.platform] ?? '#888' }}
                    >
                      {getInitials(msg.authorName ?? 'User')}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card"
                      style={{ background: PLATFORM_COLORS[msg.platform] ?? '#888' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold truncate">
                        {msg.authorName ?? 'Unknown User'}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                        {msg.createdAt ? formatRelativeTime(msg.createdAt) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {msg.content ?? '(no content)'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <SentimentBadge sentiment={msg.sentiment ?? 'NEUTRAL'} />
                      {msg.status === 'UNREAD' && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedMessage ? (
            <>
              {/* Detail header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: PLATFORM_COLORS[selectedMessage.platform] ?? '#888' }}
                  >
                    {getInitials(selectedMessage.authorName ?? 'User')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedMessage.authorName ?? 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">
                      via{' '}
                      <span
                        className="font-medium"
                        style={{ color: PLATFORM_COLORS[selectedMessage.platform] ?? '#888' }}
                      >
                        {selectedMessage.platform?.charAt(0) + (selectedMessage.platform?.slice(1).toLowerCase() ?? '')}
                      </span>
                      {' · '}
                      {selectedMessage.createdAt ? formatRelativeTime(selectedMessage.createdAt) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SentimentBadge sentiment={selectedMessage.sentiment ?? 'NEUTRAL'} />
                  <span className="badge badge-secondary">{selectedMessage.type ?? 'MESSAGE'}</span>
                  <button className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Message body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Full content */}
                <div className="card p-4">
                  <p className="text-sm leading-relaxed">{selectedMessage.content}</p>
                  {selectedMessage.mediaUrl && (
                    <img
                      src={selectedMessage.mediaUrl}
                      alt="media"
                      className="mt-3 rounded-lg max-h-48 object-cover"
                    />
                  )}
                </div>

                {/* Internal notes */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    Internal Notes
                  </h3>
                  {(selectedMessage.notes ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedMessage.notes ?? []).map((note: any) => (
                        <div key={note.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2">
                          <p className="text-xs">{note.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{note.createdAt ? formatRelativeTime(note.createdAt) : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <input
                      className="input flex-1 text-xs"
                      placeholder="Add internal note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                    <button
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={handleAddNote}
                      disabled={addingNote || !noteText.trim()}
                    >
                      {addingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reply area */}
              <div className="border-t border-border px-6 py-4 flex-shrink-0">
                <textarea
                  className="input w-full resize-none h-24 py-2 text-sm"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{replyText.length} characters</span>
                  <button
                    className="btn-primary flex items-center gap-2 py-1.5 px-4 text-xs"
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                  >
                    {replying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Send Reply
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Select a message</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a conversation from the left to view and reply to messages from your audience across all platforms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
