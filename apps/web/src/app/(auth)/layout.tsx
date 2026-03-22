import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { default: 'Sign in', template: '%s | Barmagly' },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 dark:bg-slate-950 p-12 text-white">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            B
          </div>
          Barmagly
        </Link>

        <div className="space-y-6">
          <blockquote className="text-lg leading-relaxed text-slate-300">
            &ldquo;Barmagly replaced four separate tools we were using. Our team is now twice as fast
            publishing content across all platforms.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-violet-500" />
            <div>
              <p className="font-semibold">Sarah Chen</p>
              <p className="text-sm text-slate-400">Head of Marketing, TechCorp</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8 text-sm text-slate-400">
          <div>
            <p className="text-3xl font-bold text-white">50K+</p>
            <p>Active teams</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">6</p>
            <p>Social platforms</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">99.9%</p>
            <p>Uptime SLA</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            B
          </div>
          Barmagly
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
