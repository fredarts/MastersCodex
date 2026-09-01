import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { DND_ALIGNMENTS, DND_BACKGROUNDS, DND_CLASSES, DND_RACES } from '@/lib/dnd5e-data';
import { applyClassPreset, applyLevelChange, applyRacePreset, calculateLevelFromXP, resetSheetToLevel1, revertWildShape } from '@/lib/dnd5e-calculator';
import { Shield, Sparkles, Award, Box, Check, ChevronLeft, ChevronRight, RotateCcw, PawPrint, Image as ImageIcon, UserCheck } from 'lucide-react';
import { CHARACTER_MODELS_3D, getModelUrlByNameOrPath } from '@/lib/3d-models';
import { Model3DViewer } from '../Model3DViewer';
import { LevelUpModal } from '../Modals/LevelUpModal';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface ChromaKeyStandeeProps {
  imageUrl?: string;
  characterName?: string;
  isActive: boolean;
}

const ChromaKeyStandee: React.FC<ChromaKeyStandeeProps> = ({ imageUrl, characterName, isActive }) => {
  const [processedUrl, setProcessedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!imageUrl) {
      const timer = setTimeout(() => {
        setProcessedUrl(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (!active) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setProcessedUrl(imageUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const threshold = 240;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0;
          } else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
            const avgDistance = ((threshold - r) + (threshold - g) + (threshold - b)) / 3;
            const alphaFactor = Math.min(1, avgDistance / 20);
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedUrl(canvas.toDataURL());
      } catch {
        setProcessedUrl(imageUrl);
      }
    };

    img.onerror = () => {
      if (!active) return;
      setProcessedUrl(imageUrl);
    };

    return () => {
      active = false;
    };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end overflow-hidden pb-3">
      <div 
        className="relative w-full h-full flex flex-col items-center justify-end"
        style={{ perspective: '500px' }}
      >
        {processedUrl ? (
          <div
            className={`relative z-10 transition-transform duration-500 origin-bottom select-none ${
              isActive ? 'scale-105' : 'scale-95 opacity-80'
            }`}
            style={{
              transform: 'rotateX(15deg) rotateY(-15deg)',
              transformStyle: 'preserve-3d',
              filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.75))'
            }}
          >
            <img
              src={processedUrl}
              alt={characterName || 'Token 2D'}
              className="max-h-[160px] sm:max-h-[190px] w-auto object-contain block mx-auto"
            />
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center mb-6 text-center space-y-1">
            <div className="w-16 h-16 rounded-full border border-amber-500/30 bg-amber-950/20 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-8 h-8 opacity-70" />
            </div>
            <p className="text-[10px] text-slate-400 font-serif">
              Standee 2D do Personagem
            </p>
          </div>
        )}

        {/* Base 3D do Pino (Grid de Combate) */}
        <div
          className={`absolute bottom-0 w-32 h-7 rounded-full transition-all duration-300 ${
            isActive
              ? 'border-2 border-amber-500/80 bg-amber-950/20 shadow-[0_6px_14px_rgba(245,158,11,0.5)]'
              : 'border-2 border-slate-700/60 bg-slate-900/40 shadow-[0_3px_6px_rgba(0,0,0,0.6)]'
          }`}
          style={{
            transform: 'rotateX(75deg) translateY(4px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div 
            className={`absolute inset-0.5 rounded-full border transition-colors ${
              isActive ? 'border-amber-400/40 animate-pulse' : 'border-slate-800/40'
            }`} 
          />
        </div>
      </div>
    </div>
  );
};

interface GeneralSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ sheet, onChange }) => {
  const { showAlert, showConfirm } = useCustomDialog();
  const [levelUpTarget, setLevelUpTarget] = useState<number | null>(null);

