# PLAN-campaign-readable-lore.md: Sistema de Documentos & Lore da Campanha com IA

## 1. Visão Geral e Contexto
Permitir que o Mestre crie uma biblioteca visual de documentos (livros, diários, cartas, bilhetes, tomos e pergaminhos) vinculados diretamente à Campanha, com assistência de IA para escrita de lore/pistas e integração total com Baús do mapa e Baú da Party.

## 2. Requisitos do Usuário
- [x] Criar bilhetes, cartas, diários e livros no painel de campanha.
- [x] Assistente de IA para ajudar a redigir o texto do livro/bilhete.
- [x] Exposição em grade visual na campanha estilo inventário de manuscritos.
- [x] Ícones SVG dedicados para cada tipo de documento.
- [x] Capacidade de colocar esses documentos diretamente dentro de Baús ou Esconderijos (stashes) no mapa.

## 3. Tarefas de Implementação

### Fase 1: Tipagem & Estrutura de Dados
- [ ] Atualizar `lib/types.ts` com `CampaignDocumentItem` e adicionar `campaignDocuments` em `Campaign`.
- [ ] Criar utilitários de conversão bidirecional entre `CampaignDocumentItem` e `CharacterEquipmentItem`.

### Fase 2: Endpoint de IA de Literatura de RPG
- [ ] Criar rota `app/api/ai/generate-lore-document/route.ts` utilizando o SDK Gemini para redação estilizada de textos (diários, cartas, poemas, pistas).

### Fase 3: Interface no Painel da Campanha
- [ ] Criar conjunto de ícones SVG de manuscritos (`LetterSvg`, `NoteSvg`, `DiarySvg`, `BookSvg`, `TomeSvg`, `ScrollSvg`).
- [ ] Criar componente `CampaignDocumentsStudio.tsx` com grade visual de inventário e modal de criação/edição com IA.
- [ ] Adicionar aba "📜 Documentos & Lore" em `CampaignSettingsStudio.tsx`.

### Fase 4: Integração com o Mapa e Baús
- [ ] No modal de edição de Baú/Stash do `DysonCanvas.tsx`, adicionar aba para selecionar documentos criados na campanha e colocá-los no baú.
- [ ] Integrar no compêndio e no `ContainerLootModal.tsx`.

### Fase 5: Testes e Validação
- [ ] Escrever testes unitários em `lib/__tests__/campaign-documents.test.ts`.
- [ ] Executar suíte completa de testes e build de produção.
