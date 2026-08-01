# PLAN-map-management.md - Gerenciador de Mapas e Integração com Cockpit (Dungeon Map)

Este plano detalha a migração do menu de ferramentas do `MapMaker.tsx` para um menu sanduíche/sidebar retrátil na esquerda, a remoção de botões duplicados e confusos, a criação de um sistema de múltiplos arquivos de mapas por campanha (estilo Photoshop), a associação de mapas criados a Cenas específicas, e a renderização do mapa tático (`DysonCanvas`) na Projeção Central do Cockpit do Mestre sob o modo "Dungeon Map" (antigo "Mapa Tático"), além da transmissão de visão para os jogadores.

---

## Estrutura do Banco de Dados (Supabase)

### Tabela `campaign_maps`
Tabela para salvar múltiplos mapas associados a uma campanha.
- `id` UUID PRIMARY KEY
- `campaign_id` UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `grid_data` JSONB NOT NULL DEFAULT '[]'::jsonb
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()

### Tabela `scenes` (Modificação)
- Adição da coluna `associated_map_id` UUID REFERENCES public.campaign_maps(id) ON DELETE SET NULL.

---

## Repositórios & Estado

1. **ISessionRepository.ts** e **SupabaseSessionRepository.ts**:
   - Métodos para criar, buscar, atualizar e deletar mapas da campanha.
2. **LocalStorageSessionRepository.ts**:
   - Suporte offline simulando múltiplos mapas salvos no LocalStorage.

---

## Componentes a Modificar

1. **MapMaker.tsx**:
   - Adicionar menu sanduíche na esquerda (retrátil).
   - Mudar a lista de mapas/criar novo mapa de forma persistente.
   - Limpar botões redundantes na barra superior e padronizar textos das ações globais.
2. **LiveCockpitHeader.tsx**:
   - Renomear o botão de "Mapa Tático" para **"Dungeon Map"**.
3. **CreateSceneModal.tsx**:
   - Incluir seletor de mapa para associar um dos mapas da campanha à cena.
4. **LiveVisualMirror.tsx** (Cockpit):
   - Adicionar suporte a renderizar `<DysonCanvas>` quando `liveDisplayMode === 'map'`.
   - Propagar a movimentação de tokens e a névoa revelada para os jogadores.
5. **PlayerLobby.tsx** e **PlayerViewModal.tsx**:
   - Renderizar o `<DysonCanvas>` em modo passivo (não-interativo) quando `liveDisplayMode === 'map'`.

---

## Plano de Verificação
- Garantir 100% de cobertura de tipo e lint:
  `npx eslint components/MapMaker.tsx components/live-cockpit/LiveVisualMirror.tsx components/live-cockpit/LiveCockpitHeader.tsx`
- Sincronização em tempo real e teste manual da revelação de névoa no cockpit.
