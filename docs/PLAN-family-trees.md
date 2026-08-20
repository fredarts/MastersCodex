# Plano de Implementação: Árvores Genealógicas Visuais & Sucessão de Linhagens (Family Trees & Dynasties)

Este documento detalha a arquitetura, estrutura de dados, componentes de interface e fluxos de integração para o **Visualizador e Gerador de Árvores Genealógicas e Linhagens Nobres** do *Master's Codex*, interligado ao ecossistema de **Worldbuilding**, **NPCs**, **Facções** e ao **LoreGraph**.

---

## 🤖 Roteamento de Agentes Especialistas
🤖 **Applying knowledge of `@[project-planner]`, `@[frontend-specialist]` & `@[game-developer]`...**

---

## 📌 Visão Geral & Objetivos

Muitas campanhas de RPG de fantasia e intriga política (como reinos feudais, clãs élficos, casas nobres, sucessões vampíricas ou máfias de facção) dependem fortemente de linhagens, parentescos, disputas de herança e linhagens de poder.

O sistema de **Árvores Genealógicas Visuais** fornece:
1. **Canvas Interativo de Linhagens**: Renderização de diagramas em árvore genealógica hierárquica (gerações, casamentos, filhos legítimos/bastardos, herdeiros e regentes).
2. **Sucessão Dinástica de Facções**: Rastreamento de liderança passada, atual e herdeiros imediatos de facções/guildas/impérios.
3. **Interligação Bidirecional com World Entities & LoreGraph**: Conexão nativa com entidades de categoria `npc` e `faction` no `WorldContext`, permitindo sincronização em tempo real com o grafo relacional.
4. **Gerador de Linhagem com IA (Gemini)**: Geração automatizada de casas nobres completas com brasão, lema, segredos genealógicos (ex: herdeiro secreto, bastardos disputando a coroa) e árvores de 3 a 5 gerações.
5. **Exportação & Visualização Imersiva**: Zoom & Pan infinito, exportação em PNG/SVG para handouts de jogadores, e modo visual "Pergaminho Nobre / Escudo Heráldico".

---

## 🧱 Arquitetura e Modelagem de Dados

### 1. Extensão de Tipos (`lib/types.ts`)

