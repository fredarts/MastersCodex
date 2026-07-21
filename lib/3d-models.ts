export interface Model3DOption {
  id: string;
  name: string;
  category: 'character' | 'monster';
  modelUrl: string;
  description?: string;
  icon?: string;
}

export const CHARACTER_MODELS_3D: Model3DOption[] = [
  {
    id: 'barbaro',
    name: 'Bárbaro',
    category: 'character',
    modelUrl: '/assets/3d/characters/Barbaro/Barbaro.glb',
    description: 'Guerreiro feroz com traje de pele e lâmina pesada',
    icon: '🪓',
  },
  {
    id: 'bruxo',
    name: 'Bruxo',
    category: 'character',
    modelUrl: '/assets/3d/characters/Bruxo/Bruxo.glb',
    description: 'Conjurador pactuado com patrono místico',
    icon: '🔮',
  },
  {
    id: 'clerigo',
    name: 'Clérigo',
    category: 'character',
    modelUrl: '/assets/3d/characters/Clerigo/Clerigo.glb',
    description: 'Devoto sagrado protegido por armadura e fé divina',
    icon: '✝️',
  },
  {
    id: 'druida',
    name: 'Druida',
    category: 'character',
    modelUrl: '/assets/3d/characters/Duida/Druida.glb',
    description: 'Guardião da natureza com cajado místico e veste clássica',
    icon: '🌿',
  },
  {
    id: 'feiticeiro',
    name: 'Feiticeiro',
    category: 'character',
    modelUrl: '/assets/3d/characters/Feiticeiro/Feiticeiro.glb',
    description: 'Conjurador nato com magia fluindo no sangue',
    icon: '⚡',
  },
  {
    id: 'guerreiro',
    name: 'Guerreiro / Paladino',
    category: 'character',
    modelUrl: '/assets/3d/characters/Guerreiro/Guerreiro.glb',
    description: 'Mestre do combate marcial e armaduras reluzentes',
    icon: '⚔️',
  },
  {
    id: 'mago',
    name: 'Mago / Conjurador',
    category: 'character',
    modelUrl: '/assets/3d/characters/Mago/Mago.glb',
    description: 'Mestre das artes arcanas em pose de conjuração',
    icon: '🪄',
  },
  {
    id: 'monge',
    name: 'Monge',
    category: 'character',
    modelUrl: '/assets/3d/characters/Monge/Monge.glb',
    description: 'Mestre das artes marciais e canalização de Ki',
    icon: '🥋',
  },
  {
    id: 'patrulheiro',
    name: 'Patrulheiro / Ranger',
    category: 'character',
    modelUrl: '/assets/3d/characters/Patrulheiro/Patrulheiro.glb',
    description: 'Caçador ágil e mestre do rastreio na selva',
    icon: '🏹',
  },
  {
    id: 'ladino',
    name: 'Ladino / Bardo',
    category: 'character',
    modelUrl: '/assets/3d/characters/Ladino/Ladino.glb',
    description: 'Especialista furtivo, mestre do golpe traiçoeiro',
    icon: '🗡️',
  },
];

export const MONSTER_MODELS_3D: Model3DOption[] = [
  {
    id: 'esqueleto',
    name: 'Esqueleto Guerreiro',
    category: 'monster',
    modelUrl: '/assets/3d/monsters/Esqueleto/Esqueleto.glb',
    description: 'Morto-vivo empunhando lâmina antiga',
    icon: '💀',
  },
  {
    id: 'goblin',
    name: 'Goblin Comum',
    category: 'monster',
    modelUrl: '/assets/3d/monsters/Goblin/Goblin.glb',
    description: 'Pequeno humanoide astuto e sorrateiro',
    icon: '👺',
  },
  {
    id: 'goblin-arqueiro',
    name: 'Goblin Arqueiro',
    category: 'monster',
    modelUrl: '/assets/3d/monsters/Goblin Arqueiro/Goblin Arqueiro.glb',
    description: 'Atirador de elite da tribo goblin',
    icon: '🏹',
  },
  {
    id: 'lider-hobgoblin',
    name: 'Líder Hobgoblin',
    category: 'monster',
    modelUrl: '/assets/3d/monsters/Líder Hobgoblin/Líder Hobgoblin.glb',
    description: 'Comandante militar temido e blindado',
    icon: '⚔️',
  },
];

