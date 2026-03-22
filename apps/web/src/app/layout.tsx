import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Barmagly — Social Media Manager', template: '%s | Barmagly' },
  description: 'Enterprise-grade social media management platform. Manage all your social accounts, automate posting, and grow your audience.',
  keywords: ['social media management', 'social media scheduler', 'social media analytics', 'hootsuite alternative'],
  authors: [{ name: 'Barmagly' }],
  creator: 'Barmagly',
  openGraph: {
    type: 'website',
    title: 'Barmagly — Social Media Manager',
    description: 'Enterprise social media management platform',
    siteName: 'Barmagly',
  },
  twitter: { card: 'summary_large_image', title: 'Barmagly' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: 'white' }, { media: '(prefers-color-scheme: dark)', color: '#0f172a' }],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" expand closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
