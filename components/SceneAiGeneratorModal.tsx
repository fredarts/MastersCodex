'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  AlertCircle, 
  Search, 
  Globe, 
  Users, 
  MapPin, 
  Shield, 
  Flame, 
  Scroll, 
  Check, 
  RefreshCw,
  Crown,
  Swords,
  MessageSquare,
  Compass,
  Beer
} from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { World, WorldEntity, SceneType } from '@/lib/types';

interface SceneAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    title: string;
    sensoryText: string;
    secretNotes: string;
    suggestedBgm?: 'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao';
    timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
    hasFog?: boolean;
    hasRain?: boolean;
    slideCoverPrompt?: string;
    selectedEntities: WorldEntity[];
  }) => void;
  sessionTitle: string;
  selectedWorld: World | null;
  worldEntities: WorldEntity[];
  currentSceneType: SceneType;
}

const translateCategory = (cat: string): string => {
  const map: Record<string, string> = {
    npc: 'NPC / Personagem',
    location: 'Localização / Geografia',
    faction: 'Facção ou Guilda',
    religion: 'Religião ou Deus',
    lore_event: 'Evento Histórico',
    species: 'Espécie / Raça',
    item: 'Item / Artefato',
    beast: 'Monstro / Criatura',
    military_conflict: 'Guerra / Conflito',
  };
  return map[cat] || cat;
};

const getCategoryColor = (cat: string): string => {
  switch (cat) {
    case 'npc': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'location': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'faction': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'item': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'beast': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    default: return 'text-slate-300 bg-slate-800 border-slate-700';
  }
};