export const ALL_3D_MODELS: Model3DOption[] = [...CHARACTER_MODELS_3D, ...MONSTER_MODELS_3D];

/**
 * Tenta encontrar o modelo 3D correspondente baseado no caminho direto ou no nome do personagem/classe.
 */
export function getModelUrlByNameOrPath(
  nameOrUrl?: string,
  defaultFallback: string = '/assets/3d/characters/Guerreiro/Guerreiro.glb'
): string {
  if (!nameOrUrl) return defaultFallback;

  // Se já for um caminho relativo para arquivo .glb
  if (nameOrUrl.startsWith('/') || nameOrUrl.endsWith('.glb')) {
    return nameOrUrl;
  }

  const norm = nameOrUrl
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (norm.includes('barbaro') || norm.includes('barbarian')) {
    return '/assets/3d/characters/Barbaro/Barbaro.glb';
  }
  if (norm.includes('bruxo') || norm.includes('warlock')) {
    return '/assets/3d/characters/Bruxo/Bruxo.glb';
  }
  if (norm.includes('clerigo') || norm.includes('cleric') || norm.includes('paladino') || norm.includes('paladin')) {
    return '/assets/3d/characters/Clerigo/Clerigo.glb';
  }
  if (norm.includes('druida') || norm.includes('druid')) {
    return '/assets/3d/characters/Duida/Druida.glb';
  }
  if (norm.includes('feiticeiro') || norm.includes('sorcerer')) {
    return '/assets/3d/characters/Feiticeiro/Feiticeiro.glb';
  }
  if (norm.includes('guerreiro') || norm.includes('fighter')) {
    return '/assets/3d/characters/Guerreiro/Guerreiro.glb';
  }
  if (norm.includes('mago') || norm.includes('wizard')) {
    return '/assets/3d/characters/Mago/Mago.glb';
  }
  if (norm.includes('monge') || norm.includes('monk')) {
    return '/assets/3d/characters/Monge/Monge.glb';
  }
  if (norm.includes('ladino') || norm.includes('rogue') || norm.includes('bardo') || norm.includes('bard')) {
    return '/assets/3d/characters/Ladino/Ladino.glb';
  }
  if (norm.includes('patrulheiro') || norm.includes('ranger')) {
    return '/assets/3d/characters/Patrulheiro/Patrulheiro.glb';
  }
  if (norm.includes('esqueleto') || norm.includes('skeleton')) {
    return '/assets/3d/monsters/Esqueleto/Esqueleto.glb';
  }
  if (norm.includes('arqueiro') || norm.includes('archer')) {
    return '/assets/3d/monsters/Goblin Arqueiro/Goblin Arqueiro.glb';
  }
  if (norm.includes('lider') || norm.includes('boss') || norm.includes('hobgoblin')) {
    return '/assets/3d/monsters/Líder Hobgoblin/Líder Hobgoblin.glb';
  }
  if (norm.includes('goblin')) {
    return '/assets/3d/monsters/Goblin/Goblin.glb';
  }

  return defaultFallback;
}

/**
 * Busca o modelUrl definitivo do personagem consultando SEMPRE a ficha salva no localStorage.
 * Essa função é a FONTE DE VERDADE para saber qual boneco o jogador escolheu.
 */
export function resolvePlayerModelUrl(characterName: string, fallbackClassName?: string): string {
  try {
    const saved =
      localStorage.getItem('masters_codex_character_sheets_v1') ||
      localStorage.getItem('codex_character_sheets_v1');
    if (saved) {
      const sheets: any[] = JSON.parse(saved);
      const cClean = characterName.split('(')[0].trim().toLowerCase();
      const found = sheets.find((s: any) => {
        if (!s.characterName) return false;
        const sClean = s.characterName.split('(')[0].trim().toLowerCase();
        return (
          sClean === cClean ||
          characterName.toLowerCase().includes(sClean) ||
          s.characterName.toLowerCase().includes(cClean)
        );
      });
      if (found?.modelUrl) return found.modelUrl;
      if (found?.className) return getModelUrlByNameOrPath(found.className);
    }
  } catch (e) {}

  return getModelUrlByNameOrPath(fallbackClassName || characterName);
}
