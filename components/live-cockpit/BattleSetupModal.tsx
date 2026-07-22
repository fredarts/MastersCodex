'use client';

import React, { useState } from 'react';
import { Swords, Eye, ShieldAlert, Sparkles, X, Check } from 'lucide-react';

export type BattleSetupMode = 'normal' | 'player_ambush' | 'player_surprised';

interface BattleSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSetup: (mode: BattleSetupMode, timeOfDay: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => void;
}

export const BattleSetupModal: React.FC<BattleSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirmSetup,
}) => {
  const [selectedMode, setSelectedMode] = useState<BattleSetupMode>('normal');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'day' | 'sunset' | 'night' | 'fog' | 'storm'>('day');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmSetup(selectedMode, selectedTimeOfDay);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Swords className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-wide">
              Iniciar Batalha & Encontro
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha a dinâmica do combate para configurar o Grid 3D e as permissões de posicionamento dos jogadores.
            </p>
          </div>
        </div>

        {/* Seleção do Modo de Encontro */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Tipo de Encontro
          </label>

          {/* Opção 1: Encontro Normal */}
          <div
            onClick={() => setSelectedMode('normal')}
            className={`cursor-pointer flex items-start gap-4 p-4 rounded-xl border transition-all ${
              selectedMode === 'normal'
                ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
              <Swords className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Encontro Normal</span>
                {selectedMode === 'normal' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Posicionamento inicial equilibrado. Mestre e jogadores ajustam suas posições na área padrão do grid.
              </p>
            </div>
          </div>

          {/* Opção 2: Emboscada dos Jogadores */}
          <div
            onClick={() => setSelectedMode('player_ambush')}
            className={`cursor-pointer flex items-start gap-4 p-4 rounded-xl border transition-all ${
              selectedMode === 'player_ambush'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Emboscada dos Jogadores (Ataque Surpresa)</span>
                {selectedMode === 'player_ambush' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Os jogadores atacaram de surpresa! Uma zona verde será exibida no Grid 3D para que cada jogador escolha a posição inicial de seu personagem.
              </p>
            </div>
          </div>

          {/* Opção 3: Jogadores Surpreendidos */}
          <div
            onClick={() => setSelectedMode('player_surprised')}
            className={`cursor-pointer flex items-start gap-4 p-4 rounded-xl border transition-all ${
              selectedMode === 'player_surprised'
                ? 'bg-rose-500/10 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/10'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Jogadores Surpreendidos / Emboscados</span>
                {selectedMode === 'player_surprised' && <Check className="w-4 h-4 text-rose-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                O grupo foi pego desprotegido! O Mestre tem controle exclusivo sobre o posicionamento de todos no Grid 3D antes do início do combate.
              </p>
            </div>
          </div>
        </div>

        {/* Seleção de Hora do Dia / Iluminação */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Iluminação e Clima da Arena
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'day', label: 'Dia ☀️' },
              { id: 'sunset', label: 'Pôr do Sol 🌅' },
              { id: 'night', label: 'Noite 🌙' },
              { id: 'fog', label: 'Nevoeiro 🌫️' },
              { id: 'storm', label: 'Tempestade ⚡' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTimeOfDay(t.id as any)}
                className={`py-2 px-1 text-xs font-medium rounded-lg border text-center transition-all ${
                  selectedTimeOfDay === t.id
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Swords className="w-4 h-4" />
            Iniciar Fase de Posicionamento
          </button>
        </div>
      </div>
    </div>
  );
};
