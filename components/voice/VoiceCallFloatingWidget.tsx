'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Mic, 
  MicOff, 
  Video,
  VideoOff,
  Headphones, 
  PhoneOff, 
  Settings, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Radio, 
  Crown,
  LayoutGrid,
  List,
  GripHorizontal,
  RotateCcw
} from 'lucide-react';
import { useVoiceCall, VoiceParticipantState } from '@/context/VoiceCallContext';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface VideoTileProps {
  participant: VoiceParticipantState;
  isLocalUser: boolean;
  volume: number;
  onVolumeChange?: (vol: number) => void;
}

const ParticipantVideoTile: React.FC<VideoTileProps> = ({
  participant,
  isLocalUser,
  volume,
  onVolumeChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.isVideoEnabled]);

  const hasActiveVideo = participant.isVideoEnabled && !!participant.stream;

  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden border bg-[#0a0d14] flex items-center justify-center transition-all ${
        participant.isSpeaking
          ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-950/50'
          : 'border-[#2a3449] hover:border-slate-600'
      }`}
    >
      {/* Elemento de Vídeo */}
      {hasActiveVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
          className={`w-full h-full object-cover ${isLocalUser ? '-scale-x-100' : ''}`}
        />
      ) : (
        /* Fallback: Avatar / Iniciais quando a webcam está desligada */
        <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center select-none">
          <div className="relative">
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.displayName}
                className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                  participant.isSpeaking
                    ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105'
                    : 'border-[#2a3449]'
                }`}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  participant.role === 'dm'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-[#2a3449]'
                } ${participant.isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105' : ''}`}
              >
                {participant.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {participant.role === 'dm' && (
              <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1 drop-shadow" />
            )}
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <VideoOff className="w-3 h-3 opacity-60" /> Sem Vídeo
          </span>
        </div>
      )}

      {/* Overlay Superior: Indicador de Fala */}
      {participant.isSpeaking && (
        <div className="absolute top-1.5 left-1.5 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 px-1.5 py-0.5 rounded text-[9px] text-emerald-300 font-medium flex items-center gap-1">
          <Radio className="w-2.5 h-2.5 animate-pulse" />
          <span>Falando</span>
        </div>
      )}

      {/* Overlay Inferior: Nome e Badges */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 pt-4 flex items-center justify-between text-slate-200">
        <div className="flex items-center gap-1 min-w-0 pr-1">
          {participant.role === 'dm' && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
          <span className="font-semibold text-[11px] truncate">{participant.displayName}</span>
          {isLocalUser && <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">(Você)</span>}
        </div>

        {/* Badges de Mic e Volume */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {participant.isMuted && (
            <span className="p-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30" title="Microfone Mutado">
              <MicOff className="w-2.5 h-2.5" />
            </span>
          )}

          {!isLocalUser && onVolumeChange && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVolumeSlider(!showVolumeSlider);
                }}
                className={`p-1 rounded bg-black/50 hover:bg-[#1e2738] transition-colors cursor-pointer ${
                  volume === 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
                title={`Volume: ${Math.round(volume * 100)}%`}
              >
                {volume === 0 ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
              </button>

              {showVolumeSlider && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 bottom-full mb-1.5 bg-[#161c28] border border-[#2a3449] p-2 rounded-xl shadow-xl z-50 flex items-center gap-2 w-32"
                >
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-[#2a3449] rounded cursor-pointer"
                  />
                  <span className="font-mono text-[9px] text-amber-400 min-w-[24px] text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DRAG_STORAGE_KEY = 'masters_codex_voice_widget_position_v1';

export const VoiceCallFloatingWidget: React.FC = () => {
  const {
    isInCall,
    isConnecting,
    isMuted,
    isDeafened,
    isSpeaking,
    isVideoEnabled,
    inputMode,
    pttKey,
    isPttPressed,
    participants,
    connectedPeersCount,
    isWidgetOpen,
    setIsWidgetOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    joinCall,
    leaveCall,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    videoLayout,
    setVideoLayout,
    setParticipantVolume,
  } = useVoiceCall();

  const [activeVolumeUserId, setActiveVolumeUserId] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Função para garantir que o widget fique 100% visível e contido dentro da viewport
  const clampPosition = useCallback((targetX: number, targetY: number) => {
    if (typeof window === 'undefined') return { x: targetX, y: targetY };
    const widgetEl = widgetRef.current;
    const width = widgetEl ? widgetEl.offsetWidth : (videoLayout === 'grid' ? 420 : 360);
    const height = widgetEl ? widgetEl.offsetHeight : 280;
    const padding = 12;

    const minX = padding;
    const maxX = Math.max(minX, window.innerWidth - width - padding);
    const minY = padding;
    const maxY = Math.max(minY, window.innerHeight - height - padding);

    return {
      x: Math.max(minX, Math.min(maxX, targetX)),
      y: Math.max(minY, Math.min(maxY, targetY)),
    };
  }, [videoLayout]);

  // 1. Carregar posição salva ou definir posição padrão garantida no canto inferior direito
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(DRAG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clamped = clampPosition(parsed.x, parsed.y);
          setPosition(clamped);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar posição do widget:', e);
    }

    // Posição padrão segura inicial
    const width = videoLayout === 'grid' ? 420 : 360;
    const height = 280;
    const defaultX = Math.max(12, window.innerWidth - width - 24);
    const defaultY = Math.max(12, window.innerHeight - height - 24);
    setPosition(clampPosition(defaultX, defaultY));
  }, [clampPosition, videoLayout]);

  // Re-ajustar posição automaticamente ao redimensionar a janela ou rotacionar tablet
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return clampPosition(prev.x, prev.y);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Re-ajustar posição quando expandir/minimizar ou alternar layout de vídeo
  useEffect(() => {
    setPosition((prev) => {
      if (!prev) return null;
      return clampPosition(prev.x, prev.y);
    });
  }, [isWidgetOpen, videoLayout, clampPosition]);

  // 2. Manipuladores de Arraste (Suporte completo a Mouse, Touch Screen e Tablets via Pointer Events)
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number; hasMoved: boolean }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
    hasMoved: false,
  });

  const handleDragStart = (e: React.PointerEvent) => {
    // Ignorar cliques diretos em botões, links, sliders ou inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
      return;
    }

    if (!position) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: position.x,
      startY: position.y,
      hasMoved: false,
    };

    // Capturar o ponteiro no elemento alvo se suportado
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.hasMoved = true;
      }

      const targetX = dragStartRef.current.startX + dx;
      const targetY = dragStartRef.current.startY + dy;
      const clamped = clampPosition(targetX, targetY);

      setPosition(clamped);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (position) {
        try {
          localStorage.setItem(DRAG_STORAGE_KEY, JSON.stringify(position));
        } catch (e) {}
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, position, clampPosition]);

  const resetPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = videoLayout === 'grid' ? 420 : 360;
    const height = isWidgetOpen ? 280 : 48;
    const defaultX = Math.max(12, window.innerWidth - width - 24);
    const defaultY = Math.max(12, window.innerHeight - height - 24);
    const clamped = clampPosition(defaultX, defaultY);
    setPosition(clamped);
    try {
      localStorage.setItem(DRAG_STORAGE_KEY, JSON.stringify(clamped));
    } catch (e) {}
  }, [videoLayout, isWidgetOpen, clampPosition]);

  if (!isInCall && !isConnecting) {
    return null;
  }

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const widgetStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999999,
      }
    : {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999999,
      };

  return createPortal(
    <>
      <div
        ref={widgetRef}
        style={widgetStyle}
        className="select-none animate-slide-up flex flex-col items-end gap-2"
      >
        {/* Floating Expanded Box */}
        {isWidgetOpen ? (
          <div
            className={`bg-[#0d121c]/95 backdrop-blur-md border border-[#2a3449] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all text-slate-200 ${
              isDragging ? 'opacity-90 ring-2 ring-amber-500/50 shadow-amber-950/50 cursor-grabbing' : ''
            } ${videoLayout === 'grid' ? 'w-[360px] sm:w-[420px]' : 'w-[340px] sm:w-[360px]'}`}
          >
            {/* Header da Chamada com Handle de Arraste (Touch / Mouse / Pointer) */}
            <div
              onPointerDown={handleDragStart}
              style={{ touchAction: 'none' }}
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#141b28] border-b border-[#2a3449] cursor-grab active:cursor-grabbing group select-none"
              title="Clique ou toque e arraste para mover o painel na tela"
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <GripHorizontal className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-xs text-slate-100 tracking-wide truncate">
                  {videoLayout === 'grid' ? 'Sessão com Vídeo' : 'Voz Conectada'}
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {participants.length} {participants.length === 1 ? 'membro' : 'membros'}
                </span>
              </div>

              {/* Botões de Controle do Header */}
              <div className="flex items-center gap-1">
                {/* Resetar Posição */}
                <button
                  onClick={resetPosition}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-[#1e2738] transition-colors cursor-pointer"
                  title="Redefinir Posição Padrão (Canto Inferior Direito)"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

                {/* Alternador de Layout (Lista vs Grid de Vídeo) */}
                <button
                  onClick={() => setVideoLayout(videoLayout === 'grid' ? 'compact' : 'grid')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    videoLayout === 'grid'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2738]'
                  }`}
                  title={videoLayout === 'grid' ? 'Alternar para Modo Lista' : 'Alternar para Grid de Webcams'}
                >
                  {videoLayout === 'grid' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                </button>

                {/* Minimizar */}
                <button
                  onClick={() => setIsWidgetOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e2738] transition-colors cursor-pointer"
                  title="Minimizar Widget"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo Principal: Modo Grid de Vídeo vs Modo Lista Compacta */}
            {videoLayout === 'grid' ? (
              /* Grid de Webcams */
              <div className="p-2.5 max-h-[360px] overflow-y-auto custom-scrollbar">
                <div
                  className={`grid gap-2 ${
                    participants.length === 1
                      ? 'grid-cols-1'
                      : participants.length <= 4
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {participants.map((p) => {
                    const isLocalUser = p.userId.includes('local') || p.displayName.includes('(Você)');
                    return (
                      <ParticipantVideoTile
                        key={p.userId}
                        participant={p}
                        isLocalUser={isLocalUser}
                        volume={p.volume}
                        onVolumeChange={!isLocalUser ? (vol) => setParticipantVolume(p.userId, vol) : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Lista de Participantes */
              <div className="p-2 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                {participants.map((p) => {
                  const isLocalUser = p.userId.includes('local') || p.displayName.includes('(Você)');
                  return (
                    <div
                      key={p.userId}
                      className={`flex items-center justify-between p-1.5 rounded-xl border transition-all ${
                        p.isSpeaking
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                          : 'bg-[#121824]/60 border-transparent hover:border-[#2a3449]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar com Anel de Fala */}
                        <div className="relative flex-shrink-0">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.displayName}
                              className={`w-7 h-7 rounded-full object-cover border-2 transition-all ${
                                p.isSpeaking
                                  ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105'
                                  : 'border-[#2a3449]'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border-2 transition-all ${
                                p.role === 'dm'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-800 text-slate-300 border-[#2a3449]'
                              } ${p.isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105' : ''}`}
                            >
                              {p.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {p.role === 'dm' && (
                            <Crown className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 drop-shadow" />
                          )}
                        </div>

                        {/* Nome do Participante */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-slate-200 truncate">{p.displayName}</span>
                            {isLocalUser && (
                              <span className="text-[9px] text-slate-400 font-mono">(Você)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {p.isSpeaking ? (
                              <span className="text-emerald-400 font-medium animate-pulse flex items-center gap-0.5">
                                <Radio className="w-2.5 h-2.5" /> Falando...
                              </span>
                            ) : p.isMuted ? (
                              <span className="text-rose-400">Mutado</span>
                            ) : (
                              <span className="text-slate-500">Conectado</span>
                            )}

                            {p.isVideoEnabled && (
                              <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-0.5">
                                <Video className="w-2.5 h-2.5" /> Câmera On
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controle de Volume por Peer */}
                      {!isLocalUser && (
                        <div className="relative flex items-center">
                          <button
                            onClick={() => setActiveVolumeUserId(activeVolumeUserId === p.userId ? null : p.userId)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.volume === 0
                                ? 'text-rose-400 hover:bg-rose-500/10'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2738]'
                            }`}
                            title={`Ajustar Volume de ${p.displayName} (${Math.round(p.volume * 100)}%)`}
                          >
                            {p.volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Popover Slider de Volume */}
                          {activeVolumeUserId === p.userId && (
                            <div className="absolute right-0 bottom-full mb-1 bg-[#161c28] border border-[#2a3449] p-2 rounded-xl shadow-xl z-50 flex items-center gap-2 w-36">
                              <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.05"
                                value={p.volume}
                                onChange={(e) => setParticipantVolume(p.userId, parseFloat(e.target.value))}
                                className="w-full accent-amber-500 h-1 bg-[#2a3449] rounded cursor-pointer"
                              />
                              <span className="font-mono text-[10px] text-amber-400 min-w-[28px] text-right">
                                {Math.round(p.volume * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dica PTT */}
            {inputMode === 'ptt' && (
              <div className="px-3 py-1.5 bg-[#121824] border-t border-[#1e2738] text-[10px] flex items-center justify-between text-slate-400">
                <span>Modo Push-to-Talk:</span>
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] ${
                  isPttPressed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-[#1e2738] text-amber-400'
                }`}>
                  {isPttPressed ? 'FALANDO' : `[${pttKey}]`}
                </span>
              </div>
            )}

            {/* Barra de Ações Inferiores */}
            <div className="p-2 bg-[#141b28] border-t border-[#2a3449] flex items-center justify-between gap-1.5 min-w-0">
              {/* Mute Mic */}
              <button
                onClick={toggleMute}
                className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : isSpeaking
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : 'bg-[#1e2738] text-slate-200 hover:bg-[#28344c] border border-[#2a3449]'
                }`}
                title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 flex-shrink-0" /> : <Mic className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{isMuted ? 'Mutado' : 'Microfone'}</span>
              </button>

              {/* Toggle Webcam Video */}
              <button
                onClick={() => toggleVideo()}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer flex-shrink-0 ${
                  isVideoEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-[#1e2738] text-slate-400 hover:text-white border-[#2a3449] hover:bg-[#28344c]'
                }`}
                title={isVideoEnabled ? 'Desativar Câmera / Webcam' : 'Ativar Câmera / Webcam'}
              >
                {isVideoEnabled ? <Video className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <VideoOff className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{isVideoEnabled ? 'Câmera On' : 'Câmera'}</span>
              </button>

              {/* Deafen */}
              <button
                onClick={toggleDeafen}
                className={`p-2 rounded-xl text-xs transition-all border cursor-pointer flex-shrink-0 ${
                  isDeafened
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-[#1e2738] text-slate-300 hover:text-white border-[#2a3449] hover:bg-[#28344c]'
                }`}
                title={isDeafened ? 'Reativar Áudio da Chamada (Fones)' : 'Ensurdecer (Desativar Áudio da Chamada)'}
              >
                <Headphones className="w-3.5 h-3.5" />
              </button>

              {/* Settings */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-xl text-xs bg-[#1e2738] text-slate-300 hover:text-white border border-[#2a3449] hover:bg-[#28344c] transition-all cursor-pointer flex-shrink-0"
                title="Configurações de Áudio e Vídeo"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Desconectar */}
              <button
                onClick={leaveCall}
                className="p-2 rounded-xl text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer flex-shrink-0"
                title="Sair da Chamada"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Mini Pill Badge quando Minimizado (também arrastável em Touch e Mouse) */
          <div
            onPointerDown={handleDragStart}
            style={{ touchAction: 'none' }}
            className="cursor-grab active:cursor-grabbing select-none"
          >
            <button
              onClick={() => {
                if (!dragStartRef.current.hasMoved) {
                  setIsWidgetOpen(true);
                }
              }}
              className="flex items-center gap-2 bg-[#0f141d]/95 hover:bg-[#161c28] border border-[#2a3449] hover:border-emerald-500/50 px-3 py-2 rounded-full shadow-2xl text-slate-200 transition-all group backdrop-blur-md cursor-pointer"
              title="Expandir Painel de Voz e Vídeo (Toque ou arraste para mover)"
            >
              <GripHorizontal className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-slate-300'}`} />
                )}
                {isVideoEnabled && (
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="text-[11px] text-slate-300">
                  {isVideoEnabled ? 'Vídeo' : 'Voz'} ({participants.length})
                </span>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Modal de Configurações */}
      <VoiceSettingsModal />
    </>,
    document.body
  );
};
