// src/app/(auth)/auth/page.tsx
'use client';

import { useState } from 'react';
import { AuthImagePanel } from '@/components/auth/AuthImagePanel';
import { AuthFormPanel } from '@/components/auth/AuthFormPanel';
import { AuthTrustStrip } from '@/components/auth/AuthTrustStrip';
import { AuthExplore } from '@/components/auth/AuthExplore';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="bg-brand-page font-sans text-brand-ink antialiased">
      <div className="mx-auto max-w-[1300px] px-4 py-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-card lg:grid-cols-[1fr_1.05fr]">
          <AuthImagePanel view={view} />
          <AuthFormPanel view={view} onViewChange={setView} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.75fr_1fr]">
          <AuthTrustStrip />
          <AuthExplore />
        </div>
      </div>
    </div>
  );
}