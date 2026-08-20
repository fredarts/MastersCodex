'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Crown, 
  Users, 
  ShieldAlert, 
  Flame, 
  Check, 
  Loader2, 
  ArrowRight,
  Scroll,
  HelpCircle
} from 'lucide-react';
import { FamilyTree, FamilyMemberNode, FamilyRelationshipEdge } from '@/lib/types';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { useWorld } from '@/context/WorldContext';

interface AiDynastyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDynasty: (generatedTree: Partial<FamilyTree>) => void;
}

const PRESET_IDEAS = [
  {
    title: '👑 Casa Real em Crise Sucessória',
    theme: 'Fantasia Medieval Clássica',
    prompt: 'Uma linhagem real onde o rei idoso está moribundo, o primogênito legítimo é fraco, e um filho bastardo militarmente brilhante disputa a coroa com o apoio de facções nobres.',
    generations: 3,
    intrigue: 'high',
  },
  {
    title: '🦇 Dinastia Vampírica Ancestral',
    theme: 'Gótico / Dark Fantasy',
    prompt: 'Um antigo clã de vampiros nobres que governa uma província das sombras há 400 anos, com patriarca imortal e herdeiros com sede de usurpação.',
    generations: 3,
    intrigue: 'high',
  },
  {
    title: '🧝 Clã Élfico Nobre e Arcano',
    theme: 'Alta Fantasia Élfica',
    prompt: 'Uma família de magos nobres e lordes do bosque sagrado que guardam artefatos primordiais, com longas gerações e tradições rígidas.',
    generations: 4,
    intrigue: 'medium',
  },
  {
    title: '🪙 Família Mercante de Baldur\'s Gate',
    theme: 'Intriga Urbana / Mercantil',
    prompt: 'Uma casa mercantil bilionária cujos filhos comandam bancos, navios piratas secretos e guildas de ladrões, casando com nobres falidos por status.',
    generations: 3,
    intrigue: 'high',
  },
  {
    title: '🪓 Clã Guerreiro Nórdico',
    theme: 'Nórdico / Vikings',
    prompt: 'Um clã de jarls e skjaldmös com linhagem de sangue de gigantes, onde apenas os mais fortes herdam os machados ancestrais.',
    generations: 3,
    intrigue: 'low',
  }
];

