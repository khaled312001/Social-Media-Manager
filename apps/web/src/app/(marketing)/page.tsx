import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3, Bot, Calendar, Globe, Mail, Shield, Users, Zap,
  CheckCircle, ArrowRight, Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barmagly — Enterprise Social Media Management Platform',
};

const features = [
  {
    icon: Globe,
    title: 'All Platforms, One Place',
    description: 'Manage Facebook, Instagram, Twitter/X, TikTok, LinkedIn, and YouTube from a single unified dashboard.',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Bot,
    title: 'AI-Powered Content',
    description: 'Generate platform-specific posts, get smart reply suggestions, and optimize campaigns with Claude AI agents.',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Drag-and-drop calendar, bulk scheduling, optimal timing predictions, and automated publishing queues.',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Deep engagement metrics, competitor benchmarking, custom report builder, and automated insights.',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    icon: Mail,
    title: 'Email Marketing',
    description: 'Drag-and-drop email builder, automation sequences, A/B testing, and deliverability optimization.',
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Role-based permissions, content approval workflows, task assignment, and real-time activity feeds.',
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    icon: Zap,
    title: 'Automation Engine',
    description: 'Build IF-THIS-THEN-THAT workflows to auto-reply, tag contacts, escalate issues, and more.',
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 Type II, AES-256 encryption, RBAC, SSO, audit logs, and GDPR compliance built-in.',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for individuals getting started',
    features: ['3 social accounts', '30 posts/month', '1 team member', 'Basic analytics', '7-day history'],
    cta: 'Get started free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/month',
    description: 'For growing teams and agencies',
    features: ['25 social accounts', '500 posts/month', '10 team members', 'Advanced analytics', 'AI content generation', 'Email marketing (10k contacts)', 'Custom reports', 'Priority support'],
    cta: 'Start free trial',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations at scale',
    features: ['Unlimited accounts', 'Unlimited posts', 'Unlimited team members', 'White-label options', 'SSO/SAML', 'Dedicated CSM', 'SLA guarantee', 'Custom integrations'],
    cta: 'Contact sales',
    href: '/contact',
    highlighted: false,
  },
];

const testimonials = [
  {
    quote: "Barmagly replaced Hootsuite, Mailchimp, and two other tools we were paying for. Our social engagement is up 340% since we switched.",
    name: 'Sarah Chen',
    title: 'VP Marketing, TechCorp',
    avatar: 'SC',
  },
  {
    quote: "The AI agents are genuinely impressive. We're publishing 3x more content with the same team size and quality has actually improved.",
    name: 'Marcus Williams',
    title: 'Social Media Lead, RetailBrand',
    avatar: 'MW',
  },
  {
    quote: "White-labeling for our agency clients was a game-changer. We now resell Barmagly as our own platform to 40+ clients.",
    name: 'Anna Torres',
    title: 'Founder, DigitalAgency',
    avatar: 'AT',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">B</div>
            Barmagly
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3" />
            Powered by Claude AI — 6 intelligent agents
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            One platform for{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              all your social media
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Schedule posts, analyze performance, manage your inbox, run email campaigns,
            and let AI agents handle the heavy lifting — across 6 platforms in one workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/register" className="btn-primary text-base px-6 py-3 flex items-center gap-2">
              Start free — no credit card <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="btn-secondary text-base px-6 py-3">
              See all features
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Join 50,000+ teams · 14-day free trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Social proof logos */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-widest">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-8 items-center text-muted-foreground/50 font-semibold text-lg">
            {['Shopify', 'HubSpot', 'Notion', 'Figma', 'Stripe', 'Vercel'].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-bold tracking-tight">Everything your team needs</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Replace 5+ tools with one platform. From content creation to analytics to CRM.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <div className="flex justify-center gap-0.5 text-yellow-400">
              {Array(5).fill(0).map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <h2 className="text-3xl font-bold">Loved by 50,000+ teams</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6 space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card p-6 space-y-5 relative ${plan.highlighted ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-default text-xs px-3 py-1">Most popular</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm pb-1">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.highlighted ? 'btn-primary w-full text-center block' : 'btn-secondary w-full text-center block'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-600 to-indigo-700">
        <div className="max-w-2xl mx-auto text-center space-y-5 text-white">
          <h2 className="text-4xl font-bold">Ready to transform your social media?</h2>
          <p className="text-violet-200">
            Join 50,000+ teams already using Barmagly to grow their audience and save hours every week.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-6 py-3 rounded-lg hover:bg-violet-50 transition-colors"
          >
            Start your free trial <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-violet-300">No credit card required · 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">B</div>
              Barmagly
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise-grade social media management for modern teams.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] },
          ].map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase()}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-2">
          <p className="text-xs text-muted-foreground">© 2025 Barmagly. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built with ❤️ for social media teams worldwide</p>
        </div>
      </footer>
    </div>
  );
}
