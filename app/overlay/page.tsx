'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StreamerOverlayContainer } from '@/components/overlay/StreamerOverlayContainer';

function OverlayContent() {
  const searchParams = useSearchParams();

  const campaignId = searchParams.get('campaignId') || '';
  const widgets = searchParams.get('widgets') || 'dice,combat,scene';
  const theme = searchParams.get('theme') || 'obsidian';
  const align = (searchParams.get('align') || 'bottom-right') as any;
  const combatLayout = (searchParams.get('combatLayout') || 'horizontal') as any;
  const showHp = searchParams.get('showHp') === 'true';
  const scale = parseFloat(searchParams.get('scale') || '1.0');
  const diceDuration = parseInt(searchParams.get('diceDuration') || '7000', 10);
  const isPreview = searchParams.get('preview') === 'true';

  if (!campaignId && !isPreview) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950/80 text-amber-400 font-sans p-6">
        <div className="max-w-md p-6 bg-slate-900 border border-amber-500/40 rounded-2xl text-center shadow-2xl">
          <h2 className="text-lg font-bold mb-2">Masters Codex • Streamer Overlay</h2>
          <p className="text-sm text-slate-300 mb-4">
            Nenhum <code className="text-amber-300 font-mono bg-slate-950 px-1 py-0.5 rounded">campaignId</code> fornecido na URL.
          </p>
          <p className="text-xs text-slate-400">
            Adicione a fonte de navegador no OBS com a URL gerada dentro do seu Live Cockpit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StreamerOverlayContainer
      campaignId={campaignId}
      widgets={widgets}
      theme={theme}
      align={align}
      combatLayout={combatLayout}
      showHp={showHp}
      scale={isNaN(scale) ? 1.0 : scale}
      diceDuration={isNaN(diceDuration) ? 7000 : diceDuration}
      isPreview={isPreview}
    />
  );
}

export default function OverlayPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-transparent" />
      }
    >
      <OverlayContent />
    </Suspense>
  );
}