export const AiDynastyGeneratorModal: React.FC<AiDynastyGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyDynasty,
}) => {
  const { settings } = useUserSettings();
  const { activeWorld, worldEntities } = useWorld();

  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('Fantasia Medieval Clássica');
  const [generationsCount, setGenerationsCount] = useState(3);
  const [intrigueLevel, setIntrigueLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview State
  const [generatedData, setGeneratedData] = useState<{
    houseName: string;
    houseMotto: string;
    description: string;
    members: FamilyMemberNode[];
    relationships: FamilyRelationshipEdge[];
  } | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setPrompt(preset.prompt);
    setTheme(preset.theme);
    setGenerationsCount(preset.generations);
    setIntrigueLevel(preset.intrigue as any);
    setGeneratedData(null);
    setErrorMessage(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Por favor, informe a ideia ou descrição da linhagem.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedData(null);

    try {
      const contextText = activeWorld
        ? `Mundo: ${activeWorld.title} (${activeWorld.genre}). Entidades relevantes: ${worldEntities.slice(0, 8).map((e) => `${e.name} [${e.category}]`).join(', ')}`
        : '';

      const response = await fetch('/api/ai/generate-dynasty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          theme,
          generationsCount,
          intrigueLevel,
          userSettings: settings,
          contextText,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro ${response.status} ao gerar dinastia`);
      }

      const data = await response.json();
      if (!data.members || data.members.length === 0) {
        throw new Error('A IA não retornou membros válidos para a árvore.');
      }

      setGeneratedData(data);
    } catch (err: any) {
      console.error('Erro ao gerar dinastia com IA:', err);
      setErrorMessage(err.message || 'Falha ao conectar com o serviço de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (!generatedData) return;

    onApplyDynasty({
      name: generatedData.houseName,
      houseMotto: generatedData.houseMotto,
      description: generatedData.description,
      members: generatedData.members,
      relationships: generatedData.relationships,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#0d121c] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#141a29] to-[#1c1524]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Forjador de Dinastias & Linhagens com IA
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-normal">
                  Gemini Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gere casas nobres inteiras com brasão, lema, gerações de parentesco e segredos genealógicos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!generatedData ? (
            <>
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider font-mono">
                  Ideias & Arquétipos Prontos:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {PRESET_IDEAS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-left p-2.5 rounded-xl bg-[#131826] hover:bg-[#1a2236] border border-slate-700/70 hover:border-amber-400/60 transition-all text-xs group"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-amber-300 truncate">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {preset.theme} • {preset.generations} Gerações
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Description */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Descrição / Inspiração da Família *
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Uma casa ducal do norte que comanda a cavalaria real, mas com rivalidade feroz entre os filhos gêmeos e uma filha adotada com poderes arcanos proibidos..."
                  className="w-full bg-[#141926] border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tema / Cultura
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-[#141926] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Fantasia Medieval Clássica">Fantasia Medieval Clássica</option>
                    <option value="Gótico / Dark Fantasy">Gótico / Dark Fantasy</option>
                    <option value="Alta Fantasia Élfica">Alta Fantasia Élfica</option>
                    <option value="Nórdico / Vikings">Nórdico / Clã Guerreiro</option>
                    <option value="Intriga Urbana / Mercantil">Mercantil / Guilda Nobre</option>
                    <option value="Oriental / Feudal">Feudal / Samurai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gerações na Árvore ({generationsCount})
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    value={generationsCount}
                    onChange={(e) => setGenerationsCount(parseInt(e.target.value))}
                    className="w-full accent-amber-500 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>2 (Pais & Filhos)</span>
                    <span>3 (Avós a Netos)</span>
                    <span>4 (Dinastia Longa)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nível de Intriga & Drama
                  </label>
                  <select
                    value={intrigueLevel}
                    onChange={(e) => setIntrigueLevel(e.target.value as any)}
                    className="w-full bg-[#141926] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="low">Baixo (Família Nobre Estável)</option>
                    <option value="medium">Médio (Rivalidades Normais)</option>
                    <option value="high">Alto (Bastardos, Golpes & Segredos)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* Result Preview Screen */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-[#141b2c] border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-amber-300">
                      {generatedData.houseName}
                    </h4>
                  </div>
                  {generatedData.houseMotto && (
                    <span className="text-xs italic text-slate-300 font-serif border-l border-slate-700 pl-3">
                      "{generatedData.houseMotto}"
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {generatedData.description}
                </p>
              </div>

              {/* Members Count & List preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> Membros Gerados ({generatedData.members.length}):
                  </h5>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {generatedData.relationships.length} conexões de parentesco
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {generatedData.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-[#111622] border border-slate-700 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-100 truncate">{m.name}</div>
                        {m.title && (
                          <div className="text-[10px] text-amber-400/90 truncate">{m.title}</div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Geração {m.generation} • {m.isAlive ? 'Vivo' : 'Falecido'}
                        </div>
                      </div>
                      {m.secrets && (
                        <div className="mt-1.5 text-[9px] text-rose-400/90 bg-rose-950/40 p-1 rounded truncate">
                          🔒 {m.secrets}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#121622] flex items-center justify-between">
          {generatedData ? (
            <button
              type="button"
              onClick={() => setGeneratedData(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              ← Modificar Parâmetros
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            {!generatedData ? (
              <button
                type="button"
                disabled={isLoading || !prompt.trim()}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 shadow-md transition-all font-mono"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Forjando Dinastia...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Forjar Árvore Genealógica
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmApply}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all"
              >
                <Check className="w-4 h-4" /> Aplicar Árvore ao Mundo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
