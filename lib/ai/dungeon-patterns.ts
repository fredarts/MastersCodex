import { DungeonPatternBlueprint } from './dungeon-vision-analyzer';

// Master Pattern 1: Dyson Logos Classic Master Blueprint (Extracted directly from the user's uploaded image)
export const DYSON_LOGOS_MASTER_PATTERN: DungeonPatternBlueprint = {
  id: 'pattern_dyson_logos_classic',
  name: 'Masmorra Clássica Dyson Logos (Salão Pilareado & Passagens Secretas)',
  description: 'Layout profissional com entrada simétrica, salão central com colunas/pilares, suítes de criptas laterais e múltiplos loops de corredores com passagens secretas (S).',
  styleTag: 'dyson_logos',
  gridRatio: { cols: 80, rows: 80 },
  architecturalRules: {
    hasCentralGrandHall: true,
    hasPillaredChambers: true,
    hasSecretPassageLoops: true,
    hasSymmetricEntry: true,
    hasAlcoves: true,
  },
  sampleRooms: [
    {
      name: 'Entrada Curvada Semicircular',
      type: 'entrance',
      relativeBounds: { startColPct: 0.38, startRowPct: 0.82, widthPct: 0.24, heightPct: 0.14 },
      floorTileType: 'stone',
    },
    {
      name: 'Salão Central do Trono com Pilares',
      type: 'boss_room',
      relativeBounds: { startColPct: 0.30, startRowPct: 0.22, widthPct: 0.40, heightPct: 0.22 },
      hasPillars: true,
      floorTileType: 'stone',
    },
    {
      name: 'Cripta Oeste - Ala 1',
      type: 'crypt',
      relativeBounds: { startColPct: 0.12, startRowPct: 0.20, widthPct: 0.14, heightPct: 0.12 },
      floorTileType: 'floor',
    },
    {
      name: 'Cripta Oeste - Ala 2',
      type: 'crypt',
      relativeBounds: { startColPct: 0.12, startRowPct: 0.36, widthPct: 0.14, heightPct: 0.12 },
      floorTileType: 'floor',
    },
    {
      name: 'Cripta Oeste - Ala 3',
      type: 'crypt',
      relativeBounds: { startColPct: 0.12, startRowPct: 0.52, widthPct: 0.14, heightPct: 0.12 },
      floorTileType: 'floor',
    },
    {
      name: 'Labirinto Leste - Galeria de Tesouros',
      type: 'treasury',
      relativeBounds: { startColPct: 0.72, startRowPct: 0.20, widthPct: 0.16, heightPct: 0.24 },
      floorTileType: 'carpet',
    },
    {
      name: 'Câmara Secreta Oculta Leste',
      type: 'secret_chamber',
      relativeBounds: { startColPct: 0.72, startRowPct: 0.50, widthPct: 0.14, heightPct: 0.16 },
      floorTileType: 'floor',
    },
  ],
  sampleElements: [
    { type: 'door', colPct: 0.50, rowPct: 0.82, isSecret: false },
    { type: 'portcullis', colPct: 0.50, rowPct: 0.45, isSecret: false },
    { type: 'trigger', colPct: 0.32, rowPct: 0.48, isSecret: false },
    { type: 'illusion_wall', colPct: 0.50, rowPct: 0.30, isSecret: true },
    { type: 'illusion_wall', colPct: 0.70, rowPct: 0.32, isSecret: true },
    { type: 'illusion_wall', colPct: 0.70, rowPct: 0.55, isSecret: true },
  ],
};

