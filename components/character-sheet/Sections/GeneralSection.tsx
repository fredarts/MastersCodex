import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { DND_ALIGNMENTS, DND_BACKGROUNDS, DND_CLASSES, DND_RACES } from '@/lib/dnd5e-data';
import { applyClassPreset, applyLevelChange, applyRacePreset, calculateLevelFromXP, resetSheetToLevel1, revertWildShape } from '@/lib/dnd5e-calculator';
import { User, Shield, Sparkles, Award, Image as ImageIcon, Box, Check, ChevronLeft, ChevronRight, RotateCcw, PawPrint } from 'lucide-react';
import { CHARACTER_MODELS_3D, getModelUrlByNameOrPath } from '@/lib/3d-models';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Model3DViewer } from '../Model3DViewer';
import { LevelUpModal } from '../Modals/LevelUpModal';
import { ZoomableImageModal } from '@/components/ui/ZoomableImageModal';
import { AvatarCropperModal, AvatarSettings } from '@/components/ui/AvatarCropperModal';
import { Settings2 } from 'lucide-react';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface ChromaKeyStandeeProps {
  imageUrl: string;
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
        const threshold = 240; // Limiar de remoção do fundo branco

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Verifica se o pixel é branco ou muito próximo do branco
          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0; // Torna transparente
          } 
          // Suavização simples das bordas
          else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
            const avgDistance = ((threshold - r) + (threshold - g) + (threshold - b)) / 3;
            const alphaFactor = Math.min(1, avgDistance / 20);
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedUrl(canvas.toDataURL());
      } catch (err) {
        console.warn("CORS bloqueou acesso a pixels da imagem. Mostrando imagem original.", err);
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
    <div className="relative w-full h-[260px] flex flex-col items-center justify-end overflow-hidden pb-4">
      {/* Container de Perspectiva 3D */}
      <div 
        className="relative w-full h-full flex flex-col items-center justify-end"
        style={{ perspective: '500px' }}
      >
        {/* Pino/Standee de Personagem Vertical */}
        {processedUrl && (
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
              className="max-h-[200px] w-auto object-contain block mx-auto"
            />
          </div>
        )}

        {/* Base 3D do Pino (Grid de Combate) */}
        <div
          className={`absolute bottom-0 w-36 h-8 rounded-full transition-all duration-300 ${
            isActive
              ? 'border-2 border-amber-500/80 bg-amber-950/20 shadow-[0_6px_14px_rgba(245,158,11,0.5)]'
              : 'border-2 border-slate-700/60 bg-slate-900/40 shadow-[0_3px_6px_rgba(0,0,0,0.6)]'
          }`}
          style={{
            transform: 'rotateX(75deg) translateY(4px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Anel luminoso interno */}
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCropperModalOpen, setIsCropperModalOpen] = useState(false);
  const [avatarAspect, setAvatarAspect] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'tokens'>('identity');

  const handleResetSheet = async () => {
    const confirmed = await showConfirm({
      title: 'Resetar Ficha para Nível 1?',
      message: `Tem certeza que deseja resetar a ficha de "${sheet.characterName || 'Personagem'}" para o Nível 1?\n\nEsta ação redefinirá todos os atributos, pontos de vida, perícias, armas, equipamentos, moedas, magias e talentos para o padrão inicial.\n\nNome, raça, classe, avatar e descrições de história/aparencia (página 2) serão preservados.`,
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

  const [levelUpTarget, setLevelUpTarget] = useState<number | null>(null);

  const handleLevelChange = (newLevel: number) => {
    if (newLevel > sheet.level) {
      setLevelUpTarget(newLevel);
    } else {
      const updated = applyLevelChange(sheet, newLevel);
      onChange(updated);
    }
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

      {/* SELETOR DE SUB-ABAS (BALDUR'S GATE 3 RUNIC TABS) */}
      <div className="shrink-0 flex items-center justify-between border-b border-amber-500/20 pb-1.5">
        <div className="flex items-center gap-1.5 bg-[#0b0e17] p-0.5 rounded-xl border border-amber-500/30">
          <button
            type="button"
            onClick={() => setActiveSubTab('identity')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase font-serif tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'identity'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Identidade & Origem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tokens')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase font-serif tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'tokens'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span>Miniatura 3D & Token Standee</span>
          </button>
        </div>

        <span className="text-[10px] text-amber-400/70 font-serif font-bold uppercase tracking-wider hidden sm:inline">
          {sheet.characterName || 'Personagem'} • Nvl {sheet.level}
        </span>
      </div>

      {/* CONTEÚDO DAS SUB-ABAS */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeSubTab === 'identity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-hidden">
            {/* COLUNA ESQUERDA: NOME, AVATAR & CLASSE/RAÇA */}
            <div className="flex flex-col gap-2.5 h-full overflow-hidden">
              {/* CARD: FOTO E NOME DO PERSONAGEM */}
              <div className="bg3-panel rounded-xl p-2.5 space-y-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative group w-14 h-14 rounded-xl bg-[#0b0f19] border border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {sheet.avatarUrl ? (
                      <>
                        <img 
                          src={sheet.avatarUrl} 
                          alt={sheet.characterName} 
                          onLoad={(e) => setAvatarAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                          className="absolute max-w-none transition-all duration-300" 
                          style={{
                            width: avatarAspect >= 1 ? 'auto' : '100%',
                            height: avatarAspect >= 1 ? '100%' : 'auto',
                            minWidth: avatarAspect >= 1 ? '100%' : 'auto',
                            minHeight: avatarAspect >= 1 ? 'auto' : '100%',
                            top: '50%',
                            left: '50%',
                            transform: sheet.avatarSettings 
                              ? `translate(calc(-50% + ${sheet.avatarSettings.offsetX * (56/256)}px), calc(-50% + ${sheet.avatarSettings.offsetY * (56/256)}px)) scale(${sheet.avatarSettings.zoom})`
                              : `translate(-50%, calc(-50% - 15%)) scale(1.7)`,
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsCropperModalOpen(true); }}
                            className="p-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-transform hover:scale-110 shadow"
                            title="Ajustar Enquadramento"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(true); }}
                            className="p-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded transition-transform hover:scale-110 shadow"
                            title="Ver Imagem Completa"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <User className="w-8 h-8 text-amber-500/50" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-bold tracking-wider text-amber-400/80 uppercase font-serif">
                      Nome do Personagem
                    </label>
                    <input
                      type="text"
                      value={sheet.characterName}
                      onChange={(e) => onChange({ ...sheet, characterName: e.target.value })}
                      placeholder="Ex: Thorin Escudo-de-Carvalho"
                      className="w-full bg-[#090c14] border border-slate-700/80 rounded-lg px-2.5 py-1 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={sheet.avatarUrl || ''}
                    onChange={(e) => onChange({ ...sheet, avatarUrl: e.target.value })}
                    placeholder="URL da imagem / avatar..."
                    className="flex-1 bg-[#090c14] border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                  
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!isSupabaseConfigured()}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const publicUrl = await storageService.uploadAsset(file, 'avatars');
                          onChange({ ...sheet, avatarUrl: publicUrl });
                        } catch (err: any) {
                          showAlert({
                            title: 'Erro no Avatar',
                            message: err.message || 'Erro ao carregar avatar.',
                            variant: 'danger',
                          });
                        }
                      }}
                      className="hidden"
                      id="avatar-upload-input"
                    />
                    <label
                      htmlFor="avatar-upload-input"
                      className={`px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 font-serif ${
                        !isSupabaseConfigured() ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-950'
                      }`}
                    >
                      <span>Upload</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD: RAÇA, CLASSE E NÍVEL */}
              <div className="bg3-panel rounded-xl p-2.5 space-y-2 flex-1 flex flex-col justify-between">
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
            </div>

            {/* COLUNA DIREITA: ORIGEM, TENDÊNCIA, XP & INSPIRAÇÃO */}
            <div className="flex flex-col gap-2.5 h-full overflow-hidden">
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

                {/* INSPIRAÇÃO TOGGLE COMPACTO */}
                <div className="flex items-center justify-between bg-[#090c14] border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <Award className={`w-4 h-4 ${sheet.inspiration ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-[11px] font-bold text-slate-200 font-serif">Inspiração do Mestre</p>
                      <p className="text-[9px] text-slate-400">Garante Vantagem em 1 rolagem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange({ ...sheet, inspiration: !sheet.inspiration })}
                    className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                      sheet.inspiration ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        sheet.inspiration ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* CARD: RESETAR FICHA PARA NÍVEL 1 */}
                <div className="border border-rose-500/30 bg-rose-950/20 rounded-lg p-2 flex items-center justify-between gap-2">
                  <div className="space-y-0.2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 font-serif">
                      <RotateCcw className="w-3 h-3 text-rose-400" />
                      Resetar Nível 1
                    </span>
                    <p className="text-[9px] text-slate-400">
                      Restaura atributos e habilidades mantendo identidade.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSheet}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-[10px] font-bold transition-all shrink-0 active:scale-95 cursor-pointer font-serif flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resetar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'tokens' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-hidden">
            {/* CARD: BONECO 3D */}
            <div
              className={`bg3-panel rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 h-full overflow-hidden ${
                (sheet.tokenType || '3d') === '3d'
                  ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'opacity-70 hover:opacity-90'
              }`}
              onClick={() => onChange({ ...sheet, tokenType: '3d' })}
            >
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-1 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                  Modelo 3D Interativo
                </h3>
                {(sheet.tokenType || '3d') === '3d' && (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60 font-semibold uppercase">
                    <Check className="w-3 h-3" />
                    Ativo no Grid
                  </span>
                )}
              </div>

              {(() => {
                const currentUrl = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className);
                const currentIndex = CHARACTER_MODELS_3D.findIndex((m) => m.modelUrl === currentUrl);
                const activeIndex = currentIndex >= 0 ? currentIndex : 0;
                const activeModel = CHARACTER_MODELS_3D[activeIndex] || CHARACTER_MODELS_3D[0];

                const handlePrev = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const newIndex = (activeIndex - 1 + CHARACTER_MODELS_3D.length) % CHARACTER_MODELS_3D.length;
                  onChange({ ...sheet, modelUrl: CHARACTER_MODELS_3D[newIndex].modelUrl, tokenType: '3d' });
                };

                const handleNext = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const newIndex = (activeIndex + 1) % CHARACTER_MODELS_3D.length;
                  onChange({ ...sheet, modelUrl: CHARACTER_MODELS_3D[newIndex].modelUrl, tokenType: '3d' });
                };

                return (
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-0 justify-between">
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handlePrev}
                        title="Modelo anterior"
                        className="p-1 bg-[#0b0f19] hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-amber-400 transition-all shrink-0 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative flex-1 min-w-0">
                        <select
                          value={activeModel.modelUrl}
                          onChange={(e) => { e.stopPropagation(); onChange({ ...sheet, modelUrl: e.target.value, tokenType: '3d' }); }}
                          className="w-full bg-[#0b0f19] border border-amber-500/30 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none pr-6 truncate"
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
                        onClick={handleNext}
                        title="Próximo modelo"
                        className="p-1 bg-[#0b0f19] hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-amber-400 transition-all shrink-0 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 flex items-center justify-center">
                      <Model3DViewer modelUrl={activeModel.modelUrl} height={200} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* CARD: TOKEN 2D STAND-EE */}
            <div
              className={`bg3-panel rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 h-full overflow-hidden ${
                sheet.tokenType === 'billboard'
                  ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'opacity-70 hover:opacity-90'
              }`}
              onClick={() => onChange({ ...sheet, tokenType: 'billboard' })}
            >
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-1 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Token 2D Standee (Pino de Batalha)
                </h3>
                {sheet.tokenType === 'billboard' && (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60 font-semibold uppercase">
                    <Check className="w-3 h-3" />
                    Ativo no Grid
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                {sheet.avatarUrl ? (
                  <ChromaKeyStandee 
                    imageUrl={sheet.avatarUrl} 
                    characterName={sheet.characterName} 
                    isActive={sheet.tokenType === 'billboard'}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-slate-900/50">
                      <User className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium max-w-[140px]">
                      Adicione um avatar na aba Identidade para usar como token 2D
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ZoomableImageModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        imageUrl={sheet.avatarUrl || ''} 
      />

      <AvatarCropperModal
        isOpen={isCropperModalOpen}
        onClose={() => setIsCropperModalOpen(false)}
        imageUrl={sheet.avatarUrl || ''}
        initialSettings={sheet.avatarSettings}
        onSaveSettings={(settings) => {
          onChange({ ...sheet, avatarSettings: settings });
        }}
      />
    </div>
  );
};
