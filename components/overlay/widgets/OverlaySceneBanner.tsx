'use client';

import React from 'react';
import { OverlaySceneState } from '@/lib/overlay/overlayStateReducer';
import { Compass, CloudRain, CloudFog, Moon, Sun, Sunset } from 'lucide-react';

interface OverlaySceneBannerProps {
  scene: OverlaySceneState;
  theme?: string;
}

export const OverlaySceneBanner: React.FC<OverlaySceneBannerProps> = ({ scene, theme = 'obsidian' }) => {
  if (!scene || !scene.title) return null;

  const renderWeatherIcon = () => {
    if (scene.hasRain) return <span title="Chuva"><CloudRain className="w-3.5 h-3.5 text-cyan-400" /></span>;
    if (scene.hasFog) return <span title="Névoa"><CloudFog className="w-3.5 h-3.5 text-slate-300" /></span>;
    if (scene.timeOfDay === 'night') return <span title="Noite"><Moon className="w-3.5 h-3.5 text-indigo-300" /></span>;
    if (scene.timeOfDay === 'sunset') return <span title="Pôr do Sol"><Sunset className="w-3.5 h-3.5 text-amber-500" /></span>;
    return <span title="Dia"><Sun className="w-3.5 h-3.5 text-amber-400" /></span>;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-amber-500/30 shadow-[0_0_25px_rgba(0,0,0,0.8)] max-w-lg transition-all duration-500 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
        <Compass className="w-4 h-4" />
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-300 truncate tracking-wide uppercase font-serif">
            {scene.title}
          </span>
          <div className="flex items-center gap-1 bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-slate-800">
            {renderWeatherIcon()}
          </div>
        </div>

        {scene.sensoryText && (
          <p className="text-[11px] text-slate-300 line-clamp-1 italic text-ellipsis mt-0.5">
            "{scene.sensoryText}"
          </p>
        )}
      </div>
    </div>
  );
};
