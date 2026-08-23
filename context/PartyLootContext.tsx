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
  splitCurrencyEqually: (characterNames: string[]) => Promise<void>;
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
  // Flag: true quando o jogador está na view de campanha (feed) do modo jogador
  const [isOnPlayerCampaignView, setIsOnPlayerCampaignView] = useState<boolean>(false);

  // Abre o modal de loot quando o jogador entra na tela de campanha e há loot ativo (apenas modo jogador)
  useEffect(() => {
    if (roleMode !== 'dm' && isOnPlayerCampaignView && activeLootSession?.status === 'active') {
      // Checagem defensiva: só abrir o modal se realmente houver algum recurso a ser coletado
      const allItemsClaimed = activeLootSession.items.length === 0 || activeLootSession.items.every((i) => i.claimedBy !== null);
      const isCurrencyZero =
        (activeLootSession.currency.po || 0) <= 0 &&
        (activeLootSession.currency.pl || 0) <= 0 &&
        (activeLootSession.currency.pp || 0) <= 0 &&
        (activeLootSession.currency.pc || 0) <= 0 &&
        (activeLootSession.currency.pe || 0) <= 0;

      if (!allItemsClaimed || !isCurrencyZero) {
        setIsPartyLootModalOpen(true);
      }
    }
  }, [roleMode, isOnPlayerCampaignView, activeLootSession]);

  // Escutar eventos em tempo real
  const handleRealtimeLootUpdate = useCallback(({ 
    session, 
    splitDetails 
  }: { 
    session: PartyLootSession; 
    splitDetails?: { characterNames: string[]; share: CharacterCurrency } 
  }) => {
    // Apenas armazena a sessão — o modal só abre quando o jogador entrar na view de campanha.
    // Isso evita que o modal apareça para quem está na tela de mestre ou em outra tela.
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        if (saved) {
          const sheets = JSON.parse(saved);
          const localCharNames: string[] = sheets.map((s: any) => s.characterName.toLowerCase());

          // 1. Processar itens reivindicados/distribuídos
          session.items.forEach((item) => {
            if (item.claimedBy) {
              const isLocalChar = localCharNames.includes(item.claimedBy.characterName.toLowerCase());
              if (isLocalChar) {
                // Verifica se já estava marcado como pego por este personagem no estado anterior
                const prevItem = activeLootSession?.items.find((i) => i.id === item.id);
                const wasAlreadyClaimedByLocal = prevItem && prevItem.claimedBy && 
                  prevItem.claimedBy.characterName.toLowerCase() === item.claimedBy.characterName.toLowerCase();

                if (!wasAlreadyClaimedByLocal) {
                  window.dispatchEvent(
                    new CustomEvent('masters_codex_loot_received', {
                      detail: { characterName: item.claimedBy.characterName, item },
                    })
                  );
                }
              }
            }
          });

          // 2. Processar divisão de moedas (se houver splitDetails e este cliente for participante)
          if (splitDetails) {
            splitDetails.characterNames.forEach((charName) => {
              if (localCharNames.includes(charName.toLowerCase())) {
                window.dispatchEvent(
                  new CustomEvent('masters_codex_loot_received', {
                    detail: { characterName: charName, currency: splitDetails.share },
                  })
                );
              }
            });
          }
        }
      } catch (e) {
        console.error('Erro ao processar atualização de loot em tempo real:', e);
      }
    }

    setActiveLootSession(session);
    if (session.status !== 'active') {
      toast.success('🎉 Recompensas totalmente distribuídas! Baú de Loot encerrado.');
      setIsPartyLootModalOpen(false);
    }
  }, [activeLootSession]);

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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('masters_codex_loot_received', {
            detail: { 
              characterName: transfer.toCharacterName, 
              item: transfer.item, 
              currency: transfer.currency 
            },
          })
        );
      }

      toast.info(
        `📦 ${transfer.fromCharacterName} enviou ${
          transfer.item ? `o item "${transfer.item.name}"` : 'moedas'
        } para ${transfer.toCharacterName}!`,
        { duration: 5000 }
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
    if (!campaignId) {
      toast.error('Nenhuma campanha ativa selecionada.');
      return;
    }

    const res = await partyLootService.createLootSession({
      campaignId,
      ...params,
    });

    if (res.ok) {
      setActiveLootSession(res.value);
      setIsDmLootModalOpen(false);
      // Não abre na tela do Mestre ao enviar loot
      if (roleMode !== 'dm') {
        setIsPartyLootModalOpen(true);
      }
      broadcastPartyLootUpdate({ session: res.value });
      toast.success('🎁 Baú da Party atualizado!');
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

  const splitCurrencyEqually = async (characterNames: string[]) => {
    if (!activeLootSession) return;

    const playerCount = characterNames.length;
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
      broadcastPartyLootUpdate({ 
        session: res.value,
        splitDetails: {
          characterNames,
          share,
        }
      });

      if (typeof window !== 'undefined') {
        characterNames.forEach((charName) => {
          window.dispatchEvent(
            new CustomEvent('masters_codex_loot_received', {
              detail: { characterName: charName, currency: share },
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
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tr_${Date.now()}`,
      campaignId,
      sentAt: new Date().toISOString(),
    };

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
