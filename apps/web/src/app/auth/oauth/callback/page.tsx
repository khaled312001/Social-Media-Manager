'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * This page is opened in a popup window by the accounts settings page.
 * After OAuth completes, the API redirects here.
 * We post a message to the parent window and close the popup.
 */
export default function OAuthCallbackPage() {
  const params = useSearchParams();

  useEffect(() => {
    const success = params.get('success') === 'true';
    const platform = params.get('platform') ?? '';
    const error = params.get('error') ?? '';

    if (window.opener) {
      window.opener.postMessage(
        { type: 'OAUTH_CALLBACK', success, platform, error },
        window.location.origin,
      );
      window.close();
    } else {
      // Fallback: not in popup, redirect to accounts settings
      window.location.href = '/dashboard/settings/accounts';
    }
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Completing connection…</p>
      </div>
    </div>
  );
}
