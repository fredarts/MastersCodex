/**
 * lib/auras/auraPresets.ts
 * Catálogo de Presets Oficiais de Auras de D&D 5e prontas para ativação rápida.
 */

import { TokenAura } from './auraTypes';

export type AuraPresetTemplate = Omit<TokenAura, 'id' | 'sourceCombatantId' | 'sourceCombatantName'>;

export const OFFICIAL_AURA_PRESETS: Record<string, AuraPresetTemplate> = {
  spirit_guardians: {
    spellName: 'Spirit Guardians',
    name: 'Guardiões Espirituais (15ft)',
    radiusFt: 15,
    shape: 'circle',
    affects: 'enemies',
    triggerTiming: 'on_enter',
    requiresConcentration: true,
    enabled: true,
    action: {
      type: 'saving_throw',
      saveAbility: 'WIS',
      saveDc: 'caster_spell_dc',
      damageFormula: '3d8',
      damageType: 'Radiante',
      saveHalves: true,
    },
    visual: {
      colorHex: '#facc15',
      opacity: 0.3,
      pulsing: true,
      borderStyle: 'runic',
      textureShader: 'divine',
    },
  },
  spirit_guardians_necrotic: {
    spellName: 'Spirit Guardians (Necrótico)',
    name: 'Guardiões Espirituais Necróticos (15ft)',
    radiusFt: 15,
    shape: 'circle',
    affects: 'enemies',
    triggerTiming: 'on_enter',
    requiresConcentration: true,
    enabled: true,
    action: {
      type: 'saving_throw',
      saveAbility: 'WIS',
      saveDc: 'caster_spell_dc',
      damageFormula: '3d8',
      damageType: 'Necrótico',
      saveHalves: true,
    },
    visual: {
      colorHex: '#8b5cf6',
      opacity: 0.35,
      pulsing: true,
      borderStyle: 'runic',
      textureShader: 'necrotic',
    },
  },
  aura_of_protection: {
    spellName: 'Aura of Protection',
    name: 'Aura de Proteção do Paladino (10ft)',
    radiusFt: 10,
    shape: 'circle',
    affects: 'allies',
    triggerTiming: 'continuous_buff',
    requiresConcentration: false,
    enabled: true,
    action: {
      type: 'stat_modifier',
      statModifier: {
        savingThrowsBonus: 'caster_cha_mod',
      },
    },
    visual: {
      colorHex: '#38bdf8',
      opacity: 0.25,
      pulsing: true,
      borderStyle: 'dashed',
      textureShader: 'divine',
    },
  },
  aura_of_protection_30: {
    spellName: 'Aura of Protection (30ft)',
    name: 'Aura de Proteção do Paladino (30ft)',
    radiusFt: 30,
    shape: 'circle',
    affects: 'allies',
    triggerTiming: 'continuous_buff',
    requiresConcentration: false,
    enabled: true,
    action: {
      type: 'stat_modifier',
      statModifier: {
        savingThrowsBonus: 'caster_cha_mod',
      },
    },
    visual: {
      colorHex: '#38bdf8',
      opacity: 0.2,
      pulsing: true,
      borderStyle: 'dashed',
      textureShader: 'divine',
    },
  },
  aura_of_courage: {
    spellName: 'Aura of Courage',
    name: 'Aura de Coragem (10ft)',
    radiusFt: 10,
    shape: 'circle',
    affects: 'allies',
    triggerTiming: 'continuous_buff',
    requiresConcentration: false,
    enabled: true,
    action: {
      type: 'stat_modifier',
      statModifier: {
        advantageOnSavesAgainst: ['Frightened'],
      },
    },
    visual: {
      colorHex: '#f59e0b',
      opacity: 0.25,
      pulsing: false,
      borderStyle: 'solid',
      textureShader: 'standard',
    },
  },
  twilight_sanctuary: {
    spellName: 'Twilight Sanctuary',
    name: 'Santuário do Crepúsculo (30ft)',
    radiusFt: 30,
    shape: 'circle',
    affects: 'allies',
    triggerTiming: 'on_turn_end',
    requiresConcentration: false,
    enabled: true,
    action: {
      type: 'stat_modifier',
      statModifier: {
        advantageOnSavesAgainst: ['Charmed', 'Frightened'],
      },
    },
    visual: {
      colorHex: '#6366f1',
      opacity: 0.3,
      pulsing: true,
      borderStyle: 'runic',
      textureShader: 'faerie',
    },
  },
  silence: {
    spellName: 'Silence',
    name: 'Esfera de Silêncio (20ft)',
    radiusFt: 20,
    shape: 'circle',
    affects: 'all',
    triggerTiming: 'continuous_buff',
    requiresConcentration: true,
    enabled: true,
    action: {
      type: 'apply_condition',
      condition: 'Surdo',
    },
    visual: {
      colorHex: '#94a3b8',
      opacity: 0.3,
      pulsing: false,
      borderStyle: 'solid',
      textureShader: 'standard',
    },
  },
  darkness: {
    spellName: 'Darkness',
    name: 'Escuridão Mágica (15ft)',
    radiusFt: 15,
    shape: 'circle',
    affects: 'all',
    triggerTiming: 'continuous_buff',
    requiresConcentration: true,
    enabled: true,
    action: {
      type: 'vision_blocker',
      condition: 'Cego',
    },
    visual: {
      colorHex: '#0f172a',
      opacity: 0.75,
      pulsing: true,
      borderStyle: 'solid',
      textureShader: 'necrotic',
    },
  },
  pass_without_trace: {
    spellName: 'Pass Without Trace',
    name: 'Passos Sem Pegadas (30ft)',
    radiusFt: 30,
    shape: 'circle',
    affects: 'allies',
    triggerTiming: 'continuous_buff',
    requiresConcentration: true,
    enabled: true,
    action: {
      type: 'stat_modifier',
      statModifier: {
        speedBonusFt: 0,
      },
    },
    visual: {
      colorHex: '#10b981',
      opacity: 0.2,
      pulsing: false,
      borderStyle: 'dashed',
      textureShader: 'standard',
    },
  },
};

/**
 * Cria uma instância de TokenAura a partir de um preset e combatente
 */
export function createAuraFromPreset(
  presetKey: keyof typeof OFFICIAL_AURA_PRESETS,
  sourceCombatantId: string,
  sourceCombatantName: string,
  overrides?: Partial<TokenAura>
): TokenAura {
  const preset = OFFICIAL_AURA_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Preset de aura '${presetKey}' não encontrado.`);
  }

  return {
    id: `aura-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sourceCombatantId,
    sourceCombatantName,
    ...preset,
    ...overrides,
  };
}
