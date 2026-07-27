'use client';

import React from 'react';
import { BattleLog } from '@/components/BattleLog';
import { CombatLogEntry } from '@/lib/types';

interface PlayerBattleLogPanelProps {
  logs: CombatLogEntry[];
}

export const PlayerBattleLogPanel: React.FC<PlayerBattleLogPanelProps> = ({ logs }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c0f17]">
      <BattleLog logs={logs} readOnly={true} />
    </div>
  );
};
