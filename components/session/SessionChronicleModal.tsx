'use client';

import React, { useState } from 'react';
import { GameSession, GameScene } from '@/lib/types';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { 
  Scroll, 
  Sparkles, 
  BookOpen, 
  Send, 
  Copy, 
  Check, 
  X, 
  RefreshCw, 
  Flame, 
  ShieldAlert, 
  Crown,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionChronicleModalProps {
  session: GameSession;
  scenes: GameScene[];
  partyMembers?: string[];
  combatLogs?: string[];
  onClose: () => void;
}

interface ChronicleResult {
  chapterTitle: string;
  summary: string;
  proseStory: string;
  mvpMoments: { character: string; moment: string }[];
  rewardsAndConsequences: string;
}

export const SessionChronicleModal: React.FC<SessionChronicleModalProps> = ({
  session,
  scenes,
  partyMembers = [],
  combatLogs = [],
  onClose,
}) => {
  const { activeCampaign, createFeedEvent } = useCampaign();
  const [tone, setTone] = useState<'epic' | 'dark' | 'poetic' | 'historic'>('epic');
  const [chronicle, setChronicle] = useState<ChronicleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Editable states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [proseStory, setProseStory] = useState('');

  const generateChronicle = async () => {
    setIsLoading(true);
    try {
      const payload = {
        campaignTitle: activeCampaign?.title || 'Campanha',
        sessionTitle: session.title || `Sessão #${session.sessionNumber}`,
        sessionNumber: session.sessionNumber || 1,
        scenes: scenes.map((s) => ({
          title: s.title,
          sensoryText: s.sensoryText,
          sceneType: s.sceneType,
        })),
        combatEvents: combatLogs,
        partyMembers,
        tone,
      };

      const res = await fetch('/api/ai/generate-session-chronicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.chronicle) {
        setChronicle(data.chronicle);
        setTitle(data.chronicle.chapterTitle);
        setSummary(data.chronicle.summary);
        setProseStory(data.chronicle.proseStory);
        toast.success('Crônica da sessão gerada com sucesso pelo Session Scribe!');
      } else {
        toast.error(data.error || 'Não foi possível gerar a crônica.');
      }
    } catch (err: any) {
      console.error('Erro ao gerar crônica:', err);
      toast.error('Falha de conexão com a IA Cronista.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToFeed = async () => {
    if (!createFeedEvent || !title) return;
    setIsPublishing(true);
    try {
      await createFeedEvent({
        campaignId: session.campaignId,
        eventType: 'story_recap',
        title: title.trim(),
        description: summary.trim(),
        content: proseStory.trim(),
        authorName: 'Session Scribe (IA)',
        isPublic: true,
      } as any);

      toast.success('🎉 Crônica publicada no Feed da Campanha com sucesso!');
      onClose();
    } catch (err: any) {
      console.error('Erro ao publicar no feed:', err);
      toast.error('Erro ao salvar crônica no feed.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f1420] border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                Auto-Crônica da Sessão (Session Scribe)
              </h3>
              <p className="text-xs text-slate-400">
                Transforme cenas, rolagens e combates em prosa literária para o Feed da Campanha
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Seletor de Tom Narrativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Tom Narrativo da Crônica:</span>
              <span className="text-[11px] text-slate-400">Escolha a atmosfera da prosa literária.</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'epic', label: 'Épico / Heroico', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'dark', label: 'Grimdark', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> },
                { id: 'poetic', label: 'Bardico', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
                { id: 'historic', label: 'Histórico', icon: <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    tone === t.id
                      ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Geração se ainda não gerou */}
          {!chronicle && !isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
              <Scroll className="w-12 h-12 text-amber-500/40 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-200">Pronto para escrever a história desta sessão?</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                O Session Scribe irá analisar as {scenes.length} cenas narradas e eventos para tecer uma crônica em prosa rica.
              </p>
              <button
                onClick={generateChronicle}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Gerar Crônica com IA
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-10 h-10 text-amber-400 animate-spin mb-3" />
              <h4 className="text-sm font-bold text-slate-200">O Cronista Real está escrevendo as páginas desta história...</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Conectando atos, descrevendo façanhas heróicas e registrando momentos marcantes.
              </p>
            </div>
          )}

          {/* Preview / Edição da Crônica */}
          {chronicle && !isLoading && (
            <div className="space-y-4">
              {/* Título do Capítulo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Título do Capítulo</label>
                  <button
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Visualizar' : 'Editar Texto'}</span>
                  </button>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold"
                  />
                ) : (
                  <h2 className="text-lg font-black text-amber-400 font-serif border-b border-amber-500/20 pb-2">
                    {title}
                  </h2>
                )}
              </div>

              {/* Resumo Executivo */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                  Resumo da Sessão
                </span>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
                  />
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed italic">{summary}</p>
                )}
              </div>

              {/* Prosa Literária Completa */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-serif">
                <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-slate-400 block mb-2">
                  Narrativa em Prosa
                </span>
                {isEditing ? (
                  <textarea
                    rows={8}
                    value={proseStory}
                    onChange={(e) => setProseStory(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-sans"
                  />
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                    {proseStory}
                  </div>
                )}
              </div>

              {/* Destaques dos Personagens (MVP Moments) */}
              {chronicle.mvpMoments && chronicle.mvpMoments.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                    <Crown className="w-3.5 h-3.5" /> Momentos Marcantes dos Personagens
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {chronicle.mvpMoments.map((mvp, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                        <strong className="text-amber-300">{mvp.character}:</strong>{' '}
                        <span className="text-slate-300">{mvp.moment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
          {chronicle ? (
            <button
              onClick={generateChronicle}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regerar
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {chronicle && (
              <button
                onClick={handlePublishToFeed}
                disabled={isPublishing}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Publicar no Feed da Campanha
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
