# PLAN: Worldbuilding Media (AI & Uploads) & Session Studio Lore Integration

> **Task Slug:** `worldbuilding-media-session`  
> **Status:** Draft / Ready for Implementation  
> **Target Release:** Fase Worldbuilding & Session Cockpit Integration

---

## 1. Visão Geral do Projeto

Expandir o ecossistema de Worldbuilding do **Masters Codex** com suporte a **múltiplas imagens por entidade** (upload e geração de imagem por IA via Nano Banana), e integrar a biblioteca de worldbuilding diretamente no **SessionStudio (Mesa do Mestre)** para que o Mestre possa enviar fragmentos de lore, locais, facções e itens para a cena ativa e para o **Feed da Campanha** dos jogadores.

---

## 2. Requisitos Detalhados

### A. Múltiplas Imagens & Gerador IA no Worldbuilding Modal (`WorldEntityModal.tsx`)
1. **Atributo de Imagens:** Suporte a array de imagens `images?: string[]` na interface `WorldEntity`.
2. **Upload & URL Manual:** Upload de arquivos de imagem locais (convertidos para data base64 / storage) ou colagem de URLs externas.
3. **Geração por IA (Nano Banana):**
   - Prompt automático gerado a partir do Nome, Tipo e Descrição (`shortDesc` / `fullContent`) da entidade.
   - **Trava de Validação:** Se a descrição estiver vazia ao clicar em "Gerar com IA", exibe aviso de alerta:  
     *⚠️ "Preencha primeiro a descrição da entrada antes de gerar a imagem por IA!"*
   - **Prompt Extra Personalizável:** Campo de texto livre para o usuário adicionar detalhes visuais extras (ex: *"estilo pintura a óleo fantasy sombria, 8k, iluminação dramática"*).
4. **Galeria de Mídia Interativa:**
   - Exibição de carrossel/grid com as imagens da entidade.
   - Botão para excluir qualquer imagem individualmente.
   - Suporte a gerar múltiplas imagens sucessivas e mantê-las armazenadas na entidade.

### B. Integração de Lore no Session Studio (`SessionStudio.tsx`)
1. **Painel de Inserção de Worldbuilding:**
   - Adicionar uma gaveta/modal de atalho no `SessionStudio` para buscar qualquer entidade do mundo ativo (NPCs, Locais, Itens, Tradições, Conflitos).
2. **Ação "Enviar para a Cena & Feed da Campanha":**
   - **No Log da Sessão (`BattleLog.tsx` / `LiveCockpitStudio.tsx`):** Exibe um cartão estilizado da lore revelada aos jogadores no feed de eventos da sessão em tempo real.
   - **No Feed da Campanha (`CampaignFeedEventType`):** Insere um evento do tipo `'world_lore'` no feed persistente da campanha, sincronizando via Supabase para todos os jogadores do `PlayerLobby.tsx`.

---

## 3. Arquitetura e Arquivos Afetados

| Componente / Arquivo | Responsabilidade | Ação |
| :--- | :--- | :--- |
| `lib/types.ts` | Adicionar `images?: string[]` em `WorldEntity` e `'world_lore'` em `CampaignFeedEventType`. | MODIFICAR |
| `components/WorldEntityModal.tsx` | Implementar galeria de imagens, gerador IA Nano Banana, validação de descrição e prompt extra. | MODIFICAR |
| `components/WorldEditor.tsx` | Atualizar cartões de entidade para exibir miniaturas da galeria de imagens. | MODIFICAR |
| `components/SessionStudio.tsx` | Adicionar gaveta de seleção de Worldbuilding e botão "Compartilhar Lore na Cena". | MODIFICAR |
| `lib/hooks/useCampaign.ts` | Suportar disparo de eventos `'world_lore'` para o feed da campanha. | MODIFICAR |
| `components/BattleLog.tsx` / `PlayerLobby.tsx` | Renderizar cartões de lore reveladas com imagem e descrição no feed de aventura. | MODIFICAR |

---

## 4. Fases de Execução & Testes

### Fase 1: Suporte a Dados & Galeria no Modal (`WorldEntityModal.tsx`)
- Adicionar estado de imagens (`images: string[]`) no formulário.
- Criar controles de upload manual e colagem de URL.
- Construir o painel de geração de imagem por IA (Nano Banana) com validação de descrição obrigatória e campo de prompt customizado.

### Fase 2: Visualização nas Entidades (`WorldEditor.tsx`)
- Renderizar a imagem de capa e contador de imagens nos cartões de cada categoria do Worldbuilding.

### Fase 3: Integração no Session Studio & Feed de Campanha (`SessionStudio.tsx`)
- Adicionar a aba/gaveta de seleção de Worldbuilding dentro do Cockpit do Mestre.
- Implementar a transmissão de cartões de lore para o Log de Batalha e para o Feed Sincronizado do Supabase (`user_campaigns`).

### Fase 4: Verificação & Testes
- Executar `npx tsc --noEmit` para garantir zero regressões de compilação.
- Validar geração de imagens, exclusão de mídia e transmissão de lore para a cena.