export const SceneAiGeneratorModal: React.FC<SceneAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  sessionTitle,
  selectedWorld,
  worldEntities = [],
  currentSceneType = 'social',
}) => {
  const { settings } = useUserSettings();

  const [prompt, setPrompt] = useState('');
  const [sceneType, setSceneType] = useState<SceneType>(currentSceneType);
  const [selectedEntities, setSelectedEntities] = useState<WorldEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated Result Preview State
  const [generatedData, setGeneratedData] = useState<{
    title: string;
    sensoryText: string;
    secretNotes: string;
    suggestedBgm?: 'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao';
    timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
    hasFog?: boolean;
    hasRain?: boolean;
    slideCoverPrompt?: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setGeneratedData(null);
      setSceneType(currentSceneType);
      // Auto-suggest initial entities if available
      if (worldEntities.length > 0 && selectedEntities.length === 0) {
        setSelectedEntities(worldEntities.slice(0, 2));
      }
    }
  }, [isOpen, currentSceneType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const availableEntities = worldEntities.filter(
    (ent) => !selectedEntities.some((sel) => sel.id === ent.id)
  );

  const filteredEntities = availableEntities.filter((ent) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      ent.name.toLowerCase().includes(q) ||
      (ent.subType || '').toLowerCase().includes(q) ||
      translateCategory(ent.category).toLowerCase().includes(q)
    );
  });

  const handleSelectEntity = (ent: WorldEntity) => {
    setSelectedEntities((prev) => [...prev, ent]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveEntity = (id: string) => {
    setSelectedEntities((prev) => prev.filter((ent) => ent.id !== id));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const entitiesContext = selectedEntities.length > 0
      ? selectedEntities.map((ent) => {
          let detail = `- **${ent.name}** [${translateCategory(ent.category)}${ent.subType ? ` - ${ent.subType}` : ''}]: ${ent.shortDesc}`;
          if (ent.fullContent) {
            const truncated = ent.fullContent.length > 300
              ? ent.fullContent.slice(0, 300) + '...'
              : ent.fullContent;
            detail += `\n  Detalhes: ${truncated}`;
          }
          return detail;
        }).join('\n\n')
      : undefined;

    try {
      const response = await fetch('/api/ai/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTitle,
          sceneType,
          userIdeas: prompt.trim() || undefined,
          entitiesContext,
          worldTitle: selectedWorld?.title,
          worldGenre: selectedWorld?.genre,
          worldDesc: selectedWorld?.description,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao estruturar cena com IA.');

      setGeneratedData({
        title: data.title || '',
        sensoryText: data.sensoryText || '',
        secretNotes: data.secretNotes || '',
        suggestedBgm: data.suggestedBgm,
        timeOfDay: data.timeOfDay,
        hasFog: data.hasFog,
        hasRain: data.hasRain,
        slideCoverPrompt: data.slideCoverPrompt,
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao comunicar com o co-mestre IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedData) return;
    onApply({
      ...generatedData,
      selectedEntities,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in select-none">
      <div className="bg-[#111622] border border-amber-500/40 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252f44] px-6 py-4 bg-[#161d2d]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Forjador de Cenas & Roteiro com IA
              </h3>
              <p className="text-xs text-slate-400">
                Sessão: <span className="text-amber-300 font-semibold">{sessionTitle}</span> • {selectedWorld?.title || 'Mundo Atual'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#252f44] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0f1420]/60">
          
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scene Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipo de Encontro / Cena:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'social', label: 'Social / Taverna', icon: Beer, color: 'text-amber-400' },
                { id: 'dialogue', label: 'Diálogo NPC', icon: MessageSquare, color: 'text-cyan-400' },
                { id: 'combat', label: 'Combate Épico', icon: Swords, color: 'text-rose-400' },
                { id: 'exploration', label: 'Exploração', icon: Compass, color: 'text-emerald-400' },
              ].map((st) => {
                const Icon = st.icon;
                const isSelected = sceneType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSceneType(st.id as SceneType)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow'
                        : 'bg-[#141a27] border-[#252f44] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${st.color}`} />
                    <span className="text-[11px]">{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: World Entities Selection */}
          <div className="bg-[#141a27] border border-[#252f44] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                Personagens, Locais e Entidades Presentes ({worldEntities.length} disponíveis):
              </label>
              {selectedEntities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedEntities([])}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Limpar Seleção
                </button>
              )}
            </div>

            {/* Selected Entities Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#0a0e17] border border-[#252f44] rounded-lg">
              {selectedEntities.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic py-0.5">
                  Nenhuma entidade vinculada. Pesquise abaixo para incluir NPCs, monstros ou locais nesta cena.
                </span>
              ) : (
                selectedEntities.map((ent) => (
                  <span
                    key={ent.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${getCategoryColor(ent.category)}`}
                  >
                    <span>{ent.name}</span>
                    <span className="text-[9px] opacity-75">({translateCategory(ent.category)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEntity(ent.id)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Entity Search Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Pesquisar NPC, Vilão, Taverna, Masmorra, Monstro ou Item..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {isDropdownOpen && filteredEntities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#161c28] border border-[#2a3449] rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-[#252f44]">
                  {filteredEntities.map((ent) => (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => handleSelectEntity(ent)}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#1f2738] flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{ent.name}</span>
                        {ent.subType && (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                            — {ent.subType}
                          </span>
                        )}
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{ent.shortDesc}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ml-2 ${getCategoryColor(ent.category)}`}>
                        {translateCategory(ent.category)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Premise and User Ideas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Ideias da Cena / O que deve acontecer (Opcional):</span>
              <span className="text-[10px] text-slate-500">Ex: "Os heróis entram na taverna e o bardo estranho começa a tocar uma canção proibida"</span>
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite o rumo da cena ou deixe vazio para a IA sugerir um roteiro completo..."
              className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none font-serif leading-relaxed"
            ></textarea>
          </div>

          {/* Section: Generated Preview */}
          {generatedData && (
            <div className="p-4 bg-[#0a0e17] border border-emerald-500/40 rounded-xl space-y-3 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between border-b border-[#252f44] pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Roteiro de Cena Forjado com Sucesso
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  BGM: {generatedData.suggestedBgm || 'Taverna'}
                </span>
              </div>

              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Título da Cena Sugerido:
                </h5>
                <input
                  type="text"
                  value={generatedData.title}
                  onChange={(e) => setGeneratedData({ ...generatedData, title: e.target.value })}
                  className="w-full bg-[#141a27] border border-[#252f44] focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold"
                />
              </div>

              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5 text-amber-400" />
                  Texto Sensorial para Ler aos Jogadores:
                </h5>
                <p className="text-xs text-slate-200 font-serif leading-relaxed whitespace-pre-line bg-[#141a27] p-3 rounded-lg border border-[#252f44]">
                  {generatedData.sensoryText}
                </p>
              </div>

              {generatedData.secretNotes && (
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Notas Secretas do Mestre:
                  </h5>
                  <p className="text-xs text-slate-300 font-sans italic whitespace-pre-line bg-[#141a27] p-2.5 rounded-lg border border-[#252f44]">
                    {generatedData.secretNotes}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#252f44] px-6 py-4 bg-[#161d2d]/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#0c1019] hover:bg-[#1f2738] text-slate-300 text-xs font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-amber-500/30 to-amber-600/40 hover:from-amber-500/40 hover:to-amber-600/50 border border-amber-500/50 text-amber-300 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Consultando Oráculo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatedData ? 'Gerar Outra Versão' : 'Forjar Cena com IA'}</span>
                </>
              )}
            </button>

            {generatedData && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Roteiro à Cena</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
