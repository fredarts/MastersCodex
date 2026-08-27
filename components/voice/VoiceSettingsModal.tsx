'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Video, VideoOff, Sliders, Check, Radio, Camera, RefreshCw, FlipHorizontal, AlertTriangle } from 'lucide-react';
import { useVoiceCall, parseCameraError } from '@/context/VoiceCallContext';
import { CameraErrorInfo } from '@/components/voice/CameraErrorModal';

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
    videoDevices,
    selectedVideoDeviceId,
    setSelectedVideoDeviceId,
    refreshAudioDevices,
    refreshVideoDevices,
    localSpeakingLevel,
    localVideoStream,
    isVideoEnabled,
    toggleVideo,
    setCameraError,
  } = useVoiceCall();

  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const [isRecordingKey, setIsRecordingKey] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<CameraErrorInfo | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Se a chamada já estiver com vídeo ativo, usamos o localVideoStream.
  // Caso contrário, se o usuário estiver na aba de vídeo, criamos um preview local temporário.
  useEffect(() => {
    if (!isSettingsModalOpen) {
      if (previewStream && !localVideoStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
      setPreviewError(null);
      return;
    }

    refreshAudioDevices();
    refreshVideoDevices();
  }, [isSettingsModalOpen, refreshAudioDevices, refreshVideoDevices]);

  // Gerenciar stream de pré-visualização da webcam no modal
  useEffect(() => {
    if (!isSettingsModalOpen || activeTab !== 'video') {
      if (previewStream && !localVideoStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
      setPreviewError(null);
      return;
    }

    if (localVideoStream) {
      setPreviewError(null);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = localVideoStream;
      }
      return;
    }

    let isSubscribed = true;

    const startLocalPreview = async () => {
      try {
        setPreviewError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (isSubscribed) {
          setPreviewStream(stream);
          setPreviewError(null);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (err: any) {
        console.warn('Não foi possível iniciar preview de vídeo:', err);
        if (isSubscribed) {
          const parsed = parseCameraError(err);
          setPreviewError(parsed);
          setPreviewStream(null);
        }
      }
    };

    startLocalPreview();

    return () => {
      isSubscribed = false;
      if (previewStream && !localVideoStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
    };
  }, [isSettingsModalOpen, activeTab, selectedVideoDeviceId, localVideoStream]);

  // Garantir que a tag de vídeo receba o stream
  useEffect(() => {
    const streamToDisplay = localVideoStream || previewStream;
    if (videoPreviewRef.current && streamToDisplay) {
      videoPreviewRef.current.srcObject = streamToDisplay;
    }
  }, [localVideoStream, previewStream]);

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

  const handleClose = () => {
    if (previewStream && !localVideoStream) {
      previewStream.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    }
    setPreviewError(null);
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f141d] border border-[#2a3449] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3449] bg-[#141a26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Configurações de Transmissão</h3>
              <p className="text-[11px] text-slate-400">Microfone, sensibilidade e câmera da sessão</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2a3449] bg-[#121722] px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Áudio & Microfone</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Vídeo & Webcam</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'audio' ? (
            <>
              {/* Microfone de Entrada */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    Dispositivo de Entrada (Microfone)
                  </label>
                  <button
                    type="button"
                    onClick={() => refreshAudioDevices()}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Atualizar
                  </button>
                </div>
                <select
                  value={selectedAudioDeviceId || ''}
                  onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                  className="w-full bg-[#161c28] border border-[#2a3449] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs cursor-pointer"
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
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer ${
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
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer ${
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
                      className={`flex-1 px-3 py-2 rounded-xl border text-center font-mono font-bold text-xs transition-all cursor-pointer ${
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
            </>
          ) : (
            /* Tab de Vídeo & Webcam */
            <div className="space-y-4">
              {/* Dispositivo de Câmera */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Dispositivo de Vídeo (Webcam)
                  </label>
                  <button
                    type="button"
                    onClick={() => refreshVideoDevices()}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Atualizar
                  </button>
                </div>
                <select
                  value={selectedVideoDeviceId || ''}
                  onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                  className="w-full bg-[#161c28] border border-[#2a3449] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs cursor-pointer"
                >
                  <option value="">Câmera Padrão do Sistema</option>
                  {videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Câmera ${dev.deviceId.slice(0, 5)}...`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Box de Pré-visualização da Câmera */}
              <div className="bg-[#141a26] border border-[#2a3449] p-3 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    Pré-visualização da Câmera
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMirrored(!isMirrored)}
                      className={`p-1.5 rounded-lg border text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                        isMirrored
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-[#1e2738] border-[#2a3449] text-slate-400 hover:text-slate-200'
                      }`}
                      title="Espelhar Imagem Horizontalmente"
                    >
                      <FlipHorizontal className="w-3 h-3" />
                      <span>Espelhado</span>
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video w-full bg-[#0a0d14] rounded-xl overflow-hidden border border-[#2a3449] flex items-center justify-center">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-transform ${isMirrored ? '-scale-x-100' : ''} ${
                      localVideoStream || previewStream ? 'block' : 'hidden'
                    }`}
                  />

                  {/* Mensagem quando não há stream */}
                  {!localVideoStream && !previewStream && (
                    <div className="flex flex-col items-center gap-2 p-4 text-center text-xs">
                      {previewError ? (
                        <div className="flex flex-col items-center gap-1.5 text-rose-300">
                          <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
                          <span className="font-bold text-[11px]">{previewError.title}</span>
                          <span className="text-[10px] text-slate-400 max-w-xs leading-tight">
                            {previewError.message}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCameraError(previewError)}
                            className="mt-1 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-[10px] text-rose-300 font-semibold transition-all cursor-pointer"
                          >
                            Ver Como Resolver (Diagnóstico)
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <VideoOff className="w-8 h-8 opacity-50" />
                          <span>Câmera desativada ou não autorizada</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badge de status no preview */}
                  {(localVideoStream || previewStream) && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ao Vivo
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    {isVideoEnabled ? 'Transmitindo na chamada' : 'Modo de teste local'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleVideo()}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isVideoEnabled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isVideoEnabled ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                    <span>{isVideoEnabled ? 'Desligar Câmera' : 'Ligar Câmera na Chamada'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2a3449] bg-[#141a26] flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
