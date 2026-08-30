# PLAN: Sistema de Porta-Retrato (Foto de Rosto 1:1) para NPCs & Propagação Global

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 P0 (Alta) | **Tipo de Projeto:** WEB (Next.js, Tailwind CSS, Google GenAI Image API, Supabase)  
> **Chave do Plano:** `npc-portrait-system`

---

## 🎯 1. Visão Geral & Objetivo

Atualmente, na criação e edição de entidades/NPCs no World Building ([WorldEntityModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/WorldEntityModal.tsx)), o mestre dispõe de dois modos principais de arte:
1. **Capa Principal** (Arte conceitual da cena, corpo ou cenário nos formatos 9:16, 3:4, 16:9, etc.).
2. **Pino de Combate 3D** (Arte 1:1 de corpo inteiro em pose dinâmica de combate com fundo branco `#FFFFFF` puro para tokens e billboards 3D).

**O Objetivo deste plano é introduzir um terceiro tipo oficial de arte: o Porta-Retrato (Foto de Rosto / Perfil 1:1)**:
- Um botão dedicado **"🖼️ Porta-retrato"** (ou "👤 Foto de Rosto") na barra de ferramentas do gerador de imagem por IA no Worldbuilder.
- Geração otimizada no aspecto **1:1** focada no rosto/busto do personagem, mantendo a consistência visual facial da imagem de capa (mesmos traços, olhos, cabelo, etnia/raça e iluminação dramática).
- Indexação e persistência da foto de perfil nos atributos da entidade (`portraitIndex` / `portraitUrl`).
- Identificação visual na galeria com badge **"👤 RETRATO"** e botões de ação rápida para alternar ou definir qualquer imagem da galeria como Capa, Pino de Combate ou Porta-Retrato.
- **Propagação e consumo automático** dessa foto de perfil nos módulos-chave do ecossistema:
  1. 🏪 **Lojas & Mercadores (Merchant Studio / BG3 Merchant)**: Ao vincular um NPC como dono de loja, sua foto de rosto é automaticamente usada como avatar do mercador.
  2. 📌 **Mural de Pistas & Investigação (Detective Pinboard)**: Ao adicionar ou importar um NPC como suspeito/card no mural, a foto de rosto é exibida no estilo polaroid de investigação.
  3. 🌳 **Árvore Genealógica (Dynasty & Family Trees)**: Cards de membros e modal genealógico exibem a foto de rosto do NPC vinculado.
  4. 🗺️ **World Editor & LoreGraph**: Avatares circulares de NPCs na lista de entidades e nós do grafo de relações.
  5. ⚔️ **Iniciativa & Ficha D&D 5e**: Trilha de turnos de combate e sincronização de `avatarUrl` da ficha de personagem.
  6. 🎙️ **Session Studio & Voice Call**: Orador de cena e widget de voz com o rosto do NPC.

---

## 🏗️ 2. Arquitetura da Solução & Helper Unificado

```mermaid
graph TD
    subgraph "WorldEntityModal (Gerador & Galeria)"
        UI_BTNS["Botões: ⭐ Capa | 🎯 Pino de Combate | 👤 Porta-retrato (1:1)"] --> GEN_AI["Google GenAI Image API (Nano Banana)"]
        GEN_AI --> SAVE_IMG["Galeria de Imagens (images[])"]
        SAVE_IMG --> ATTRS["entity.attributes: { combatPinIndex, portraitIndex, portraitUrl }"]
    end

    subgraph "Helper Unificado: getEntityPortraitUrl(npc)"
        ATTRS --> HELPER["getEntityPortraitUrl(entity)"]
        HELPER -->|1. Prioridade: portraitIndex / portraitUrl| P_IMG["Foto de Rosto 1:1"]
        HELPER -->|2. Fallback: images[0] (Capa)| DEF_IMG["Imagem de Capa"]
    end

    subgraph "Consumo Global da Foto de Rosto"
        P_IMG --> SHOPS["🏪 Lojas & Mercadores (MerchantForge & BG3 Modal)"]
        P_IMG --> CLUE_BOARD["📌 Mural de Pistas (Suspeitos estilo Polaroid)"]
        P_IMG --> FAMILY_TREE["🌳 Árvore Genealógica (Cards de Membros)"]
        P_IMG --> WORLD_EDITOR["🏛️ World Editor (Cards de NPCs da Campanha)"]
        P_IMG --> LORE_GRAPH["🕸️ LoreGraph (Nós Circulares de NPCs)"]
        P_IMG --> COMBAT_TRACKER["⚔️ Combat Tracker & Ficha 5e (Iniciativa & Avatar)"]
        P_IMG --> VOICE_CALL["🎙️ Voice Widget & Orador de Cena"]
    end
```

