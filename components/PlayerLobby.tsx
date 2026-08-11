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
  Ghost,
  Copy,
  Map as MapIcon,
  MessageSquare,
  ListOrdered,
  Dices,
  Check,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useSession } from '@/context/SessionContext';
import { UserCampaign, CharacterSheet, MacroBarDisplayMode, SecretRollNotificationMode } from '@/lib/types';
import { CharacterSheetModal } from './character-sheet/CharacterSheetModal';
import { CharacterManagerModal } from './character-sheet/CharacterManagerModal';
import { createEmptyCharacterSheet, generateUuid } from '@/lib/dnd5e-data';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { useAuth } from '@/context/AuthContext';
import { parseRangeString } from '@/lib/utils/dndRangeUtils';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';

import { FloatingDiceRollerHUD } from './live-cockpit/FloatingDiceRollerHUD';
import { PlayerCombatTrackerHUD } from './player-view/PlayerCombatTrackerHUD';
import { PlayerTokenActionDock } from './player-view/PlayerTokenActionDock';
import { PresenceIndicator } from './live-cockpit/PresenceIndicator';
import { SharedGameLog } from './live-cockpit/SharedGameLog';
import { LiveChatPanel } from './live-cockpit/LiveChatPanel';
import { BattleGrid3D } from './BattleGrid3D';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';
import { DysonCanvas } from './map/DysonCanvas';
import { MagicShaderSlideshow } from './MagicShaderSlideshow';
import { normalizeImageUrl, getYouTubeEmbedUrl } from '@/lib/imageUtils';

