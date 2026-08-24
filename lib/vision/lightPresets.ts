import { LightSource, VisionType } from '@/lib/types';

export interface LightPreset {
  id: string;
  name: string;
  description: string;
  brightRadiusFeet: number;
  dimRadiusFeet: number;
  colorHex: string;
  intensity: number;
  animation: 'none' | 'torch' | 'pulse' | 'chroma' | 'candle';
  angleDeg?: number; // 360 for radial, < 360 for directional cone
}

export const DND5E_LIGHT_PRESETS: Record<string, LightPreset> = {
  torch: {
    id: 'torch',
    name: 'Tocha (Torch)',
    description: 'Ilumina 20 pés de luz plena e mais 20 pés de penumbra (1 hora).',
    brightRadiusFeet: 20,
    dimRadiusFeet: 40,
    colorHex: '#ff9933',
    intensity: 0.9,
    animation: 'torch',
    angleDeg: 360,
  },
  hooded_lantern: {
    id: 'hooded_lantern',
    name: 'Lampião Coberto (Hooded Lantern)',
    description: 'Ilumina 30 pés de luz plena e mais 30 pés de penumbra (6 horas por frasco de óleo).',
    brightRadiusFeet: 30,
    dimRadiusFeet: 60,
    colorHex: '#ffbb44',
    intensity: 0.95,
    animation: 'none',
    angleDeg: 360,
  },
  bullseye_lantern: {
    id: 'bullseye_lantern',
    name: 'Lampião Furta-Fogo (Bullseye Lantern)',
    description: 'Lança um cone de 60 pés de luz plena e mais 60 pés de penumbra.',
    brightRadiusFeet: 60,
    dimRadiusFeet: 120,
    colorHex: '#ffcc55',
    intensity: 1.0,
    animation: 'none',
    angleDeg: 60,
  },
  candle: {
    id: 'candle',
    name: 'Vela (Candle)',
    description: 'Ilumina 5 pés de luz plena e mais 5 pés de penumbra (1 hora).',
    brightRadiusFeet: 5,
    dimRadiusFeet: 10,
    colorHex: '#ffaa55',
    intensity: 0.6,
    animation: 'candle',
    angleDeg: 360,
  },
  spell_light: {
    id: 'spell_light',
    name: 'Truque Luz (Light Spell)',
    description: 'O objeto emana luz plena em um raio de 20 pés e penumbra por mais 20 pés.',
    brightRadiusFeet: 20,
    dimRadiusFeet: 40,
    colorHex: '#e6f2ff',
    intensity: 1.0,
    animation: 'pulse',
    angleDeg: 360,
  },
  spell_daylight: {
    id: 'spell_daylight',
    name: 'Magia Luz do Dia (Daylight Spell)',
    description: 'Esfera de luz plena com raio de 60 pés e penumbra por mais 60 pés adicionais.',
    brightRadiusFeet: 60,
    dimRadiusFeet: 120,
    colorHex: '#fff7cc',
    intensity: 1.2,
    animation: 'pulse',
    angleDeg: 360,
  },
  spell_faerie_fire: {
    id: 'spell_faerie_fire',
    name: 'Fogo das Fadas (Faerie Fire)',
    description: 'Brilho mágico colorido em raio de 10 pés de penumbra que impede invisibilidade.',
    brightRadiusFeet: 10,
    dimRadiusFeet: 20,
    colorHex: '#d946ef',
    intensity: 0.85,
    animation: 'chroma',
    angleDeg: 360,
  },
};

/**
 * Creates a standard LightSource from a preset ID attached to a token or position.
 */
export function createLightFromPreset(
  presetKey: keyof typeof DND5E_LIGHT_PRESETS | string,
  options: {
    id?: string;
    x: number;
    y: number;
    attachedToTokenId?: string;
    customColor?: string;
  }
): LightSource {
  const preset = DND5E_LIGHT_PRESETS[presetKey] || DND5E_LIGHT_PRESETS.torch;
  return {
    id: options.id || `light-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    x: options.x,
    y: options.y,
    brightRadius: preset.brightRadiusFeet,
    dimRadius: preset.dimRadiusFeet,
    color: options.customColor || preset.colorHex,
    intensity: preset.intensity,
    animation: preset.animation,
    attachedToTokenId: options.attachedToTokenId,
  };
}

/**
 * Computes effective vision range in cells for a combatant based on their vision type and darkvision range.
 */
export function computeEffectiveVisionRangeCells(
  visionType: VisionType = 'normal',
  configuredVisionRangeFeet?: number,
  darkvisionRangeFeet?: number
): number {
  if (visionType === 'darkvision') {
    const dvFeet = darkvisionRangeFeet || 60;
    return Math.max(1, dvFeet / 5);
  }
  if (visionType === 'blindsight' || visionType === 'tremorsense') {
    const senseFeet = configuredVisionRangeFeet || 30;
    return Math.max(1, senseFeet / 5);
  }
  if (visionType === 'truesight') {
    const trueFeet = configuredVisionRangeFeet || 120;
    return Math.max(1, trueFeet / 5);
  }
  const normFeet = configuredVisionRangeFeet || 30;
  return Math.max(1, normFeet / 5);
}
