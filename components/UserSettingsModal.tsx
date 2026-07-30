'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Key, Sparkles, Cpu, Image as ImageIcon, Save, CheckCircle } from 'lucide-react';
import { useUserSettings, UserSettings } from '@/lib/hooks/useUserSettings';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATIC_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recomendado)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Alta Qualidade)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
];

const STATIC_IMAGE_MODELS = [
  { id: 'imagen-3.0-generate-001', name: 'Imagen 3 (Alta Qualidade)' },
  { id: 'gemini-3.1-flash-lite-image', name: 'Nano Banana 2 (gemini-3.1-flash-lite-image)' },
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, isLoaded, saveSettings } = useUserSettings();

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [textModelProvider, setTextModelProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [textModel, setTextModel] = useState('gemini-2.5-flash');
  const [imageModel, setImageModel] = useState('imagen-3.0-generate-001');

  const [openRouterModels, setOpenRouterModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load settings into local state when they are loaded from custom hook
  useEffect(() => {
    if (isLoaded) {
      setGeminiApiKey(settings.geminiApiKey);
      setOpenRouterApiKey(settings.openRouterApiKey);
      setTextModelProvider(settings.textModelProvider);
      setTextModel(settings.textModel);
      setImageModel(settings.imageModel);
    }
  }, [isLoaded, settings, isOpen]);

  // Fetch OpenRouter models dynamically
  useEffect(() => {
    if (isOpen && textModelProvider === 'openrouter') {
      setIsLoadingModels(true);
      fetch('https://openrouter.ai/api/v1/models')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.data)) {
            const formatted = data.data.map((m: any) => ({
              id: m.id,
              name: m.name || m.id,
            }));
            setOpenRouterModels(formatted);
          }
        })
        .catch((err) => console.error('Erro ao buscar modelos do OpenRouter:', err))
        .finally(() => setIsLoadingModels(false));
    }
  }, [isOpen, textModelProvider]);

  // Auto select first model when provider changes if model isn't compatible
  useEffect(() => {
    if (isLoaded) {
      if (textModelProvider === 'gemini') {
        const isGeminiModel = STATIC_GEMINI_MODELS.some(m => m.id === textModel);
        if (!isGeminiModel) {
          setTextModel(STATIC_GEMINI_MODELS[0].id);
        }
      } else {
        const isOpenRouterModel = openRouterModels.some(m => m.id === textModel);
        if (!isOpenRouterModel && openRouterModels.length > 0) {
          // If we have loaded openRouterModels, fallback to first free or popular model
          const freeLlama = openRouterModels.find(m => m.id.includes('free'));
          setTextModel(freeLlama ? freeLlama.id : openRouterModels[0].id);
        }
      }
    }
  }, [textModelProvider, openRouterModels]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      geminiApiKey,
      openRouterApiKey,
      textModelProvider,
      textModel,
      imageModel,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  const filteredOpenRouterModels = openRouterModels.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-4 mb-4 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
              <Key className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Configurações de IA</h3>
              <p className="text-[10px] text-amber-400">Personalize chaves e modelos de texto e imagem</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#2a3449] rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
          {isSaved ? (
            <div className="p-8 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-center flex flex-col items-center justify-center space-y-3 my-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Configurações Salvas!</h4>
                <p className="text-xs text-slate-400 mt-1">Os modelos e chaves foram armazenados localmente com sucesso.</p>
              </div>
            </div>
          ) : (
            <>
              {/* API Keys Section */}
              <div className="bg-[#0a0d14] p-4 rounded-xl border border-[#2a3449] space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Chaves de API (Salvas localmente)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Chave de API do Gemini:</label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#161c28] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Chave de API do OpenRouter:</label>
                  <input
                    type="password"
                    value={openRouterApiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-[#161c28] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Text Model Section */}
              <div className="bg-[#0a0d14] p-4 rounded-xl border border-[#2a3449] space-y-3">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Modelo de Texto (Narrador & Co-Mestre)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Provedor de Texto:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTextModelProvider('gemini')}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        textModelProvider === 'gemini'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Google Gemini
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextModelProvider('openrouter')}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        textModelProvider === 'openrouter'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      OpenRouter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Modelo de Texto:</label>
                  {textModelProvider === 'gemini' ? (
                    <select
                      value={textModel}
                      onChange={(e) => setTextModel(e.target.value)}
                      className="w-full bg-[#161c28] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      {STATIC_GEMINI_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Buscar modelo no OpenRouter... (ex: llama)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#161c28] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                      {isLoadingModels ? (
                        <div className="text-center py-2 text-[10px] text-slate-500">Carregando modelos do OpenRouter...</div>
                      ) : (
                        <select
                          value={textModel}
                          onChange={(e) => setTextModel(e.target.value)}
                          className="w-full bg-[#161c28] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 max-h-36"
                        >
                          {filteredOpenRouterModels.length > 0 ? (
                            filteredOpenRouterModels.map((m) => (
                              <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                            ))
                          ) : (
                            <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B Instruct (Free fallback)</option>
                          )}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Image Model Section */}
              <div className="bg-[#0a0d14] p-4 rounded-xl border border-[#2a3449] space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Modelo de Imagem (Gerador de Retratos)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Modelo de Imagem:</label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="w-full bg-[#161c28] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {STATIC_IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#2a3449] hover:bg-[#1f2738] text-slate-300 font-bold text-xs rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
