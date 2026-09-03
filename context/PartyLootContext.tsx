'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PartyLootSession,
  PartyLootItem,
  CharacterCurrency,
  LootDistributionMode,
  CharacterEquipmentItem,
  DirectTransferPayload,
} from '@/lib/types';
import { partyLootService } from '@/lib/services/partyLootService';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { useCampaign } from '@/context/CampaignContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface PartyLootContextType {
  activeLootSession: PartyLootSession | null;
  setActiveLootSession: React.Dispatch<React.SetStateAction<PartyLootSession | null>>;
  isDmLootModalOpen: boolean;
  setIsDmLootModalOpen: (open: boolean) => void;
  isPartyLootModalOpen: boolean;
  setIsPartyLootModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferTargetItem: CharacterEquipmentItem | null;
  setTransferTargetItem: (item: CharacterEquipmentItem | null) => void;
  // Controla se o jogador está na view de campanha do modo jogador
  isOnPlayerCampaignView: boolean;
  setIsOnPlayerCampaignView: (active: boolean) => void;
  pendingReceivedTransfer: DirectTransferPayload | null;
  setPendingReceivedTransfer: (payload: DirectTransferPayload | null) => void;

  // Ações de Negócio
  createLootSession: (params: {
    title: string;
    description?: string;
    distributionMode: LootDistributionMode;
    leaderId?: string;
    leaderCharacterName?: string;
    currency: CharacterCurrency;
    items: Omit<PartyLootItem, 'claimedBy'>[];
  }) => Promise<void>;
  claimItem: (itemId: string, characterName: string, userId?: string) => Promise<void>;
  distributeItem: (itemId: string, targetCharacterName: string, targetUserId?: string) => Promise<void>;
  deleteItemFromPartyLoot: (itemId: string) => Promise<void>;
  splitCurrencyEqually: (targets: (string | { characterName: string; userId?: string })[]) => Promise<void>;
  closeLootSession: () => Promise<void>;
  sendDirectTransfer: (payload: Omit<DirectTransferPayload, 'id' | 'sentAt'>) => Promise<void>;
}

const PartyLootContext = createContext<PartyLootContextType | undefined>(undefined);

