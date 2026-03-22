'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard, Check, X, Zap, ArrowUpRight, Download,
  RefreshCw, AlertCircle, Star, Users, FileText, Globe,
  Loader2,
} from 'lucide-react';
import { billingApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

const PLANS = [
  {
    key: 'FREE',
    name: 'Free',
    price: 0,
    cycle: 'month',
    features: {
      posts: 10,
      accounts: 2,
      members: 1,
      analytics: false,
      ai: false,
      api: false,
      support: 'Community',
    },
  },
  {
    key: 'STARTER',
    name: 'Starter',
    price: 29,
    cycle: 'month',
    features: {
      posts: 100,
      accounts: 5,
      members: 3,
      analytics: true,
      ai: false,
      api: false,
      support: 'Email',
    },
  },
  {
    key: 'PROFESSIONAL',
    name: 'Professional',
    price: 79,
    cycle: 'month',
    popular: true,
    features: {
      posts: 500,
      accounts: 15,
      members: 10,
      analytics: true,
      ai: true,
      api: false,
      support: 'Priority',
    },
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    price: 199,
    cycle: 'month',
    features: {
      posts: 2000,
      accounts: 50,
      members: 25,
      analytics: true,
      ai: true,
      api: true,
      support: 'Dedicated',
    },
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: null,
    cycle: 'month',
    features: {
      posts: -1, // unlimited
      accounts: -1,
      members: -1,
      analytics: true,
      ai: true,
      api: true,
      support: 'SLA',
    },
  },
];

function UsageMeter({ label, used, limit, icon: Icon, color }: {
  label: string;
  used: number;
  limit: number;
  icon: React.ElementType;
  color: string;
}) {
  const pct = limit < 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = pct >= 80;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className={cn('w-4 h-4', color)} />
          {label}
        </div>
        <span className={cn('text-xs font-medium', isNearLimit ? 'text-destructive' : 'text-muted-foreground')}>
          {used} / {limit < 0 ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isNearLimit ? 'bg-destructive' : 'bg-primary'
          )}
          style={{ width: `${limit < 0 ? 0 : pct}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Approaching limit — consider upgrading
        </p>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    Promise.all([
      billingApi.subscription().catch(() => null),
      billingApi.plans().catch(() => null),
    ]).then(([sub, pl]) => {
      setSubscription((sub as any)?.data ?? sub ?? {});
      const plData = (pl as any)?.data ?? pl;
      setInvoices(plData?.invoices ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCheckout(planKey: string) {
    setActionLoading(planKey);
    try {
      const res: any = await billingApi.checkout({ planId: planKey });
      const url = res?.url ?? res?.data?.url;
      if (url) window.location.href = url;
    } catch { /* ignore */ } finally {
      setActionLoading('');
    }
  }

  async function handlePortal() {
    setActionLoading('portal');
    try {
      const res: any = await billingApi.portal();
      const url = res?.url ?? res?.data?.url;
      if (url) window.location.href = url;
    } catch { /* ignore */ } finally {
      setActionLoading('');
    }
  }

  const currentPlanKey = subscription?.plan ?? 'FREE';
  const currentPlan = PLANS.find((p) => p.key === currentPlanKey) ?? PLANS[0];
  const usage = subscription?.usage ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground">Manage your plan, usage, and payment details</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Current plan */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-success flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Current Plan
                  </span>
                </div>
                <h2 className="text-xl font-bold">{currentPlan.name}</h2>
                <p className="text-2xl font-bold mt-1">
                  {currentPlan.price === null ? (
                    'Custom pricing'
                  ) : currentPlan.price === 0 ? (
                    'Free'
                  ) : (
                    <>
                      ${currentPlan.price}
                      <span className="text-sm font-normal text-muted-foreground">/{currentPlan.cycle}</span>
                    </>
                  )}
                </p>
                {subscription?.nextBillingDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Renews {formatDate(subscription.nextBillingDate)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary flex items-center gap-2"
                  onClick={handlePortal}
                  disabled={actionLoading === 'portal'}
                >
                  {actionLoading === 'portal' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Manage Subscription
                </button>
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={() => handleCheckout('PROFESSIONAL')}
                  disabled={currentPlanKey === 'PROFESSIONAL'}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Features list */}
            <div className="mt-5 pt-5 border-t border-border grid sm:grid-cols-3 gap-3">
              {[
                `${currentPlan.features.posts < 0 ? 'Unlimited' : currentPlan.features.posts} posts/month`,
                `${currentPlan.features.accounts < 0 ? 'Unlimited' : currentPlan.features.accounts} social accounts`,
                `${currentPlan.features.members < 0 ? 'Unlimited' : currentPlan.features.members} team members`,
                currentPlan.features.analytics ? 'Advanced analytics' : null,
                currentPlan.features.ai ? 'AI content generation' : null,
                currentPlan.features.api ? 'API access' : null,
                `${currentPlan.features.support} support`,
              ].filter(Boolean).map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Usage meters */}
          <div className="card p-6">
            <h2 className="font-semibold text-sm mb-4">Usage This Period</h2>
            <div className="space-y-5">
              <UsageMeter
                label="Posts Published"
                used={usage.posts ?? 0}
                limit={currentPlan.features.posts}
                icon={FileText}
                color="text-primary"
              />
              <UsageMeter
                label="Social Accounts"
                used={usage.accounts ?? 0}
                limit={currentPlan.features.accounts}
                icon={Globe}
                color="text-blue-500"
              />
              <UsageMeter
                label="Team Members"
                used={usage.members ?? 0}
                limit={currentPlan.features.members}
                icon={Users}
                color="text-green-500"
              />
            </div>
          </div>

          {/* Plan comparison */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Plan Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">Feature</th>
                    {PLANS.map((plan) => (
                      <th key={plan.key} className={cn('px-4 py-3 text-center font-medium', plan.popular && 'bg-primary/5')}>
                        <div>
                          {plan.popular && (
                            <span className="text-[10px] text-primary font-semibold block mb-0.5">POPULAR</span>
                          )}
                          {plan.name}
                          {plan.key === currentPlanKey && (
                            <span className="ml-1.5 text-[10px] badge-success">Current</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          {plan.price === null ? 'Custom' : plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { label: 'Posts/month', key: 'posts', format: (v: number) => v < 0 ? '∞' : String(v) },
                    { label: 'Social accounts', key: 'accounts', format: (v: number) => v < 0 ? '∞' : String(v) },
                    { label: 'Team members', key: 'members', format: (v: number) => v < 0 ? '∞' : String(v) },
                    { label: 'Analytics', key: 'analytics', format: (v: boolean) => v },
                    { label: 'AI generation', key: 'ai', format: (v: boolean) => v },
                    { label: 'API access', key: 'api', format: (v: boolean) => v },
                    { label: 'Support', key: 'support', format: (v: string) => v },
                  ].map(({ label, key, format }) => (
                    <tr key={key}>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{label}</td>
                      {PLANS.map((plan) => {
                        const val = (plan.features as any)[key];
                        const formatted = format(val);
                        return (
                          <td
                            key={plan.key}
                            className={cn('px-4 py-3 text-center', plan.popular && 'bg-primary/5')}
                          >
                            {typeof formatted === 'boolean' ? (
                              formatted ? (
                                <Check className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground mx-auto" />
                              )
                            ) : (
                              <span className="text-xs font-medium">{formatted}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-3" />
                    {PLANS.map((plan) => (
                      <td key={plan.key} className={cn('px-4 py-3 text-center', plan.popular && 'bg-primary/5')}>
                        {plan.key === currentPlanKey ? (
                          <span className="text-xs text-muted-foreground">Current plan</span>
                        ) : (
                          <button
                            className={cn(plan.popular ? 'btn-primary' : 'btn-secondary', 'py-1.5 px-3 text-xs w-full')}
                            onClick={() => plan.price === null ? undefined : handleCheckout(plan.key)}
                            disabled={!!actionLoading}
                          >
                            {plan.price === null ? 'Contact Us' : actionLoading === plan.key ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment method */}
          {subscription?.paymentMethod && (
            <div className="card p-5">
              <h2 className="font-semibold text-sm mb-3">Payment Method</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {subscription.paymentMethod.brand?.toUpperCase() ?? 'Card'} ending in {subscription.paymentMethod.last4 ?? '••••'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                  </p>
                </div>
                <button className="btn-secondary ml-auto py-1.5 px-3 text-xs" onClick={handlePortal}>
                  Update
                </button>
              </div>
            </div>
          )}

          {/* Billing history */}
          <div className="card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Billing History</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No invoices yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {invoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{formatDate(invoice.date ?? invoice.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{invoice.description ?? `Invoice #${invoice.id?.slice(0, 8)}`}</p>
                    </div>
                    <span className="font-semibold text-sm">${(invoice.amount / 100).toFixed(2)}</span>
                    <span className={cn(invoice.status === 'paid' ? 'badge-success' : 'badge-destructive')}>
                      {invoice.status}
                    </span>
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost p-1.5 text-muted-foreground"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
