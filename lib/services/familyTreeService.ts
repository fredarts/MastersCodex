import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FamilyTree, FamilyMemberNode, WorldEntity, Result } from '@/lib/types';

const LOCAL_STORAGE_TREES_KEY = 'codex_family_trees_';

export const familyTreeService = {
  /**
   * Busca todas as árvores genealógicas associadas a um mundo
   */
  async fetchFamilyTrees(worldId: string): Promise<Result<FamilyTree[]>> {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('family_trees')
          .select('*')
          .eq('world_id', worldId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Erro ao buscar family_trees no Supabase, caindo no fallback local:', error.message);
        } else if (data && data.length > 0) {
          const trees: FamilyTree[] = data.map((d) => ({
            id: d.id,
            worldId: d.world_id,
            factionId: d.faction_id || undefined,
            name: d.name,
            houseMotto: d.house_motto || undefined,
            crestUrl: d.crest_url || undefined,
            description: d.description || undefined,
            members: d.members || [],
            relationships: d.relationships || [],
            rootMemberId: d.root_member_id || undefined,
            layoutDirection: d.layout_direction || 'top_bottom',
            customStyles: d.custom_styles || { theme: 'royal_gold', connectorStyle: 'smooth' },
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          return { ok: true, value: trees };
        }
      }

      // Fallback para localStorage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_TREES_KEY}${worldId}`);
        if (raw) {
          const parsed: FamilyTree[] = JSON.parse(raw);
          return { ok: true, value: parsed };
        }
      }

      return { ok: true, value: [] };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar árvores genealógicas.'),
      };
    }
  },

  /**
   * Salva ou atualiza uma árvore genealógica
   */
  async saveFamilyTree(tree: FamilyTree): Promise<Result<FamilyTree>> {
    try {
      const now = new Date().toISOString();
      const updatedTree: FamilyTree = {
        ...tree,
        updatedAt: now,
        createdAt: tree.createdAt || now,
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('family_trees')
          .upsert({
            id: updatedTree.id,
            world_id: updatedTree.worldId,
            faction_id: updatedTree.factionId || null,
            name: updatedTree.name,
            house_motto: updatedTree.houseMotto || null,
            crest_url: updatedTree.crestUrl || null,
            description: updatedTree.description || null,
            members: updatedTree.members,
            relationships: updatedTree.relationships,
            root_member_id: updatedTree.rootMemberId || null,
            layout_direction: updatedTree.layoutDirection || 'top_bottom',
            custom_styles: updatedTree.customStyles || {},
            updated_at: updatedTree.updatedAt,
          });

        if (error) {
          console.warn('Erro ao salvar family_tree no Supabase:', error.message);
        }
      }

      // Salva no localStorage (como fallback e cache rápido)
      if (typeof window !== 'undefined') {
        const storageKey = `${LOCAL_STORAGE_TREES_KEY}${tree.worldId}`;
        const raw = localStorage.getItem(storageKey);
        let list: FamilyTree[] = raw ? JSON.parse(raw) : [];
        const index = list.findIndex((t) => t.id === updatedTree.id);
        if (index >= 0) {
          list[index] = updatedTree;
        } else {
          list.push(updatedTree);
        }
        localStorage.setItem(storageKey, JSON.stringify(list));
      }

      return { ok: true, value: updatedTree };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao salvar árvore genealógica.'),
      };
    }
  },

  /**
   * Deleta uma árvore genealógica
   */
  async deleteFamilyTree(treeId: string, worldId: string): Promise<Result<void>> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('family_trees').delete().eq('id', treeId);
        if (error) {
          console.warn('Erro ao deletar family_tree no Supabase:', error.message);
        }
      }

      if (typeof window !== 'undefined') {
        const storageKey = `${LOCAL_STORAGE_TREES_KEY}${worldId}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          let list: FamilyTree[] = JSON.parse(raw);
          list = list.filter((t) => t.id !== treeId);
          localStorage.setItem(storageKey, JSON.stringify(list));
        }
      }

      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao deletar árvore genealógica.'),
      };
    }
  },

  /**
   * Sincroniza dados do membro com a entidade NPC do Worldbuilder
   */
  syncMemberWithWorldEntity(member: FamilyMemberNode, entity: WorldEntity): FamilyMemberNode {
    return {
      ...member,
      worldEntityId: entity.id,
      name: entity.name,
      title: member.title || entity.subType || undefined,
      avatarUrl: (entity.images && entity.images.length > 0) ? entity.images[0] : member.avatarUrl,
      isAlive: entity.status === 'active' || entity.status === 'allied',
    };
  }
};
