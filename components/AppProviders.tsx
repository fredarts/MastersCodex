'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorldProvider } from '@/context/WorldContext';
import { CampaignProvider } from '@/context/CampaignContext';
import { SessionProvider } from '@/context/SessionContext';
import { LiveCockpitProvider } from '@/context/LiveCockpitContext';
import { AudioProvider } from '@/context/AudioContext';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <WorldProvider currentUserId={user?.id}>
      <CampaignProvider currentUserId={user?.id}>
        <SessionProvider>
          <AudioProvider>
            <LiveCockpitProvider>{children}</LiveCockpitProvider>
          </AudioProvider>
        </SessionProvider>
      </CampaignProvider>
    </WorldProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" richColors theme="dark" />
      <InnerProviders>{children}</InnerProviders>
    </AuthProvider>
  );
}

