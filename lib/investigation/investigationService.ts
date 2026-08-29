import { 
  InvestigationBoard, 
  PinBoardItem, 
  BoardStringConnection, 
  BoardScope, 
  StringColor,
  PinItemType 
} from './investigationTypes';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';

const STORAGE_PREFIX = 'codex_investigation_board_';

export const investigationService = {
  getBoardStorageKey(campaignId: string, scope: BoardScope, ownerUserId?: string): string {
    if (scope === 'personal') {
      return `${STORAGE_PREFIX}${campaignId}_personal_${ownerUserId || 'anon'}`;
    }
    return `${STORAGE_PREFIX}${campaignId}_party`;
  },

  async getBoard(
    campaignId: string, 
    scope: BoardScope = 'party', 
    ownerUserId?: string
  ): Promise<InvestigationBoard> {
    const key = this.getBoardStorageKey(campaignId, scope, ownerUserId);

    // 1. Tentar buscar no Supabase se configurado e for UUID válido
    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      try {
        let query = supabase
          .from('investigation_boards')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('scope', scope);

        if (scope === 'personal') {
          query = query.eq('owner_user_id', ownerUserId || 'anon');
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          const remoteBoard: InvestigationBoard = {
            id: data.id,
            campaignId: data.campaign_id,
            scope: data.scope,
            ownerUserId: data.owner_user_id || undefined,
            title: data.title || 'Mural de Investigação',
            items: data.items || [],
            connections: data.connections || [],
            activeQuestIds: data.active_quest_ids || [],
            updatedAt: data.updated_at || new Date().toISOString(),
          };

          // Atualiza cache local
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(remoteBoard));
          }
          return remoteBoard;
        }
      } catch (dbErr) {
        console.warn('[InvestigationService] Erro ao carregar do Supabase, usando fallback local:', dbErr);
      }
    }

    // 2. Fallback para LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.warn('[InvestigationService] Erro ao ler localStorage:', e);
      }
    }

    // 3. Criar board padrão inicial se for a primeira vez
    const defaultBoard = this.createDefaultBoard(campaignId, scope, ownerUserId);
    await this.saveBoard(defaultBoard);
    return defaultBoard;
  },

  async saveBoard(board: InvestigationBoard): Promise<void> {
    board.updatedAt = new Date().toISOString();

    // 1. Salvar no LocalStorage para resposta imediata / offline
    if (typeof window !== 'undefined') {
      const key = this.getBoardStorageKey(board.campaignId, board.scope, board.ownerUserId);
      try {
        localStorage.setItem(key, JSON.stringify(board));
        // Notificar componentes abertos na mesma janela
        window.dispatchEvent(
          new CustomEvent('codex_investigation_board_sync', {
            detail: { board }
          })
        );
      } catch (e) {
        console.error('[InvestigationService] Erro ao salvar no localStorage:', e);
      }
    }

    // 2. Persistir no Supabase se configurado
    if (isSupabaseConfigured() && isValidUuid(board.campaignId)) {
      try {
        if (board.scope === 'party') {
          const { data: existing } = await supabase
            .from('investigation_boards')
            .select('id')
            .eq('campaign_id', board.campaignId)
            .eq('scope', 'party')
            .maybeSingle();

          const payload = {
            campaign_id: board.campaignId,
            scope: 'party',
            owner_user_id: null,
            title: board.title || 'Mural de Investigação',
            items: board.items || [],
            connections: board.connections || [],
            updated_at: board.updatedAt,
          };

          if (existing?.id) {
            const { error: updateErr } = await supabase
              .from('investigation_boards')
              .update(payload)
              .eq('id', existing.id);

            if (updateErr) {
              console.error('[InvestigationService] Erro ao atualizar party board no Supabase:', updateErr.message);
            }
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('investigation_boards')
              .insert(payload)
              .select('id')
              .single();

            if (insertErr) {
              console.error('[InvestigationService] Erro ao inserir party board no Supabase:', insertErr.message);
            } else if (inserted?.id) {
              board.id = inserted.id;
            }
          }
        } else {
          // Scope 'personal'
          const { data: existing } = await supabase
            .from('investigation_boards')
            .select('id')
            .eq('campaign_id', board.campaignId)
            .eq('scope', 'personal')
            .eq('owner_user_id', board.ownerUserId || 'anon')
            .maybeSingle();

          const payload = {
            campaign_id: board.campaignId,
            scope: 'personal',
            owner_user_id: board.ownerUserId || 'anon',
            title: board.title || 'Mural de Investigação',
            items: board.items || [],
            connections: board.connections || [],
            updated_at: board.updatedAt,
          };

          if (existing?.id) {
            const { error: updateErr } = await supabase
              .from('investigation_boards')
              .update(payload)
              .eq('id', existing.id);

            if (updateErr) {
              console.error('[InvestigationService] Erro ao atualizar personal board no Supabase:', updateErr.message);
            }
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('investigation_boards')
              .insert(payload)
              .select('id')
              .single();

            if (insertErr) {
              console.error('[InvestigationService] Erro ao inserir personal board no Supabase:', insertErr.message);
            } else if (inserted?.id) {
              board.id = inserted.id;
            }
          }
        }
      } catch (err) {
        console.error('[InvestigationService] Exceção ao salvar no Supabase:', err);
      }
    }
  },

  createDefaultBoard(
    campaignId: string, 
    scope: BoardScope, 
    ownerUserId?: string
  ): InvestigationBoard {
    const isParty = scope === 'party';

    const defaultItems: PinBoardItem[] = isParty ? [
      {
        id: `pin-sample-1`,
        boardId: `board-${campaignId}-${scope}`,
        scope: 'party',
        type: 'suspect',
        title: 'Lorde Malakor',
        description: 'Visto reunindo-se secretamente com contrabandistas no cais ao anoitecer.',
        position: { x: 180, y: 120 },
        rotationDeg: -2.5,
        colorTag: 'red',
        pinnedBy: 'Dungeon Master',
      },
      {
        id: `pin-sample-2`,
        boardId: `board-${campaignId}-${scope}`,
        scope: 'party',
        type: 'clue',
        title: 'Frasco com Selo da Serpente',
        description: 'Encontrado sob as tábuas do assoalho da taverna. Contém resíduos de beladona.',
        position: { x: 520, y: 140 },
        rotationDeg: 3.2,
        colorTag: 'purple',
        pinnedBy: 'Dungeon Master',
      },
      {
        id: `pin-sample-3`,
        boardId: `board-${campaignId}-${scope}`,
        scope: 'party',
        type: 'location',
        title: 'Taverna do Corvo Caolho',
        description: 'Ponto de encontro da guilda clandestina e local do último desaparecimento.',
        position: { x: 350, y: 380 },
        rotationDeg: 1.1,
        colorTag: 'amber' as StringColor,
        pinnedBy: 'Dungeon Master',
      }
    ] : [
      {
        id: `pin-personal-sample-1`,
        boardId: `board-${campaignId}-${scope}`,
        scope: 'personal',
        ownerUserId,
        type: 'custom_note',
        title: 'Minhas Suspeitas Secretas',
        description: 'O estalajadeiro parece saber mais do que diz. Ele desviou o olhar ao mencionar a serpente.',
        position: { x: 260, y: 180 },
        rotationDeg: -1.8,
        colorTag: 'yellow',
        pinnedBy: 'Meu Diário',
      }
    ];

    const defaultConnections: BoardStringConnection[] = isParty ? [
      {
        id: `conn-sample-1`,
        boardId: `board-${campaignId}-${scope}`,
        fromPinId: 'pin-sample-1',
        toPinId: 'pin-sample-3',
        stringColor: 'red',
        label: 'Visto conversando na taverna',
        createdBy: 'Dungeon Master',
        createdAt: new Date().toISOString(),
      },
      {
        id: `conn-sample-2`,
        boardId: `board-${campaignId}-${scope}`,
        fromPinId: 'pin-sample-2',
        toPinId: 'pin-sample-3',
        stringColor: 'purple',
        label: 'Encontrado no quarto dos fundos',
        createdBy: 'Dungeon Master',
        createdAt: new Date().toISOString(),
      }
    ] : [];

    return {
      id: `board-${campaignId}-${scope}-${ownerUserId || 'party'}`,
      campaignId,
      scope,
      ownerUserId,
      title: isParty ? 'Mural de Investigação da Mesa' : 'Meu Diário de Pistas',
      items: defaultItems,
      connections: defaultConnections,
      activeQuestIds: [],
      updatedAt: new Date().toISOString(),
    };
  },

  async addPin(
    board: InvestigationBoard, 
    pinData: Omit<PinBoardItem, 'id' | 'boardId' | 'scope' | 'ownerUserId'>
  ): Promise<{ board: InvestigationBoard; newPin: PinBoardItem }> {
    const newPin: PinBoardItem = {
      ...pinData,
      id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      boardId: board.id,
      scope: board.scope,
      ownerUserId: board.ownerUserId,
    };

    const updatedBoard: InvestigationBoard = {
      ...board,
      items: [...board.items, newPin],
    };

    await this.saveBoard(updatedBoard);
    return { board: updatedBoard, newPin };
  },

  async updatePin(
    board: InvestigationBoard, 
    pinId: string, 
    updates: Partial<PinBoardItem>
  ): Promise<InvestigationBoard> {
    const updatedBoard: InvestigationBoard = {
      ...board,
      items: board.items.map((item) => (item.id === pinId ? { ...item, ...updates } : item)),
    };

    await this.saveBoard(updatedBoard);
    return updatedBoard;
  },

  async deletePin(
    board: InvestigationBoard, 
    pinId: string
  ): Promise<InvestigationBoard> {
    // ATOMIC CASCADE DELETE: Remove pino E todas as conexões de fios associadas
    const updatedBoard: InvestigationBoard = {
      ...board,
      items: board.items.filter((item) => item.id !== pinId),
      connections: board.connections.filter(
        (conn) => conn.fromPinId !== pinId && conn.toPinId !== pinId
      ),
    };

    await this.saveBoard(updatedBoard);
    return updatedBoard;
  },

  async connectPins(
    board: InvestigationBoard,
    fromPinId: string,
    toPinId: string,
    stringColor: StringColor = 'red',
    label?: string,
    createdBy: string = 'Investigador'
  ): Promise<{ board: InvestigationBoard; connection?: BoardStringConnection; error?: string }> {
    // Validação 1: Bloqueia auto-conexão
    if (fromPinId === toPinId) {
      return { board, error: 'Um pino não pode ser conectado a ele mesmo.' };
    }

    // Validação 2: Verifica existência de ambos os pinos
    const fromExists = board.items.some((i) => i.id === fromPinId);
    const toExists = board.items.some((i) => i.id === toPinId);
    if (!fromExists || !toExists) {
      return { board, error: 'Um ou ambos os pinos não existem no mural.' };
    }

    // Validação 3: Previne conexões duplicadas exatas (atualiza cor/label se já existir)
    const existingIdx = board.connections.findIndex(
      (c) =>
        (c.fromPinId === fromPinId && c.toPinId === toPinId) ||
        (c.fromPinId === toPinId && c.toPinId === fromPinId)
    );

    if (existingIdx !== -1) {
      const updatedConnections = [...board.connections];
      updatedConnections[existingIdx] = {
        ...updatedConnections[existingIdx],
        stringColor,
        label: label !== undefined ? label : updatedConnections[existingIdx].label,
      };

      const updatedBoard: InvestigationBoard = {
        ...board,
        connections: updatedConnections,
      };
      await this.saveBoard(updatedBoard);
      return { board: updatedBoard, connection: updatedConnections[existingIdx] };
    }

    const newConnection: BoardStringConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      boardId: board.id,
      fromPinId,
      toPinId,
      stringColor,
      label,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const updatedBoard: InvestigationBoard = {
      ...board,
      connections: [...board.connections, newConnection],
    };

    await this.saveBoard(updatedBoard);
    return { board: updatedBoard, connection: newConnection };
  },

  async updateConnection(
    board: InvestigationBoard,
    connectionId: string,
    updates: Partial<Pick<BoardStringConnection, 'label' | 'notes' | 'isCollapsed' | 'stringColor'>>
  ): Promise<InvestigationBoard> {
    const updatedBoard: InvestigationBoard = {
      ...board,
      connections: board.connections.map((c) =>
        c.id === connectionId ? { ...c, ...updates } : c
      ),
    };
    await this.saveBoard(updatedBoard);
    return updatedBoard;
  },

  async toggleCollapseConnection(
    board: InvestigationBoard,
    connectionId: string
  ): Promise<InvestigationBoard> {
    const updatedBoard: InvestigationBoard = {
      ...board,
      connections: board.connections.map((c) =>
        c.id === connectionId ? { ...c, isCollapsed: !c.isCollapsed } : c
      ),
    };
    await this.saveBoard(updatedBoard);
    return updatedBoard;
  },

  async disconnectPins(
    board: InvestigationBoard, 
    connectionId: string
  ): Promise<InvestigationBoard> {
    const updatedBoard: InvestigationBoard = {
      ...board,
      connections: board.connections.filter((c) => c.id !== connectionId),
    };

    await this.saveBoard(updatedBoard);
    return updatedBoard;
  },

  async sharePinToParty(
    personalPin: PinBoardItem, 
    campaignId: string,
    senderName: string = 'Aventureiro'
  ): Promise<{ partyBoard: InvestigationBoard; sharedPin: PinBoardItem }> {
    const partyBoard = await this.getBoard(campaignId, 'party');

    const sharedPin: PinBoardItem = {
      ...personalPin,
      id: `pin-shared-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      boardId: partyBoard.id,
      scope: 'party',
      ownerUserId: undefined,
      pinnedBy: `Compartilhado por ${senderName}`,
      position: {
        x: personalPin.position.x + (Math.random() * 40 - 20),
        y: personalPin.position.y + (Math.random() * 40 - 20),
      },
    };

    const updatedPartyBoard: InvestigationBoard = {
      ...partyBoard,
      items: [...partyBoard.items, sharedPin],
    };

    await this.saveBoard(updatedPartyBoard);
    return { partyBoard: updatedPartyBoard, sharedPin };
  },

  async toggleWaxSeal(
    board: InvestigationBoard, 
    pinId: string
  ): Promise<InvestigationBoard> {
    const updatedBoard: InvestigationBoard = {
      ...board,
      items: board.items.map((item) =>
        item.id === pinId ? { ...item, isWaxSealed: !item.isWaxSealed } : item
      ),
    };

    await this.saveBoard(updatedBoard);
    return updatedBoard;
  }
};
