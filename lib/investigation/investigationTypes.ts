export type BoardScope = 'party' | 'personal';

export type PinItemType = 
  | 'clue' 
  | 'suspect' 
  | 'location' 
  | 'document' 
  | 'quest' 
  | 'custom_note' 
  | 'lore_node';

export type StringColor = 'red' | 'yellow' | 'blue' | 'green' | 'white' | 'purple';

export interface PinBoardItem {
  id: string;
  boardId: string;
  scope: BoardScope;
  ownerUserId?: string; // Preenchido se scope === 'personal'
  type: PinItemType;
  title: string;
  description: string;
  loreNodeId?: string; // Vínculo ao LoreGraph/WorldEntity
  documentId?: string; // Vínculo a documento da campanha
  questId?: string;
  imageUrl?: string;
  position: { x: number; y: number };
  rotationDeg: number; // -6 a +6 graus para realismo visual de papel afixado
  colorTag: StringColor;
  isSecret?: boolean; // Visível apenas para o DM
  isWaxSealed?: boolean; // Visível aos jogadores mas lacrado com selo de cera
  secretNotes?: string; // Anotações exclusivas do DM
  discoveredAt?: string;
  pinnedBy: string; // Nome ou ID do jogador/DM
}

export interface BoardStringConnection {
  id: string;
  boardId: string;
  fromPinId: string;
  toPinId: string;
  stringColor: StringColor;
  label?: string; // Anotação manuscrita livre do jogador/DM sobre o fio
  notes?: string; // Detalhes estendidos da dedução
  isCollapsed?: boolean; // Nota de papel recolhida/colapsada
  createdBy: string;
  createdAt: string;
}

export interface QuestEntry {
  id: string;
  campaignId: string;
  title: string;
  summary: string;
  status: 'rumor' | 'active' | 'leads_found' | 'confrontation' | 'completed' | 'failed';
  giverEntityId?: string;
  targetEntityId?: string;
  rewards?: {
    gold?: number;
    xp?: number;
    customReward?: string;
  };
}

export interface InvestigationBoard {
  id: string;
  campaignId: string;
  scope: BoardScope;
  ownerUserId?: string;
  title: string;
  items: PinBoardItem[];
  connections: BoardStringConnection[];
  activeQuestIds: string[];
  updatedAt: string;
}