export const PartyLootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeCampaign, campaignMembers } = useCampaign();
  const { roleMode } = useAuth();
  const campaignId = activeCampaign?.id || 'default_campaign';

  const [activeLootSession, setActiveLootSession] = useState<PartyLootSession | null>(null);
  const [isDmLootModalOpen, setIsDmLootModalOpen] = useState<boolean>(false);
  const [isPartyLootModalOpen, setIsPartyLootModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferTargetItem, setTransferTargetItem] = useState<CharacterEquipmentItem | null>(null);
  const [pendingReceivedTransfer, setPendingReceivedTransfer] = useState<DirectTransferPayload | null>(null);
  // Flag: true quando o jogador está na view de campanha (feed) do modo jogador
  const [isOnPlayerCampaignView, setIsOnPlayerCampaignView] = useState<boolean>(false);

  // Escutar eventos em tempo real
  const handleRealtimeLootUpdate = useCallback(({ 
    session, 
    splitDetails 
  }: { 
    session: PartyLootSession; 
    splitDetails?: { characterNames: string[]; userIds?: string[]; share: CharacterCurrency } 
  }) => {
    // 1. Processar itens reivindicados/distribuídos
    session.items.forEach((item) => {
      if (item.claimedBy) {
        // Verifica se já estava marcado como pego por este personagem no estado anterior
        const prevItem = activeLootSession?.items.find((i) => i.id === item.id);
        const wasAlreadyClaimed = prevItem && prevItem.claimedBy && 
          prevItem.claimedBy.characterName.toLowerCase() === item.claimedBy.characterName.toLowerCase();

        if (!wasAlreadyClaimed) {
          partyLootService.grantLootToCharacter({
            campaignId,
            characterName: item.claimedBy.characterName,
            userId: item.claimedBy.userId,
            item,
            sourceName: 'Item do Baú da Party',
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('masters_codex_loot_received', {
                detail: { characterName: item.claimedBy.characterName, item },
              })
            );
          }
        }
      }
    });

    // 2. Processar divisão de moedas (persiste para cada personagem da divisão)
    if (splitDetails) {
      splitDetails.characterNames.forEach((charName, idx) => {
        const uId = splitDetails.userIds && splitDetails.userIds[idx];
        partyLootService.grantLootToCharacter({
          campaignId,
          characterName: charName,
          userId: uId,
          currency: splitDetails.share,
          sourceName: 'Divisão de Moedas do Baú da Party',
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('masters_codex_loot_received', {
              detail: { characterName: charName, userId: uId, currency: splitDetails.share },
            })
          );
        }
      });
    }

    setActiveLootSession(session);
    if (session.status === 'active') {
      // Abre o modal de loot em tempo real apenas quando o Mestre acabou de enviar/atualizar o loot
      setIsPartyLootModalOpen(true);
    } else {
      toast.success('🎉 Recompensas totalmente distribuídas! Baú de Loot encerrado.');
      setIsPartyLootModalOpen(false);
    }
  }, [activeLootSession, campaignId]);

  const handleRealtimeLootClose = useCallback(({ sessionId }: { sessionId: string }) => {
    setActiveLootSession((prev) => {
      if (prev?.id === sessionId) {
        return null;
      }
      return prev;
    });
    setIsPartyLootModalOpen(false);
  }, []);

  const handleRealtimeDirectTransfer = useCallback(
    ({ transfer }: { transfer: DirectTransferPayload }) => {
      setPendingReceivedTransfer(transfer);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('masters_codex_direct_transfer_package', {
            detail: transfer,
          })
        );
      }

      const count = (transfer.items && transfer.items.length > 0)
        ? transfer.items.length
        : transfer.item ? 1 : 0;

      const desc = count > 1
        ? `${count} itens`
        : transfer.items?.[0]?.name || transfer.item?.name || 'moedas';

      toast.info(
        `🎁 ${transfer.fromCharacterName} enviou ${desc} para ${transfer.toCharacterName}!`,
        { duration: 6000 }
      );
    },
    []
  );

  const { broadcastPartyLootUpdate, broadcastPartyLootClose, broadcastDirectTransfer } = useRealtimeSync({
    campaignId,
    onPartyLootUpdate: handleRealtimeLootUpdate,
    onPartyLootClose: handleRealtimeLootClose,
    onDirectTransfer: handleRealtimeDirectTransfer,
  });

  // Carregar sessão de loot ativa inicial da campanha
  useEffect(() => {
    if (!campaignId) {
      setActiveLootSession(null);
      return;
    }

    partyLootService.fetchActiveLootSession(campaignId).then((res) => {
      if (res.ok && res.value) {
        setActiveLootSession(res.value);
      } else {
        setActiveLootSession(null);
      }
    });
  }, [campaignId]);

  const createLootSession = async (params: {
    title: string;
    description?: string;
    distributionMode: LootDistributionMode;
    leaderId?: string;
    leaderCharacterName?: string;
    currency: CharacterCurrency;
    items: Omit<PartyLootItem, 'claimedBy'>[];
  }) => {
    const res = await partyLootService.createLootSession({
      campaignId,
      ...params,
    });

    if (res.ok) {
      setActiveLootSession(res.value);
      broadcastPartyLootUpdate({ session: res.value });
      setIsDmLootModalOpen(false);
      setIsPartyLootModalOpen(true);
      toast.success(`🎁 Baú de Loot "${res.value.title}" forjado e disponibilizado para a party!`);
    } else {
      toast.error(res.error.message);
    }
  };

  const claimItem = async (itemId: string, characterName: string, userId?: string) => {
    if (!activeLootSession) return;

    const updatedItems = activeLootSession.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          claimedBy: {
            userId: userId || '',
            characterName,
            claimedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
      return item;
    });

    const updatedSession: PartyLootSession = {
      ...activeLootSession,
      items: updatedItems,
    };

    const res = await partyLootService.updateLootSession(updatedSession);
    if (res.ok) {
      setActiveLootSession(res.value);
      broadcastPartyLootUpdate({ session: res.value });

      const claimedItem = activeLootSession.items.find((i) => i.id === itemId);
      if (claimedItem) {
        await partyLootService.grantLootToCharacter({
          campaignId,
          characterName,
          userId,
          item: claimedItem,
          sourceName: 'Item Resgatado do Baú da Party',
        });
      }

      if (typeof window !== 'undefined' && claimedItem) {
        window.dispatchEvent(
          new CustomEvent('masters_codex_loot_received', {
            detail: { characterName, item: claimedItem },
          })
        );
      }

      toast.success(`Você pegou: ${updatedItems.find((i) => i.id === itemId)?.name}`);
    } else {
      toast.error(res.error.message);
    }
  };

  const distributeItem = async (itemId: string, targetCharacterName: string, targetUserId?: string) => {
    if (!activeLootSession) return;

    const targetItem = activeLootSession.items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const updatedItems = activeLootSession.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          claimedBy: {
            userId: targetUserId || '',
            characterName: targetCharacterName,
            claimedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
      return item;
    });

    const updatedSession: PartyLootSession = {
      ...activeLootSession,
      items: updatedItems,
    };

    const res = await partyLootService.updateLootSession(updatedSession);
    if (res.ok) {
      setActiveLootSession(res.value);
      broadcastPartyLootUpdate({ session: res.value });

      await partyLootService.grantLootToCharacter({
        campaignId,
        characterName: targetCharacterName,
        userId: targetUserId,
        item: targetItem,
        sourceName: 'Item Distribuído pelo Líder/Mestre',
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('masters_codex_loot_received', {
            detail: { characterName: targetCharacterName, item: targetItem },
          })
        );
      }

      toast.success(`Líder atribuiu "${targetItem.name}" para ${targetCharacterName}!`);
    } else {
      toast.error(res.error.message);
    }
  };

  const deleteItemFromPartyLoot = async (itemId: string) => {
    if (!activeLootSession) return;

    const itemToDelete = activeLootSession.items.find((i) => i.id === itemId);
    const updatedItems = activeLootSession.items.filter((item) => item.id !== itemId);

    const updatedSession: PartyLootSession = {
      ...activeLootSession,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    const res = await partyLootService.updateLootSession(updatedSession);
    if (res.ok) {
      setActiveLootSession(res.value);
      broadcastPartyLootUpdate({ session: res.value });
      toast.info(`🗑️ "${itemToDelete?.name || 'Item'}" foi descartado do Baú da Party.`);
    } else {
      toast.error('Erro ao descartar item do baú.');
    }
  };

  const splitCurrencyEqually = async (targets: (string | { characterName: string; userId?: string })[]) => {
    if (!activeLootSession) return;

    const normalizedTargets: { characterName: string; userId?: string }[] = targets.map((t) => {
      if (typeof t === 'string') return { characterName: t };
      return t;
    });

    const playerCount = normalizedTargets.length;
    if (playerCount <= 0) {
      toast.error('Nenhum personagem ativo para dividir o dinheiro.');
      return;
    }

    const { share, remainder } = partyLootService.splitCurrencyEqually(activeLootSession.currency, playerCount);

    const updatedSession: PartyLootSession = {
      ...activeLootSession,
      currency: remainder,
    };

    const res = await partyLootService.updateLootSession(updatedSession);
    if (res.ok) {
      setActiveLootSession(res.value);
      const characterNames = normalizedTargets.map((t) => t.characterName);
      const userIds = normalizedTargets.map((t) => t.userId).filter(Boolean) as string[];

      broadcastPartyLootUpdate({ 
        session: res.value,
        splitDetails: {
          characterNames,
          userIds,
          share,
        }
      });

      // Persiste as moedas diretamente na ficha de cada personagem no Supabase e LocalStorage
      for (const target of normalizedTargets) {
        await partyLootService.grantLootToCharacter({
          campaignId,
          characterName: target.characterName,
          userId: target.userId,
          currency: share,
          sourceName: 'Divisão de Moedas do Baú da Party',
        });
      }

      if (typeof window !== 'undefined') {
        normalizedTargets.forEach((target) => {
          window.dispatchEvent(
            new CustomEvent('masters_codex_loot_received', {
              detail: { characterName: target.characterName, userId: target.userId, currency: share },
            })
          );
        });
      }

      toast.success('💰 Moedas divididas igualmente entre os aventureiros!');
    } else {
      toast.error(res.error.message);
    }
  };

  const closeLootSession = async () => {
    if (!activeLootSession) return;

    const updatedSession: PartyLootSession = {
      ...activeLootSession,
      status: 'completed',
    };

    const res = await partyLootService.updateLootSession(updatedSession);
    const sessionId = activeLootSession.id;
    setActiveLootSession(null);
    setIsPartyLootModalOpen(false);

    if (res.ok) {
      broadcastPartyLootClose({ sessionId });
      toast.success('Sessão de Loot finalizada e arquivada.');
    } else {
      toast.error(res.error.message);
    }
  };

  const sendDirectTransfer = async (payload: Omit<DirectTransferPayload, 'id' | 'sentAt'>) => {
    if (!campaignId) return;

    const transfer: DirectTransferPayload = {
      ...payload,
      campaignId,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tr_${Date.now()}`,
      sentAt: new Date().toISOString(),
    };

    await partyLootService.grantLootToCharacter({
      campaignId,
      characterName: transfer.toCharacterName,
      userId: transfer.toUserId,
      currency: transfer.currency,
      item: transfer.item,
      sourceName: `Transferência Direta (${transfer.fromCharacterName})`,
    });

    broadcastDirectTransfer({ transfer });
    toast.success(`Envio de item/moedas para ${transfer.toCharacterName} realizado!`);
    setIsTransferModalOpen(false);
    setTransferTargetItem(null);
  };

  return (
    <PartyLootContext.Provider
      value={{
        activeLootSession,
        setActiveLootSession,
        isDmLootModalOpen,
        setIsDmLootModalOpen,
        isPartyLootModalOpen,
        setIsPartyLootModalOpen,
        isTransferModalOpen,
        setIsTransferModalOpen,
        transferTargetItem,
        setTransferTargetItem,
        isOnPlayerCampaignView,
        setIsOnPlayerCampaignView,
        pendingReceivedTransfer,
        setPendingReceivedTransfer,
        createLootSession,
        claimItem,
        distributeItem,
        deleteItemFromPartyLoot,
        splitCurrencyEqually,
        closeLootSession,
        sendDirectTransfer,
      }}
    >
      {children}
    </PartyLootContext.Provider>
  );
};

export const usePartyLoot = () => {
  const context = useContext(PartyLootContext);
  if (!context) {
    throw new Error('usePartyLoot deve ser usado dentro de um PartyLootProvider');
  }
  return context;
};