// Master Pattern 2: Labyrinthine Catacombs
export const LILABYRINTH_CATACOMBS_PATTERN: DungeonPatternBlueprint = {
  id: 'pattern_labyrinthine_catacombs',
  name: 'Catacumbas Labirínticas (Passagens Estreitas & Armadilhas)',
  description: 'Layout emaranhado com corredores sinuosos, múltiplos pontos de emboscada, câmaras funerárias menores e várias portas secretas.',
  styleTag: 'catacombs',
  gridRatio: { cols: 80, rows: 80 },
  architecturalRules: {
    hasCentralGrandHall: false,
    hasPillaredChambers: false,
    hasSecretPassageLoops: true,
    hasSymmetricEntry: false,
    hasAlcoves: true,
  },
  sampleRooms: [
    {
      name: 'Portal de Entrada das Catacumbas',
      type: 'entrance',
      relativeBounds: { startColPct: 0.10, startRowPct: 0.10, widthPct: 0.18, heightPct: 0.15 },
      floorTileType: 'dirt',
    },
    {
      name: 'Câmara do Ossuário',
      type: 'crypt',
      relativeBounds: { startColPct: 0.40, startRowPct: 0.35, widthPct: 0.22, heightPct: 0.18 },
      floorTileType: 'stone',
    },
    {
      name: 'Câmara Ritual Profana',
      type: 'boss_room',
      relativeBounds: { startColPct: 0.65, startRowPct: 0.65, widthPct: 0.25, heightPct: 0.22 },
      floorTileType: 'carpet',
    },
  ],
  sampleElements: [
    { type: 'trap', colPct: 0.30, rowPct: 0.25, isSecret: true },
    { type: 'illusion_wall', colPct: 0.63, rowPct: 0.68, isSecret: true },
    { type: 'chest', colPct: 0.75, rowPct: 0.75, isSecret: false },
  ],
};

const STORAGE_KEY = 'codex_custom_dungeon_patterns';

export function getAllDungeonPatterns(): DungeonPatternBlueprint[] {
  const defaults = [DYSON_LOGOS_MASTER_PATTERN, LILABYRINTH_CATACOMBS_PATTERN];

  if (typeof window === 'undefined') return defaults;

  try {
    const customJson = localStorage.getItem(STORAGE_KEY);
    if (customJson) {
      const parsed: DungeonPatternBlueprint[] = JSON.parse(customJson);
      return [...defaults, ...parsed];
    }
  } catch (err) {
    console.error('Erro ao ler padrões customizados do LocalStorage:', err);
  }

  return defaults;
}

export function savePatternToLibrary(pattern: DungeonPatternBlueprint): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getAllDungeonPatterns().filter(
      (p) => !p.id.startsWith('pattern_dyson_') && !p.id.startsWith('pattern_labyrinthine_')
    );
    existing.push(pattern);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Erro ao salvar padrão no LocalStorage:', err);
  }
}

export function getPatternPromptInstructions(patternId?: string): string {
  const patterns = getAllDungeonPatterns();
  const selected = patterns.find((p) => p.id === patternId) || DYSON_LOGOS_MASTER_PATTERN;

  return `
ESTILO DE ARQUITETURA DE ELITE APLICADO (${selected.name}):
- ${selected.description}
- REGRAS ARQUITETÔNICAS OBRIGATÓRIAS:
  1. Salão Central com Pilares: ${selected.architecturalRules.hasPillaredChambers ? 'SIM! Crie 1 salão grande (mínimo 10x8) com "hasPillars": true, deixando células internas como pilares de parede.' : 'NÃO'}
  2. Passagens Secretas em Loop (S): ${selected.architecturalRules.hasSecretPassageLoops ? 'SIM! Posicione de 2 a 4 paredes ilusórias ("illusion_wall") interligando salas adjacentes e corredores para criar caminhos de flanqueamento.' : 'NÃO'}
  3. Entrada Simétrica com Alcovas: ${selected.architecturalRules.hasSymmetricEntry ? 'SIM! A entrada deve se conectar a uma grande galeria/corredor com alcovas laterais.' : 'NÃO'}
  4. Formato das Salas: Crie salas quadradas, retangulares e salões compostos em vez de blocos simples.
`;
}
