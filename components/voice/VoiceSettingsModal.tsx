'use client';

import React, { useState } from 'react';
import { X, Mic, Volume2, Keyboard, Sliders, Check, Radio } from 'lucide-react';
import { useVoiceCall } from '@/context/VoiceCallContext';

export const VoiceSettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    inputMode,
    setInputMode,
    pttKey,
    setPttKey,
    vadSensitivity,
    setVadSensitivity,
    audioDevices,
    selectedAudioDeviceId,
    setSelectedAudioDeviceId,
    localSpeakingLevel,
    isInCall,
  } = useVoiceCall();

  const [isRecordingKey, setIsRecordingKey] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleKeyDownRecord = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (e.key === 'Escape') {
      setIsRecordingKey(false);
      return;
    }
    setPttKey(e.code || e.key);
    setIsRecordingKey(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f141d] border border-[#2a3449] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3449] bg-[#141a26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Configurações de Voz</h3>
              <p className="text-[11px] text-slate-400">Microfone, sensibilidade e atalhos de chamada</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Microfone de Entrada */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              Dispositivo de Entrada (Microfone)
            </label>
            <select
              value={selectedAudioDeviceId || ''}
              onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
              className="w-full bg-[#161c28] border border-[#2a3449] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="">Microfone Padrão do Sistema</option>
              {audioDevices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label || `Microfone ${dev.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Entrada: VAD vs PTT */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              Modo de Transmissão de Voz
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInputMode('vad')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left ${
                  inputMode === 'vad'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-slate-100">Ativação por Voz</span>
                  {inputMode === 'vad' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[10px] text-slate-400">Microfone abre automaticamente ao falar</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('ptt')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left ${
                  inputMode === 'ptt'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-slate-100">Push-to-Talk (PTT)</span>
                  {inputMode === 'ptt' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[10px] text-slate-400">Pressione e segure uma tecla para falar</span>
              </button>
            </div>
          </div>

          {/* Configurações específicas por modo */}
          {inputMode === 'vad' ? (
            <div className="bg-[#141a26] border border-[#2a3449] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Sensibilidade do Microfone</span>
                <span className="font-mono text-amber-400 text-[11px]">{vadSensitivity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={vadSensitivity}
                onChange={(e) => setVadSensitivity(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-[#2a3449] rounded-lg cursor-pointer"
              />

              {/* Medidor VU em Tempo Real */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Nível de Entrada Atual</span>
                  <span className={localSpeakingLevel > vadSensitivity ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {localSpeakingLevel > vadSensitivity ? 'Transmitindo' : 'Silêncio'}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#1e2738] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-75 ${
                      localSpeakingLevel > vadSensitivity ? 'bg-emerald-500' : 'bg-amber-500/60'
                    }`}
                    style={{ width: `${Math.min(100, localSpeakingLevel)}%` }}
                  />
                  {/* Linha indicadora do threshold */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow"
                    style={{ left: `${vadSensitivity}%` }}
                    title={`Threshold: ${vadSensitivity}%`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#141a26] border border-[#2a3449] p-3.5 rounded-xl space-y-2">
              <span className="font-semibold text-slate-300 block">Tecla do Push-to-Talk</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onKeyDown={isRecordingKey ? handleKeyDownRecord : undefined}
                  onClick={() => setIsRecordingKey(true)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-center font-mono font-bold text-xs transition-all ${
                    isRecordingKey
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                      : 'bg-[#1a2234] border-[#2a3449] text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {isRecordingKey ? 'Pressione qualquer tecla...' : pttKey}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Dica: Teclas comuns recomendadas: <code className="text-amber-400 font-mono">Space</code>,{' '}
                <code className="text-amber-400 font-mono">KeyV</code> ou <code className="text-amber-400 font-mono">ControlLeft</code>.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2a3449] bg-[#141a26] flex justify-end">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
