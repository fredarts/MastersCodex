import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseSRDRepository } from '../repositories/supabase/SupabaseSRDRepository';
import { supabase } from '../supabase';

vi.mock('../supabase', () => {
  const mockSupabase = {
    from: vi.fn(),
  };
  return {
    supabase: mockSupabase,
    isSupabaseConfigured: vi.fn().mockReturnValue(true),
  };
});

describe('SupabaseSRDRepository FTS Integration', () => {
  let repo: SupabaseSRDRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SupabaseSRDRepository();
  });

  it('deve formatar query de busca FTS tsvector para monstros', async () => {
    const mockTextSearch = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'm1',
          name: 'Goblin',
          type: 'humanoide',
          hp: 7,
          ac: 15,
          cr: '1/4',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      textSearch: mockTextSearch,
      limit: mockLimit,
    });

    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const results = await repo.searchMonsters('goblin guerreiro');

    expect(supabase.from).toHaveBeenCalledWith('srd_monsters');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockTextSearch).toHaveBeenCalledWith('fts', 'goblin | guerreiro');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Goblin');
  });

  it('deve retornar array vazio graciosamente se houver erro no banco de dados', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'FTS column not indexed' },
    });

    const mockSelect = vi.fn().mockReturnValue({
      limit: mockLimit,
    });

    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const results = await repo.searchMonsters('');
    expect(results).toEqual([]);
  });
});
