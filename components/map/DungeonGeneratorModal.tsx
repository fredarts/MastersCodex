'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  X, 
  ShieldAlert, 
  Key, 
  Castle, 
  Flame, 
  Skull, 
  Layers, 
  Grid, 
  Sliders, 
  CheckSquare, 
  Square, 
  Loader2,
  Eye,
  Upload,
  BookOpen,
  Compass
} from 'lucide-react';
import { generateDungeonFloorWithAI, AIDungeonRequestParams, AIDungeonOutput } from '@/lib/ai/dungeon-generator';
import { parseAIDungeonToMapData, ParsedDungeonMap } from '@/lib/parsers/dungeonParser';
import { analyzeDungeonMapImage, DungeonPatternBlueprint } from '@/lib/ai/dungeon-vision-analyzer';
import { getAllDungeonPatterns, savePatternToLibrary, DYSON_LOGOS_MASTER_PATTERN } from '@/lib/ai/dungeon-patterns';
import { toast } from 'sonner';

interface DungeonGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDungeonGenerated: (
    floors: ParsedDungeonMap[],
    targetMode: 'current_floor' | 'append_floors' | 'new_map'
  ) => void;
  currentLevelName?: string;
  hasActiveMap?: boolean;
}

const THEMES = [
  { id: 'gothic', label: 'Gótica / Cripta', icon: Castle, desc: 'Salas de pedra escura, tapetes vermelhos e sarcófagos' },
  { id: 'cave', label: 'Caverna & Mina', icon: Skull, desc: 'Túneis de rocha bruta, estalagmites e escuridão' },
  { id: 'temple', label: 'Templo Antigo', icon: ShieldAlert, desc: 'Altares de ritual, colunas ornamentadas e relíquias' },
  { id: 'sewer', label: 'Esgoto Subterrâneo', icon: Layers, desc: 'Canais de água poluída, grades de ferro e fungos' },
  { id: 'infernal', label: 'Infernal / Vulcânica', icon: Flame, desc: 'Rios de lava, piso de obsidian e tochas de fogo negro' },
];

