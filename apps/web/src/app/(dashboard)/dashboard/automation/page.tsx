'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Zap, X, Play, Pause, Trash2, Clock, CheckCircle,
  AlertCircle, MessageSquare, Bell, Tag, Globe, Send,
  Webhook, UserPlus, ChevronRight, ChevronDown, Filter,
  ToggleLeft, ToggleRight, History, RefreshCw,
} from 'lucide-react';
import { cn, formatRelativeTime, formatDate } from '@/lib/utils';

const TRIGGERS = [
  { key: 'NEW_MESSAGE', label: 'New Message', icon: MessageSquare },
  { key: 'NEW_MENTION', label: 'New Mention', icon: Bell },
  { key: 'POST_PUBLISHED', label: 'Post Published', icon: Globe },
  { key: 'NEW_FOLLOWER', label: 'New Follower', icon: UserPlus },
  { key: 'SCHEDULED_TIME', label: 'Scheduled Time', icon: Clock },
];

const ACTION_TYPES = [
  { key: 'SEND_REPLY', label: 'Send Reply', icon: Send },
  { key: 'ASSIGN_TO', label: 'Assign To', icon: UserPlus },
  { key: 'ADD_TAG', label: 'Add Tag', icon: Tag },
  { key: 'SEND_NOTIFICATION', label: 'Send Notification', icon: Bell },
  { key: 'CREATE_POST', label: 'Create Post', icon: Globe },
  { key: 'WEBHOOK', label: 'Call Webhook', icon: Webhook },
];

interface AutomationAction {
  type: string;
  config: Record<string, string>;
}

interface WorkflowBuilderState {
  name: string;
  trigger: string;
  conditions: string;
  actions: AutomationAction[];
  enabled: boolean;
}

function WorkflowBuilderModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: WorkflowBuilderState;
  onClose: () => void;
  onSave: (data: WorkflowBuilderState) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [trigger, setTrigger] = useState(initial?.trigger ?? '');
  const [conditions, setConditions] = useState(initial?.conditions ?? '');
  const [actions, setActions] = useState<AutomationAction[]>(initial?.actions ?? []);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  function addAction() {
    setActions((prev) => [...prev, { type: 'SEND_REPLY', config: {} }]);
  }

  function updateAction(index: number, field: keyof AutomationAction, value: unknown) {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!name.trim() || !trigger) return;
    onSave({ name, trigger, conditions, actions, enabled });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">{initial ? 'Edit Automation' : 'New Automation'}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Automation Name</label>
            <input
              className="input w-full"
              placeholder="e.g. Auto-reply to mentions"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              When this happens (Trigger)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGERS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTrigger(key)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all text-left',
                    trigger === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary bg-background'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Conditions (optional)
            </label>
            <input
              className="input w-full"
              placeholder="e.g. message contains 'price', platform = Instagram"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Use simple expressions like: platform = INSTAGRAM, sentiment = NEGATIVE
            </p>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                Do this (Actions)
              </label>
              <button
                className="btn-ghost flex items-center gap-1 text-xs py-1 px-2"
                onClick={addAction}
              >
                <Plus className="w-3 h-3" />
                Add Action
              </button>
            </div>
            {actions.length === 0 ? (
              <button
                onClick={addAction}
                className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-primary transition-colors"
              >
                <Plus className="w-4 h-4 mx-auto mb-1" />
                Add your first action
              </button>
            ) : (
              <div className="space-y-2">
                {actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0 mt-2">
                      {i + 1}
                    </div>
                    <div className="flex-1 card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <select
                          className="input text-xs py-1"
                          value={action.type}
                          onChange={(e) => updateAction(i, 'type', e.target.value)}
                        >
                          {ACTION_TYPES.map(({ key, label }) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <button
                          className="btn-ghost p-1 text-muted-foreground hover:text-destructive ml-2"
                          onClick={() => removeAction(i)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {action.type === 'SEND_REPLY' && (
                        <input
                          className="input w-full text-xs"
                          placeholder="Reply message..."
                          value={action.config.message ?? ''}
                          onChange={(e) => updateAction(i, 'config', { ...action.config, message: e.target.value })}
                        />
                      )}
                      {action.type === 'ASSIGN_TO' && (
                        <input
                          className="input w-full text-xs"
                          placeholder="Team member email or ID"
                          value={action.config.assigneeId ?? ''}
                          onChange={(e) => updateAction(i, 'config', { ...action.config, assigneeId: e.target.value })}
                        />
                      )}
                      {action.type === 'ADD_TAG' && (
                        <input
                          className="input w-full text-xs"
                          placeholder="Tag name"
                          value={action.config.tag ?? ''}
                          onChange={(e) => updateAction(i, 'config', { ...action.config, tag: e.target.value })}
                        />
                      )}
                      {action.type === 'WEBHOOK' && (
                        <input
                          className="input w-full text-xs"
                          placeholder="https://your-webhook-url.com"
                          value={action.config.url ?? ''}
                          onChange={(e) => updateAction(i, 'config', { ...action.config, url: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div>
              <p className="text-sm font-medium">Enable automation</p>
              <p className="text-xs text-muted-foreground">Activate this automation immediately after saving</p>
            </div>
            <button onClick={() => setEnabled(!enabled)}>
              {enabled ? (
                <ToggleRight className="w-7 h-7 text-green-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleSave}
              disabled={!name.trim() || !trigger}
            >
              <Zap className="w-4 h-4" />
              Save Automation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null);
  const [executions, setExecutions] = useState<any[]>([]);

  useEffect(() => {
    // Load automations from API
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '';
    const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspace-id') : '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (workspaceId) headers['X-Workspace-Id'] = workspaceId;

    Promise.all([
      fetch('/api/automations', { headers }).then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/automations/executions', { headers }).then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([aRes, eRes]) => {
      setAutomations(aRes?.data?.items ?? aRes?.items ?? aRes?.data ?? []);
      setExecutions(eRes?.data?.items ?? eRes?.items ?? eRes?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  function handleSave(data: WorkflowBuilderState) {
    if (editingAutomation) {
      setAutomations((prev) =>
        prev.map((a: any) => a.id === editingAutomation.id ? { ...a, ...data } : a)
      );
    } else {
      setAutomations((prev) => [
        {
          id: Date.now().toString(),
          ...data,
          executionCount: 0,
          lastRunAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setEditingAutomation(null);
  }

  function handleToggle(id: string) {
    setAutomations((prev) =>
      prev.map((a: any) => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this automation?')) return;
    setAutomations((prev) => prev.filter((a: any) => a.id !== id));
  }

  const triggerLabel = (key: string) => TRIGGERS.find((t) => t.key === key)?.label ?? key;
  const TriggerIcon = (key: string) => TRIGGERS.find((t) => t.key === key)?.icon ?? Zap;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automation</h1>
          <p className="text-sm text-muted-foreground">Create workflows to automate repetitive tasks</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingAutomation(null); setShowBuilder(true); }}
        >
          <Plus className="w-4 h-4" />
          New Automation
        </button>
      </div>

      {/* Automations list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Workflows</h2>
          <span className="text-xs text-muted-foreground">{automations.length} automations</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 bg-muted rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No automations yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Create your first automation to save time on repetitive tasks
            </p>
            <button
              className="btn-primary flex items-center gap-2 mx-auto"
              onClick={() => setShowBuilder(true)}
            >
              <Plus className="w-4 h-4" />
              New Automation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {automations.map((automation: any) => {
              const Icon = TriggerIcon(automation.trigger);
              return (
                <div key={automation.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    automation.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{automation.name}</p>
                      {automation.enabled ? (
                        <span className="badge-success text-[10px]">Active</span>
                      ) : (
                        <span className="badge badge-secondary text-[10px]">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        {triggerLabel(automation.trigger)}
                      </span>
                      <span>·</span>
                      <span>{(automation.actions ?? []).length} action(s)</span>
                      {automation.lastRunAt && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last run {formatRelativeTime(automation.lastRunAt)}
                          </span>
                        </>
                      )}
                      {automation.executionCount !== undefined && (
                        <>
                          <span>·</span>
                          <span>{automation.executionCount} executions</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(automation.id)}
                      className={cn(
                        'transition-colors',
                        automation.enabled ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
                      )}
                      title={automation.enabled ? 'Disable' : 'Enable'}
                    >
                      {automation.enabled ? (
                        <ToggleRight className="w-7 h-7" />
                      ) : (
                        <ToggleLeft className="w-7 h-7" />
                      )}
                    </button>
                    <button
                      className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground text-xs"
                      onClick={() => { setEditingAutomation(automation); setShowBuilder(true); }}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-ghost p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(automation.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Execution History</h2>
        </div>
        {executions.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No execution history yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Automation</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Trigger</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Executed At</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executions.map((exec: any) => (
                  <tr key={exec.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-3 text-xs font-medium">{exec.automationName ?? exec.name ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{exec.trigger ?? '—'}</td>
                    <td className="px-5 py-3">
                      {exec.status === 'SUCCESS' ? (
                        <span className="badge-success flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="badge-destructive flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {exec.executedAt ? formatRelativeTime(exec.executedAt) : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {exec.durationMs ? `${exec.durationMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow builder modal */}
      {showBuilder && (
        <WorkflowBuilderModal
          initial={editingAutomation ?? undefined}
          onClose={() => { setShowBuilder(false); setEditingAutomation(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
