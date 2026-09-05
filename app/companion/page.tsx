'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileCompanionView } from '@/components/companion/MobileCompanionView';
import { Loader2 } from 'lucide-react';

function CompanionContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get('character') || undefined;

  return <MobileCompanionView initialCharacterId={characterId} />;
}

export default function CompanionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Iniciando Pocket Companion...</span>
        </div>
      }
    >
      <CompanionContent />
    </Suspense>
  );
}