---

## 📋 3. Divisão de Tarefas & Arquivos a Modificar / Criar

### 🟧 Módulo 1: Helper Central e Tipagens (`lib/world/entityHelpers.ts` & `lib/types.ts`)
- **Arquivos:**
  - `lib/types.ts`
  - `lib/world/entityHelpers.ts` *(NOVO helper modular)*
- **Ações:**
  1. Definir utilitários centralizados para obtenção de imagens de entidades com fallbacks robustos:
     - `getEntityPortraitUrl(entity)`: retorna a foto de perfil/porta-retrato (`entity.attributes?.portraitIndex` ou `entity.attributes?.portraitUrl`, caindo para `entity.images[0]`).
     - `getEntityCombatPinUrl(entity)`: retorna o pino de combate 3D (`entity.attributes?.combatPinIndex`, caindo para `images[0]`).
     - `getEntityCoverUrl(entity)`: retorna a capa principal (`images[0]`).
     - `getEntityImageRoles(entity)`: retorna os papéis de cada índice na galeria (`isCover`, `isCombatPin`, `isPortrait`).

---

### 🟨 Módulo 2: WorldEntityModal - Modo Porta-Retrato & Gestão de Miniaturas
- **Arquivo:** [components/WorldEntityModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/WorldEntityModal.tsx)
- **Ações:**
  1. **Estados do Modal**:
     - Adicionar estado `isPortraitMode` (ou enum `generationMode: 'standard' | 'combat_pin' | 'portrait'`).
     - Adicionar estado `portraitIndex` (lido de `editingEntity.attributes.portraitIndex`).
  2. **Botão Porta-Retrato na Barra de Ferramentas**:
     - Adicionar botão **"👤 Porta-retrato"** com estilo visual refinado (ícone de retrato/câmera, badge `1:1`, estilo ativo destacado).
     - Ao clicar, ativa `isPortraitMode = true`, define `aspectRatio = '1:1'` e desativa `isCombatPinMode`.
  3. **Banner Informativo de Modo Retrato**:
     - Exibir banner explicativo: *"Modo Porta-retrato Ativo: Gera um close-up detalhado do rosto do personagem (1:1), ideal para foto de perfil em lojas, mural de pistas, árvore genealógica e fichas."*
  4. **Engenharia de Prompt Específica para Porta-Retrato**:
     - Prompt contextualizado: *Close-up facial portrait / head-and-shoulders bust shot of [Character Name], highly detailed face, expressive eyes, atmospheric lighting. Maintain exact facial features, hair, skin tone, and visual identity from the reference image. Clean aesthetic framing, 8k resolution, cinematic lighting.*
  5. **Atribuição Automática & Badges da Galeria**:
     - Ao gerar imagem em modo retrato, definir automaticamente `setPortraitIndex(newImages.length - 1)`.
     - No loop de miniaturas (`images.map`), adicionar o badge **"👤 RETRATO"** no topo direito/esquerdo.
     - Adicionar botão de ação rápida no hover de cada miniatura para permitir definir a imagem como **Porta-retrato** com 1 clique.
  6. **Persistência no Save**:
     - Salvar `attributes.portraitIndex` e `attributes.portraitUrl` no `handleSubmit`.
     - Atualizar a sincronização da ficha `npcCharacterSheet.avatarUrl` para usar a foto do porta-retrato se disponível.

---

### 🟩 Módulo 3: Lojas & Mercadores (Merchant Studio & BG3 Merchant Modal)
- **Arquivos:**
  - [components/merchant/MerchantForgeModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/merchant/MerchantForgeModal.tsx)
  - [components/merchant/BG3MerchantModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/merchant/BG3MerchantModal.tsx)
