/**
 * lib/auras/auraTypes.ts
 * Definições completas de tipos para o Sistema de Auras Dinâmicas e Efeitos Espaciais.
 */

import { ConditionType } from '../types';

export type AuraShape = 'circle' | 'cube' | 'cylinder';
export type AuraTargetFilter = 'allies' | 'enemies' | 'all';
export type AuraTriggerTiming = 'on_enter' | 'on_turn_start' | 'on_turn_end' | 'continuous_buff';
export type AuraActionType = 'saving_throw' | 'apply_damage' | 'apply_condition' | 'stat_modifier' | 'vision_blocker';
export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AuraEffectAction {
  type: AuraActionType;
  
  // Para Saving Throws & Dano
  saveAbility?: AbilityKey;
  saveDc?: number | 'caster_spell_dc';
  damageFormula?: string;   // ex: '3d8'
  damageType?: string;      // ex: 'Radiante', 'Necrótico', 'Fogo'
  saveHalves?: boolean;     // Se true, metade do dano no sucesso
  
  // Para Condições (ex: Silêncio / Amedrontado)
  condition?: ConditionType;
  
  // Para Buffs / Modificadores Passivos (ex: Aura do Paladino)
  statModifier?: {
    savingThrowsBonus?: number | 'caster_cha_mod';
    acBonus?: number;
    speedBonusFt?: number;
    advantageOnSavesAgainst?: string[]; // ex: ['Frightened', 'Charmed']
  };
}

export interface AuraVisualConfig {
  colorHex: string;         // ex: '#facc15' (Dourado/Radiante), '#8b5cf6' (Arcano)
  opacity: number;          // 0.1 a 0.6
  pulsing: boolean;
  borderStyle: 'solid' | 'dashed' | 'runic';
  textureShader?: 'divine' | 'fire' | 'necrotic' | 'frost' | 'faerie' | 'standard';
}

export interface TokenAura {
  id: string;
  sourceCombatantId: string;
  sourceCombatantName: string;
  spellName?: string;
  name: string;             // ex: 'Spirit Guardians (15ft)', 'Aura de Coragem (10ft)'
  radiusFt: number;         // Raio em pés (10, 15, 30) -> 1 quadrado de 5ft = 1.5m
  shape: AuraShape;
  affects: AuraTargetFilter;
  triggerTiming: AuraTriggerTiming;
  action: AuraEffectAction;
  requiresConcentration?: boolean;
  enabled: boolean;
  visual: AuraVisualConfig;
}

export interface ActiveAuraBuff {
  auraId: string;
  sourceCombatantId: string;
  sourceCombatantName: string;
  auraName: string;
  statModifier: AuraEffectAction['statModifier'];
}

export interface AuraTriggerEvent {
  id: string;
  aura: TokenAura;
  targetCombatantId: string;
  targetCombatantName: string;
  triggerType: 'ENTER' | 'TURN_START' | 'TURN_END';
  timestamp: number;
}
