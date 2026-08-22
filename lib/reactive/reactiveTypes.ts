import { Combatant } from '@/lib/types';

export type ReactiveTriggerType =
  | 'trap_damage'      // Causa dano ou impõe condição (Estacas, Fogo, Veneno)
  | 'pressure_plate'  // Aciona elemento vinculado (Grade, Porta, Alçapão)
  | 'ambush_spawn'    // Revela monstros ocultos e inicia combate
  | 'audio_ambience'   // Toca som ambiente ou efeito sonoro misterioso
  | 'surface_hazard'; // Superfície de terreno difícil (Graxa, Gelo, Ácido)

export interface ReactiveTrapEffect {
  id?: string;
  type: ReactiveTriggerType;
  name: string;
  description: string;
  detectDC: number;              // CD Percepção Passiva/Investigação para notar
  disarmDC: number;              // CD Prestidigitação para desarmar com Ferramentas
  saveStat?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; // Atributo para Salvaguarda
  saveDC?: number;               // CD da Salvaguarda
  damageDice?: string;           // Ex: '2d10', '4d6'
  damageType?: string;           // 'Perfurante', 'Fogo', 'Veneno', 'Ácido'
  conditionApplied?: string;     // 'Envenenado', 'Caído', 'Impedido', 'Cego'
  targetId?: string;             // ID da porta/grade associada se for pressure_plate
  revealedToPlayers: boolean;    // Se está visível no mapa
  isArmed: boolean;              // Se está armada ou já foi desarmada/disparada
  oneShot: boolean;              // Se dispara apenas uma vez ou sempre que pisar
  soundEffect?: 'trap_spike' | 'trap_explosion' | 'trap_poison' | 'trap_click' | 'gate_close';
}

export interface TrapTriggerResult {
  triggered: boolean;
  detectedEarly: boolean;        // Se foi detectada antes de pisar pela percepção passiva
  message: string;
  damageDealt: number;
  damageDice?: string;
  damageType?: string;
  saveStat?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  saveDC?: number;
  saveRoll?: number;
  saveSuccess?: boolean;
  conditionApplied?: string;
  soundEffect?: string;
  linkedTriggerExecuted?: boolean;
  linkedTargetId?: string;
  updatedTrap: ReactiveTrapEffect;
}

export interface DisarmAttemptResult {
  success: boolean;
  roll: number;
  targetDC: number;
  critFail: boolean; // Se rolou 1 natural ou falhou por 5+, pode disparar a armadilha na cara!
  accidentallyTriggered: boolean;
  message: string;
}