  const handleResetSheet = async () => {
    const confirmed = await showConfirm({
      title: 'Resetar Ficha para Nível 1?',
      message: `Tem certeza que deseja resetar a ficha de "${sheet.characterName || 'Personagem'}" para o Nível 1?\n\nEsta ação redefinirá todos os atributos, pontos de vida, perícias, armas, equipamentos, moedas, magias e talentos para o padrão inicial.\n\nNome, raça, classe e descrições da história serão preservados.`,
      confirmText: 'Sim, Resetar Nível 1',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      const reset = resetSheetToLevel1(sheet);
      onChange(reset);
      showAlert({
        title: 'Ficha Resetada',
        message: 'A ficha foi resetada para o Nível 1 com sucesso.',
        variant: 'success',
      });
    }
  };

  const handleRaceChange = (newRace: string) => {
    const raceData = DND_RACES[newRace];
    const newSubrace = (raceData && raceData.subraces) ? Object.keys(raceData.subraces)[0] : '';
    const updated = applyRacePreset(sheet, newRace, newSubrace);
    onChange(updated);
  };

  const handleSubraceChange = (newSubrace: string) => {
    const updated = applyRacePreset(sheet, sheet.race, newSubrace);
    onChange(updated);
  };

  const handleClassChange = (newClass: string) => {
    const updated = applyClassPreset(sheet, newClass);
    onChange({
      ...updated,
      modelUrl: getModelUrlByNameOrPath(newClass),
    });
  };

  const handleLevelChange = (newLevel: number) => {
    if (newLevel > sheet.level) {
      setLevelUpTarget(newLevel);
    } else {
      const updated = applyLevelChange(sheet, newLevel);
      onChange(updated);
    }
  };

  const activeTokenType = sheet.tokenType || '3d';
  const currentModelUrl = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className);
  const currentIndex = CHARACTER_MODELS_3D.findIndex((m) => m.modelUrl === currentModelUrl);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeModel = CHARACTER_MODELS_3D[activeIndex] || CHARACTER_MODELS_3D[0];

  const handlePrevModel = () => {
    const newIndex = (activeIndex - 1 + CHARACTER_MODELS_3D.length) % CHARACTER_MODELS_3D.length;
    onChange({ ...sheet, modelUrl: CHARACTER_MODELS_3D[newIndex].modelUrl, tokenType: '3d' });
  };

