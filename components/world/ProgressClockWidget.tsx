'use client';

import React from 'react';
import { ProgressClock } from '@/lib/types';
import { 
  Skull, 
  Flame, 
  Sparkles, 
  ShieldAlert, 
  Footprints, 
  CheckCircle2, 
  Lock, 
  Eye, 
  Plus, 
  Minus,
  Crown
} from 'lucide-react';

interface ProgressClockWidgetProps {
  clock: ProgressClock;
  onUpdate?: (updated: ProgressClock) => void;
  onDelete?: (id: string) => void;
  isInteractive?: boolean;
  size?: number; // Tamanho em pixels (default: 120)
}

function getCategoryTheme(category: ProgressClock['category']) {
  switch (category) {
    case 'danger':
      return { label: 'Perigo / Ameaça', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, defaultColor: '#f43f5e' };
    case 'stealth':
      return { label: 'Furtividade / Alarme', icon: <Footprints className="w-3.5 h-3.5 text-purple-400" />, defaultColor: '#a855f7' };
    case 'ritual':
      return { label: 'Ritual / Magia', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, defaultColor: '#06b6d4' };
    case 'faction':
      return { label: 'Facção / Poder', icon: <Crown className="w-3.5 h-3.5 text-amber-400" />, defaultColor: '#f59e0b' };
    case 'quest':
      return { label: 'Missão / Progresso', icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />, defaultColor: '#10b981' };
    default:
      return { label: 'Geral', icon: <Skull className="w-3.5 h-3.5 text-slate-300" />, defaultColor: '#e2e8f0' };
  }
}

/**
 * Converte ângulo em coordenadas polares (graus -> X, Y)
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Gera caminho SVG de uma fatia de torta (Pie Slice)
 */
function describeArcSlice(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

export const ProgressClockWidget: React.FC<ProgressClockWidgetProps> = ({
  clock,
  onUpdate,
  onDelete,
  isInteractive = true,
  size = 130,
}) => {
  const { totalSegments, filledSegments, title, description, category, colorHex, isPublic } = clock;
  const theme = getCategoryTheme(category);
  const baseColor = colorHex || theme.defaultColor;
  const isCompleted = filledSegments >= totalSegments;

  const center = size / 2;
  const radius = center - 8;
  const sliceAngle = 360 / totalSegments;

  const handleSliceClick = (index: number) => {
    if (!isInteractive || !onUpdate) return;
    const newFilled = index + 1 === filledSegments ? index : index + 1;
    onUpdate({
      ...clock,
      filledSegments: Math.max(0, Math.min(totalSegments, newFilled)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleIncrement = () => {
    if (!isInteractive || !onUpdate || filledSegments >= totalSegments) return;
    onUpdate({
      ...clock,
      filledSegments: filledSegments + 1,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDecrement = () => {
    if (!isInteractive || !onUpdate || filledSegments <= 0) return;
    onUpdate({
      ...clock,
      filledSegments: filledSegments - 1,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-[#0f1420] border border-[#222c3e] hover:border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col items-center gap-3 transition-all relative group">
      {/* Header com Categoria e Visibilidade */}
      <div className="w-full flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: baseColor }}>
          {theme.icon}
          {theme.label}
        </span>
        <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          {isPublic ? <Eye className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
          {isPublic ? 'Público' : 'Secreto'}
        </span>
      </div>

      {/* Relógio Circular SVG */}
      <div className="relative cursor-pointer select-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Fundo do Relógio */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="3"
          />

          {/* Fatias Segmentadas */}
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isFilled = i < filledSegments;
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;
            const pathData = describeArcSlice(center, center, radius - 2, startAngle, endAngle);

            return (
              <path
                key={i}
                d={pathData}
                fill={isFilled ? baseColor : '#101623'}
                fillOpacity={isFilled ? (isCompleted ? 1 : 0.85) : 0.4}
                stroke="#0f1420"
                strokeWidth="2.5"
                onClick={() => handleSliceClick(i)}
                className={`transition-all duration-200 ${
                  isInteractive ? 'hover:opacity-90 hover:brightness-125' : ''
                }`}
                style={{
                  filter: isFilled ? `drop-shadow(0 0 ${isCompleted ? '6px' : '2px'} ${baseColor}80)` : 'none',
                }}
              />
            );
          })}

          {/* Anel Externo Estilizado */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isCompleted ? baseColor : '#334155'}
            strokeWidth={isCompleted ? '3' : '2'}
            className={isCompleted ? 'animate-pulse' : ''}
          />
          {/* Marcador Central */}
          <circle
            cx={center}
            cy={center}
            r="4"
            fill={isCompleted ? baseColor : '#475569'}
          />
        </svg>

        {/* Badge Flutuante Central de Progresso */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[11px] font-mono font-black text-slate-100 bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-slate-700/60 shadow-lg">
            {filledSegments}/{totalSegments}
          </span>
        </div>
      </div>

      {/* Título & Descrição */}
      <div className="text-center w-full min-w-0">
        <h4 className="text-sm font-bold text-slate-100 truncate" title={title}>
          {title}
        </h4>
        {description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5" title={description}>
            {description}
          </p>
        )}
      </div>

      {/* Status de Conclusão ou Controles Rápidos (+ / -) */}
      {isCompleted ? (
        <div className="w-full py-1 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-400 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>{clock.completedMessage || 'Relógio Disparado!'}</span>
        </div>
      ) : isInteractive ? (
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={filledSegments <= 0}
            className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={filledSegments >= totalSegments}
            className="flex-1 py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Avançar
          </button>
        </div>
      ) : null}
    </div>
  );
};
