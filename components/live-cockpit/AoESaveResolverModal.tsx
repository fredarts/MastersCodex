'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { getSpellAoEDefinition, AbilityKey } from '@/lib/dnd5e-spells-shapes';
import { calculateEffectiveDamage } from '@/lib/dnd5e-damage-resolver';
import { rollDiceFormula } from '@/lib/dnd5e-dice';
import { 
  Dices, 
  Flame, 
  ShieldCheck, 
  ShieldX, 
  Check, 
  X, 
  Sparkles, 
  Heart, 
  Zap, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface TargetSaveRow {
  combatantId: string;
  name: string;
  avatarUrl?: string;
  type: 'player' | 'monster' | 'npc';
  currentHp: number;
  maxHp: number;
  saveBonus: number;
  advantageState: 'normal' | 'advantage' | 'disadvantage';
  d20Roll: number | null;
  totalSave: number | null;
  isSuccess: boolean | null;
  customDamageOverride?: number;
  hasEvasion?: boolean;
}

export const AoESaveResolverModal: React.FC = () => {
  const {
    isAoESaveModalOpen,
    setIsAoESaveModalOpen,
    activeSpellTargeting,
    setActiveSpellTargeting,
    casterTokenKey,
    setCasterTokenKey,
    setSpellTargetPosition,
    combatants,
    detectedAoETargets,
    triggerDamageWithConcentrationCheck,
    updateCombatantState,
    broadcastCombatLogEntry,
    roundCount,
  } = useLiveCockpit();

  const spellInfo = useMemo(() => {
    return getSpellAoEDefinition(activeSpellTargeting?.name || '');
  }, [activeSpellTargeting]);

  const [dc, setDc] = useState<number>(15);
  const [damageFormula, setDamageFormula] = useState<string>('8d6');
  const [rolledDamage, setRolledDamage] = useState<number | null>(null);
  const [damageType, setDamageType] = useState<string>('Fogo');
  const [saveHalves, setSaveHalves] = useState<boolean>(true);
  const [saveAbility, setSaveAbility] = useState<AbilityKey>('DEX');

  // Inicializar alvos a partir dos detectedAoETargets
  const [targetRows, setTargetRows] = useState<TargetSaveRow[]>([]);

  useEffect(() => {
    if (!isAoESaveModalOpen) return;

    if (spellInfo) {
      setDamageFormula(spellInfo.damageFormula || '8d6');
      setDamageType(spellInfo.damageType || 'Fogo');
      setSaveHalves(spellInfo.saveHalves !== false);
      if (spellInfo.saveAbility) {
        setSaveAbility(spellInfo.saveAbility);
      }
    }

    // Identificar bônus de save para cada alvo detectado
    const rows: TargetSaveRow[] = detectedAoETargets
      .map((id) => {
        const c = combatants.find((combatant) => combatant.id === id);
        if (!c) return null;

        // Buscar modificador do atributo (ex: DEX Save)
        const abilityKey = (spellInfo?.saveAbility || 'DEX').toLowerCase() as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
        let bonus = 0;
        
        if (c.savingThrowBonuses && c.savingThrowBonuses[spellInfo?.saveAbility || 'DEX'] !== undefined) {
          bonus = c.savingThrowBonuses[spellInfo?.saveAbility || 'DEX']!;
        } else if (c[abilityKey] !== undefined) {
          bonus = Math.floor((c[abilityKey]! - 10) / 2);
        }

        return {
          combatantId: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl || c.tokenImageUrl,
          type: c.type,
          currentHp: c.hp,
          maxHp: c.maxHp,
          saveBonus: bonus,
          advantageState: 'normal',
          d20Roll: null,
          totalSave: null,
          isSuccess: null,
          hasEvasion: false,
        };
      })
      .filter(Boolean) as TargetSaveRow[];

    setTargetRows(rows);
  }, [isAoESaveModalOpen, detectedAoETargets, combatants, spellInfo]);

  if (!isAoESaveModalOpen) return null;

  const handleRollDamage = () => {
    try {
      const rollRes = rollDiceFormula(damageFormula);
      setRolledDamage(rollRes.total);
      toast.success(`Dano Rolado: ${rollRes.total} (${damageFormula})`);
    } catch {
      toast.error('Fórmula de dano inválida. Use ex: 8d6 ou 3d8+4');
    }
  };

  const rollIndividualSave = (combatantId: string) => {
    setTargetRows((prev) =>
      prev.map((row) => {
        if (row.combatantId !== combatantId) return row;

        const d1 = Math.floor(Math.random() * 20) + 1;
        const d2 = Math.floor(Math.random() * 20) + 1;
        let chosenD20 = d1;
        if (row.advantageState === 'advantage') chosenD20 = Math.max(d1, d2);
        if (row.advantageState === 'disadvantage') chosenD20 = Math.min(d1, d2);

        const total = chosenD20 + row.saveBonus;
        const isSuccess = total >= dc;

        return {
          ...row,
          d20Roll: chosenD20,
          totalSave: total,
          isSuccess,
        };
      })
    );
  };

  const handleRollAllSaves = () => {
    setTargetRows((prev) =>
      prev.map((row) => {
        const d1 = Math.floor(Math.random() * 20) + 1;
        const d2 = Math.floor(Math.random() * 20) + 1;
        let chosenD20 = d1;
        if (row.advantageState === 'advantage') chosenD20 = Math.max(d1, d2);
        if (row.advantageState === 'disadvantage') chosenD20 = Math.min(d1, d2);

        const total = chosenD20 + row.saveBonus;
        const isSuccess = total >= dc;

        return {
          ...row,
          d20Roll: chosenD20,
          totalSave: total,
          isSuccess,
        };
      })
    );
    toast.info('Todos os testes de salvaguarda foram rolados!');
  };

  const calculateFinalDamageForTarget = (row: TargetSaveRow): number => {
    if (row.customDamageOverride !== undefined) return row.customDamageOverride;
    const base = rolledDamage !== null ? rolledDamage : 0;
    if (base === 0) return 0;

    let damage = base;
    if (row.isSuccess) {
      if (row.hasEvasion) damage = 0;
      else if (saveHalves) damage = Math.floor(base / 2);
      else damage = 0;
    } else {
      if (row.hasEvasion) damage = Math.floor(base / 2);
    }

    // Verificar Resistências / Imunidades do Combatente
    const targetCombatant = combatants.find((c) => c.id === row.combatantId);
    if (targetCombatant) {
      const res = calculateEffectiveDamage({
        rawDamage: damage,
        damageType,
        target: targetCombatant,
      });
      damage = res.effectiveDamage;
    }

    return Math.max(0, damage);
  };

  const handleApplyDamageAll = () => {
    if (rolledDamage === null && targetRows.length > 0) {
      toast.error('Role o dano antes de aplicar!');
      return;
    }

    const appliedSummary: string[] = [];

    targetRows.forEach((row) => {
      const finalDmg = calculateFinalDamageForTarget(row);
      triggerDamageWithConcentrationCheck(row.combatantId, finalDmg, damageType);
      appliedSummary.push(`${row.name}: -${finalDmg} PV (${row.isSuccess ? 'Passou' : 'Falhou'})`);
    });

    // Se a magia exigir concentração, marcar o conjurador
    if (spellInfo?.requiresConcentration && casterTokenKey) {
      const caster = combatants.find((c) => c.id === casterTokenKey || c.name === casterTokenKey);
      if (caster) {
        updateCombatantState(caster.id, {
          isConcentrating: true,
          concentrationSpell: activeSpellTargeting.name,
        });
        toast.info(`✨ ${caster.name} agora está concentrando em ${activeSpellTargeting.name}!`);
      }
    }

    // Log de Combate
    broadcastCombatLogEntry({
      id: `aoe-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      round: roundCount,
      actorId: casterTokenKey || 'caster-aoe',
      actorName: casterTokenKey || 'Conjurador',
      eventType: 'attack',
      description: `💥 [AoE] ${activeSpellTargeting.name} (CD ${dc} ${saveAbility}) causando ${rolledDamage} de dano de ${damageType}. Resultados:\n${appliedSummary.join('\n')}`,
    });

    toast.success(`Dano em área aplicado a ${targetRows.length} alvos com sucesso!`);
    setIsAoESaveModalOpen(false);
    setActiveSpellTargeting(null);
    setCasterTokenKey(null);
    setSpellTargetPosition(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f141d] border border-amber-500/40 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Resolução de Magia em Área</span>
                <span className="text-amber-400 font-mono text-sm">[{activeSpellTargeting.name}]</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {targetRows.length} {targetRows.length === 1 ? 'alvo capturado' : 'alvos capturados'} na área de efeito
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAoESaveModalOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configurações da Magia & Rolagem de Dano */}
        <div className="p-5 bg-slate-900/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          {/* CD do Save */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              CD de Salvaguarda ({saveAbility})
            </label>
            <input
              type="number"
              value={dc}
              onChange={(e) => setDc(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Fórmula de Dano */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Fórmula de Dano
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={damageFormula}
                onChange={(e) => setDamageFormula(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-200 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleRollDamage}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow"
                title="Rolar Dados de Dano"
              >
                <Dices className="w-4 h-4" />
                <span>Rolar</span>
              </button>
            </div>
          </div>

          {/* Dano Total Rolado */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Dano Base ({damageType})
            </label>
            <input
              type="number"
              placeholder="Ex: 28"
              value={rolledDamage !== null ? rolledDamage : ''}
              onChange={(e) => setRolledDamage(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-base font-extrabold text-amber-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Botão Rolar Todos os Saves */}
          <div>
            <button
              onClick={handleRollAllSaves}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Rolar Todos os Saves</span>
            </button>
          </div>
        </div>

        {/* Lista de Alvos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {targetRows.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-mono text-sm">
              Nenhum combatente detectado dentro da área do template.
            </div>
          ) : (
            targetRows.map((row) => {
              const finalDamage = calculateFinalDamageForTarget(row);
              const resultingHp = Math.max(0, row.currentHp - finalDamage);

              return (
                <div
                  key={row.combatantId}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  {/* Combatente Info */}
                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {row.avatarUrl ? (
                        <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{row.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{row.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-mono">
                          <Heart className="w-3 h-3" /> {row.currentHp}/{row.maxHp}
                        </span>
                        <span className="font-mono text-slate-400">Mod: {row.saveBonus >= 0 ? `+${row.saveBonus}` : row.saveBonus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vantagem / Desvantagem */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() =>
                        setTargetRows((prev) =>
                          prev.map((r) =>
                            r.combatantId === row.combatantId
                              ? { ...r, advantageState: r.advantageState === 'advantage' ? 'normal' : 'advantage' }
                              : r
                          )
                        )
                      }
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        row.advantageState === 'advantage' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      VANT
                    </button>
                    <button
                      onClick={() =>
                        setTargetRows((prev) =>
                          prev.map((r) =>
                            r.combatantId === row.combatantId
                              ? { ...r, advantageState: r.advantageState === 'disadvantage' ? 'normal' : 'disadvantage' }
                              : r
                          )
                        )
                      }
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        row.advantageState === 'disadvantage' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      DESV
                    </button>
                  </div>

                  {/* Resultado do Teste */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => rollIndividualSave(row.combatantId)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-400" />
                      <span>{row.d20Roll !== null ? `d20: ${row.d20Roll}` : 'Rolar'}</span>
                    </button>

                    {row.totalSave !== null ? (
                      <div
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                          row.isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {row.isSuccess ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
                        <span>Total: {row.totalSave} ({row.isSuccess ? 'Passou' : 'Falhou'})</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Pendente</span>
                    )}
                  </div>

                  {/* Dano Final Calculado */}
                  <div className="text-right min-w-[120px]">
                    <div className="text-xs font-bold text-rose-400 font-mono">
                      -{finalDamage} PV
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      PV Final: <span className={resultingHp === 0 ? 'text-rose-500 font-bold' : 'text-slate-300'}>{resultingHp}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer com Ações */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setIsAoESaveModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleApplyDamageAll}
            disabled={targetRows.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            <span>Aplicar Dano a Todos ({targetRows.length} Alvos)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