interface PlayerLobbyProps {
  onOpenPlayerView: () => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ onOpenPlayerView }) => {
  const { activeCampaign, setActiveCampaign, userCampaigns, joinCampaignByCode, leaveCampaign, feedEvents, updateCampaignMemberModelUrl } = useCampaign();
  const { 
    tokenPositions3D, 
    updateTokenPosition3D, 
    combatants, 
    setCombatants,
    initializeFromCombatants,
    currentTurnIndex, 
    setCurrentTurnIndex,
    roundCount, 
    setRoundCount,
    liveDisplayMode,
    combatLogs,
    chatMessages,
    onlineUsers,
    broadcastPlayerRoll,
    broadcastToPlayerView,
    broadcastCombatUpdate,
    updateCombatantState,
    mapData,
    projectedScene,
    drawings,
    broadcastStateRequest,
    selectedTargetId,
  } = useLiveCockpit();
  const { activeScene } = useSession();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useCustomDialog();
  const { setIsOnPlayerCampaignView } = usePartyLoot();
  
  // Navigation & Modal States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(activeCampaign?.id || null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Solicita o snapshot atual do Mestre ao carregar o lobby
  useEffect(() => {
    if (broadcastStateRequest) {
      broadcastStateRequest();
    }
  }, [broadcastStateRequest, activeCampaign?.id]);

  // Se a cena ativa possui combatentes e o estado local está vazio, inicializa os tokens
  useEffect(() => {
    if (activeScene?.combatants && activeScene.combatants.length > 0 && combatants.length === 0) {
      if (setCombatants) setCombatants(activeScene.combatants);
      if (initializeFromCombatants) initializeFromCombatants(activeScene.combatants);
    }
  }, [activeScene?.combatants, combatants.length, setCombatants, initializeFromCombatants]);

  // VTT Player Cockpit UI States
  const [playerCanvasView, setPlayerCanvasView] = useState<'auto' | 'grid' | 'map' | 'art'>('auto');
  const [sidebarTab, setSidebarTab] = useState<'init' | 'log' | 'chat'>('init');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [macroDisplayMode, setMacroDisplayMode] = useState<MacroBarDisplayMode>('both');
  const [secretRollMode, setSecretRollMode] = useState<SecretRollNotificationMode>('subtle_notice');
  const [pendingAttackPayload, setPendingAttackPayload] = useState<any>(null);

  const setPendingAttack = useLiveCockpitStudioStore((state) => state.setPendingAttack);
  const pendingAttackStore = useLiveCockpitStudioStore((state) => state.pendingAttack);
  const setBg3DiceOverlay = useLiveCockpitStudioStore((state) => state.setBg3DiceOverlay);
  const setDiceResult = useLiveCockpitStudioStore((state) => state.setDiceResult);

  const handlePlayerAttackTarget = (target: any) => {
    if (pendingAttackStore && pendingAttackPayload) {
      const attack = pendingAttackPayload;
      const cleanBonus = pendingAttackStore.mod;
      const title = pendingAttackStore.title;
      
      const charName = activeSheet.characterName || 'Jogador';
      const currentActor = combatants.find(
        (c) => c.name.toLowerCase().includes(charName.toLowerCase()) || charName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      setBg3DiceOverlay({
        title,
        actorName: currentActor?.name || activeSheet.characterName,
        targetName: target?.name,
        modifier: cleanBonus,
        targetAc: target?.ac || 10,
        difficultyClass: target?.ac || 10,
        damageDiceFormula: attack.damage || '1d8',
        isRolling: false,
        phase: 'd20',
        onRollComplete: (finalTotal: number, isHitResult: boolean, roll: number) => {
          const isCrit = roll === 20;
          const isFail = roll === 1;

          setDiceResult({
            title,
            roll,
            total: finalTotal,
            isCrit,
            isFail,
          });

          const fullRoll = {
            id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            characterId: activeSheet.id,
            characterName: activeSheet.characterName || charName,
            avatarUrl: activeSheet.avatarUrl,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            rollType: 'attack',
            label: `Ataque: ${attack.name} em ${target.name}`,
            d20Roll: roll,
            d20Roll1: roll,
            modifier: cleanBonus,
            total: finalTotal,
            isCrit,
            isFail,
            damageDice: attack.damage,
            damageType: attack.type,
          };
          
          broadcastPlayerRoll(fullRoll as any);

          if (currentActor && updateCombatantState && liveDisplayMode === 'combat') {
            const isMyTurn = combatants[currentTurnIndex]?.name.toLowerCase().includes(charName.toLowerCase());
            if (isMyTurn && !currentActor.actionUsed) {
              updateCombatantState(currentActor.id, { actionUsed: true });
            }
          }
        }
      });
      
      setPendingAttack(null);
      setPendingAttackPayload(null);
    }
  };

  const handlePlayerNextTurn = () => {
    if (!combatants || combatants.length === 0) return;
    let nextIndex = currentTurnIndex + 1;
    let nextRound = roundCount;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      setRoundCount(nextRound);
    }

    setCurrentTurnIndex(nextIndex);

    // Reseta recursos de ações do combatente cujo turno acabou de encerrar
    const currentActor = combatants[currentTurnIndex];
    if (currentActor && updateCombatantState) {
      updateCombatantState(currentActor.id, {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
        movementUsed: 0,
      });
    }

    // Transmite a nova ordem de turno para o Mestre e demais jogadores
    if (broadcastCombatUpdate) {
      broadcastCombatUpdate({
        combatants,
        currentTurnIndex: nextIndex,
        roundCount: nextRound,
      });
    }

    if (broadcastToPlayerView) {
      broadcastToPlayerView({
        combatants,
        currentTurnIndex: nextIndex,
        roundCount: nextRound,
      });
    }

    const nextActor = combatants[nextIndex];
    toast.success(`Turno encerrado! Próximo a jogar: ${nextActor?.name || 'Próximo combatente'}`);
  };

  const handleCopyInviteCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    toast.success('Código de convite copiado para a área de transferência!');
    setTimeout(() => setCopiedInvite(false), 2000);
  };
  
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

  // Solicita snapshot de estado ao Mestre ao entrar no Lobby da Campanha
  useEffect(() => {
    if (activeCampaign) {
      broadcastStateRequest();
    }
  }, [activeCampaign, broadcastStateRequest]);

  // Efeito para salvar fichas no localStorage sempre que houver alteração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characterSheets));
    }
  }, [characterSheets]);

  // We track currentCampaignId for the member fetch effect
  const currentCampaignIdForMembers = selectedCampaignId || activeCampaign?.id || null;

  // Carrega as fichas do Supabase vinculadas ao usuário conectado e à campanha ativa, mesclando com o localStorage
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    const fetchSheetsFromDb = async () => {
      const uId = user?.id;
      if (!uId || !isValidUuid(uId)) return;
      
      try {
        let query = supabase.from('character_sheets').select('*');
        if (currentCampaignIdForMembers && isValidUuid(currentCampaignIdForMembers)) {
          query = query.or(`user_id.eq.${uId},campaign_id.eq.${currentCampaignIdForMembers}`);
        } else {
          query = query.eq('user_id', uId);
        }

        const { data, error } = await query;
          
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

            const targetActive = finalSheets.find((s) => s.userId === uId && s.characterName !== 'Novo Aventureiro') || finalSheets.find((s) => s.userId === uId) || finalSheets[0] || createEmptyCharacterSheet('player-1');
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
  }, [user?.id, currentCampaignIdForMembers]);

  // Fetch campaign members when campaign changes

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

        if (cId && isValidUuid(cId)) {
          supabase.from('campaign_members').update({
            character_name: updatedWithTimestamp.characterName || 'Sem Nome',
            avatar_url: updatedWithTimestamp.avatarUrl || null,
          }).eq('campaign_id', cId).eq('user_id', uId);
        }
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
        /* ==================== 3. VISÃO 2: COCKPIT DO JOGADOR (CENTRAL DE JOGO) ==================== */
        <div className="flex-1 flex flex-col h-[calc(100vh-100px)] min-h-[650px] space-y-3 animate-fade-in">
          {/* TOP HEADER UNIFICADO (BARRA SUPERIOR) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141a26] border border-[#2a3449] p-3 rounded-2xl shadow-xl shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToHub}
                className="flex items-center gap-1.5 bg-[#0a0d14] hover:bg-[#2a3449] border border-[#2a3449] text-slate-300 hover:text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Minhas Campanhas</span>
              </button>

              <div className="h-6 w-[1px] bg-[#2a3449]" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                    COCKPIT DO JOGADOR
                  </span>
                  {currentCampaign?.inviteCode && (
                    <button
                      onClick={() => handleCopyInviteCode(currentCampaign.inviteCode)}
                      className="text-[10px] font-mono font-bold text-slate-300 bg-[#0a0d14] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                      title="Clique para copiar código de convite da mesa"
                    >
                      <span>Convite: <strong className="text-amber-400">{currentCampaign.inviteCode}</strong></span>
                      {copiedInvite ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-100 leading-tight mt-0.5">
                  {currentCampaign?.title || 'Campanha Ativa'}
                </h2>
              </div>
            </div>

            {/* Controles de Visualização / Projeção do Jogador (Estilo Cockpit DM) */}
            <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-[#2a3449]">
              <button
                onClick={() => setPlayerCanvasView('art')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  playerCanvasView === 'art'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                }`}
                title="Modo Ilustração / Arte da Cena"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Ilustração</span>
              </button>

              <button
                onClick={() => setPlayerCanvasView('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  playerCanvasView === 'map'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                }`}
                title="Modo Dungeon Map 2D"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Dungeon Map</span>
              </button>

              <button
                onClick={() => setPlayerCanvasView('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  playerCanvasView === 'grid' || playerCanvasView === 'auto'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                }`}
                title="Modo Grid 3D / Combate"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Grid 3D / Combate</span>
              </button>
            </div>

            {/* Right Header Actions & Online Avatars */}
            <div className="flex items-center gap-3">
              <PresenceIndicator users={onlineUsers} className="border-r border-[#2a3449] pr-3" />

              <button
                onClick={() => handleOpenSheetForCampaign(currentCampaign || undefined)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Ficha: <strong className="font-extrabold">{resolveCharName(currentCampaign)}</strong></span>
              </button>

              <button
                onClick={onOpenPlayerView}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
              >
                <Tv className="w-4 h-4" />
                <span>Modo TV</span>
              </button>

              {currentCampaign && (
                <button
                  onClick={() => handleLeaveCampaign(currentCampaign)}
                  className="p-1.5 bg-[#0a0d14] hover:bg-rose-950/40 border border-[#2a3449] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-all"
                  title="Sair desta Campanha"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* MAIN WORKSPACE BODY (CANVAS + SIDEBAR) */}
          <div className="flex-1 flex gap-3 overflow-hidden">
            {/* CENTER CANVAS (80% da tela: Grid 3D, Mapa 2D ou Arte da Cena) */}
            <div className="flex-1 bg-[#05070a] border border-[#2a3449] rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-2xl">
              {/* TOP BAR: COMBAT INITIATIVE HUD */}
              {liveDisplayMode === 'combat' && (
                <div className="w-full shrink-0 z-20">
                  <PlayerCombatTrackerHUD
                    combatants={combatants}
                    currentTurnIndex={currentTurnIndex}
                    roundCount={roundCount}
                    playerCharName={resolveCharName(currentCampaign)}
                    isCombatActive={true}
                    characterSheets={characterSheets}
                    activeSheet={activeSheet}
                    campaignMembers={campaignMembers}
                    onEndTurn={handlePlayerNextTurn}
                  />
                </div>
              )}

              {/* CANVAS CONTENT AREA */}
              <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
                {(() => {
                  const activeView = playerCanvasView === 'auto' ? liveDisplayMode : playerCanvasView;
                  const currentScene = projectedScene || activeScene;

                  if (activeView === 'grid' || activeView === 'combat') {
                    return (
                      <ThreeErrorBoundary>
                        <BattleGrid3D
                          combatants={combatants}
                          currentTurnIndex={currentTurnIndex}
                          selectedTargetId={selectedTargetId || undefined}
                          onAttackTarget={handlePlayerAttackTarget}
                          timeOfDayHour={currentScene?.timeOfDayHour}
                          timeOfDayPreset={currentScene?.timeOfDay}
                          hasFog={currentScene?.hasFog}
                          hasRain={currentScene?.hasRain}
                          floorTextureUrl={currentScene?.floorTextureUrl}
                          {...(currentScene?.environmentSettings || {})}
                          interactive={true}
                          userRole="player"
                        />
                      </ThreeErrorBoundary>
                    );
                  }

                  if (activeView === 'map') {
                    const typedMap = mapData as any;
                    if (typedMap && typedMap.grid && typedMap.grid.length > 0) {
                      return (
                        <DysonCanvas
                          grid={typedMap.grid || []}
                          bgImageUrl={typedMap.bgImageUrl || null}
                          gridScale={typedMap.gridScale || 40}
                          gridOffsetX={typedMap.gridOffsetX || 0}
                          gridOffsetY={typedMap.gridOffsetY || 0}
                          combatants={combatants}
                          vectorWalls={typedMap.vectorWalls || []}
                          lightSources={typedMap.lightSources || []}
                          selectedTool="pan"
                          selectedTileType="floor"
                          selectedTokenCombatant={null}
                          onGridChange={() => {}}
                          isPlayerView={true}
                          drawings={drawings}
                        />
                      );
                    }
                  }

                  // Default Scene Artwork View
                  const sceneImages = currentScene?.sceneImages || [];
                  const rawUrl = sceneImages.length > 0
                    ? sceneImages[currentScene?.activeImageIndex ?? 0]?.imageUrl
                    : currentScene?.imageUrl;

                  if (rawUrl) {
                    const ytEmbed = getYouTubeEmbedUrl(rawUrl);
                    if (ytEmbed) {
                      return (
                        <iframe
                          src={ytEmbed}
                          className="w-full h-full border-0 bg-black"
                          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    }
                    return (
                      <MagicShaderSlideshow
                        imageUrl={normalizeImageUrl(rawUrl)}
                        className="w-full h-full"
                      />
                    );
                  }

                  return (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500 font-mono">
                      <ImageIcon className="w-12 h-12 text-slate-600 opacity-40 animate-pulse" />
                      <p className="text-xs text-slate-400">Aguardando Transmissão de Imagem pelo Dungeon Master...</p>
                    </div>
                  );
                })()}
              </div>

              {/* BOTTOM OVERLAY: PLAYER TOKEN ACTION DOCK */}
              {(() => {
                const charName = resolveCharName(currentCampaign);
                const meCombatant = combatants.find(
                  (c) => c.name.toLowerCase().includes(charName.toLowerCase()) || charName.toLowerCase().includes(c.name.toLowerCase())
                );
                const isCombat = liveDisplayMode === 'combat';
                const isMyTurn = isCombat && combatants[currentTurnIndex]?.name.toLowerCase().includes(charName.toLowerCase());

                return (
                  <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex justify-center">
                    <div className="pointer-events-auto w-full max-w-4xl">
                      <PlayerTokenActionDock
                        activeSheet={activeSheet}
                        playerCombatant={meCombatant}
                        isMyTurn={isMyTurn}
                        isCombatActive={isCombat}
                        onStartAttackTargeting={(attack) => {
                          const cleanBonus = parseInt(attack.atkBonus.replace(/[^0-9-]/g, '')) || 0;
                          const rangeText = attack.rangeText || attack.range || attack.name;
                          const rangeInfo = parseRangeString(rangeText);
                          setPendingAttack({
                            title: `Ataque: ${attack.name}`,
                            mod: cleanBonus,
                            actorCombatant: meCombatant,
                            actionDesc: attack.damage,
                            rangeText,
                            rangeInfo,
                          });
                          setPendingAttackPayload(attack);
                          toast.info(`Mirando Ataque: ${attack.name}. Clique na criatura alvo no Grid 3D!`);
                        }}
                        onExecuteRoll={(rollEvent) => {
                          const fullRoll = {
                            id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                            characterId: activeSheet.id,
                            characterName: activeSheet.characterName || charName,
                            avatarUrl: activeSheet.avatarUrl,
                            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                            ...rollEvent
                          };
                          broadcastPlayerRoll(fullRoll as any);
                        }}
                        onUpdateCombatantActionState={(update) => {
                          if (meCombatant && updateCombatantState) {
                            updateCombatantState(meCombatant.id, update);
                          }
                        }}
                        onOpenFullSheet={() => handleOpenSheetForCampaign(currentCampaign || undefined)}
                        onEndTurn={handlePlayerNextTurn}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT SIDEBAR INTEGRADA (INICIATIVA / LOG / CHAT) */}
            <div className="w-80 bg-[#141a26] border border-[#2a3449] rounded-2xl flex flex-col justify-between overflow-hidden shadow-xl shrink-0">
              {/* Tab Navigation */}
              <div className="flex border-b border-[#2a3449] bg-[#0c1018] p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => setSidebarTab('init')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                    sidebarTab === 'init'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Membros ({campaignMembers.length})</span>
                </button>
                <button
                  onClick={() => setSidebarTab('log')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                    sidebarTab === 'log'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>Log ({combatLogs.length})</span>
                </button>
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                    sidebarTab === 'chat'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat ({chatMessages.length})</span>
                </button>
              </div>

              {/* TAB CONTENT */}
              <div className="flex-1 overflow-y-auto">
                {sidebarTab === 'init' ? (
                  <div className="p-3 space-y-4">
                    {/* Widget: Membros do Grupo */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-[#2a3449]">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-400" /> Membros Conectados
                        </span>
                      </div>

                      {campaignMembers.map((member) => {
                        const isMe = member.characterName?.toLowerCase() === currentCampaign?.characterName?.toLowerCase();
                        const initials = (member.characterName || '?').slice(0, 2).toUpperCase();
                        const isDM = member.role === 'dm';
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                              isMe ? 'bg-cyan-950/30 border-cyan-500/40' : isDM ? 'bg-amber-950/20 border-amber-500/30' : 'bg-[#0a0d14] border-[#2a3449]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.characterName} className="w-7 h-7 rounded-lg object-cover border border-[#2a3449]" />
                              ) : (
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border ${isDM ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                                  {initials}
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-200 leading-tight">
                                  {member.characterName || 'Aventureiro'}
                                  {isMe && <span className="ml-1 text-[8px] bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 px-1 rounded font-mono">VOCÊ</span>}
                                </p>
                                <p className="text-[8px] font-mono text-slate-500 uppercase">
                                  {isDM ? '🎲 Dungeon Master' : '⚔️ Jogador'}
                                </p>
                              </div>
                            </div>

                            {!isMe && !isDM && (
                              <button
                                onClick={() => handleViewMemberSheet(member)}
                                disabled={loadingMemberSheet === member.id}
                                className="px-2 py-1 bg-[#161c28] hover:bg-cyan-950/40 border border-[#2a3449] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50"
                                title="Ver Ficha deste Jogador"
                              >
                                {loadingMemberSheet === member.id ? '...' : 'Ficha'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Feed da Aventura resumido */}
                    <div className="space-y-2 pt-2 border-t border-[#2a3449]">
                      <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Diário de Bordo
                      </h4>
                      {campaignFeed.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic bg-[#0a0d14] p-2.5 rounded-xl border border-[#2a3449]">
                          Nenhum registro público no feed da campanha até o momento.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {campaignFeed.slice(0, 3).map((ev) => (
                            <div key={ev.id} className="p-2.5 rounded-xl bg-[#0a0d14] border border-[#2a3449] space-y-1">
                              <h5 className="text-[11px] font-bold text-amber-300">{ev.title}</h5>
                              <p className="text-[10px] text-slate-300 leading-tight">{ev.summary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : sidebarTab === 'log' ? (
                  <SharedGameLog
                    combatLogs={combatLogs}
                    chatMessages={chatMessages}
                    currentUserId={user?.id}
                    isDm={activeCampaign?.dmId === user?.id}
                  />
                ) : (
                  <LiveChatPanel
                    activeSheet={activeSheet}
                    displayMode={macroDisplayMode}
                    secretMode={secretRollMode}
                  />
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

      {/* 3D BG3 Dice Roller Modal & HUD */}
      <FloatingDiceRollerHUD />
    </div>
  );
};