export const DungeonGeneratorModal: React.FC<DungeonGeneratorModalProps> = ({
  isOpen,
  onClose,
  onDungeonGenerated,
  currentLevelName,
  hasActiveMap = true,
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'vision_learn'>('generator');
  const [applyMode, setApplyMode] = useState<'current_floor' | 'append_floors' | 'new_map'>('current_floor');
  
  const [prompt, setPrompt] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('gothic');
  const [selectedPatternId, setSelectedPatternId] = useState(DYSON_LOGOS_MASTER_PATTERN.id);
  const [level, setLevel] = useState(3);
  const [floors, setFloors] = useState(1);
  const [hasPuzzles, setHasPuzzles] = useState(true);
  const [hasSecretPassages, setHasSecretPassages] = useState(true);

  // Custom Grid Size
  const [cols, setCols] = useState(80);
  const [rows, setRows] = useState(80);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  // Vision Learning state
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [patternsList, setPatternsList] = useState<DungeonPatternBlueprint[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPatternsList(getAllDungeonPatterns());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSetPresetSize = (w: number, h: number) => {
    setCols(w);
    setRows(h);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeVisionMap = async () => {
    if (!uploadedImageSrc) {
      toast.error('Selecione uma imagem de mapa para analisar.');
      return;
    }

    try {
      setIsAnalyzingVision(true);
      toast.info('Analisando arquitetura e topologia do mapa com Visão IA...');
      
      const newPattern = await analyzeDungeonMapImage(uploadedImageSrc);
      savePatternToLibrary(newPattern);
      
      const updated = getAllDungeonPatterns();
      setPatternsList(updated);
      setSelectedPatternId(newPattern.id);
      
      toast.success(`Estilo "${newPattern.name}" aprendido e cadastrado no Banco de Dados!`);
      setActiveTab('generator');
    } catch (err: any) {
      console.error('Erro ao analisar visão do mapa:', err);
      toast.error(err?.message || 'Falha ao analisar a imagem do mapa com IA.');
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationStep('Conectando ao oráculo de IA...');

      const params: AIDungeonRequestParams = {
        prompt,
        theme: selectedTheme,
        patternId: selectedPatternId,
        level,
        floors,
        hasPuzzles,
        hasSecretPassages,
        cols,
        rows,
      };

      const generatedFloors: ParsedDungeonMap[] = [];

      for (let f = 1; f <= floors; f++) {
        setGenerationStep(`Gerando Andar ${f} de ${floors} (Escavando cômodos e instalando armadilhas)...`);
        const aiOutput: AIDungeonOutput = await generateDungeonFloorWithAI(params, f);
        setGenerationStep(`Construindo paredes e instalando iluminação no Andar ${f}...`);
        const parsed = parseAIDungeonToMapData(aiOutput);
        generatedFloors.push(parsed);
      }

      toast.success(`Masmorra gerada com sucesso! ${generatedFloors.length} andar(es) pronto(s).`);
      onDungeonGenerated(generatedFloors, applyMode);
      onClose();
    } catch (err: any) {
      console.error('Erro ao gerar masmorra:', err);
      toast.error(err?.message || 'Falha ao gerar a masmorra com IA.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in select-none">
      <div className="bg-[#0f172a] border border-amber-500/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-[#1e293b] to-slate-900 border-b border-amber-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Gerador de Masmorra por IA
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  Dyson Logos Pattern Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">Configure parâmetros e treine a IA com imagens de mapas profissionais</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating || isAnalyzingVision}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#090d16] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'generator'
                ? 'bg-[#0f172a] text-amber-400 border-amber-500/30 border-b-[#0f172a]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>Gerar Masmorra</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vision_learn')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'vision_learn'
                ? 'bg-[#0f172a] text-cyan-400 border-cyan-500/30 border-b-[#0f172a]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Aprender com Imagem (Vision AI)</span>
          </button>
        </div>

        {/* Tab 1: Generator */}
        {activeTab === 'generator' && (
          <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
            {/* Target Destination Selection */}
            <div className="space-y-2 bg-[#020617] p-3.5 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-amber-400" />
                Destino da Geração / Andares
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setApplyMode('current_floor')}
                  disabled={isGenerating || !hasActiveMap}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    applyMode === 'current_floor'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  } ${!hasActiveMap ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>🎯 Andar Atual</span>
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {currentLevelName ? `Substituir "${currentLevelName}"` : 'Substituir piso atual'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyMode('append_floors')}
                  disabled={isGenerating || !hasActiveMap}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    applyMode === 'append_floors'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  } ${!hasActiveMap ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>➕ Novo(s) Andar(es)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    Adicionar no mapa atual
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyMode('new_map')}
                  disabled={isGenerating}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    applyMode === 'new_map'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>🗺️ Nova Masmorra</span>
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    Criar novo mapa separado
                  </span>
                </button>
              </div>
            </div>

            {/* Pattern Style Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-amber-400" />
                Estilo / Padrão de Arquitetura do Banco de Dados
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {patternsList.map((pat) => {
                  const isSelected = selectedPatternId === pat.id;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => setSelectedPatternId(pat.id)}
                      disabled={isGenerating}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100 truncate">{pat.name}</span>
                        {isSelected && <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">ATIVO</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{pat.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Libre Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Wand2 className="w-4 h-4 text-amber-400" />
                Orientação / Prompt do Mestre
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="Descreva a atmosfera ou elementos específicos (ex: 'Cripta antiga com salão de trono pilareado no centro, armadilhas de veneno e altar sagrado...')"
                className="w-full bg-[#020617] border border-slate-700 focus:border-amber-500/80 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none h-20"
              />
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">Tema Visual</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {THEMES.map((theme) => {
                  const IconComponent = theme.icon;
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      disabled={isGenerating}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold truncate">{theme.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Dimensions */}
            <div className="space-y-3 bg-[#020617] p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  Tamanho do Grid Customizável
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetPresetSize(40, 40)}
                    className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${
                      cols === 40 && rows === 40 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    40x40
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetSize(60, 60)}
                    className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${
                      cols === 60 && rows === 60 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    60x60
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetSize(80, 80)}
                    className={`text-[10px] px-2 py-1 rounded font-mono border transition-all ${
                      cols === 80 && rows === 80 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    80x80 (Padrão)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Colunas (Largura):</span>
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={cols}
                    onChange={(e) => setCols(Math.max(20, Math.min(120, parseInt(e.target.value) || 40)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Linhas (Altura):</span>
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={rows}
                    onChange={(e) => setRows(Math.max(20, Math.min(120, parseInt(e.target.value) || 40)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Level & Floors Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 bg-[#020617] p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Nível do Grupo (CR)
                  </span>
                  <span className="font-mono font-black text-amber-400">Nível {level}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  disabled={isGenerating}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2 bg-[#020617] p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Andares da Masmorra
                  </span>
                  <span className="font-mono font-black text-amber-400">{floors} Andar(es)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={floors}
                  onChange={(e) => setFloors(parseInt(e.target.value))}
                  disabled={isGenerating}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Interactivity Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasPuzzles(!hasPuzzles)}
                disabled={isGenerating}
                className="flex items-center gap-2.5 bg-[#020617] border border-slate-800 p-3 rounded-xl hover:border-slate-700 text-left transition-colors cursor-pointer"
              >
                {hasPuzzles ? (
                  <CheckSquare className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-200">Puzzles com Alavancas</div>
                  <div className="text-[10px] text-slate-400">Conecta alavancas a grades de ferro</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHasSecretPassages(!hasSecretPassages)}
                disabled={isGenerating}
                className="flex items-center gap-2.5 bg-[#020617] border border-slate-800 p-3 rounded-xl hover:border-slate-700 text-left transition-colors cursor-pointer"
              >
                {hasSecretPassages ? (
                  <CheckSquare className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-200">Passagens Secretas (S)</div>
                  <div className="text-[10px] text-slate-400">Cria paredes ilusórias e salas ocultas</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Vision Learning */}
        {activeTab === 'vision_learn' && (
          <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
            <div className="bg-[#020617] border border-cyan-500/30 rounded-xl p-4 space-y-3 text-xs text-slate-300">
              <h3 className="font-bold text-cyan-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Treinar IA com Imagem de Mapa
              </h3>
              <p className="leading-relaxed text-slate-400">
                Faça o upload de qualquer mapa de RPG profissional (como Dyson Logos, Donjon, UVTT). A IA analisará a simetria, os salões pilareados, corredores e passagens secretas para salvar esse estilo no seu Banco de Dados de Padrões.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Upload do Mapa de Exemplo
              </label>

              <label className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-center">
                <Upload className="w-8 h-8 text-cyan-400 animate-bounce" />
                <span className="text-xs font-bold text-cyan-200">Clique para selecionar a imagem do mapa (.png, .jpg, .webp)</span>
                <span className="text-[10px] text-slate-400">Ex: Mapa do Dyson Logos ou desenho autoral</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {uploadedImageSrc && (
                <div className="bg-[#020617] border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={uploadedImageSrc} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-cyan-500/30" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Imagem Carregada</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Pronta para análise por visão</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeVisionMap}
                    disabled={isAnalyzingVision}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingVision ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analisar & Salvar no Banco</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isGenerating ? (
              <span className="text-amber-400 font-semibold flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {generationStep || 'Gerando masmorra...'}
              </span>
            ) : (
              <span>Grid: <strong className="text-cyan-400 font-mono">{cols} x {rows}</strong> • CR: <strong className="text-amber-400 font-mono">{level}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating || isAnalyzingVision}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            {activeTab === 'generator' && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Escavando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Criar Masmorra Completa</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
