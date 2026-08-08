# Plano de Implementação: Seleção de Talentos (Feats) no Level Up

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js, React, D&D 5e System)  
> **Chave do Plano:** `feats-selection`

Este plano detalha o design técnico e a implementação do **Sistema de Seleção de Talentos (Feats)** no modal de evolução de nível (`LevelUpModal`) e a integração com todas as classes e fichas de personagem D&D 5e no Masters Codex.

---

## 🎯 Escopo & Regras de Negócio

1. **Escolha Alternativa no Level Up (ASI vs Feat):**
   - Nos níveis de ASI (4, 8, 12, 16, 19 para a maioria das classes; mais níveis 6 e 14 para Guerreiro, e nível 10 para Ladino), o jogador pode escolher entre:
     - **Opção A:** Incremento no Valor de Habilidade (ASI: +2 em um atributo ou +1 em dois atributos).
     - **Opção B:** Escolher 1 Talento (Feat) oficial da lista do D&D 5e.
2. **Requisitos de Talentos (Prerequisites):**
   - O sistema filtrará/bloqueará talentos cujos pré-requisitos não forem atendidos pelo personagem (ex: Valor mínimo de Força/Destreza, Proficiência com tipos de armadura, capacidade de conjurar magias, raça específica).
3. **Talentos de Atributo (Half-Feats):**
   - Talentos que concedem +1 em um atributo à escolha do jogador (ex: *Resiliente*, *Atleta*, *Fey Touched*, *Observador*) abrirão um seletor simples para aplicar o ponto bônus.
4. **Talentos com Efeitos Especiais de Cálculo:**
   - **Robusto (Tough):** Adiciona automaticamente +2 PVs por nível do personagem (retroativo e futuro).
   - **Alerta (Alert):** Adiciona +5 de bônus permanente na Iniciativa.
   - **Móvel (Mobile):** Adiciona +10ft (3m) no deslocamento base.
   - **Resiliente (Resilient):** Concede proficiência no teste de resistência (Saving Throw) do atributo escolhido.
5. **Armazenamento e Exibição na Ficha:**
   - Adição do array `feats: CharacterFeat[]` no tipo `CharacterSheet`.
   - Aba/Seção dedicada na Ficha de Personagem (`CharacterSheet`) listando os Talentos adquiridos com descrição rica e ações ativáveis.

---

## 🏗️ Modificações Propostas

### 1. Modelo de Dados (`lib/types.ts`)

```typescript
export interface CharacterFeat {
  id: string;
  name: string;
  namePt: string;
  description: string;
  prerequisite?: string;
  chosenAttribute?: AttributeKey; // Para Half-Feats (+1 no atributo escolhido)
  benefits: {
    attributeBonus?: Partial<Record<AttributeKey, number>>;
    initiativeBonus?: number;
    speedBonus?: number;
    hpPerLevelBonus?: number;
    savingThrowProficiency?: AttributeKey;
  };
}

// Atualização no CharacterSheet:
export interface CharacterSheet {
  // ...campos existentes
  feats?: CharacterFeat[];
}
```

### 2. Base de Dados de Talentos D&D 5e (`lib/dnd5e-feats-db.ts`)

Criar arquivo dedicado contendo a lista dos principais talentos oficiais de D&D 5e em Português e Inglês:
- **Alerta (Alert)**
- **Atirador de Elite (Sharpshooter)**
- **Mestre de Armas Grandes (Great Weapon Master)**
- **Conjurador de Combate (War Caster)**
- **Robusto (Tough)**
- **Sortudo (Lucky)**
- **Móvel (Mobile)**
- **Sentinela (Sentinel)**
- **Resiliente (Resilient)**
- **Adepto Elemental (Elemental Adept)**
- **Observador (Observant)**
- **Combatente Montado (Mounted Combatant)**
- **Especialista em Besta (Crossbow Expert)**
- **Mestre em Armaduras Pesadas (Heavy Armor Master)**
- *E mais 15+ talentos fundamentais da 5ª edição.*

### 3. Ajuste do Calculador (`lib/dnd5e-calculator.ts`)

- Atualizar cálculo de Iniciativa para somar `feats.reduce((acc, f) => acc + (f.benefits.initiativeBonus || 0), 0)`.
- Atualizar cálculo de Deslocamento/Speed para somar bônus de talentos (*Mobile*).
- Atualizar cálculo de Vida Máxima (`maxHp`) para incluir o bônus de *Robusto (Tough)* se presente (`level * 2`).
- Atualizar Saving Throws para considerar proficiências concedidas por talentos (*Resilience*).

### 4. Interface do Modal de Nível (`components/character-sheet/Modals/LevelUpModal.tsx`)

- No **Passo 3 (Níveis de ASI)**, adicionar um seletor de aba/modo:
  - `[ Modificadores de Atributo (+2) ]` | `[ Selecionar Talento / Feat ]`
- Se o modo **Talento** for selecionado:
  - Exibir barra de busca e filtros de categoria (Combate, Magia, Utilitários, Atributos).
  - Exibir cards dos talentos indicando se o personagem cumpre os pré-requisitos.
  - Se for um Half-Feat, permitir a seleção do atributo que receberá +1.
- No `finishLevelUp`, salvar o talento selecionado no array `finalSheet.feats` e aplicar os bônus aos atributos/PVs.

### 5. Exibição na Ficha do Personagem (`components/character-sheet/Sections/FeaturesSection.tsx` & `GeneralSection.tsx`)

- Adicionar cartão/sub-aba "Talentos & Feats" onde o jogador e DM podem visualizar os talentos ativos, suas descrições e bônus.

---

## Verification Plan

### Automated Tests
```bash
# Análise de tipos
npx tsc --noEmit
```

### Manual Verification
1. Criar/Evoluir um Guerreiro para o Nível 4 no `LevelUpModal`.
2. Escolher a opção "Selecionar Talento" em vez de ASI.
3. Escolher o talento **Alerta (Alert)** → Confirmar nivelamento → Verificar se a Iniciativa na Ficha subiu +5.
4. Evoluir para o Nível 6 de Guerreiro → Escolher **Robusto (Tough)** → Verificar se os PVs aumentaram em +12 (6 níveis x 2).
5. Evoluir para o Nível 8 → Escolher **Resiliente (Resilient - Constituição)** → Verificar se Constituição aumentou +1 e ganhou proficiência no Teste de Resistência de Con.
