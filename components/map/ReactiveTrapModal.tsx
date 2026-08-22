'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Check,
  Zap,
  Sparkles,
  Shield,
  Dices,
  Volume2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ReactiveTrapEffect, ReactiveTriggerType } from '@/lib/reactive/reactiveTypes';
import { TRAP_PRESETS } from '@/lib/reactive/trapPresets';
import { evaluateTokenStep } from '@/lib/reactive/reactiveSceneEngine';
import { toast } from 'sonner';

interface ReactiveTrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrap?: ReactiveTrapEffect;
  onSave: (trap: ReactiveTrapEffect) => void;
}

export const ReactiveTrapModal: React.FC<ReactiveTrapModalProps> = ({
  isOpen,
  onClose,
  initialTrap,
  onSave,
}) => {
  const [trap, setTrap] = useState<ReactiveTrapEffect>(
    initialTrap || {
      type: 'trap_damage',
      name: 'Fosso de Estacas Oculto',
      description: 'Estacas de ferro afiadas no fundo de um fosso.',
      detectDC: 13,
      disarmDC: 14,
      saveStat: 'dex',
      saveDC: 13,
      damageDice: '2d10',
      damageType: 'Perfurante',
      conditionApplied: 'Caído',
      revealedToPlayers: false,
      isArmed: true,
      oneShot: true,
      soundEffect: 'trap_spike',
    }
  );

  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (presetKey: string) => {
    const preset = TRAP_PRESETS[presetKey];
    if (preset) {
      setTrap({ ...preset });
      toast.info(`Preset "${preset.name}" aplicado!`);
    }
  };

  const handleSimulateStep = () => {
    const res = evaluateTokenStep({
      tokenName: 'Guerreiro Teste',
      passivePerception: 12,
      trap,
      forceStepEvenIfDetected: true,
    });
    setTestResult(res.message);
    toast.success('Simulação de disparo executada!');
  };

  const handleSave = () => {
    onSave(trap);
    toast.success(`Armadilha "${trap.name}" configurada no mapa!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-950 border border-rose-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Configurador de Armadilhas & Gatilhos
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  BG3 Style
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Defina perigos que disparam automaticamente quando tokens pisam na célula.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Escolher Modelo Pronto (Preset)
            </label>
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione uma armadilha clássica...
              </option>
              {Object.entries(TRAP_PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.name} ({p.damageDice !== '0' ? p.damageDice : p.type})
                </option>
              ))}
            </select>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nome do Perigo</label>
              <input
                type="text"
                value={trap.name}
                onChange={(e) => setTrap({ ...trap, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Tipo de Gatilho</label>
              <select
                value={trap.type}
                onChange={(e) => setTrap({ ...trap, type: e.target.value as ReactiveTriggerType })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
              >
                <option value="trap_damage">Dano / Salvaguarda</option>
                <option value="pressure_plate">Placa de Pressão (Mecânico)</option>
                <option value="surface_hazard">Terreno Difícil / Graxa</option>
              </select>
            </div>
          </div>

          {/* DCs & Stats */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">CD Detecção</label>
              <input
                type="number"
                value={trap.detectDC}
                onChange={(e) => setTrap({ ...trap, detectDC: parseInt(e.target.value, 10) || 10 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-amber-300 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">CD Desarmar</label>
              <input
                type="number"
                value={trap.disarmDC}
                onChange={(e) => setTrap({ ...trap, disarmDC: parseInt(e.target.value, 10) || 10 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-cyan-300 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">TR Atributo</label>
              <select
                value={trap.saveStat || 'dex'}
                onChange={(e) => setTrap({ ...trap, saveStat: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 text-center uppercase"
              >
                <option value="dex">DEX</option>
                <option value="con">CON</option>
                <option value="str">STR</option>
                <option value="wis">WIS</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">CD Salvaguarda</label>
              <input
                type="number"
                value={trap.saveDC || 13}
                onChange={(e) => setTrap({ ...trap, saveDC: parseInt(e.target.value, 10) || 13 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-rose-300 font-bold"
              />
            </div>
          </div>

          {/* Damage & Condition */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Dado de Dano</label>
              <input
                type="text"
                value={trap.damageDice || '2d10'}
                onChange={(e) => setTrap({ ...trap, damageDice: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                placeholder="2d10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Tipo de Dano</label>
              <input
                type="text"
                value={trap.damageType || 'Perfurante'}
                onChange={(e) => setTrap({ ...trap, damageType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                placeholder="Perfurante"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Condição Imposta</label>
              <input
                type="text"
                value={trap.conditionApplied || ''}
                onChange={(e) => setTrap({ ...trap, conditionApplied: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                placeholder="Caído, Envenenado..."
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTrap({ ...trap, isArmed: !trap.isArmed })}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                trap.isArmed
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {trap.isArmed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{trap.isArmed ? 'Armada' : 'Desarmada'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTrap({ ...trap, revealedToPlayers: !trap.revealedToPlayers })}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                trap.revealedToPlayers
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {trap.revealedToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{trap.revealedToPlayers ? 'Visível' : 'Oculta'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTrap({ ...trap, oneShot: !trap.oneShot })}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                trap.oneShot
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{trap.oneShot ? 'Único Uso' : 'Recorrente'}</span>
            </button>
          </div>

          {/* Test Trigger Simulation */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSimulateStep}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl font-bold transition-all"
            >
              <Dices className="w-4 h-4" />
              <span>Testar Simulação de Disparo</span>
            </button>
            {testResult && (
              <p className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 text-[11px] font-mono">
                {testResult}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/80 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white transition-all shadow-lg shadow-rose-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar no Grid</span>
          </button>
        </div>
      </div>
    </div>
  );
};
