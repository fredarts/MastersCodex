'use client';

import React from 'react';
import { Swords, Heart, Dices, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';

export type CompanionTab = 'actions' | 'life' | 'dice' | 'resources';

interface CompanionBottomNavProps {
  activeTab: CompanionTab;
  onChangeTab: (tab: CompanionTab) => void;
  isDeadOrDying?: boolean;
}

export const CompanionBottomNav: React.FC<CompanionBottomNavProps> = ({
  activeTab,
  onChangeTab,
  isDeadOrDying = false,
}) => {
  const tabs: { id: CompanionTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'actions',
      label: 'Ações',
      icon: <Swords className="w-5 h-5" />,
    },
    {
      id: 'life',
      label: 'Vida',
      icon: <Heart className={`w-5 h-5 ${isDeadOrDying ? 'text-red-500 animate-bounce' : ''}`} />,
      badge: isDeadOrDying ? '0 HP' : undefined,
    },
    {
      id: 'dice',
      label: 'Dados',
      icon: <Dices className="w-5 h-5" />,
    },
    {
      id: 'resources',
      label: 'Recursos',
      icon: <Sparkles className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom,12px)] pt-1.5 px-3 select-none">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic.tap();
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all active:scale-90 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-medium'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[9px] font-black px-1 rounded-full shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0.5 w-6 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
