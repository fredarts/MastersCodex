'use client';

import React from 'react';
import { useStreamerOverlaySync } from '@/lib/hooks/useStreamerOverlaySync';
import { OverlayDiceAlert } from './widgets/OverlayDiceAlert';
import { OverlayCombatTracker } from './widgets/OverlayCombatTracker';
import { OverlaySceneBanner } from './widgets/OverlaySceneBanner';
import { OverlayChatFeed } from './widgets/OverlayChatFeed';

export interface StreamerOverlayProps {
  campaignId: string;
  widgets?: string; // e.g. "dice,combat,scene,chat"
  theme?: string;
  align?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-center';
  combatLayout?: 'horizontal' | 'vertical' | 'compact';
  showHp?: boolean;
  scale?: number;
  diceDuration?: number;
  isPreview?: boolean;
}

export const StreamerOverlayContainer: React.FC<StreamerOverlayProps> = ({
  campaignId,
  widgets = 'dice,combat,scene',
  theme = 'obsidian',
  align = 'bottom-right',
  combatLayout = 'horizontal',
  showHp = false,
  scale = 1.0,
  diceDuration = 7000,
  isPreview = false,
}) => {
  const { state, triggerTestRoll } = useStreamerOverlaySync({
    campaignId,
    diceDurationMs: diceDuration,
  });

  const activeWidgets = (widgets || '').split(',').map((w) => w.trim().toLowerCase());
  const showDice = activeWidgets.includes('dice');
  const showCombat = activeWidgets.includes('combat');
  const showScene = activeWidgets.includes('scene');
  const showChat = activeWidgets.includes('chat');

  // Alignment positioning classes
  const getAlignmentClasses = () => {
    switch (align) {
      case 'top-left':
        return 'top-6 left-6 items-start';
      case 'top-right':
        return 'top-6 right-6 items-end';
      case 'top-center':
        return 'top-6 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-left':
        return 'bottom-6 left-6 items-start';
      case 'bottom-center':
        return 'bottom-6 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6 items-end';
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-transparent pointer-events-none select-none"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: align.includes('top') ? 'top center' : 'bottom center',
      }}
    >
      {/* Top Center Scene Banner */}
      {showScene && state.scene.title && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <OverlaySceneBanner scene={state.scene} theme={theme} />
        </div>
      )}

      {/* Primary Dock (Dice, Combat Tracker, Chat Feed) */}
      <div className={`absolute flex flex-col gap-4 z-10 pointer-events-auto ${getAlignmentClasses()}`}>
        {showCombat && state.combat.isActive && (
          <OverlayCombatTracker
            combat={state.combat}
            layout={combatLayout}
            showHp={showHp}
            theme={theme}
          />
        )}

        {showChat && state.chatMessages.length > 0 && (
          <OverlayChatFeed messages={state.chatMessages} theme={theme} />
        )}

        {showDice && <OverlayDiceAlert rolls={state.rolls} theme={theme} />}
      </div>

      {/* Preview Controls Banner (Only visible during preview inside Masters Codex app) */}
      {isPreview && (
        <div className="absolute top-3 left-3 bg-slate-950/90 border border-amber-500/50 p-2.5 rounded-xl flex items-center gap-2 z-50 pointer-events-auto shadow-2xl">
          <span className="text-xs font-bold text-amber-400 font-mono">MODO PREVIEW OBS</span>
          <button
            onClick={() => triggerTestRoll(false, false)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
          >
            🎲 Dado Normal
          </button>
          <button
            onClick={() => triggerTestRoll(true, false)}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs rounded border border-amber-500/50 font-bold"
          >
            ✨ Nat 20 Crítico
          </button>
          <button
            onClick={() => triggerTestRoll(false, true)}
            className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs rounded border border-rose-500/50 font-bold"
          >
            💀 Nat 1 Falha
          </button>
        </div>
      )}
    </div>
  );
};
