'use client';

import { useState } from 'react';
import { AuthImagePanel } from '@/components/auth/AuthImagePanel';
import { AuthFormPanel } from '@/components/auth/AuthFormPanel';
import { AuthTrustStrip } from '@/components/auth/AuthTrustStrip';
import { AuthExplore } from '@/components/auth/AuthExplore';

interface AuthScreenProps {
  /** CSP nonce for this request — forwarded to Google One Tap's injected script. */
  nonce?: string;
}

export function AuthScreen({ nonce }: AuthScreenProps) {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased">
      <div className="mx-auto w-full max-w-[1300px] px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:rounded-3xl lg:grid-cols-[1fr_1.05fr]">
          <AuthImagePanel view={view} />
          <AuthFormPanel view={view} onViewChange={setView} nonce={nonce} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1.75fr_1fr]">
          <AuthTrustStrip />
          <AuthExplore />
        </div>
      </div>
    </div>
  );
}
