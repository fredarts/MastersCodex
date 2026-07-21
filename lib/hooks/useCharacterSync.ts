'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CharacterSheet } from '@/lib/types';
import { createEmptyCharacterSheet } from '@/lib/dnd5e-data';

const STORAGE_KEY = 'masters_codex_dnd_character_sheets';

export interface UseCharacterSyncOptions {
  userId: string;
  campaignId?: string | null;
  onRemoteSheetChange?: (sheet: CharacterSheet) => void;
}

export function useCharacterSync({ userId, campaignId, onRemoteSheetChange }: UseCharacterSyncOptions) {
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Carrega fichas (Supabase primeiro, localStorage como fallback)
  const fetchSheets = useCallback(async () => {
    setIsLoading(true);
    let loadedSheets: CharacterSheet[] = [];

    if (isSupabaseConfigured() && userId) {
      try {
        let query = supabase.from('character_sheets').select('*');
        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        } else {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          loadedSheets = data.map((row) => ({
            ...row.data,
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            characterName: row.character_name || row.data.characterName,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar fichas do Supabase, usando localStorage:', err);
      }
    }

    // Fallback: localStorage se nada veio do Supabase
    if (loadedSheets.length === 0 && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          loadedSheets = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Erro ao ler localStorage:', e);
      }
    }

    // Se ainda não houver nenhuma ficha, cria uma ficha padrão
    if (loadedSheets.length === 0) {
      const defaultSheet = createEmptyCharacterSheet(userId || 'player-1', campaignId || undefined);
      loadedSheets = [defaultSheet];
    }

    setCharacterSheets(loadedSheets);
    setIsLoading(false);
  }, [userId, campaignId]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  // 2. Salva ficha no Supabase + localStorage com Debounce
  const saveSheet = useCallback(
    async (updatedSheet: CharacterSheet) => {
      const sheetWithTimestamp: CharacterSheet = {
        ...updatedSheet,
        updatedAt: new Date().toISOString(),
      };

      // Atualiza estado local imediatamente (UI reativa)
      setCharacterSheets((prev) => {
        const index = prev.findIndex((s) => s.id === sheetWithTimestamp.id);
        let next: CharacterSheet[];
        if (index >= 0) {
          next = [...prev];
          next[index] = sheetWithTimestamp;
        } else {
          next = [sheetWithTimestamp, ...prev];
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });

      // Salva no Supabase via Debounce de 600ms
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        if (!isSupabaseConfigured()) return;
        try {
          await supabase.from('character_sheets').upsert({
            id: sheetWithTimestamp.id,
            user_id: sheetWithTimestamp.userId || userId || 'player-1',
            campaign_id: sheetWithTimestamp.campaignId || campaignId || null,
            character_name: sheetWithTimestamp.characterName || 'Sem Nome',
            data: sheetWithTimestamp,
            updated_at: sheetWithTimestamp.updatedAt,
          });
        } catch (err) {
          console.error('Erro ao sincronizar ficha com Supabase:', err);
        }
      }, 600);
    },
    [userId, campaignId]
  );

  // 3. Realtime Subscription (Escuta mudanças em tempo real feitas pelo Mestre ou Jogador)
  useEffect(() => {
    if (!isSupabaseConfigured() || !campaignId) return;

    const channel = supabase
      .channel(`character_sheets_sync_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_sheets',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            const remoteData = (payload.new as any).data as CharacterSheet;
            if (remoteData) {
              setCharacterSheets((prev) => {
                const idx = prev.findIndex((s) => s.id === remoteData.id);
                if (idx >= 0) {
                  const updatedList = [...prev];
                  updatedList[idx] = remoteData;
                  return updatedList;
                }
                return [remoteData, ...prev];
              });
              if (onRemoteSheetChange) {
                onRemoteSheetChange(remoteData);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, onRemoteSheetChange]);

  return {
    characterSheets,
    isLoading,
    saveSheet,
    refreshSheets: fetchSheets,
  };
}
