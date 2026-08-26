'use client';

import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
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
  ShieldAlert
} from 'lucide-react';
import { useVoiceCall, VoiceParticipantState } from '@/context/VoiceCallContext';
import { VoiceSettingsModal } from './VoiceSettingsModal';

export const VoiceCallFloatingWidget: React.FC = () => {
  const {
    isInCall,
    isConnecting,
    isMuted,
    isDeafened,
    isSpeaking,
    inputMode,
    pttKey,
    isPttPressed,
    participants,
    connectedPeersCount,
    isWidgetOpen,
    setIsWidgetOpen,
    setIsSettingsModalOpen,
    joinCall,
    leaveCall,
    toggleMute,
    toggleDeafen,
    setParticipantVolume,
  } = useVoiceCall();

  const [activeVolumeUserId, setActiveVolumeUserId] = useState<string | null>(null);

  if (!isInCall && !isConnecting) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none animate-slide-up">
        {/* Floating Expanded Box */}
        {isWidgetOpen ? (
          <div className="w-72 bg-[#0d121c]/95 backdrop-blur-md border border-[#2a3449] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all text-slate-200">
            {/* Header da Chamada */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141b28] border-b border-[#2a3449]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-xs text-slate-100 tracking-wide">Voz Conectada</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  {participants.length} {participants.length === 1 ? 'membro' : 'membros'}
                </span>
              </div>
              <button
                onClick={() => setIsWidgetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1e2738] transition-colors"
                title="Minimizar Widget"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Participantes */}
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
                        <div className="flex items-center gap-1 text-[10px]">
                          {p.isSpeaking ? (
                            <span className="text-emerald-400 font-medium animate-pulse flex items-center gap-0.5">
                              <Radio className="w-2.5 h-2.5" /> Falando...
                            </span>
                          ) : p.isMuted ? (
                            <span className="text-rose-400">Mutado</span>
                          ) : (
                            <span className="text-slate-500">Conectado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controle de Volume por Peer */}
                    {!isLocalUser && (
                      <div className="relative flex items-center">
                        <button
                          onClick={() => setActiveVolumeUserId(activeVolumeUserId === p.userId ? null : p.userId)}
                          className={`p-1.5 rounded-lg transition-colors ${
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
            <div className="p-2 bg-[#141b28] border-t border-[#2a3449] flex items-center justify-between gap-1.5">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : isSpeaking
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : 'bg-[#1e2738] text-slate-200 hover:bg-[#28344c] border border-[#2a3449]'
                }`}
                title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Mutado' : 'Microfone'}</span>
              </button>

              {/* Deafen */}
              <button
                onClick={toggleDeafen}
                className={`p-2 rounded-xl text-xs transition-all border ${
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
                className="p-2 rounded-xl text-xs bg-[#1e2738] text-slate-300 hover:text-white border border-[#2a3449] hover:bg-[#28344c] transition-all"
                title="Configurações de Áudio e Microfone"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Desconectar */}
              <button
                onClick={leaveCall}
                className="p-2 rounded-xl text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition-all"
                title="Sair da Chamada de Voz"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Mini Pill Badge quando Minimizado */
          <button
            onClick={() => setIsWidgetOpen(true)}
            className="flex items-center gap-2 bg-[#0f141d]/95 hover:bg-[#161c28] border border-[#2a3449] hover:border-emerald-500/50 px-3 py-2 rounded-full shadow-2xl text-slate-200 transition-all group backdrop-blur-md"
            title="Expandir Painel de Voz"
          >
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
              <span className="text-[11px] text-slate-300">Voz ({participants.length})</span>
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Modal de Configurações */}
      <VoiceSettingsModal />
    </>
  );
};
