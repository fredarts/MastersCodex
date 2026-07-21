'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorldProvider } from '@/context/WorldContext';
import { CampaignProvider } from '@/context/CampaignContext';
import { SessionProvider } from '@/context/SessionContext';
import { LiveCockpitProvider } from '@/context/LiveCockpitContext';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <WorldProvider currentUserId={user?.id}>
      <CampaignProvider currentUserId={user?.id}>
        <SessionProvider>
          <LiveCockpitProvider>{children}</LiveCockpitProvider>
        </SessionProvider>
      </CampaignProvider>
    </WorldProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InnerProviders>{children}</InnerProviders>
    </AuthProvider>
  );
}
