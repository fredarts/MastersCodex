import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCurrentSceneImage } from '@/lib/imageUtils';

describe('Cross-Account Realtime Synchronization & Projection Modes', () => {
  describe('resolveCurrentSceneImage resolver', () => {
    it('deve extrair a imagem correta a partir de slidePacks ativos', () => {
      const sceneWithPacks = {
        id: 'scene-taverna',
        title: '🍻 O incidente na taverna',
        imageUrl: 'https://example.com/fallback.jpg',
        slidePacks: [
          {
            id: 'pack-main',
            title: 'Taverna Principal',
            images: [
              { imageUrl: 'https://example.com/slide1.jpg', overlayText: 'A taverna cheia' },
              { imageUrl: 'https://example.com/slide2.jpg', overlayText: 'A briga começa' },
            ],
          },
        ],
        activeSlidePackId: 'pack-main',
        activeImageIndex: 1,
      };

      const resolved = resolveCurrentSceneImage(sceneWithPacks);
      expect(resolved).not.toBeNull();
      expect(resolved?.imageUrl).toBe('https://example.com/slide2.jpg');
      expect(resolved?.overlayText).toBe('A briga começa');
      expect(resolved?.activeImageIndex).toBe(1);
    });

    it('deve extrair imagem quando environmentSettings.slide_packs é usado', () => {
      const sceneWithEnv = {
        id: 'scene-dungeon',
        title: 'Tumba do Guardião Quebrado',
        environmentSettings: {
          active_slide_pack_id: 'pack-tumba',
          slide_packs: [
            {
              id: 'pack-tumba',
              images: [
                { imageUrl: 'https://example.com/tumba-cover.jpg', overlayText: 'Entrada da tumba' },
              ],
            },
          ],
        },
        activeImageIndex: 0,
      };

      const resolved = resolveCurrentSceneImage(sceneWithEnv);
      expect(resolved).not.toBeNull();
      expect(resolved?.imageUrl).toBe('https://example.com/tumba-cover.jpg');
    });

    it('deve retornar null de forma segura se a cena não possuir imagem', () => {
      const emptyScene = {
        id: 'scene-empty',
        title: 'Cena Vazia',
      };
      const resolved = resolveCurrentSceneImage(emptyScene);
      expect(resolved).toBeNull();
    });
  });

  describe('Canvas Mode Resolution Logic', () => {
    it('deve seguir o modo do mestre quando o botão do jogador estiver em Auto', () => {
      const resolveView = (playerCanvasView: string, liveDisplayMode: string) => {
        if (playerCanvasView === 'auto') {
          return liveDisplayMode || 'art';
        }
        return playerCanvasView;
      };

      expect(resolveView('auto', 'artwork')).toBe('artwork');
      expect(resolveView('auto', 'map')).toBe('map');
      expect(resolveView('auto', 'combat')).toBe('combat');
    });

    it('deve respeitar a escolha manual do jogador se ele desativar o Auto', () => {
      const resolveView = (playerCanvasView: string, liveDisplayMode: string) => {
        if (playerCanvasView === 'auto') {
          return liveDisplayMode || 'art';
        }
        return playerCanvasView;
      };

      // Mestre mudou para combate, mas jogador travou em map manualmente
      expect(resolveView('map', 'combat')).toBe('map');
      // Mestre mudou para artwork, mas jogador travou em grid
      expect(resolveView('grid', 'artwork')).toBe('grid');
    });
  });

  describe('Dungeon Map Matching Logic', () => {
    it('deve selecionar o mapa associado correto da cena projetada antes do fallback', () => {
      const campaignMaps = [
        { id: 'map-goblins', title: 'Catacumbas do Rei Goblin Sangrento' },
        { id: 'map-tumba', title: 'Tumba do Guardião Quebrado' },
        { id: 'map-floresta', title: 'Floresta Sombria' },
      ];

      const currentScene = {
        id: 'scene-1',
        title: '🍻 O incidente na taverna',
        associatedMapId: 'map-tumba',
        associatedMapIds: ['map-tumba'],
      };

      const mapData = {
        activeMapId: 'map-tumba',
      };

      // Algoritmo de resolução usado no PlayerLobby
      const resolveMap = (mapPayload: any, scene: any, maps: any[]) => {
        const currentMapId = mapPayload?.activeMapId ||
          (scene?.associatedMapIds && scene.associatedMapIds[0]) ||
          scene?.associatedMapId ||
          (maps.find(m => scene?.associatedMapIds?.includes(m.id))?.id) ||
          maps[0]?.id;

        return maps.find((m) => m.id === currentMapId) || maps[0] || null;
      };

      const matchedMap = resolveMap(mapData, currentScene, campaignMaps);
      expect(matchedMap).not.toBeNull();
      expect(matchedMap?.id).toBe('map-tumba');
      expect(matchedMap?.title).toBe('Tumba do Guardião Quebrado');
    });
  });

  describe('State Handshake Protocol (STATE_REQUEST & STATE_SNAPSHOT)', () => {
    it('deve montar o snapshot completo de estado no Cockpit do Mestre', () => {
      const activeScene = {
        id: 'scene-taverna',
        title: '🍻 O incidente na taverna',
        imageUrl: 'https://example.com/taverna.jpg',
        isBattleStarted: false,
        isDungeonExplorationStarted: false,
      };

      const liveDisplayMode = 'map';
      const combatants = [
        { id: 'c-1', name: 'Karynna', hp: 10, maxHp: 10 },
        { id: 'c-2', name: 'Bugbear', hp: 27, maxHp: 27 },
      ];

      const mapData = {
        activeMapId: 'map-tumba',
        dungeonExplorationStarted: false,
      };

      // Simulação do payload montado em onStateRequest pelo Mestre
      const buildStateSnapshot = (scene: any, mode: string, combs: any[], map: any) => ({
        mode,
        projectedScene: scene,
        combatants: combs,
        currentTurnIndex: 0,
        roundCount: 1,
        mapData: map,
        dungeonExplorationStarted: map?.dungeonExplorationStarted || false,
        selectedTargetId: null,
        drawings: [],
      });

      const snapshot = buildStateSnapshot(activeScene, liveDisplayMode, combatants, mapData);

      expect(snapshot.mode).toBe('map');
      expect(snapshot.projectedScene.id).toBe('scene-taverna');
      expect(snapshot.combatants).toHaveLength(2);
      expect(snapshot.mapData.activeMapId).toBe('map-tumba');
    });
  });

  describe('Database Live State (public.campaigns live_state CDC)', () => {
    it('deve extrair e aplicar displayMode e activeMapId a partir de live_state retornado pelo banco', () => {
      const campaignRow = {
        id: 'camp-123',
        title: 'Mesa Principal',
        active_scene_id: 'scene-taverna',
        live_state: {
          displayMode: 'map',
          activeMapId: 'map-tumba',
          dungeonExplorationStarted: false,
          updatedAt: 1725246000000,
        },
      };

      const applyDbLiveState = (row: typeof campaignRow) => {
        return {
          resolvedMode: row.live_state?.displayMode || 'artwork',
          activeMapId: row.live_state?.activeMapId || null,
          dungeonExplorationStarted: Boolean(row.live_state?.dungeonExplorationStarted),
        };
      };

      const result = applyDbLiveState(campaignRow);
      expect(result.resolvedMode).toBe('map');
      expect(result.activeMapId).toBe('map-tumba');
      expect(result.dungeonExplorationStarted).toBe(false);
    });

    it('deve extrair currentImageUrl e overlayText a partir do live_state do banco quando a cena ainda não foi baixada localmente', () => {
      const liveStateFromDb = {
        displayMode: 'artwork',
        activeSceneId: 'scene-taverna-456',
        currentImageUrl: 'https://example.com/slides/slide-2.jpg',
        title: 'O Ataque dos Goblins',
        overlayText: 'Sombras se movem atrás dos barris.',
        activeImageIndex: 1,
        activeSlidePackId: 'pack-combat',
      };

      const projectedScene = {
        id: liveStateFromDb.activeSceneId,
        imageUrl: liveStateFromDb.currentImageUrl,
        currentImageUrl: liveStateFromDb.currentImageUrl,
        title: liveStateFromDb.title,
        sensoryText: liveStateFromDb.overlayText,
        activeImageIndex: liveStateFromDb.activeImageIndex,
        activeSlidePackId: liveStateFromDb.activeSlidePackId,
      };

      const resolved = resolveCurrentSceneImage(projectedScene);
      expect(resolved).not.toBeNull();
      expect(resolved?.imageUrl).toBe('https://example.com/slides/slide-2.jpg');
      expect(resolved?.overlayText).toBe('Sombras se movem atrás dos barris.');
      expect(resolved?.activeImageIndex).toBe(1);
    });
  });
});
