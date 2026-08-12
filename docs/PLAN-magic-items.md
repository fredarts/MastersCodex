# Projeto: Implementação de Itens Mágicos do SRD

## Objetivo
Adicionar o restante dos itens mágicos do SRD 5.1 (oriundos do Dungeon Master's Guide) ao compêndio do jogo, organizando-os em múltiplos arquivos batch e mantendo-se estritamente dentro do licenciamento SRD.

## Restrições e Escopo (Definido)
- **Escopo**: Focar APENAS nos itens do DMG que constam no SRD 5.1. Não adicionar itens do Xanathar's, Tasha's ou itens do DMG que ficaram de fora do SRD.
- **Arquitetura**: Dividir o arquivo de dados em múltiplos batches (ex: `srd-items-batch-2.ts`, etc.) para evitar arquivos de tamanho excessivo, similar à estrutura já usada nas magias (spells).
- **Idioma**: Os itens deverão ter nome original em inglês na propriedade `englishName` e nome/descrição localizados para PT-BR.

## Task Breakdown (Divisão de Tarefas)

- [ ] **Fase 1: Preparação**
  - [ ] Revisar os itens já presentes em `srd-items-data.ts` (atualmente 67 itens).
  - [ ] Renomear os itens atuais dentro do arquivo base para uma constante agrupável (ex: `BATCH_1_ITEMS`).
- [ ] **Fase 2: Criação dos Batches de Itens (Baseado no SRD)**
  - [ ] **Batch 2**: Anéis (Rings) - Adicionar os anéis mágicos restantes do SRD.
  - [ ] **Batch 3**: Varinhas, Cajados e Bastões (Wands, Staves & Rods) do SRD.
  - [ ] **Batch 4**: Armas Mágicas Específicas (Magic Weapons) - Mace of Disruption, Oathbow, etc. do SRD.
  - [ ] **Batch 5**: Armaduras Especiais (Armor) - Mithral, Adamantine, Demon Armor, etc.
  - [ ] **Batch 6**: Itens Maravilhosos (Wondrous Items) A-I.
  - [ ] **Batch 7**: Itens Maravilhosos (Wondrous Items) J-Z.
  - [ ] **Batch 8**: Poções e Pergaminhos (Potions & Scrolls).
  - [ ] **Batch 9**: Itens Lendários e Artefatos do SRD.
- [ ] **Fase 3: Integração**
  - [ ] Importar e concatenar todos os batches em `ALL_SRD_ITEMS` no arquivo `srd-items-data.ts`.
- [ ] **Fase 4: Verificação**
  - [ ] Executar o projeto e testar o Compendium View.
  - [ ] Testar os filtros de Categoria e Raridade com os novos itens.
  - [ ] Verificar a existência de IDs duplicados ou problemas de formatação no TS.

## Agent Assignments
- `backend-specialist`: Criação e estruturação dos arquivos `.ts` e formatação correta dos objetos de dados TypeScript.
- `project-planner`: Organização da ordem de criação dos arquivos para prevenir commits muito extensos e difíceis de rastrear.
- `orchestrator`: Revisão final e checagem de erros no terminal (`tsc` e `next dev`).

## Verification Checklist
- [ ] Todos os arquivos batch compilam sem erros no `npx tsc --noEmit`.
- [ ] Nenhum item de propriedade intelectual restrita (fora do SRD 5.1) foi inserido.
- [ ] Os IDs dos itens (ex: `ring-of-swimming`) não possuem conflito.
- [ ] A tela do Compendium carrega dezenas/centenas de novos itens com sucesso.
