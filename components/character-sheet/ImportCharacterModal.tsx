'use client';

import React, { useState } from 'react';
import {
  Download,
  Link as LinkIcon,
  FileCode,
  Check,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Shield,
  Heart,
  Zap,
  Sword,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { CharacterSheet } from '@/lib/types';
import { parseDdbCharacter } from '@/lib/importers/dndBeyondParser';
import Image from 'next/image';

interface ImportCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sheet: CharacterSheet) => void;
}

export const ImportCharacterModal: React.FC<ImportCharacterModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'json'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<CharacterSheet | null>(null);

  if (!isOpen) return null;

  const handleFetchFromUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('Por favor, insira o link da ficha no D&D Beyond.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `/api/importer/dndbeyond?url=${encodeURIComponent(urlInput.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao buscar personagem no D&D Beyond.');
      }

      setParsedPreview(data.characterSheet);
      toast.success(`Ficha de "${data.characterSheet.characterName}" carregada com sucesso!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao importar personagem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseJson = () => {
    if (!jsonInput.trim()) {
      setErrorMsg('Por favor, cole o conteúdo JSON da ficha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const raw = JSON.parse(jsonInput.trim());
      const sheet = parseDdbCharacter(raw);
      setParsedPreview(sheet);
      toast.success(`Ficha de "${sheet.characterName}" processada com sucesso!`);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Erro ao interpretar JSON. Verifique se o formato é válido do D&D Beyond.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonInput(text);
        const raw = JSON.parse(text);
        const sheet = parseDdbCharacter(raw);
        setParsedPreview(sheet);
        toast.success(`Arquivo "${file.name}" carregado com sucesso!`);
      } catch (err: any) {
        setErrorMsg('Arquivo JSON inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedPreview) return;
    onImport(parsedPreview);
    toast.success(`Ficha de "${parsedPreview.characterName}" importada!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Importador do D&D Beyond & JSON
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  D&D 5e
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Traga personagens prontos colando o link público ou enviando um arquivo JSON.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Step 1: Input / Tab Selection if no preview loaded */}
          {!parsedPreview ? (
            <>
              {/* Tab selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('url');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'url'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Link do D&D Beyond (Automático)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('json');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'json'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Upload / Colar JSON</span>
                </button>
              </div>

              {/* Tab 1: URL */}
              {activeTab === 'url' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Link da Ficha do Personagem
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://www.dndbeyond.com/characters/12345678"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchFromUrl()}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
                      />
                      <button
                        onClick={handleFetchFromUrl}
                        disabled={isLoading || !urlInput.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{isLoading ? 'Buscando...' : 'Buscar Ficha'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Como funciona:
                    </div>
                    <p>
                      1. Abra sua ficha no <strong>D&D Beyond</strong>.
                    </p>
                    <p>
                      2. Certifique-se de que ela está como <strong>Pública</strong> (Privacy: Public).
                    </p>
                    <p>
                      3. Copie o link do navegador e cole no campo acima.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: JSON */}
              {activeTab === 'json' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Arquivo .JSON da Ficha
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer bg-slate-900 border border-slate-800 rounded-xl p-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Ou cole o texto JSON bruto:
                    </label>
                    <textarea
                      rows={5}
                      placeholder='{ "id": 12345, "name": "Aventureiro", ... }'
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleParseJson}
                    disabled={isLoading || !jsonInput.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCode className="w-4 h-4" />
                    )}
                    <span>Processar JSON</span>
                  </button>
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          ) : (
            /* Step 2: Character Preview Card */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-amber-500/40 shadow-xl space-y-4">
                {/* Character Header Info */}
                <div className="flex items-start gap-4">
                  {parsedPreview.avatarUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-500/40 flex-shrink-0 bg-slate-900 shadow-md">
                      <img
                        src={parsedPreview.avatarUrl}
                        alt={parsedPreview.characterName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl flex-shrink-0">
                      {parsedPreview.characterName.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-amber-300 truncate">
                      {parsedPreview.characterName}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {parsedPreview.race} • {parsedPreview.className} {parsedPreview.subclass ? `(${parsedPreview.subclass})` : ''} - Nível {parsedPreview.level}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {parsedPreview.background} • {parsedPreview.alignment}
                    </p>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">HP Máximo</div>
                      <div className="text-sm font-black text-slate-100">{parsedPreview.maxHp}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">Classe de Armadura</div>
                      <div className="text-sm font-black text-slate-100">{parsedPreview.armorClass}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">Deslocamento</div>
                      <div className="text-sm font-black text-slate-100">{parsedPreview.speed}</div>
                    </div>
                  </div>
                </div>

                {/* Core Attributes */}
                <div className="grid grid-cols-6 gap-1.5 text-center">
                  {Object.entries(parsedPreview.attributes).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
                    >
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        {key.substring(0, 3)}
                      </span>
                      <span className="text-xs font-black text-amber-300">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Summary badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    <Sword className="w-3 h-3 text-amber-400" />
                    {parsedPreview.attacks.length} Ataques
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    <BookOpen className="w-3 h-3 text-cyan-400" />
                    {parsedPreview.spells.length} Magias
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    💰 {parsedPreview.currency?.po || 0} PO
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/80 border-t border-slate-800">
          {parsedPreview ? (
            <>
              <button
                onClick={() => setParsedPreview(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-lg shadow-amber-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar e Importar Ficha</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
