'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';

interface NarratorTeleprompterPanelProps {
  onSlideChange: (index: number) => Promise<void>;
}

export const NarratorTeleprompterPanel: React.FC<NarratorTeleprompterPanelProps> = ({
  onSlideChange,
}) => {
  const { activeScene } = useSession();
  const { teleprompterFontSize, setTeleprompterFontSize } = useLiveCockpitStudioStore();

  const activeImageIndex = activeScene?.activeImageIndex ?? 0;

  return (
    <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden bg-[#0c0f17]">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Teleprompter do Narrador
          </span>

          {/* Font Size controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTeleprompterFontSize((prev) => Math.max(12, prev - 2))}
              className="w-6 h-6 rounded bg-[#161c28] border border-[#2a3449] hover:border-slate-500 text-xs font-bold text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              title="Diminuir Fonte"
            >
              A-
            </button>
            <span className="text-[10px] text-slate-400 font-bold font-mono">{teleprompterFontSize}px</span>
            <button
              onClick={() => setTeleprompterFontSize((prev) => Math.min(32, prev + 2))}
              className="w-6 h-6 rounded bg-[#161c28] border border-[#2a3449] hover:border-slate-500 text-xs font-bold text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              title="Aumentar Fonte"
            >
              A+
            </button>
          </div>
        </div>

        {/* Teleprompter text content */}
        {activeScene ? (
          <div
            className="font-serif leading-relaxed italic text-amber-200 select-text p-3 rounded-xl bg-[#121824]/40 border border-[#2a3449]/40 min-h-[120px] whitespace-pre-wrap"
            style={{ fontSize: `${teleprompterFontSize}px` }}
          >
            {(() => {
              const slideObj = activeScene.sceneImages?.[activeImageIndex];
              const targetText = slideObj
                ? slideObj.secretNotes || slideObj.overlayText || activeScene.sensoryText
                : activeScene.sensoryText;
              return targetText
                ? `"${targetText}"`
                : 'Nenhum texto sensorial ou nota de teleprompter configurada para este slide.';
            })()}
          </div>
        ) : (
          <div className="text-center p-6 text-slate-500 text-xs">
            Nenhuma cena ativa para exibir no teleprompter.
          </div>
        )}

        {/* Notes visible only to DM */}
        {activeScene?.secretNotes && (
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
            <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">
              🔑 Notas Secretas da Cena (Apenas Narrador)
            </div>
            <p className="text-xs text-purple-200 leading-relaxed font-serif">{activeScene.secretNotes}</p>
          </div>
        )}
      </div>

      {/* Bottom Quick slide switcher inside teleprompter */}
      {activeScene?.sceneImages && activeScene.sceneImages.length > 1 && (
        <div className="pt-3 border-t border-[#2a3449] flex items-center justify-between">
          <button
            onClick={async () => {
              const prevIdx =
                (activeImageIndex - 1 + activeScene.sceneImages!.length) % activeScene.sceneImages!.length;
              await onSlideChange(prevIdx);
            }}
            className="flex-1 py-1.5 mr-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-xs font-bold text-slate-200 rounded-lg text-center cursor-pointer"
          >
            ◀ Anterior
          </button>
          <span className="text-[10px] text-slate-400 font-mono px-3 font-semibold">
            {activeImageIndex + 1} / {activeScene.sceneImages.length}
          </span>
          <button
            onClick={async () => {
              const nextIdx = (activeImageIndex + 1) % activeScene.sceneImages!.length;
              await onSlideChange(nextIdx);
            }}
            className="flex-1 py-1.5 ml-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-xs font-bold text-slate-200 rounded-lg text-center cursor-pointer"
          >
            Próximo ▶
          </button>
        </div>
      )}
    </div>
  );
};
