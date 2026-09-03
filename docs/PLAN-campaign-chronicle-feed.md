# PLAN: Reformulação do Feed Cronológico da Campanha & Acesso para Jogadores

**Data:** 03 de Setembro de 2026  
**Status:** 📋 Aguardando Confirmação do Usuário (Socratic Gate)  
**Slug do Plano:** `docs/PLAN-campaign-chronicle-feed.md`  
**Especialistas:** `@project-planner`, `@frontend-specialist`, `@game-developer`

---

## 🎯 1. Visão Geral & Problemas Identificados

1. **Bug de Rolagem (Scroll Bloqueado)**:
   - O container do Feed Cronológico em `CampaignSettingsStudio.tsx` não possui `overflow-y-auto` e `h-full min-h-0` adequados na árvore flexbox, fazendo com que a lista de eventos fique presa e não role em tablets ou resoluções intermediárias.
2. **Excesso de Menus Verticais Aninhados no Tablet**:
   - Atualmente, a tela possui a sidebar de navegação global da esquerda, a sidebar da aba de configurações (`Menu Painel`), e dentro do Feed abre uma **terceira coluna vertical** (`Filtros`). Isso espreme o espaço horizontal útil do tablet (1138x712) para menos de 50% da tela.
   - **Solução de Design UI/UX**: Transformar os filtros numa barra superior horizontal em formato de pílulas (*Filter Chips / Horizontal Action Bar*) com contadores dinâmicos, busca rápida e botão de ação `+ Novo Evento`, liberando 100% da largura útil para a linha do tempo narrativa.
3. **Disponibilização do Feed para os Jogadores**:
   - Os jogadores atualmente não têm um local dedicado para ler as crônicas da campanha, recaps de sessões e lore revelado.
   - **Solução**: Adicionar um botão de fácil acesso no Cockpit do Jogador (`PlayerLobby.tsx` / `PlayerTokenActionDock`) abrindo um modal temático de **Crônicas da Campanha**, exibindo exclusivamente eventos marcados com `isPublic: true` (protegendo anotações secretas do Mestre).

---

## 🏗️ 2. Arquitetura da Solução

### 2.1. Topbar de Filtros Horizontal no Painel do Mestre (`CampaignSettingsStudio.tsx`)
```
+-----------------------------------------------------------------------------------------------+
| 📜 Todos (157) | ⚔️ Batalhas (12) | 💬 NPCs (24) | 📖 Recaps (8) | 🔮 Lore (45) | 🔍 Buscar... | [+ Novo Evento] |
+-----------------------------------------------------------------------------------------------+
|  Timeline Vertical com Rolagem Suave (overflow-y-auto custom-scrollbar flex-1)                 |
|  [●] 20/09 - Rei Theron Valerius III [👁️ PÚBLICO] [🗑️]                                      |
|  [●] 19/09 - Pagamento de Despesa (10 PO) [👁️ PÚBLICO] [🗑️]                                  |
|  [●] 18/09 - Emboscada na Floresta [🔒 PRIVADO DM] [🗑️]                                       |
+-----------------------------------------------------------------------------------------------+
```

### 2.2. Acesso do Jogador (`PlayerLobby.tsx`)
- Adicionar botão **"📖 Crônicas"** no cabeçalho do lobby do jogador.
- Abrir um modal / gaveta temático com a mesma linha do tempo visual, porém filtrando com `isPublic === true` e sem controles de edição/exclusão.

---

## 📋 3. Divisão de Tarefas

### Fase 1: Correção Estrutural da Rolagem & Layout Flexbox
- [ ] Ajustar os containers pai e filho da aba `feed` em `CampaignSettingsStudio.tsx` com `flex flex-col h-full min-h-0 overflow-hidden`.
- [ ] Aplicar `flex-1 min-h-0 overflow-y-auto custom-scrollbar` na lista da timeline para rolagem suave em qualquer resolução.

### Fase 2: Redesenho dos Filtros para Barra Horizontal Moderna
- [ ] Remover a barra lateral secundária vertical aninhada (`isFeedFilterCollapsed`).
- [ ] Criar a barra de ferramentas horizontal compacta no topo da timeline com:
  - Chips de filtro com ícones e badges numéricos coloridos (`Todos`, `Batalhas`, `NPCs`, `Recaps`, `Lore do Mundo`).
  - Campo de busca textual rápida por título ou conteúdo.
  - Botão de destaque `+ Novo Evento` alinhado à direita.

### Fase 3: Timeline dos Jogadores no Lobby
- [ ] Adicionar botão **"Crônicas"** na barra de ferramentas do jogador (`PlayerLobby.tsx`).
- [ ] Conectar os eventos do feed sincronizados em tempo real (`feedEvents`) exibindo apenas registros públicos.

---

## ❓ 4. Socratic Gate & Perguntas Estratégicas

1. **Apresentação do Feed para o Jogador**:
   - **Opção A (Recomendada)**: Modal temático flutuante (*"Crônicas da Campanha"*) aberto a partir de um botão no topo do cockpit do jogador, sem sair do mapa/grid 3D.
   - **Opção B**: Uma aba dedicada de visualização rápida no painel lateral direito do jogador (junto a Membros, Log e Chat).
2. **Busca Textual nos Filtros**:
   - Gostaria de incluir um campo de busca por texto junto com as pílulas de filtro para encontrar eventos antigos rapidamente (ex: buscar por "Rei", "Valíria", "Dragão")?
