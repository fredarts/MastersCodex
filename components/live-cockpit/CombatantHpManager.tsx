'use client';

import React, { useState } from 'react';
import { Combatant } from '@/lib/types';
import { Swords, Heart } from 'lucide-react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';

interface CombatantHpManagerProps {
  combatant: Combatant;
  onHpChange: (id: string, delta: number) => void;
}

export const CombatantHpManager: React.FC<CombatantHpManagerProps> = ({
  combatant,
  onHpChange,
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  const hpPercent = Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100));

  const { triggerDamageWithConcentrationCheck } = useLiveCockpit();

  const handlePreciseHp = (isDamage: boolean) => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || val <= 0) return;
    if (isDamage && triggerDamageWithConcentrationCheck) {
      triggerDamageWithConcentrationCheck(combatant.id, val);
    } else {
      onHpChange(combatant.id, isDamage ? -val : val);
    }
    setInputValue('');
  };

  return (
    <div 
      className="flex flex-wrap items-center justify-between gap-3 mt-1 bg-[#0a0d14]/50 p-2 rounded-xl border border-[#2a3449]/50" 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <div className="bg-[#0a0d14] px-2 py-1 rounded-lg border border-cyan-900/50 shadow-inner">
          <div className="text-[8px] font-bold text-cyan-500/70 uppercase leading-none">CA</div>
          <div className="text-xs font-mono font-black text-cyan-300 leading-none">{combatant.ac}</div>
        </div>
        
        <div className="w-24">
          <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
            <span className="text-rose-400 flex items-center gap-1">HP</span>
            <span className="text-slate-200">{combatant.hp}/{combatant.maxHp}</span>
          </div>
          <div className="w-full h-1.5 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
            <div 
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
              }`} 
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center bg-[#0a0d14] rounded-lg border border-[#2a3449] overflow-hidden focus-within:border-amber-500/50">
        <input 
          type="number" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Val" 
          className="w-10 bg-transparent text-xs font-mono font-bold text-center text-slate-200 outline-none p-1 appearance-none"
        />
        <button 
          onClick={() => handlePreciseHp(true)} 
          className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border-l border-[#2a3449] transition-colors cursor-pointer" 
          title="Causar Dano"
        >
          <Swords className="w-3 h-3" />
        </button>
        <button 
          onClick={() => handlePreciseHp(false)} 
          className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 border-l border-[#2a3449] transition-colors cursor-pointer" 
          title="Curar Vida"
        >
          <Heart className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
