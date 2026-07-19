'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Sparkles, 
  BookOpen, 
  Tv, 
  LogIn, 
  CheckCircle2, 
  UserCheck, 
  Plus, 
  ArrowLeft, 
  X, 
  ChevronRight, 
  ScrollText, 
  Users,
  Compass,
  LogOut,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserCampaign, CharacterSheet } from '@/lib/types';
import { CharacterSheetModal } from './character-sheet/CharacterSheetModal';
import { CharacterManagerModal } from './character-sheet/CharacterManagerModal';
import { createEmptyCharacterSheet } from '@/lib/dnd5e-data';

interface PlayerLobbyProps {
  onOpenPlayerView: () => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ onOpenPlayerView }) => {
  const { activeCampaign, setActiveCampaign, userCampaigns, joinCampaignByCode, leaveCampaign, feedEvents } = useAuth();
  
  // Navigation & Modal States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(activeCampaign?.id || null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [campaignToLeave, setCampaignToLeave] = useState<UserCampaign | null>(null);
  
  // D&D 5e Character Sheets Multi-State
  const STORAGE_KEY = 'masters_codex_character_sheets_v1';
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {
          console.error('Erro ao carregar fichas salvas:', err);
        }
      }
    }
    const defaultSheet = createEmptyCharacterSheet('player-1', activeCampaign?.id);
    return [defaultSheet];
  });

  const [activeSheet, setActiveSheet] = useState<CharacterSheet>(() => characterSheets[0] || createEmptyCharacterSheet('player-1'));
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // Efeito para salvar fichas no localStorage sempre que houver alteração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characterSheets));
    }
  }, [characterSheets]);

  const handleOpenSheetForCampaign = (camp?: UserCampaign) => {
    // Procura se já existe uma ficha vinculada à campanha ou com o nome do personagem
    const charName = camp?.characterName || 'Aventureiro';
    const foundSheet = characterSheets.find(
      (s) => (camp?.id && s.campaignId === camp.id) || s.characterName.toLowerCase() === charName.toLowerCase()
    );

    if (foundSheet) {
      setActiveSheet(foundSheet);
    } else {
      const newSheet = createEmptyCharacterSheet('player-1', camp?.id);
      newSheet.characterName = charName;
      setCharacterSheets((prev) => [newSheet, ...prev]);
      setActiveSheet(newSheet);
    }
    setIsSheetModalOpen(true);
  };

  const handleCreateNewSheet = () => {
    const newSheet = createEmptyCharacterSheet('player-1');
    newSheet.characterName = `Aventureiro ${characterSheets.length + 1}`;
    setCharacterSheets((prev) => [newSheet, ...prev]);
    setActiveSheet(newSheet);
    setIsManagerModalOpen(false);
    setIsSheetModalOpen(true);
  };

  const handleSelectSheetToEdit = (sheet: CharacterSheet) => {
    setActiveSheet(sheet);
    setIsManagerModalOpen(false);
    setIsSheetModalOpen(true);
  };

  const handleDuplicateSheet = (sheetId: string) => {
    const target = characterSheets.find((s) => s.id === sheetId);
    if (!target) return;

    const cloned: CharacterSheet = {
      ...JSON.parse(JSON.stringify(target)),
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      characterName: `${target.characterName} (Cópia)`,
      updatedAt: new Date().toISOString(),
    };

    setCharacterSheets((prev) => [cloned, ...prev]);
  };

  const handleDeleteSheet = (sheetId: string) => {
    if (characterSheets.length <= 1) {
      alert('Você deve manter ao menos uma ficha de personagem.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir esta ficha de personagem?')) {
      setCharacterSheets((prev) => prev.filter((s) => s.id !== sheetId));
    }
  };

  const handleSaveSheet = (updatedSheet: CharacterSheet) => {
    setActiveSheet(updatedSheet);
    setCharacterSheets((prev) =>
      prev.map((s) => (s.id === updatedSheet.id ? { ...updatedSheet, updatedAt: new Date().toISOString() } : s))
    );
  };
  
  // Form States
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [characterNameInput, setCharacterNameInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);
  const [joinErrorMsg, setJoinErrorMsg] = useState<string | null>(null);

  const handleOpenJoinModal = () => {
    if (characterSheets.length > 0 && !characterNameInput) {
      setCharacterNameInput(characterSheets[0].characterName);
    }
    setIsJoinModalOpen(true);
  };

  const playerCampaigns = userCampaigns.filter((c) => c.role === 'player');

  // Find currently selected campaign
  const currentCampaign = playerCampaigns.find((c) => c.id === selectedCampaignId) || activeCampaign;

  // Filter feed for current active campaign (or public feed)
  const campaignFeed = feedEvents.filter((e) => e.isPublic && (!currentCampaign || e.campaignId === currentCampaign.id || !e.campaignId));

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setIsJoining(true);
    setJoinErrorMsg(null);

    const success = await joinCampaignByCode(inviteCodeInput, characterNameInput);
    setIsJoining(false);

    if (success) {
      const charName = characterNameInput.trim() || 'Seu Personagem';
      setJoinSuccessMsg(`✓ Conectado com sucesso à mesa! Personagem: ${charName}`);
      setInviteCodeInput('');
      setCharacterNameInput('');
      
      // Auto close modal after brief feedback
      setTimeout(() => {
        setJoinSuccessMsg(null);
        setIsJoinModalOpen(false);
      }, 1500);
    } else {
      setJoinErrorMsg('Código de convite inválido ou mesa não encontrada.');
    }
  };

  const handleConfirmLeave = async () => {
    if (!campaignToLeave) return;
    await leaveCampaign(campaignToLeave.id);
    if (selectedCampaignId === campaignToLeave.id) {
      setSelectedCampaignId(null);
    }
    setCampaignToLeave(null);
  };

  const handleSelectCampaign = (camp: UserCampaign) => {
    setActiveCampaign(camp);
    setSelectedCampaignId(camp.id);
  };

  const handleBackToHub = () => {
    setSelectedCampaignId(null);
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col p-6 overflow-y-auto select-none relative">
      {/* ==================== MODAL: CONFIRMAR SAÍDA DA CAMPANHA ==================== */}
      {campaignToLeave && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161c28] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Sair da Campanha</h3>
                <p className="text-xs text-slate-400">Tem certeza que deseja sair desta mesa de jogo?</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#0a0d14] border border-[#2a3449] rounded-xl text-xs space-y-1">
              <span className="text-slate-400">Campanha:</span>
              <strong className="block text-slate-100 font-bold text-sm">{campaignToLeave.title}</strong>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCampaignToLeave(null)}
                className="px-4 py-2.5 rounded-xl border border-[#2a3449] text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-100 font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Campanha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 1. MODAL: ADICIONAR CAMPANHA VIA CÓDIGO ==================== */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Entrar em uma Mesa de Jogo</h3>
                <p className="text-xs text-slate-400">Digite o código enviado pelo seu Dungeon Master</p>
              </div>
            </div>

            {joinSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{joinSuccessMsg}</span>
              </div>
            )}

            {joinErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400" />
                <span>{joinErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Código de Convite da Campanha:
                </label>
                <input
                  type="text"
                  required
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="Ex: O RE-172 ou VALIRIA-89X"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono font-bold uppercase tracking-wider focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Selecione o Personagem para esta Mesa:</span>
                  <span className="text-[10px] text-amber-400 font-mono">({characterSheets.length} ficha(s) salvas)</span>
                </label>

                {characterSheets.length > 0 ? (
                  <select
                    value={characterNameInput}
                    onChange={(e) => setCharacterNameInput(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-bold focus:outline-none transition-all"
                  >
                    <option value="" disabled>
                      -- Selecione um Personagem Salvo --
                    </option>
                    {characterSheets.map((sheet) => (
                      <option key={sheet.id} value={sheet.characterName}>
                        {sheet.characterName} ({sheet.race} {sheet.className} Lvl {sheet.level})
                      </option>
                    ))}
                    <option value="__custom__">✍️ Digitar outro nome de personagem...</option>
                  </select>
                ) : null}

                {/* Input de texto livre caso selecione digitar outro nome ou não tenha fichas salvas */}
                {(characterSheets.length === 0 || characterNameInput === '__custom__') && (
                  <input
                    type="text"
                    required
                    value={characterNameInput === '__custom__' ? '' : characterNameInput}
                    onChange={(e) => setCharacterNameInput(e.target.value)}
                    placeholder="Ex: Kaelen, o Destemido"
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-bold focus:outline-none transition-all mt-2"
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#2a3449] text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isJoining ? 'Conectando...' : 'Conectar à Mesa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2. VISÃO 1: HUB DE CAMPANHAS DO JOGADOR ==================== */}
      {!selectedCampaignId ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded">
                    MODO JOGADOR
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-1">Minhas Campanhas & Mesas de Jogo</h2>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                  Selecione um card para acessar o Diário de Bordo e o Feed da Aventura, ou adicione uma nova mesa via código.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsManagerModalOpen(true)}
                className="flex items-center gap-2 bg-[#141b2d] border border-amber-500/50 hover:border-amber-400 text-amber-400 hover:text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Minhas Fichas ({characterSheets.length})</span>
              </button>

              <button
                onClick={handleOpenJoinModal}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Entrar em Mesa (Código)</span>
              </button>

              <button
                onClick={onOpenPlayerView}
                className="flex items-center gap-2 bg-[#161c28] border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95"
              >
                <Tv className="w-4 h-4" />
                <span>Tela de Exibição (TV/Discord)</span>
              </button>
            </div>
          </div>

          {/* Cards Grid Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" /> Suas Campanhas Ativas ({playerCampaigns.length})
            </h3>
          </div>

          {/* Player Campaigns Cards Grid */}
          {playerCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-[#161c28]/60 border border-dashed border-[#2a3449] rounded-2xl space-y-4 max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <ScrollText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-200">Você ainda não ingressou em nenhuma campanha</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Solicite o código de convite ao seu Dungeon Master e clique no botão abaixo para conectar seu personagem à mesa.
                </p>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeira Campanha</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playerCampaigns.map((camp) => {
                const isActive = activeCampaign?.id === camp.id;
                return (
                  <div
                    key={camp.id}
                    onClick={() => handleSelectCampaign(camp)}
                    className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-xl hover:-translate-y-1 ${
                      isActive
                        ? 'bg-gradient-to-b from-[#1c2436] to-[#121722] border-amber-500/60 shadow-amber-500/10'
                        : 'bg-[#161c28] border-[#2a3449] hover:border-slate-400 hover:bg-[#1a2233]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                            MESA DE JOGO
                          </span>
                          <h4 className="text-lg font-bold text-slate-100 mt-1.5 group-hover:text-amber-300 transition-colors">
                            {camp.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isActive && (
                            <span className="text-[9px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-mono shadow-md">
                              ATIVA
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignToLeave(camp);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg transition-all"
                            title="Sair desta Campanha"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {camp.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#2a3449] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Personagem:</span>
                        </span>
                        <strong className="text-cyan-300 font-semibold">{camp.characterName || 'Aventureiro'}</strong>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-slate-500" />
                          <span>Código da Mesa:</span>
                        </span>
                        <span className="font-mono text-amber-400 font-bold bg-[#0a0d14] px-2 py-0.5 rounded border border-[#2a3449]">
                          {camp.inviteCode}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform gap-1">
                        <span>Acessar Feed da Campanha</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ==================== 3. VISÃO 2: FEED & DETALHES DA CAMPANHA SELECIONADA ==================== */
        <div className="space-y-6 animate-fade-in">
          {/* Top Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#161c28] border border-[#2a3449] p-4 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHub}
                className="flex items-center gap-2 bg-[#0a0d14] hover:bg-[#2a3449] border border-[#2a3449] text-slate-300 hover:text-amber-400 font-bold px-3.5 py-2 rounded-xl text-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Minhas Campanhas</span>
              </button>

              <div className="h-6 w-[1px] bg-[#2a3449]" />

              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                  CAMPANHA SELECIONADA
                </span>
                <h2 className="text-lg font-bold text-slate-100 leading-tight">
                  {currentCampaign?.title || 'Campanha Ativa'}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleOpenSheetForCampaign(currentCampaign || undefined)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Abrir / Editar Ficha D&D 5e</span>
              </button>

              <span className="text-xs font-mono font-bold bg-[#0a0d14] text-slate-300 border border-[#2a3449] px-3 py-1.5 rounded-xl flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Personagem: <strong className="text-cyan-300">{currentCampaign?.characterName || 'Aventureiro'}</strong></span>
              </span>
              <button
                onClick={onOpenPlayerView}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
              >
                <Tv className="w-4 h-4" />
                <span>Modo TV / Discord</span>
              </button>

              {currentCampaign && (
                <button
                  onClick={() => setCampaignToLeave(currentCampaign)}
                  className="flex items-center gap-1.5 bg-[#0a0d14] hover:bg-rose-950/40 border border-[#2a3449] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 font-bold px-3 py-2 rounded-xl text-xs transition-all"
                  title="Sair desta Campanha"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Mesa</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar: Campaign Summary & Character Card */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#161c28] border border-[#2a3449] shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider font-mono">
                  <Shield className="w-4 h-4 text-amber-400" /> Resumo da Mesa
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Descrição:</span>
                    <p className="text-slate-300 bg-[#0a0d14] p-3 rounded-xl border border-[#2a3449] leading-relaxed">
                      {currentCampaign?.description || 'Nenhuma descrição fornecida pelo Mestre.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a0d14] border border-[#2a3449]">
                    <span className="text-slate-400">Código de Convite:</span>
                    <span className="font-mono text-amber-400 font-bold">{currentCampaign?.inviteCode}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a0d14] border border-[#2a3449]">
                    <span className="text-slate-400">Seu Personagem:</span>
                    <span className="font-semibold text-cyan-300">{currentCampaign?.characterName || 'Aventureiro'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Column: Campaign Feed Timeline */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-[#161c28] border border-[#2a3449] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" /> Feed da Aventura & Diário de Bordo
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Resumos de batalhas, encontros com NPCs e histórias marcantes compartilhadas pelo Mestre.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {campaignFeed.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-[#0a0d14]/50 rounded-xl border border-dashed border-[#2a3449] space-y-2">
                    <ScrollText className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs">Nenhum registro público publicado no feed desta campanha até o momento.</p>
                  </div>
                ) : (
                  campaignFeed.map((ev) => (
                    <div key={ev.id} className="p-4 rounded-xl bg-[#0a0d14] border border-[#2a3449] space-y-2 hover:border-slate-500 transition-all">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-amber-300 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>{ev.title}</span>
                        </h4>
                        <span className="text-[9px] font-mono font-bold bg-[#161c28] text-slate-400 border border-[#2a3449] px-2 py-0.5 rounded uppercase">
                          {ev.eventType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-serif leading-relaxed">{ev.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GERENCIADOR DE MÚLTIPLAS FICHAS ==================== */}
      <CharacterManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        characterSheets={characterSheets}
        onSelectSheetToEdit={handleSelectSheetToEdit}
        onCreateNewSheet={handleCreateNewSheet}
        onDuplicateSheet={handleDuplicateSheet}
        onDeleteSheet={handleDeleteSheet}
      />

      {/* ==================== MODAL DA FICHA DE PERSONAGEM D&D 5E ==================== */}
      <CharacterSheetModal
        sheet={activeSheet}
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onSave={handleSaveSheet}
      />
    </div>
  );
};

