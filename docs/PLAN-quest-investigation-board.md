# Plano de Projeto: Graph-Driven Quest & Rumor Tracker (Mural de Investigação de Detetive Pro)

> **Slug:** `quest-investigation-board`  
> **Comando:** `/plan`  
> **Módulo:** `LoreGraph & Quest Tracking`  
> **Estilo:** *Detective Corkboard / Red String Conspiracy & Investigation Board*

---

## 🎯 1. Objetivo & Visão Geral

Permitir que o Mestre e os Jogadores rastreiem mistérios, boatos, pistas e missões conectando itens, suspeitos (NPCs), locais e documentos diretamente através de um **Mural de Investigação Interativo (Detective Corkboard)** com fios vermelhos/coloridos conectando os nós com **100% de liberdade narrativa para os jogadores**.

### ✨ Pilares Principais:
1. **Conexão Direta ao `LoreGraph`**: Entidades de mundo (NPCs, Facções, Locais) e Documentos do Codex são afixados como polaroids/cartões no mural com 1 clique.
2. **Fios Vermelhos Interativos (Red Strings SVG)**: Jogadores clicam em um alfinete e arrastam o fio até outro nó para traçar teorias de conspiração ou relacionamentos de forma livre com rótulos personalizados.
3. **Escopo Dual com Bridge de Compartilhamento**:
   - **Mural da Party (Mesa)**: Colaborativo e sincronizado em tempo real para todo o grupo.
   - **Mural Pessoal (Diário do Investigador)**: Privado de cada jogador, com botão de 1 clique para *"📤 Compartilhar com a Mesa"*.
4. **Névoa de Mistério (Selo de Cera do Mestre)**: Pistas podem ser afixadas como envelopes lacrados e reveladas pelo Mestre quando os jogadores descobrirem a pista.
5. **Prevenção de Erros de Lógica**: Exclusão em cascata de fios órfãos, bloqueio de auto-conexões e espaço de coordenadas virtual infinito para telas de qualquer resolução.

---

## 📐 2. Arquitetura de Dados

- `lib/investigation/investigationTypes.ts`:
  - `PinBoardItem`: Pinos com tipo (`clue`, `suspect`, `location`, `document`, `quest`, `custom_note`, `lore_node`), posições X/Y, rotação sutil, tags de cor, e vínculo opcional a `loreNodeId` e `documentId`.
  - `BoardStringConnection`: Fios entre dois pinos com cor, tensão da curva Bézier e rótulo livre digitado pelos jogadores.
  - `InvestigationBoard`: Coleção com escopo (`party` ou `personal`) e sincronização.
- `lib/investigation/investigationService.ts`:
  - Operações CRUD com limpeza em cascata de conexões órfãs e sincronização em tempo real.
- `lib/__tests__/investigationBoard.test.ts`:
  - Testes unitários para regras de posicionamento, conexões de fios, exclusão em cascata e compartilhamento de pistas.

---

## 🎨 3. Design da Interface (UI/UX)

- `components/investigation/DetectivePinboardModal.tsx`:
  - **Ambiente Imersivo**: Textura de cortiça vintage escura com iluminação ambiente noir, post-its rasgados, alfinetes de cabeça esférica e polaroids.
  - **Fios SVG Elásticos**: Linhas Bézier arrastáveis em tempo real entre alfinetes com animação suave de tensão.
  - **Alternador de Modo**: `[ 🌐 Mural do Grupo ]` vs `[ 🕵️ Meu Diário Secreto ]`.
  - **Caixa de Ferramentas**:
    - `📌 Adicionar Pista` | `📜 Importar do LoreGraph` | `🧵 Puxar Fio Vermelho` | `🔍 Filtrar por Caso` | `🧹 Auto-Organizar`.
- `components/investigation/QuestTrackerSidebar.tsx`:
  - Lista lateral retrátil com resumo das missões ativas e progresso de pistas.

---

## 📋 4. Tarefas & Etapas de Execução

| Tarefa | Responsável | Descrição |
|--------|-------------|-----------|
| **1. Motor & Tipos** | `backend-specialist` | Criar `investigationTypes.ts` e `investigationService.ts` com limpeza em cascata. |
| **2. Testes Unitários** | `debugger` | Escrever e passar testes em `lib/__tests__/investigationBoard.test.ts`. |
| **3. Mural Visual (Canvas + SVG)** | `frontend-specialist` | Desenvolver `DetectivePinboardModal.tsx` com renderização de fios Bézier e drag-and-drop. |
| **4. Integração LoreGraph & Header** | `orchestrator` | Adicionar botões no Header, no LoreGraph e na Ficha de Personagem. |
| **5. Validação de Build & E2E** | `orchestrator` | Rodar `npm test` e `npm run build` garantindo zero erros. |

---

## 🚀 5. Próximo Passo

Para iniciar a implementação deste sistema completo, execute o comando:
```bash
/create
```
