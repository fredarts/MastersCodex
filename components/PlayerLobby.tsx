'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Heart,
  Swords,
  Activity,
  Lock,
  Eye,
  EyeOff,
  Ghost
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { UserCampaign, CharacterSheet } from '@/lib/types';
import { CharacterSheetModal } from './character-sheet/CharacterSheetModal';
import { CharacterManagerModal } from './character-sheet/CharacterManagerModal';
import { createEmptyCharacterSheet, generateUuid } from '@/lib/dnd5e-data';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { usePartyLoot } from '@/context/PartyLootContext';

interface PlayerLobbyProps {
  onOpenPlayerView: () => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ onOpenPlayerView }) => {
  const { activeCampaign, setActiveCampaign, userCampaigns, joinCampaignByCode, leaveCampaign, feedEvents, updateCampaignMemberModelUrl } = useCampaign();
  const { tokenPositions3D, updateTokenPosition3D, combatants, currentTurnIndex, roundCount, liveDisplayMode } = useLiveCockpit();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useCustomDialog();
  const { setIsOnPlayerCampaignView } = usePartyLoot();
  
  // Navigation & Modal States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(activeCampaign?.id || null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
  // D&D 5e Character Sheets Multi-State
  const STORAGE_KEY = 'masters_codex_character_sheets_v1';
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: CharacterSheet[] = JSON.parse(saved);
          return parsed.map((s) => {
            // Migra ID antigo não-UUID para UUIDv4 válido se necessário
            let currentId = s.id;
            if (!currentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentId)) {
              currentId = generateUuid();
            }
            // Se modelUrl ainda não foi definido pelo jogador, ou está com valor genérico antigo, corrige
            let targetModelUrl = s.modelUrl;
            if (!targetModelUrl || targetModelUrl === '/assets/3d/characters/Duida/Druida.glb') {
              if (s.className && !s.className.toLowerCase().includes('druid')) {
                targetModelUrl = getModelUrlByNameOrPath(s.className);
              }
            }
            return { ...s, id: currentId, modelUrl: targetModelUrl };
          });
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

  // Group members state
  const [campaignMembers, setCampaignMembers] = useState<{id: string; userId: string; characterName?: string; avatarUrl?: string; role: string}[]>([]);
  const [viewingSheet, setViewingSheet] = useState<CharacterSheet | null>(null);
  const [isViewingSheetOpen, setIsViewingSheetOpen] = useState(false);
  const [loadingMemberSheet, setLoadingMemberSheet] = useState<string | null>(null);

  // Efeito para salvar fichas no localStorage sempre que houver alteração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characterSheets));
    }
  }, [characterSheets]);

  // Carrega as fichas do Supabase vinculadas ao usuário conectado e mescla com o localStorage
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    const fetchSheetsFromDb = async () => {
      const uId = user?.id;
      if (!uId || !isValidUuid(uId)) return;
      
      try {
        const { data, error } = await supabase
          .from('character_sheets')
          .select('*')
          .eq('user_id', uId);
          
        if (!error && data) {
          const dbSheets = data.map((row) => ({
            ...row.data,
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            characterName: row.character_name || row.data?.characterName,
            updatedAt: row.updated_at,
          }));

          const dbSheetIds = new Set(dbSheets.map((s) => s.id));
          
          setCharacterSheets((prev) => {
            // Remove local sheets that have a UUID ID but were deleted in Supabase
            const validLocalSheets = prev.filter(
              (s) => !isValidUuid(s.id) || dbSheetIds.has(s.id)
            );

            const merged = [...validLocalSheets];
            dbSheets.forEach((dbS) => {
              const idx = merged.findIndex((s) => s.id === dbS.id);
              if (idx >= 0) {
                const localTime = new Date(merged[idx].updatedAt || 0).getTime();
                const dbTime = new Date(dbS.updatedAt || 0).getTime();
                if (dbTime > localTime) {
                  merged[idx] = dbS;
                }
              } else {
                merged.push(dbS);
              }
            });
            
            const filtered = merged.filter((s) => {
              const isDefaultMock = s.characterName === 'Novo Aventureiro' && !dbSheets.some((dbS) => dbS.id === s.id);
              return !isDefaultMock;
            });
            const finalSheets = filtered.length > 0 ? filtered : (merged.length > 0 ? merged : []);
            
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSheets));
            } catch (e) {}

            const targetActive = finalSheets.find((s) => s.characterName !== 'Novo Aventureiro') || finalSheets[0] || createEmptyCharacterSheet('player-1');
            if (targetActive) {
              setActiveSheet(targetActive);
            }

            return finalSheets;
          });
        }
      } catch (err) {
        console.warn('Erro ao buscar fichas do Supabase:', err);
      }
    };
    
    fetchSheetsFromDb();
  }, [user?.id]);

  // We track currentCampaignId for the member fetch effect
  const currentCampaignIdForMembers = selectedCampaignId || activeCampaign?.id || null;

  // Fetch campaign members when campaign changes
  useEffect(() => {
    if (!currentCampaignIdForMembers) { setCampaignMembers([]); return; }
    const loadMembers = async () => {
      // Try Supabase first
      if (isSupabaseConfigured() && isValidUuid(currentCampaignIdForMembers)) {
        try {
          const { data, error } = await supabase
            .from('campaign_members')
            .select('*')
            .eq('campaign_id', currentCampaignIdForMembers);
          if (!error && data) {
            setCampaignMembers(data.map((m: any) => ({
              id: m.id, userId: m.user_id, characterName: m.character_name, avatarUrl: m.avatar_url, role: m.role || 'player',
            })));
            return;
          }
        } catch (_) {}
      }
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('codex_members');
        const all: any[] = saved ? JSON.parse(saved) : [];
        setCampaignMembers(all.filter((m) => m.campaignId === currentCampaignIdForMembers).map((m) => ({
          id: m.id, userId: m.userId || '', characterName: m.characterName, role: m.role || 'player',
        })));
      } catch (_) { setCampaignMembers([]); }
    };
    loadMembers();
  }, [currentCampaignIdForMembers]);

  const handleViewMemberSheet = async (member: {id: string; userId: string; characterName?: string; role: string}) => {
    setLoadingMemberSheet(member.id);
    let foundSheet: CharacterSheet | null = null;
    if (isSupabaseConfigured() && isValidUuid(member.userId)) {
      try {
        const { data } = await supabase.from('character_sheets').select('*').eq('user_id', member.userId).limit(1);
        if (data && data.length > 0) {
          foundSheet = { ...data[0].data, id: data[0].id, userId: data[0].user_id, campaignId: data[0].campaign_id, characterName: data[0].character_name || data[0].data?.characterName };
        }
      } catch (_) {}
    }
    if (!foundSheet && member.characterName) {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        const sheets: CharacterSheet[] = saved ? JSON.parse(saved) : [];
        foundSheet = sheets.find((s) => s.characterName?.toLowerCase() === member.characterName!.toLowerCase()) || null;
      } catch (_) {}
    }
    setLoadingMemberSheet(null);
    if (!foundSheet) {
      showAlert({
        title: 'Ficha Não Encontrada',
        message: `Nenhuma ficha encontrada para ${member.characterName || 'este jogador'}.`,
        variant: 'warning'
      });
      return;
    }
    if (foundSheet.isPublic === false) {
      showAlert({
        title: 'Ficha Privada',
        message: `🔒 ${member.characterName || 'Este jogador'} bloqueou a visualização da sua ficha.`,
        variant: 'info'
      });
      return;
    }
    setViewingSheet(foundSheet);
    setIsViewingSheetOpen(true);
  };

  const handleOpenSheetForCampaign = (camp?: UserCampaign) => {
    const charName = resolveCharName(camp);
    
    // 1. Procura ficha vinculada à campanha
    let foundSheet = characterSheets.find((s) => camp?.id && s.campaignId === camp.id);
    
    // 2. Se não achar, procura pelo nome do personagem
    if (!foundSheet && charName && charName !== 'Aventureiro') {
      foundSheet = characterSheets.find(
        (s) => s.characterName.toLowerCase() === charName.toLowerCase()
      );
    }

    // 3. Se não achar por nome, mas o usuário tiver apenas uma ficha, vamos sugerir usar essa única ficha
    if (!foundSheet && characterSheets.length === 1 && characterSheets[0].characterName !== 'Novo Aventureiro') {
      foundSheet = characterSheets[0];
      if (camp?.id) {
        foundSheet.campaignId = camp.id;
        handleSaveSheet(foundSheet);
      }
    }

    if (foundSheet) {
      setActiveSheet(foundSheet);
      setIsSheetModalOpen(true);
    } else {
      if (characterSheets.length > 0) {
        setIsManagerModalOpen(true);
        toast.info('Selecione uma ficha de personagem existente ou crie uma nova para esta campanha.');
      } else {
        const newSheet = createEmptyCharacterSheet(user?.id || 'player-1', camp?.id);
        newSheet.characterName = charName !== 'Aventureiro' ? charName : `Aventureiro ${characterSheets.length + 1}`;
        setCharacterSheets((prev) => [newSheet, ...prev]);
        setActiveSheet(newSheet);
        setIsSheetModalOpen(true);
      }
    }
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

  const handleDeleteSheet = async (sheetId: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Ficha de Personagem',
      message: 'Tem certeza que deseja excluir esta ficha de personagem? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir Ficha',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    const sheetToDelete = characterSheets.find((s) => s.id === sheetId);

      // 1. Excluir ficha do Supabase
      if (isSupabaseConfigured()) {
        try {
          if (isValidUuid(sheetId)) {
            const { error: delErr } = await supabase.from('character_sheets').delete().eq('id', sheetId);
            if (delErr) {
              console.error('Erro ao excluir ficha no Supabase:', delErr);
            } else {
              console.log('Ficha excluída com sucesso do Supabase.');
            }
          }

          // Se a ficha estava vinculada a uma campanha, remover a inscrição em campaign_members
          const uId = user?.id || sheetToDelete?.userId;
          if (sheetToDelete?.campaignId && uId) {
            await supabase
              .from('campaign_members')
              .delete()
              .eq('campaign_id', sheetToDelete.campaignId)
              .eq('user_id', uId);
          }
        } catch (err) {
          console.error('Erro ao excluir ficha do Supabase:', err);
        }
      }

      // 2. Atualizar estado local
      setCharacterSheets((prev) => {
        const next = prev.filter((s) => s.id !== sheetId);
        if (activeSheet?.id === sheetId) {
          const fallback = next[0] || createEmptyCharacterSheet('player-1');
          setActiveSheet(fallback);
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
  };

  const handleSaveSheet = (updatedSheet: CharacterSheet) => {
    const updatedWithTimestamp: CharacterSheet = {
      ...updatedSheet,
      updatedAt: new Date().toISOString(),
    };
    setActiveSheet(updatedWithTimestamp);
    setCharacterSheets((prev) => {
      const exists = prev.some((s) => s.id === updatedSheet.id);
      const next = exists
        ? prev.map((s) => (s.id === updatedSheet.id ? updatedWithTimestamp : s))
        : [updatedWithTimestamp, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Transmite evento instantâneo de atualização do modelo de personagem (local e cross-tab)
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'CHARACTER_MODEL_UPDATED',
        sheet: updatedWithTimestamp,
      });
      bc.close();
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('masters_codex_character_model_updated', {
        detail: updatedWithTimestamp,
      })
    );

    // Sincroniza a ficha com o banco de dados Supabase para acesso do Mestre e de outros usuários
    if (isSupabaseConfigured()) {
      const uId = user?.id || updatedWithTimestamp.userId || 'player-1';
      const cId = updatedWithTimestamp.campaignId || activeCampaign?.id || null;
      
      if (isValidUuid(uId)) {
        supabase.from('character_sheets').upsert({
          id: updatedWithTimestamp.id,
          user_id: uId,
          campaign_id: (cId && isValidUuid(cId)) ? cId : null,
          character_name: updatedWithTimestamp.characterName || 'Sem Nome',
          data: updatedWithTimestamp,
          updated_at: updatedWithTimestamp.updatedAt,
        }).then(({ error }) => {
          if (error) {
            console.error('Erro ao sincronizar ficha com Supabase:', error);
          } else {
            console.log('Ficha sincronizada com o Supabase.');
          }
        });
      }
    }

    // Sincroniza modelUrl no Supabase e no codex_members para que o DM veja o modelo correto
    try {
      const targetModelUrl = updatedWithTimestamp.modelUrl || getModelUrlByNameOrPath(updatedWithTimestamp.className || updatedWithTimestamp.characterName);
      const targetCampId = updatedWithTimestamp.campaignId || activeCampaign?.id || '';
      updateCampaignMemberModelUrl(targetCampId, updatedWithTimestamp.characterName, targetModelUrl);

      const memsStr = localStorage.getItem('codex_members');
      if (memsStr) {
        const mems: any[] = JSON.parse(memsStr);
        let changed = false;
        const updatedMems = mems.map((m) => {
          if (
            m.characterName &&
            m.characterName.toLowerCase() === updatedWithTimestamp.characterName.toLowerCase()
          ) {
            if (m.modelUrl !== targetModelUrl) {
              changed = true;
              return { ...m, modelUrl: targetModelUrl };
            }
          }
          return m;
        });
        if (changed) {
          localStorage.setItem('codex_members', JSON.stringify(updatedMems));
        }
      }
    } catch (e) {}
  };

  const handleSaveSheetRef = useRef(handleSaveSheet);
  const characterSheetsRef = useRef(characterSheets);

  useEffect(() => {
    handleSaveSheetRef.current = handleSaveSheet;
    characterSheetsRef.current = characterSheets;
  });

  // Listen for loot received events (claims/direct transfers) and update active sheets in player lobby
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLootReceived = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { characterName, item, currency } = customEvent.detail;
      
      const sheet = characterSheetsRef.current.find(
        (s) => s.characterName.toLowerCase() === characterName.toLowerCase()
      );
      
      if (sheet) {
        const updated = { ...sheet };
        if (item) {
          updated.equipment = [...(updated.equipment || []), item];
        }
        if (currency) {
          const cur = updated.currency || { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 };
          updated.currency = {
            po: cur.po + (currency.po || 0),
            pp: cur.pp + (currency.pp || 0),
            pc: cur.pc + (currency.pc || 0),
            pe: cur.pe + (currency.pe || 0),
            pl: cur.pl + (currency.pl || 0),
          };
        }
        handleSaveSheetRef.current(updated);
      }
    };

    window.addEventListener('masters_codex_loot_received', handleLootReceived);
    return () => window.removeEventListener('masters_codex_loot_received', handleLootReceived);
  }, []);
  
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

  const playerCampaigns = userCampaigns;

  // Find currently selected campaign
  const currentCampaign = playerCampaigns.find((c) => c.id === selectedCampaignId) || activeCampaign;

  // Resolve character name from multiple sources (campaign → sheets → members → fallback)
  const resolveCharName = (camp?: UserCampaign | null): string => {
    if (camp?.characterName) return camp.characterName;
    // Try to find a character sheet linked to this campaign
    const linkedSheet = camp?.id
      ? characterSheets.find((s) => s.campaignId === camp.id)
      : null;
    if (linkedSheet?.characterName && linkedSheet.characterName !== 'Novo Aventureiro') {
      return linkedSheet.characterName;
    }
    // Try to find the name from campaign members (the user's own entry)
    if (camp?.id) {
      const myMember = campaignMembers.find((m) => m.userId === user?.id && m.characterName);
      if (myMember?.characterName) return myMember.characterName;
    }
    return 'Aventureiro';
  };

  // Filter feed for current active campaign (or public feed)
  const campaignFeed = feedEvents.filter((e) => e.isPublic && (!currentCampaign || e.campaignId === currentCampaign.id || !e.campaignId));

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    const charName = characterNameInput.trim() || 'Seu Personagem';
    const selectedSheet = characterSheets.find(
      (s) => s.characterName.toLowerCase() === charName.toLowerCase()
    );
    const modelUrl =
      selectedSheet?.modelUrl ||
      (selectedSheet ? getModelUrlByNameOrPath(selectedSheet.className) : getModelUrlByNameOrPath(charName));

    const success = await joinCampaignByCode(inviteCodeInput, characterNameInput, modelUrl);
    setIsJoining(false);

    if (success) {
      const charName = characterNameInput.trim() || 'Seu Personagem';
      
      // Vincula o campaign_id à ficha do jogador e força o salvamento e upsert no Supabase
      const selectedSheet = characterSheets.find(
        (s) => s.characterName.toLowerCase() === charName.toLowerCase()
      );
      if (selectedSheet) {
        const updated = { 
          ...selectedSheet, 
          campaignId: activeCampaign?.id || selectedCampaignId || undefined 
        };
        handleSaveSheet(updated);
      }
      
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

  const handleLeaveCampaign = async (camp: UserCampaign) => {
    const confirmed = await showConfirm({
      title: 'Sair da Campanha',
      message: `Tem certeza que deseja sair da mesa de jogo "${camp.title}"?`,
      confirmText: 'Sair da Campanha',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    await leaveCampaign(camp.id);
    if (selectedCampaignId === camp.id) {
      setSelectedCampaignId(null);
    }
  };

  const handleSelectCampaign = (camp: UserCampaign) => {
    setActiveCampaign(camp);
    setSelectedCampaignId(camp.id);
  };

  // Sinaliza ao PartyLootContext se o jogador está na view de campanha (para controlar o modal de loot)
  useEffect(() => {
    const isOnView = !!selectedCampaignId;
    setIsOnPlayerCampaignView(isOnView);
    // Limpa a flag ao desmontar
    return () => {
      setIsOnPlayerCampaignView(false);
    };
  }, [selectedCampaignId, setIsOnPlayerCampaignView]);

  const handleBackToHub = () => {
    setSelectedCampaignId(null);
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col p-6 overflow-y-auto select-none relative">

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
                              handleLeaveCampaign(camp);
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
                        <strong className="text-cyan-300 font-semibold">{resolveCharName(camp)}</strong>
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
                <span>Personagem: <strong className="text-cyan-300">{resolveCharName(currentCampaign)}</strong></span>
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
                  onClick={() => handleLeaveCampaign(currentCampaign)}
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
                    <span className="font-semibold text-cyan-300">{resolveCharName(currentCampaign)}</span>
                  </div>
                </div>
              </div>

              {/* Widget de Status do Personagem ao Vivo */}
              {(() => {
                const playerCharName = resolveCharName(currentCampaign);
                const playerCombatant = combatants.find(
                  (c) => c.name.toLowerCase().includes(playerCharName.toLowerCase()) || playerCharName.toLowerCase().includes(c.name.toLowerCase())
                );
                const isCombatActive = liveDisplayMode === 'combat';
                const isMyTurn = isCombatActive && combatants[currentTurnIndex]?.name.toLowerCase().includes(playerCharName.toLowerCase());
                const hpPercent = playerCombatant ? Math.max(0, Math.min(100, (playerCombatant.hp / playerCombatant.maxHp) * 100)) : 100;

                return (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161c28] to-[#121824] border border-amber-500/40 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider">
                          Status ao Vivo (Combate)
                        </h3>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        isCombatActive
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border border-[#2a3449]'
                      }`}>
                        {isCombatActive ? `🟢 EM COMBATE (Rodada ${roundCount})` : '⚪ EXPLORAÇÃO / NARRATIVA'}
                      </span>
                    </div>

                    {playerCombatant ? (
                      <div className="space-y-2.5">
                        {/* HP Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" /> HP:
                            </span>
                            <span className="font-bold text-slate-200">{playerCombatant.hp} / {playerCombatant.maxHp}</span>
                          </div>
                          <div className="w-full h-2 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                            <div
                              className={`h-full transition-all duration-300 ${
                                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* AC, Initiative, Conditions */}
                        <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#2a3449]/50">
                          <span className="text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <Shield className="w-3 h-3 text-cyan-400" /> CA {playerCombatant.ac}
                          </span>
                          <span className="text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded">
                            Iniciativa: #{playerCombatant.initiative}
                          </span>
                        </div>

                        {/* Active Conditions */}
                        {playerCombatant.conditions.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {playerCombatant.conditions.map((cond) => (
                              <span key={cond} className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                                {cond}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Turn Status Alert */}
                        {isCombatActive && (
                          <div className={`p-2 rounded-xl text-xs font-bold font-mono text-center flex items-center justify-center gap-2 ${
                            isMyTurn
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md animate-pulse'
                              : 'bg-[#0a0d14] text-slate-400 border border-[#2a3449]'
                          }`}>
                            <Swords className="w-3.5 h-3.5" />
                            <span>{isMyTurn ? '🗡️ É A SUA VEZ! ABRA A TELA DO JOGADOR' : `Aguardando Turno... (${combatants[currentTurnIndex]?.name || 'Próximo'})`}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic bg-[#0a0d14] p-3 rounded-xl border border-[#2a3449]">
                        Seu personagem ainda não foi adicionado ao combate ativo pelo Mestre.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Widget: Posição na Iniciativa */}
              {liveDisplayMode === 'combat' && combatants.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#161c28] border border-[#2a3449] shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 uppercase font-mono">
                      <Swords className="w-4 h-4 text-amber-400" />
                      Fila de Iniciativa
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {combatants.map((c, i) => {
                      const isCurrentTurn = i === currentTurnIndex;
                      const playerCharName = resolveCharName(currentCampaign);
                      const isMe = c.name.toLowerCase().includes(playerCharName.toLowerCase()) || playerCharName.toLowerCase().includes(c.name.toLowerCase());
                      return (
                        <div key={c.id} className={`flex items-center justify-between p-2 rounded-lg text-[11px] font-mono border ${isCurrentTurn ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold shadow-sm shadow-amber-500/10' : isMe ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300' : 'bg-[#0a0d14] border-[#2a3449] text-slate-400'}`}>
                          <div className="flex items-center gap-2">
                            <span className="opacity-60">#{i + 1}</span>
                            <span>{c.name}</span>
                          </div>
                          {isMe && <span className="text-[9px] bg-cyan-900/60 border border-cyan-500/40 px-1.5 py-0.5 rounded text-cyan-300">VOCÊ</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Widget: Membros do Grupo */}
              <div className="p-4 rounded-2xl bg-[#161c28] border border-[#2a3449] shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 uppercase font-mono">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Membros do Grupo
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500 bg-[#0a0d14] border border-[#2a3449] px-2 py-0.5 rounded">
                    {campaignMembers.length} membro{campaignMembers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {campaignMembers.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 space-y-1">
                    <Ghost className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-[11px]">Nenhum membro encontrado nesta campanha.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaignMembers.map((member) => {
                      const isMe = member.characterName?.toLowerCase() === currentCampaign?.characterName?.toLowerCase();
                      const initials = (member.characterName || '?').slice(0, 2).toUpperCase();
                      const isDM = member.role === 'dm';
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                            isMe ? 'bg-cyan-950/30 border-cyan-500/40' : isDM ? 'bg-amber-950/20 border-amber-500/30' : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.characterName} className="w-8 h-8 rounded-lg object-cover border border-[#2a3449]" />
                            ) : (
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono border ${isDM ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : isMe ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-[#161c28] border-[#2a3449] text-slate-300'}`}>
                                {initials}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-slate-200 leading-tight">
                                {member.characterName || 'Aventureiro'}
                                {isMe && <span className="ml-1 text-[9px] bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 px-1 rounded font-mono">VOCÊ</span>}
                              </p>
                              <p className="text-[9px] font-mono text-slate-500 uppercase">
                                {isDM ? '🎲 Dungeon Master' : '⚔️ Jogador'}
                              </p>
                            </div>
                          </div>

                          {!isMe && !isDM && (
                            <button
                              onClick={() => handleViewMemberSheet(member)}
                              disabled={loadingMemberSheet === member.id}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161c28] hover:bg-cyan-950/40 border border-[#2a3449] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                              title="Ver Ficha deste Jogador"
                            >
                              {loadingMemberSheet === member.id ? <span className="animate-spin text-sm">⟳</span> : <Eye className="w-3.5 h-3.5" />}
                              <span>Ficha</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Privacy toggle for own sheet */}
                {(() => {
                  const mySheet = characterSheets.find(
                    (s) => s.characterName?.toLowerCase() === currentCampaign?.characterName?.toLowerCase()
                  ) || characterSheets[0];
                  if (!mySheet) return null;
                  const isPublic = mySheet.isPublic !== false;
                  return (
                    <div className="pt-2 border-t border-[#2a3449]">
                      <button
                        onClick={() => { const updated = { ...mySheet, isPublic: !isPublic }; handleSaveSheet(updated); setActiveSheet(updated); }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${isPublic ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-400' : 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:border-rose-400'}`}
                        title={isPublic ? 'Ficha visível ao grupo. Clique para tornar privada.' : 'Ficha privada. Clique para tornar visível.'}
                      >
                        <div className="flex items-center gap-2">
                          {isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isPublic ? 'Minha ficha: Visível ao grupo' : 'Minha ficha: Privada'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full border flex items-center transition-all ${isPublic ? 'bg-emerald-500/30 border-emerald-500/50 justify-end' : 'bg-rose-500/10 border-rose-500/30 justify-start'}`}>
                          <div className={`w-3 h-3 rounded-full mx-0.5 ${isPublic ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        </div>
                      </button>
                    </div>
                  );
                })()}
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

      {/* ==================== VIEWER MODAL: FICHA DE OUTRO JOGADOR (SOMENTE LEITURA) ==================== */}
      {isViewingSheetOpen && viewingSheet && (
        <CharacterSheetModal
          sheet={viewingSheet}
          isOpen={isViewingSheetOpen}
          onClose={() => {
            setIsViewingSheetOpen(false);
            setViewingSheet(null);
          }}
          onSave={() => {}}
          readOnly={true}
        />
      )}
    </div>
  );
};

