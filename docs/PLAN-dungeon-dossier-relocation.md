# PLAN - Relocação do Dossier & Configuração da Masmorra

## 1. Visão Geral & Objetivo

Atualmente, na tela de **Sessão / Recursos da Cena (Aba Mapa de Dungeon)**, o painel direito exibe um formulário completo de edição e configuração da masmorra (Geração de capa com IA, upload/URL de capa, edição de título, seleção de nível de desafio e edição de texto de lore/rumores), além do botão "Salvar Dossier".

O objetivo desta refatoração é:
1. **Desacoplar a Configuração da Masmorra:** Mover todo o gerenciamento e configuração de metadados/dossier (capa IA/manual, lore narrativa, faixa de nível, dados imersivos) para a **Tela de Criação/Edição de Mapas (Map Maker / Gerenciador de Masmorras)**.
2. **Tela de Sessão/Cena como Visualizador & Briefing do Mestre:** A aba de masmorras na cena de sessão passa a ser uma visão limpa e imersiva de consulta (Showcase / Dossier do Mestre), exibindo capa cinemática em destaque, título, badges de dificuldade, lore formatada para leitura, métricas táticas e botões de vincular à cena / disparar no Live Cockpit / abrir para edição no Map Maker.

---

## 2. Análise da Arquitetura Atual

- `components/session/SceneDungeonMapsStudio.tsx`:
  - Contém o estado e os inputs para `activeTitle`, `activeDescription`, `activeChallengeRating`, `activeDifficultyTier`, `activeCoverImageUrl`, `SceneImageAiModal` e `handleSaveDungeonDetails`.
  - Mistura a responsabilidade de "planejamento de cena" com "criação e configuração de entidade de mapa".
- `components/MapMaker.tsx` & `components/map/MapMakerTopBar.tsx`:
  - O Map Maker edita o grid, paredes, iluminação, tokens e níveis.
  - Possui o `MapManagerModal` para trocar/criar mapas, mas não possui um modal ou painel dedicado de **Dossier & Metadados da Masmorra** (onde o mestre possa gerar a arte de capa com IA, definir lore, rumores e nível de desafio).
- `lib/types.ts` (`CampaignMap` / `MultiLevelGridData`):
  - Já suporta `coverImageUrl`, `description`, `challengeRating`, `difficultyTier`, etc.

---

## 3. Plano de Implementação

### Fase 1: Dossier no Map Maker (Criação e Edição de Mapas)
- Criar/Integrar o **Modal ou Painel de Dossier da Masmorra** no Map Maker (`components/map/DungeonDossierModal.tsx` ou integrado no `MapMakerTopBar` / `MapManagerModal`).
- Permitir dentro do Map Maker:
  - Gerar Capa com IA (`SceneImageAiModal` ou `DungeonCoverAiModal`).
  - Usar fundo do mapa renderizado como capa.
  - Inserir link/upload de imagem.
  - Editar Título, Faixa de Nível/Dificuldade (Tier) e Lore/Rumores Narrativos.
  - Salvar tudo diretamente na entidade `CampaignMap`.

### Fase 2: Redesign da Aba "Mapa de Dungeon" no Session Studio
- Transformar a coluna direita do `SceneDungeonMapsStudio.tsx` em um **Card de Apresentação / Briefing Narrativo**:
  - Capa cinemática em alta resolução com vinheta e visual premium.
  - Título e Badge de Dificuldade com visual estilizado de compêndio.
  - Caixa de Leitura do Mestre (Texto narrativo/Lore com tipografia serifada, botão de copiar texto de narração ou ler em voz alta).
  - Métricas táticas e status de vinculação à cena.
  - Botão de ação rápida: *"Editar Masmorra no Map Maker"* (que abre o Map Maker direto nesta masmorra) e *"Vincular/Desvincular da Cena"*.

### Fase 3: Verificação e Testes
- Testar fluxo de criação/edição de dossier no Map Maker.
- Testar visualização e disparo da masmorra nas cenas do SessionStudio.
- Validar persistência via `storageService` / banco de dados.

---

## 4. Portões Socráticos & Perguntas Estratégicas

1. **Acesso no Map Maker:** Prefere um botão de destaque na barra superior do Map Maker (ex: ícone de pergaminho/livro *"Dossier da Masmorra"*) ou uma aba lateral dentro do Map Maker?
2. **Atalho de Edição na Cena:** Na tela de Sessão, deseja um botão sutil tipo *"✏️ Editar Dossier"* que abra um modal rápido de edição sem precisar sair da cena, ou prefere redirecionar para a tela do Map Maker?
3. **Capa e Ambientação:** O botão de *"Usar Fundo do Mapa como Capa"* deve gerar uma captura automática do grid atual do Map Maker?
