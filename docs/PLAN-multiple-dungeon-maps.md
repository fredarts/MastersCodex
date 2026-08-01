# Plano de Implementação - Múltiplos Mapas de Masmorra por Cena

Este plano detalha o design técnico para permitir a associação de um ou mais mapas de masmorras a uma única cena, o gerenciamento dessa associação na tela de recursos da cena, a alternância de mapas no Cockpit do Mestre e a sincronização em tempo real para os jogadores.

---

## 🛠️ Alterações Propostas

### 1. Banco de Dados & Modelos de Domínio
* **Migração SQL:**
  * Criar um arquivo de migração `supabase/migrations/20260801_add_associated_map_ids_to_scenes.sql` para adicionar a coluna `associated_map_ids UUID[] DEFAULT '{}'::uuid[]` na tabela de `scenes`.
* **Modelos do TypeScript:**
  * **[types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts):** Adicionar `associatedMapIds?: string[];` na interface `GameScene`.
  * **[database.types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/database.types.ts):** Adicionar `associated_map_ids?: string[] | null;` na interface `SceneRow`.
* **Mapeamento & Repositórios:**
  * **[mappers.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/mappers.ts):** Atualizar `mapSceneRowToDomain` para incluir `associatedMapIds: row.associated_map_ids || []`.
  * **[SupabaseSessionRepository.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/repositories/supabase/SupabaseSessionRepository.ts):** Atualizar métodos `createScene` e `updateScene` para mapear `associated_map_ids: scene.associatedMapIds || []`.
  * **[LocalStorageSessionRepository.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/repositories/offline/LocalStorageSessionRepository.ts):** Garantir suporte local persistindo `associatedMapIds` diretamente no objeto da cena.

---

### 2. Tela de Recursos da Cena ([SessionStudio.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/SessionStudio.tsx))
* Adicionar a sub-aba `'dungeon-maps'` ao menu lateral de "Recursos da Cena" usando o ícone `Map` (de `lucide-react`) com o rótulo **"Dungeon Maps"**.
* Implementar a visualização da aba `'dungeon-maps'`:
  * Listar todos os mapas de masmorras disponíveis na campanha (`campaignMaps`).
  * Renderizar um checkbox ao lado de cada mapa.
  * Ao marcar/desmarcar o checkbox, atualizar a lista `associatedMapIds` da cena ativa:
    * Se marcado, adiciona o ID do mapa à lista e salva a cena.
    * Se desmarcado, remove o ID do mapa da lista e salva a cena.
  * Mostrar um aviso informativo explicando que as masmorras selecionadas estarão disponíveis para o mestre controlar durante a sessão no Cockpit.

---

### 3. Mapeamento de Estado no DM Cockpit ([CockpitDungeonMap.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CockpitDungeonMap.tsx))
* Adicionar suporte para lidar com múltiplos mapas de cena (carregando estados de jogo individuais persistidos como `scene_maps` baseados na cena e no ID da masmorra correspondente):
  * **Tabela/Estrutura de Estado:** Estender o serviço para que `fetchSceneMap(sceneId, mapId)` e `saveSceneMap(sceneId, gridData, mapId)` gravem/leiam especificamente usando uma chave combinada.
    *(Nota: para simplificar sem alterar a tabela no Supabase, a chave da tabela `scene_maps` é `scene_id`. Podemos armazenar um dicionário JSONB no banco com múltiplos grids, ou passar `scene_id` modificado como `${sceneId}_${mapId}` no repositório).*
    * **Decisão:** Usar a chave do banco no formato `${sceneId}_${mapId}` para a persistência de cada masmorra na cena. Isso permite salvar grids individuais e persistentes por masmorra sem alterar a tabela `scene_maps`!
* No cabeçalho da aba Dungeon Map no Cockpit:
  * Exibir um seletor (dropdown) elegante somente quando houver mais de 1 mapa associado à cena.
  * Ao trocar o mapa selecionado, carregar instantaneamente o estado do grid e a calibração da masmorra selecionada, e disparar a transmissão em tempo real para os jogadores.

---

### 4. Sincronização e Renderização na Tela do Jogador
* O payload de transmissão enviado para os jogadores via `broadcastToPlayerView` incluirá a chave `mapData` correspondente ao mapa que está atualmente ativo no cockpit do mestre.
* O componente [PlayerViewModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerViewModal.tsx) receberá as atualizações automáticas via contexto do LiveCockpit e renderizará o grid correto de forma totalmente transparente e em tempo real.

---

## 🧪 Plano de Verificação

### Testes Manuais
1. **Associação de Mapas na Cena:**
   - Acessar a tela de Recursos da Cena e associar 2 mapas diferentes (ex: "Entrada do Templo" e "Cripta Subterrânea").
2. **Alternância no Cockpit:**
   - Abrir o Cockpit e acessar a aba Dungeon Map.
   - Verificar se o dropdown de seleção aparece com ambos os mapas listados.
   - Trocar de mapa no dropdown, mover um token ou limpar o fog de um deles, e alternar de volta para certificar-se de que cada mapa mantém seu estado salvo (fog e tokens) independente do outro.
3. **Validação do Player View:**
   - Abrir a Projeção do Jogador (`PlayerViewModal`) e confirmar se o mapa exibido acompanha a troca de dropdown feita no Cockpit do mestre instantaneamente.