```typescript
// Tipos de Relações Genealógicas e Dinásticas
export type FamilyRelationType = 
  | 'parent'        // Pai/Mãe
  | 'child'         // Filho(a) legítimo(a)
  | 'spouse'        // Cônjuge / Casamento
  | 'ex_spouse'     // Ex-cônjuge / Divórcio / Anulação
  | 'betrothed'     // Prometido(a) em noivado
  | 'bastard'       // Filho(a) bastardo(a) / Ilegítimo(a)
  | 'adopted'       // Adotado(a)
  | 'sibling'       // Irmão / Irmã
  | 'half_sibling'  // Meio-irmão / Meia-irmã
  | 'ancestor'      // Antepassado fundador
  | 'heir'          // Herdeiro direto designado
  | 'claimant'      // Reivindicante ao trono/liderança
  | 'usurper';      // Usurpador / Regente ilegítimo

export type SuccessionStatus = 
  | 'ruling'        // Atual monarca / líder
  | 'heir_apparent' // 1º na linha de sucessão
  | 'heir_presumptive' // Próximo na linha
  | 'disinherited'  // Deserdado(a)
  | 'abdicated'     // Abdicou
  | 'deceased'      // Falecido(a)
  | 'exiled'        // No exílio
  | 'missing';      // Desaparecido(a)

export interface FamilyMemberNode {
  id: string; // ID da WorldEntity (NPC) ou ID interno do nó
  worldEntityId?: string; // Vínculo com NPC existente no Worldbuilder
  name: string;
  title?: string; // Ex: 'Lorde de Winterfell', 'Arquimago', 'Príncipe Herdeiro'
  houseOrDynasty?: string; // Ex: 'Casa Valerius', 'Clã Martelo de Prata'
  generation: number; // 0 = Raiz/Fundador, 1 = Filhos, 2 = Netos, etc.
  gender?: 'male' | 'female' | 'other';
  birthEra?: string; // Ex: 'Ano 120 da 3ª Era'
  deathEra?: string; // Ex: 'Ano 178 da 3ª Era' ou null se vivo
  isAlive: boolean;
  avatarUrl?: string;
  coatOfArmsUrl?: string; // Brasão / Escudo Heráldico
  successionStatus?: SuccessionStatus;
  notes?: string;
  secrets?: string; // Notas secretas do DM (ex: "Na verdade é filho do conselheiro")
  customBadge?: string; // Ex: '💀 Assassinado', '👑 Rei Atual'
}

export interface FamilyRelationshipEdge {
  id: string;
  fromId: string;
  toId: string;
  type: FamilyRelationType;
  details?: string; // Ex: 'Casamento político em 142', 'Legitimado por decreto'
  isSecret?: boolean; // Apenas visível para o DM
}

export interface FamilyTree {
  id: string;
  worldId: string;
  factionId?: string; // Vinculado a uma facção/reino específico
  name: string; // Ex: 'Árvore Genealógica da Dinastia Valerius'
  houseMotto?: string; // Ex: 'Na Sombra Forjamos a Luz'
  crestUrl?: string; // Imagem do Brasão
  description?: string;
  members: FamilyMemberNode[];
  relationships: FamilyRelationshipEdge[];
  rootMemberId?: string;
  layoutDirection: 'top_bottom' | 'bottom_top' | 'left_right';
  customStyles?: {
    theme: 'parchment' | 'royal_gold' | 'dark_fantasy' | 'cyber_neon' | 'arcane_blue';
    connectorStyle: 'smooth' | 'step' | 'straight';
  };
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 🎨 Componentes & Interface de Usuário (UI/UX)

### 1. `components/family-tree/FamilyTreeViewer.tsx` (Canvas Principal)
- **Visualizador em Canvas / SVG Hi-DPI**:
  - Suporte completo a **Zoom In / Zoom Out**, **Pan (Arrastar Canvas)** e **Reset de Foco**.
  - Nós estilizados com estética de alta fantasia (estilo pergaminho nobre / gótico / dark luxury):
    - Avatar circular com moldura dourada / prateada.
    - Ícones de status: Coroa (Líder/Rei), Caveira (Falecido), Espadas Cruzadas (Claimant), Coração Partido (Divórcio), Aliança (Casamento).
    - Conectores visuais inteligentes com cores semânticas (Linhas duplas para casamentos, linhas pontilhadas para bastardos/adotados, linha sólida dourada para linha de sucessão ativa).
  - **Barra de Ferramentas Superior**:
    - Seletor de Famílias/Casas Nobres do Mundo.
    - Botão **"+ Nova Árvore Genealógica"** e **"+ Adicionar Membro"**.
    - Botão **"✨ Gerar Dinastia com IA"**.
    - Filtro de visualização: *Apenas Vivos*, *Linha de Sucessão*, *Segredos Ocultos (Modo DM)*.
    - Exportação: **"Baixar PNG em Alta Resolução"** ou **"Copiar Handout para Jogadores"**.

### 2. `components/family-tree/FamilyMemberCard.tsx`
- Mini-card interativo com suporte a hover com detalhes rápidos e click para abrir a ficha completa do NPC ou o editor rápido.
- Conexão direta para abrir o `WorldEntityModal` e atualizar a lore do personagem sem sair da árvore.

### 3. `components/family-tree/FamilyMemberEditModal.tsx`
- Modal rápido para vincular a um NPC existente no `WorldContext` ou criar um novo membro na árvore.
- Configuração de Parentesco (Pai/Mãe, Cônjuge, Irmão, Filho, Adotado, Bastardo).
- Status de sucessão e notas secretas do Mestre.

### 4. `components/family-tree/AiDynastyGeneratorModal.tsx`
- Assistente com Gemini AI para gerar famílias nobres prontas:
  - *Inputs*: Nome da Casa/Família, Tema/Cultura (ex: 'Casa Élfica Nobre decadente', 'Clã Guerreiro Nórdico', 'Família Mercante de Baldur\'s Gate'), Número de Gerações (2 a 5), Nível de Intriga/Dramaturgia.
  - *Outputs*: Gera automaticamente árvore com 6 a 15 membros conectados com segredos, alianças de casamento, bastardos e conflitos de sucessão pré-configurados.

### 5. Integração com `components/WorldEditor.tsx` e `components/LoreGraph.tsx`
- **WorldEditor**: Nova aba interativa nas ferramentas: **"Árvores Genealógicas"** (com ícone `GitFork` / `Crown` ao lado de Grafo de Lore, Cronologia e Mapa Interativo).
- **LoreGraph**: No Grafo de Lore, adicionar botão de ação rápida em nós de NPCs/Facções: *"Ver Árvore Genealógica"*, centralizando e focando na linhagem correspondente.

---

## 📅 Fases de Implementação

| Fase | Descrição | Componentes / Arquivos | Complexidade |
|---|---|---|---|
| **Fase 1: Tipagem & Armazenamento** | Criação das interfaces de dados em `lib/types.ts` e service `lib/services/familyTreeService.ts` com suporte a `localStorage` + Supabase. | `lib/types.ts`, `lib/services/familyTreeService.ts` | Baixa |
| **Fase 2: Motor de Layout de Árvore** | Algoritmo de posicionamento hierárquico por gerações e casamentos (layout tree hierarchy 2D sem sobreposição de nós). | `lib/utils/familyTreeLayout.ts` | Média |
| **Fase 3: Componentes de Visualização** | Criação do `FamilyTreeViewer`, renderizador de conexões SVG e nós interativos `FamilyMemberNode`. | `components/family-tree/FamilyTreeViewer.tsx`, `components/family-tree/FamilyMemberCard.tsx` | Alta |
| **Fase 4: Modais de Edição & Vínculo com NPCs** | Modais de criação/edição de membros, seleção de pais/cônjuges e integração com `WorldContext` / `WorldEntity`. | `components/family-tree/FamilyMemberModal.tsx`, `components/family-tree/RelationshipConnectorModal.tsx` | Média |
| **Fase 5: IA Dynasty Generator** | Prompt engineering e gerador estruturado com Gemini AI para forjar famílias inteiras com drama e linhagens nobres. | `components/family-tree/AiDynastyGeneratorModal.tsx`, `lib/ai/dynasty-generator.ts` | Média |
| **Fase 6: Integração no WorldEditor & LoreGraph** | Adicionar aba no `WorldEditor.tsx` e interligação com `LoreGraph.tsx` e `WorldbuilderStudio.tsx`. | `components/WorldEditor.tsx`, `components/LoreGraph.tsx` | Baixa |

---

## 🔍 Plano de Verificação & Testes

### 1. Testes Automatizados Unitários
- **`lib/utils/__tests__/familyTreeLayout.test.ts`**: Testar ordenação de nós por geração, agrupamento de cônjuges e cálculo de conexões ortogonais/bezier sem ciclos infinitos.
- **`lib/services/__tests__/familyTreeService.test.ts`**: Testar CRUD de árvores, adição/remoção de membros em cascata e persistência local/remota.

### 2. Validação Manual de Interface
- Criar árvore de 3 gerações (Avós -> Pais/Tios -> Filhos/Primos) e verificar renderização das linhas de casamento e descendência.
- Testar zoom, pan e centralização da câmera em nós selecionados.
- Testar vínculo de nó com NPC existente e conferir sincronização de nome e avatar.
- Testar gerador de dinastia via IA e validar inserção em massa de membros na árvore.
- Validar exportação de imagem PNG em alta definição.

---

## 🚀 Próximos Passos
- Revise o plano acima.
- Digite `/create` ou autorize a execução para iniciar a implementação da Fase 1 e seguintes!