  const handleNextModel = () => {
    const newIndex = (activeIndex + 1) % CHARACTER_MODELS_3D.length;
    onChange({ ...sheet, modelUrl: CHARACTER_MODELS_3D[newIndex].modelUrl, tokenType: '3d' });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden animate-fade-in select-none space-y-2">
      {levelUpTarget !== null && (
        <LevelUpModal
          isOpen={true}
          onClose={() => setLevelUpTarget(null)}
          sheet={sheet}
          targetLevel={levelUpTarget}
          onConfirm={(updated) => {
            onChange(updated);
            setLevelUpTarget(null);
          }}
        />
      )}

      {/* BANNER DE FORMA SELVAGEM ATIVA (SE HOUVER) */}
      {sheet.activeWildShape && (
        <div className="shrink-0 bg-gradient-to-r from-emerald-950/80 via-[#0d1624] to-amber-950/70 border border-emerald-500/50 rounded-xl p-2 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <PawPrint className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-white uppercase tracking-wider font-serif">
                  🐾 Forma Selvagem: {sheet.activeWildShape.beastName}
                </span>
                <span className="text-[8px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/40">
                  {sheet.activeWildShape.beastType === 'elemental' ? 'Elemental' : 'Besta'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-mono">
                PV: <strong className="text-emerald-400">{sheet.activeWildShape.currentBeastHp}/{sheet.activeWildShape.maxBeastHp}</strong> • CA: <strong className="text-cyan-300">{sheet.activeWildShape.beastAc}</strong> • Deslocamento: <strong className="text-amber-300">{sheet.activeWildShape.beastSpeed}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange(revertWildShape(sheet))}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg shadow transition-all active:scale-95 cursor-pointer font-serif flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reverter</span>
          </button>
        </div>
      )}

      {/* GRID PRINCIPAL EM TELA ÚNICA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        
        {/* COLUNA ESQUERDA: NOME DO PERSONAGEM & SELETOR DE BONECOS (3D / 2D) */}
        <div className="lg:col-span-5 flex flex-col gap-2 h-full overflow-hidden">
          {/* CARD: NOME DO PERSONAGEM */}
          <div className="bg3-panel rounded-xl p-2.5 space-y-1 shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold tracking-wider text-amber-400 uppercase font-serif flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Nome do Personagem
              </label>
              <span className="text-[9px] font-serif font-bold text-amber-300/70 uppercase">
                {sheet.race || 'Humano'} • {sheet.className || 'Guerreiro'}
              </span>
            </div>
            <input
              type="text"
              value={sheet.characterName}
              onChange={(e) => onChange({ ...sheet, characterName: e.target.value })}
              placeholder="Ex: Thorin Escudo-de-Carvalho"
              className="w-full bg-[#090c14] border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          {/* CARD: MINIATURA 3D E TOKEN 2D */}
          <div className="bg3-panel rounded-xl p-2.5 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
            {/* CABEÇALHO COM SELEÇÃO DO TIPO DE BONECO (3D vs 2D) */}
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-[#090c14] p-0.5 rounded-lg border border-amber-500/20">
                <button
                  type="button"
                  onClick={() => onChange({ ...sheet, tokenType: '3d' })}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-serif transition-all cursor-pointer ${
                    activeTokenType === '3d'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Box className="w-3 h-3 text-sky-400" />
                  <span>Modelo 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...sheet, tokenType: 'billboard' })}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-serif transition-all cursor-pointer ${
                    activeTokenType === 'billboard'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <ImageIcon className="w-3 h-3 text-emerald-400" />
                  <span>Token 2D</span>
                </button>
              </div>

              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold uppercase">
                <Check className="w-3 h-3" />
                Ativo no Grid
              </span>
            </div>

            {/* VISUALIZAÇÃO: 3D MODEL OU 2D STANDEE */}
            {activeTokenType === '3d' ? (
              <div className="space-y-1 flex-1 flex flex-col min-h-0 justify-between mt-1.5">
                {/* SELETOR DE MODELO 3D */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevModel}
                    title="Modelo anterior"
                    className="p-1 bg-[#090c14] hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-amber-400 transition-all shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative flex-1 min-w-0">
                    <select
                      value={activeModel.modelUrl}
                      onChange={(e) => onChange({ ...sheet, modelUrl: e.target.value, tokenType: '3d' })}
                      className="w-full bg-[#090c14] border border-amber-500/30 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none pr-6 truncate font-serif"
                    >
                      {CHARACTER_MODELS_3D.map((m) => (
                        <option key={m.id} value={m.modelUrl} className="bg-[#0b0f19] text-amber-200">
                          {m.icon ? `${m.icon} ` : ''}{m.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 text-[8px]">
                      ▼
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextModel}
                    title="Próximo modelo"
                    className="p-1 bg-[#090c14] hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-amber-400 transition-all shrink-0 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CANVAS 3D */}
                <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden rounded-lg bg-[#070a10]/50 border border-slate-800/60">
                  <Model3DViewer modelUrl={activeModel.modelUrl} height={210} />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center mt-1.5 bg-[#070a10]/50 border border-slate-800/60 rounded-lg p-2">
                <ChromaKeyStandee 
                  imageUrl={sheet.avatarUrl} 
                  characterName={sheet.characterName} 
                  isActive={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: TODOS OS INPUTS (CLASSE, RAÇA, NÍVEL, ORIGEM, XP, INSPIRAÇÃO) */}
        <div className="lg:col-span-7 flex flex-col gap-2 h-full overflow-y-auto lg:overflow-hidden pr-0.5">
          
          {/* CARD 1: CLASSE, RAÇA E NÍVEL */}
          <div className="bg3-panel rounded-xl p-2.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Classe, Raça & Nível
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                Nível {sheet.level} (+{Math.floor((sheet.level - 1) / 4) + 2} Prof)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-slate-300 font-serif">Raça</label>
                <select
                  value={sheet.race}
                  onChange={(e) => handleRaceChange(e.target.value)}
                  className="w-full bg-[#090c14] border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Object.keys(DND_RACES).map((raceName) => (
                    <option key={raceName} value={raceName}>{raceName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-slate-300 font-serif">Classe</label>
                <select
                  value={sheet.className}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-[#090c14] border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Object.keys(DND_CLASSES).map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SLIDER DE NÍVEL COMPACTO */}
            <div className="bg-[#090c14] border border-slate-800/80 rounded-lg p-1.5 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Evolução de Nível (1-20)</span>
                <span className="text-amber-400 font-bold">Nvl {sheet.level}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={sheet.level}
                onChange={(e) => handleLevelChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
              />
            </div>

            {/* SUBCLASSE & SUBRAÇA */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[9px] text-slate-400 font-serif">Subraça</label>
                {DND_RACES[sheet.race]?.subraces ? (
                  <select
                    value={sheet.subrace || ''}
                    onChange={(e) => handleSubraceChange(e.target.value)}
                    className="w-full bg-[#090c14] border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {Object.keys(DND_RACES[sheet.race].subraces!).map((subKey) => (
                      <option key={subKey} value={subKey}>{subKey}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value=""
                    placeholder="Nenhuma"
                    disabled
                    className="w-full bg-[#090c14] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-500 opacity-50 cursor-not-allowed"
                  />
                )}
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-slate-400 font-serif">Subclasse</label>
                <input
                  type="text"
                  value={sheet.subclass || ''}
                  onChange={(e) => onChange({ ...sheet, subclass: e.target.value })}
                  placeholder="Ex: Campeão"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: ORIGEM, TENDÊNCIA, XP & INSPIRAÇÃO */}
          <div className="bg3-panel rounded-xl p-2.5 space-y-2 flex-1 flex flex-col justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Origem, Tendência & Experiência
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-slate-300 font-serif">Antecedente</label>
                <select
                  value={sheet.background}
                  onChange={(e) => onChange({ ...sheet, background: e.target.value })}
                  className="w-full bg-[#090c14] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {DND_BACKGROUNDS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-slate-300 font-serif">Tendência</label>
                <select
                  value={sheet.alignment}
                  onChange={(e) => onChange({ ...sheet, alignment: e.target.value })}
                  className="w-full bg-[#090c14] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {DND_ALIGNMENTS.map((align) => (
                    <option key={align} value={align}>{align}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[9px] text-slate-400 font-serif">Pontos de Experiência (XP)</label>
                <input
                  type="number"
                  value={sheet.xp}
                  onChange={(e) => {
                    const newXp = parseInt(e.target.value, 10) || 0;
                    const expectedLevel = calculateLevelFromXP(newXp);
                    if (expectedLevel > sheet.level) {
                      setLevelUpTarget(expectedLevel);
                    }
                    onChange({ ...sheet, xp: newXp });
                  }}
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-slate-400 font-serif">Nome do Jogador</label>
                <input
                  type="text"
                  value={sheet.playerName}
                  onChange={(e) => onChange({ ...sheet, playerName: e.target.value })}
                  placeholder="Nome do jogador..."
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* INSPIRAÇÃO & RESETAR NÍVEL 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {/* TOGGLE INSPIRAÇÃO */}
              <div className="flex items-center justify-between bg-[#090c14] border border-slate-800 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${sheet.inspiration ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-200 font-serif leading-tight">Inspiração</p>
                    <p className="text-[8px] text-slate-400 leading-none">Vantagem em 1 rolagem</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...sheet, inspiration: !sheet.inspiration })}
                  className={`w-9 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer shrink-0 ${
                    sheet.inspiration ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      sheet.inspiration ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* BOTAO RESETAR NÍVEL 1 */}
              <div className="border border-rose-500/30 bg-rose-950/20 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 font-serif">
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    Resetar Nvl 1
                  </span>
                  <p className="text-[8px] text-slate-400 leading-none">Restaura atributos iniciais</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetSheet}
                  className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-[9px] font-bold transition-all shrink-0 active:scale-95 cursor-pointer font-serif flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