- **Ações:**
  1. No `MerchantForgeModal.tsx`, na função `handleUpdateShopNpc`, atribuir `merchantAvatarUrl: getEntityPortraitUrl(npc)`.
  2. Na prévia do NPC vinculado no formulário de loja, exibir a foto de rosto com indicador visual.
  3. No `BG3MerchantModal.tsx`, exibir o avatar de rosto no cabeçalho e na cena de negociação.

---

### 🟦 Módulo 4: Mural de Pistas & Investigação (Detective Pinboard Modal)
- **Arquivo:** [components/investigation/DetectivePinboardModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/investigation/DetectivePinboardModal.tsx)
- **Ações:**
  1. No `handleImportLoreNode`, ao importar um NPC para o mural como suspeito, utilizar `imageUrl: getEntityPortraitUrl(entity)`.
  2. Ao selecionar um NPC no dropdown de criação de suspeito/pista, carregar a foto de rosto como imagem do card polaroid.
  3. Garantir encaixe perfeito no card polaroid da pista com proporção 1:1 e moldura vintage de investigação.

---

### 🟪 Módulo 5: Árvore Genealógica (Family Trees)
- **Arquivos:**
  - [components/family-tree/FamilyMemberCard.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/family-tree/FamilyMemberCard.tsx)
  - [components/family-tree/FamilyMemberModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/family-tree/FamilyMemberModal.tsx)
  - [components/family-tree/FamilyTreeViewer.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/family-tree/FamilyTreeViewer.tsx)
- **Ações:**
  1. No `FamilyMemberCard.tsx`, calcular `displayAvatar` utilizando `getEntityPortraitUrl(linkedNpc)`.
  2. No `FamilyMemberModal.tsx`, ao associar um membro da família a um NPC do mundo, preencher `avatarUrl` com `getEntityPortraitUrl(foundNpc)`.
  3. No `FamilyTreeViewer.tsx`, renderizar os nós da árvore genealógica com a foto de perfil nítida e enquadrada.

---

### 🟫 Módulo 6: Outros Locais Beneficiados no Sistema
- **Arquivos:**
  - [components/WorldEditor.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/WorldEditor.tsx) (Card de NPC na listagem do Worldbuilding)
  - [components/CombatTracker.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/CombatTracker.tsx) (Avatar na ordem de iniciativa)
  - [components/SessionStudio.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/SessionStudio.tsx) (Diálogo de NPCs & Participantes)
  - [components/LoreGraph.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/LoreGraph.tsx) (Nós de NPCs no grafo)
- **Ações:**
  1. Substituir referências diretas de `images[0]` por `getEntityPortraitUrl(ent)` onde o contexto exigir um avatar/rosto de personagem.
  2. Manter a imagem de capa (`images[0]`) para cards de cenário, banners e visualizações de paisagem.

---

## 🧪 4. Plano de Validação & Testes

### 1. Testes Automatizados
```bash
# Validação estática de tipagem TypeScript
npx tsc --noEmit

# Execução da suíte de testes do projeto
npm run test
```

### 2. Testes Manuais de Interface & Fluxo
- [ ] **Geração do Porta-Retrato**: Abrir um NPC no Worldbuilder → Clicar em "Porta-retrato" → Gerar com IA → Verificar proporção 1:1, foco no rosto e badge `👤 RETRATO` na miniatura.
- [ ] **Gestão da Galeria**: Clicar nos botões de ação rápida em outras imagens para reatribuir Capa, Pino de Combate ou Porta-Retrato.
- [ ] **Integração com Lojas**: Criar uma loja no Merchant Studio → Vincular ao NPC com porta-retrato → Confirmar foto de rosto no avatar do mercador.
- [ ] **Mural de Pistas**: Abrir Mural de Pistas → Importar NPC como Suspeito → Verificar card polaroid com a foto de rosto 1:1.
- [ ] **Árvore Genealógica**: Abrir Árvore Genealógica → Vincular membro a NPC → Verificar que o card do membro exibe o porta-retrato.
- [ ] **Ficha & Outros Locais**: Confirmar sincronização do avatar com a ficha D&D 5e e listagens de NPC.
