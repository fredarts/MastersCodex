'use client';

import React from 'react';
import { Ruler, X, Check, Undo2, CheckCircle2 } from 'lucide-react';
import { RulerPoint, RulerSegment } from '../DysonCanvas';

export interface RulerSummary {
  totalSteps: number;
  totalFeet: number;
  totalMeters: number;
  activePoints: RulerPoint[];
  segments: RulerSegment[];
}

interface RulerHUDProps {
  selectedTool: string;
  rulerStatus: 'idle' | 'measuring' | 'completed';
  rulerPoints: RulerPoint[];
  rulerCursor: RulerPoint | null;
  getRulerSummary: (points: RulerPoint[], liveCursor: RulerPoint | null, isMeasuring: boolean) => RulerSummary;
  onExitRuler: () => void;
  onFinishRuler: () => void;
  onUndoRulerPoint: () => void;
  onResetRuler: () => void;
}

export const RulerHUD: React.FC<RulerHUDProps> = ({
  selectedTool,
  rulerStatus,
  rulerPoints,
  rulerCursor,
  getRulerSummary,
  onExitRuler,
  onFinishRuler,
  onUndoRulerPoint,
  onResetRuler,
}) => {
  if (selectedTool !== 'measure') return null;

  return (
    <div 
      onMouseDown={(e) => e.stopPropagation()} 
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="select-none pointer-events-auto"
    >
      {rulerStatus === 'idle' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl flex items-center gap-3 text-xs text-cyan-200 shadow-2xl animate-fade-in pointer-events-auto max-w-[90vw]">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Ruler className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col pr-1">
            <span className="font-semibold text-slate-100">Régua Tática Ortogonal (D&D 5e)</span>
            <span className="text-[11px] text-cyan-300/80">
              Medição estritamente ortogonal (sem diagonal). Arraste ou clique para traçar o caminho.
            </span>
          </div>
          <button
            type="button"
            onClick={onExitRuler}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            title="Fechar Régua e voltar às ferramentas (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {rulerStatus === 'measuring' && (() => {
        const summary = getRulerSummary(rulerPoints, rulerCursor, true);
        return (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl flex flex-wrap items-center gap-4 text-xs text-cyan-200 shadow-2xl animate-fade-in pointer-events-auto max-w-[92vw]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md shadow-cyan-500/30">
                <Ruler className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-white font-mono">
                    {summary.totalFeet}ft
                  </span>
                  <span className="text-[11px] text-cyan-300 font-mono">
                    ({summary.totalMeters}m)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{summary.totalSteps} casas</span>
                  <span>•</span>
                  <span>{summary.activePoints.length} pontos {summary.segments.length > 1 ? `(${summary.segments.length} curvas)` : ''}</span>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFinishRuler}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
                title="Confirmar fim da medição (ESC / Enter / Espaço / Duplo-clique)"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Concluir (ESC)</span>
              </button>
              
              {rulerPoints.length > 1 && (
                <button
                  type="button"
                  onClick={onUndoRulerPoint}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                  title="Desfazer último ponto (Backspace)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Desfazer</span>
                </button>
              )}

              <button
                type="button"
                onClick={onResetRuler}
                className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                title="Limpar medição"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>
          </div>
        );
      })()}

      {rulerStatus === 'completed' && (() => {
        const summary = getRulerSummary(rulerPoints, null, false);
        return (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[360px] max-w-[92vw] bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3.5 text-xs text-slate-200 shadow-2xl animate-fade-in pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-100 text-xs">Medição da Rota Concluída</span>
              </div>
              <button
                type="button"
                onClick={onExitRuler}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
                title="Fechar Régua e voltar (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-2 my-2.5">
              <div className="bg-[#0e1422] border border-cyan-500/20 rounded-xl p-2.5 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Distância Total</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-cyan-400 font-mono">{summary.totalFeet}ft</span>
                  <span className="text-[11px] text-cyan-300/70 font-mono">({summary.totalMeters}m)</span>
                </div>
              </div>
              <div className="bg-[#0e1422] border border-cyan-500/20 rounded-xl p-2.5 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Quadrados / Passos</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-amber-400 font-mono">{summary.totalSteps}</span>
                  <span className="text-[11px] text-slate-400 font-mono">casas</span>
                </div>
              </div>
            </div>

            {/* Segments Breakdown */}
            {summary.segments.length > 1 && (
              <div className="mb-2.5 max-h-28 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Detalhamento dos Segmentos:
                </span>
                {summary.segments.map((seg, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between text-[11px] bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/60 font-mono">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 text-[9px] flex items-center justify-center font-bold">
                        {sIdx + 1}
                      </span>
                      Segmento {sIdx + 1}
                    </span>
                    <span className="font-bold text-cyan-300">
                      +{seg.feet}ft ({seg.steps} casas)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onExitRuler}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                title="Fechar medição e voltar às ferramentas (ESC / Enter / OK)"
              >
                <Check className="w-4 h-4" />
                <span>OK / Fechar (ESC)</span>
              </button>
              <button
                type="button"
                onClick={onResetRuler}
                className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Iniciar nova medição"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Nova Medição</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
