'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@/context/SessionContext';
import { useCampaign } from '@/context/CampaignContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { DysonCanvas } from '@/components/map/DysonCanvas';
import { Combatant, GameScene } from '@/lib/types';
import { 
  Tv, 
  Maximize2, 
  RotateCw, 
  Compass, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Map, 
  Image as ImageIcon,
  ShieldAlert
} from 'lucide-react';

interface TvDisplayContainerProps {
  campaignId: string;
  initialRotation?: number; // 0, 90, 180, 270
  initialScale?: number;    // Multiplicador de escala do grid
  initialMode?: 'auto' | 'map' | 'scene' | 'combat';
}

export const TvDisplayContainer: React.FC<TvDisplayContainerProps> = ({
  campaignId,
  initialRotation = 0,
  initialScale = 1.0,
  initialMode = 'auto',
}) => {
  const { activeScene, campaignMaps, fetchSceneMap } = useSession();
  const { activeCampaign } = useCampaign();
  const { mapData: liveMapData, liveDisplayMode } = useLiveCockpit();

  const [rotation, setRotation] = useState<number>(initialRotation);
  const [scale, setScale] = useState<number>(initialScale);
  const [displayMode, setDisplayMode] = useState<'auto' | 'map' | 'scene' | 'combat'>(initialMode);
  const [isCalibratorOpen, setIsCalibratorOpen] = useState(false);
  const [sceneMapData, setSceneMapData] = useState<any | null>(null);

  // Carregar mapa da cena ativa
  useEffect(() => {
    if (!activeScene?.id) {
      setSceneMapData(null);
      return;
    }

    let isMounted = true;
    fetchSceneMap(activeScene.id).then((mapData) => {
      if (isMounted) {
        setSceneMapData(mapData);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeScene?.id, fetchSceneMap]);

  // Atalhos de Teclado (F: Fullscreen, R: Girar TV, C: Calibrar Grid)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation((prev) => (prev + 90) % 360);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCalibratorOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dados do mapa da cena (sincronizados em tempo real)
  const activeMapData = (liveMapData as any) || sceneMapData || null;
  const hasMap = Boolean(activeMapData?.grid && activeMapData.grid.length > 0);
  const hasImage = Boolean(activeScene?.imageUrl || (activeScene?.sceneImages && activeScene.sceneImages.length > 0));

  // Determinar o que renderizar
  const isShowingMap = displayMode === 'map' || (displayMode === 'auto' && (liveDisplayMode === 'map' || hasMap));

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-slate-100 relative select-none cursor-none group hover:cursor-default">
      {/* Botões Discretos de Controle no Hover Superior */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-amber-500/30 shadow-2xl">
        <button
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-amber-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Girar Orientação da TV (R)"
        >
          <RotateCw className="w-4 h-4" />
          <span>{rotation}°</span>
        </button>

        <button
          onClick={() => setIsCalibratorOpen((prev) => !prev)}
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            isCalibratorOpen ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 text-amber-400'
          }`}
          title="Calibrador Físico de Grid (C)"
        >
          <span>📏 25mm</span>
        </button>

        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-200 text-xs transition-colors cursor-pointer"
          title="Tela Cheia (F)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Régua de Calibração Física (1 Grid = 1 Polegada / 25.4mm) */}
      {isCalibratorOpen && (
        <div className="absolute top-16 right-3 z-50 bg-slate-950/95 border border-amber-500/50 p-4 rounded-2xl shadow-2xl w-80 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <h4 className="text-xs font-black uppercase text-amber-400 mb-1 flex items-center gap-1.5">
            <Compass className="w-4 h-4" /> Calibração Física para Miniaturas
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">
            Ajuste o controle deslizante até que o quadrado abaixo meça exatamente <strong>2.5 cm (1 polegada)</strong> na tela da sua TV usando uma régua real.
          </p>

          {/* Quadrado de Referência Física 25mm */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-3">
            <div 
              className="border-2 border-dashed border-amber-400 bg-amber-400/10 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 transition-all"
              style={{
                width: `${96 * scale}px`, // ~25.4mm em 96 DPI base
                height: `${96 * scale}px`,
              }}
            >
              1 INCH / 25mm
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Escala:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-amber-300">{Math.round(scale * 100)}%</span>
          </div>
        </div>
      )}

      {/* Área de Projeção Rotacionável e Escalável */}
      <div 
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          width: rotation === 90 || rotation === 270 ? '100vh' : '100vw',
          height: rotation === 90 || rotation === 270 ? '100vw' : '100vh',
        }}
      >
        {isShowingMap && activeMapData ? (
          <div className="w-full h-full relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <DysonCanvas
              key={`tv_${activeScene?.id}_${activeMapData.activeLevelId || 'lvl0'}`}
              grid={activeMapData.grid || []}
              bgImageUrl={activeMapData.bgImageUrl || null}
              gridScale={(activeMapData.gridScale || 40) * scale}
              gridOffsetX={activeMapData.gridOffsetX || 0}
              gridOffsetY={activeMapData.gridOffsetY || 0}
              combatants={activeScene?.combatants || []}
              vectorWalls={activeMapData.vectorWalls || []}
              lightSources={activeMapData.lightSources || []}
              selectedTool="pan"
              selectedTileType="floor"
              selectedTokenCombatant={null}
              onGridChange={() => {}}
              isPlayerView={true}
              renderFog={true}
              renderLighting={true}
              renderVision={true}
            />
          </div>
        ) : hasImage ? (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            <img
              src={activeScene?.imageUrl || (activeScene?.sceneImages && activeScene.sceneImages[0]?.imageUrl) || ''}
              alt={activeScene?.title || 'Cena Narrativa'}
              className="w-full h-full object-contain filter drop-shadow-2xl animate-in fade-in zoom-in-95 duration-500"
            />
            {/* Banner Atmosférico Inferior */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-8 text-center pointer-events-none">
              <h2 className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-lg tracking-wide uppercase font-serif">
                {activeScene?.title || activeCampaign?.title || 'Masters Codex'}
              </h2>
              {activeScene?.sensoryText && (
                <p className="text-sm text-slate-300 max-w-2xl mx-auto mt-2 italic drop-shadow line-clamp-2">
                  "{activeScene.sensoryText}"
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Tv className="w-16 h-16 text-amber-500/40 mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-300">Modo TV / Mesa Presencial Ativo</h2>
            <p className="text-xs text-slate-500 max-w-md mt-2">
              Selecione uma cena com mapa ou arte conceitual no Live Cockpit do Mestre para projetar automaticamente nesta tela.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
