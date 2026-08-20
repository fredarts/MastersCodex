'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorldProvider } from '@/context/WorldContext';
import { CampaignProvider } from '@/context/CampaignContext';
import { SessionProvider } from '@/context/SessionContext';
import { LiveCockpitProvider } from '@/context/LiveCockpitContext';
import { AudioProvider } from '@/context/AudioContext';

import { PartyLootProvider } from '@/context/PartyLootContext';
import { DmLootCreatorModal } from '@/components/loot/DmLootCreatorModal';
import { PartyLootModal } from '@/components/loot/PartyLootModal';
import { ItemTransferModal } from '@/components/loot/ItemTransferModal';

import { CustomDialogProvider } from '@/context/CustomDialogContext';
import { CustomDialogModal } from '@/components/CustomDialogModal';

import { CalendarProvider } from '@/context/CalendarContext';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <CustomDialogProvider>
      <WorldProvider currentUserId={user?.id}>
        <CampaignProvider currentUserId={user?.id}>
          <CalendarProvider>
            <PartyLootProvider>
              <SessionProvider>
                <AudioProvider>
                  <LiveCockpitProvider>{children}</LiveCockpitProvider>
                </AudioProvider>
              </SessionProvider>

              {/* Modais Globais de Loot e Transferência */}
              <DmLootCreatorModal />
              <PartyLootModal currentUserId={user?.id} />
              <ItemTransferModal />
              <CustomDialogModal />
            </PartyLootProvider>
          </CalendarProvider>
        </CampaignProvider>
      </WorldProvider>
    </CustomDialogProvider>
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

