'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TvDisplayContainer } from '@/components/tv/TvDisplayContainer';

function TvPageContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId') || '';
  const rotation = parseInt(searchParams.get('rotation') || '0', 10);
  const scale = parseFloat(searchParams.get('scale') || '1.0');
  const mode = (searchParams.get('mode') || 'auto') as any;

  return (
    <TvDisplayContainer
      campaignId={campaignId}
      initialRotation={isNaN(rotation) ? 0 : rotation}
      initialScale={isNaN(scale) ? 1.0 : scale}
      initialMode={mode}
    />
  );
}

export default function TvPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-black flex items-center justify-center text-amber-500 font-mono text-xs">
          Carregando Modo TV...
        </div>
      }
    >
      <TvPageContent />
    </Suspense>
  );
}
