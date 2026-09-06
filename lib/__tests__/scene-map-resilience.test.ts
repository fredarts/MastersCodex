import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseSessionRepository } from '../repositories/supabase/SupabaseSessionRepository';

// Mock Supabase Client
vi.mock('../supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
    isValidUuid: vi.fn((val: string) => Boolean(val && val.length > 5)),
    isSupabaseConfigured: vi.fn(() => true),
  };
});

import { supabase } from '../supabase';

describe('Scene Map Resilience & Offline Persistence Suite', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
    Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock }, writable: true });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should save scene map to localStorage immediately as reliable offline fallback', async () => {
    const repo = new SupabaseSessionRepository();
    const mockMapData = {
      maps: {
        'map-123': {
          activeLevelId: 'lvl-1',
          levels: {
            'lvl-1': {
              grid: [[{ x: 0, y: 0, type: 'floor', fog: false }]],
              gridScale: 40,
            },
          },
        },
      },
      activeMapId: 'map-123',
    };

    // Simulate Supabase failing with HTTP 500 error (e.g. FK violation or missing remote scene)
    (supabase.from as any).mockReturnValue({
      upsert: vi.fn().mockRejectedValue(new Error('Internal Server Error 500')),
    });

    // Should not throw or reject
    await expect(repo.saveSceneMap('scene-test-456', mockMapData)).resolves.not.toThrow();

    // Verify localStorage fallback received the map data
    const localSaved = JSON.parse(localStorageMock.getItem('codex_scene_maps') || '{}');
    expect(localSaved['scene-test-456']).toBeDefined();
    expect(localSaved['scene-test-456'].maps['map-123'].activeLevelId).toBe('lvl-1');
  });

  it('should retrieve scene map from localStorage fallback if Supabase returns error or null', async () => {
    const repo = new SupabaseSessionRepository();
    const mockMapData = {
      maps: {
        'dungeon-alpha': {
          grid: [[{ x: 1, y: 1, type: 'wall', fog: true }]],
        },
      },
      activeMapId: 'dungeon-alpha',
    };

    // Pre-populate offline storage
    localStorageMock.setItem(
      'codex_scene_maps',
      JSON.stringify({
        'scene-fallback-789': mockMapData,
      })
    );

    // Simulate Supabase failing or returning null
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockRejectedValue(new Error('500 Database unreachable')),
        }),
      }),
    });

    const result = await repo.fetchSceneMap('scene-fallback-789');
    expect(result).toBeDefined();
    expect(result.activeMapId).toBe('dungeon-alpha');
    expect(result.maps['dungeon-alpha'].grid[0][0].type).toBe('wall');
  });
});
