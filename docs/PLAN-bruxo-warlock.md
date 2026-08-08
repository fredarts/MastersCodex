# Projeto: Implementação Completa da Classe Bruxo (Warlock) na Ficha de Personagem

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo:** WEB / BACKEND (Lógica de Dados, Regras D&D 5e)
> **Chave do Plano:** `bruxo-warlock`

## Overview

Este plano implementa 100% da classe **Bruxo (Warlock)** no Masters Codex, incluindo a mecânica exclusiva de **Magia do Pacto (Pact Magic)** — que difere fundamentalmente de todas as outras classes conjuradoras do D&D 5e por usar slots que se recuperam em descanso curto, não longo, e que são sempre do nível máximo disponível.

### Gaps Identificados no Codebase Atual

| Gap | Arquivo | Status Atual |
|-----|---------|--------------|
| **Nenhuma feature 1-20** | `dnd5e-data.ts` → `CLASS_FEATURES_DB` | ❌ Chave `Bruxo` **não existe** |
| **Nenhum recurso de classe** | `dnd5e-calculator.ts` → `getClassResourcesForLevel` | ❌ `Bruxo` **não está listado** (sem Invocações/Pact Slots) |
| **Pact Magic não calculada** | `dnd5e-calculator.ts` → `recalculateSheetDerivedStats` | ❌ Bruxo **ausente** da lógica de `casterLevel` (L516-L533) |
| **Short Rest não recupera Pact Slots** | `dnd5e-calculator.ts` → `applyShortRest` | ❌ Sem lógica para restaurar slots de Bruxo |
| **Tipo `pactSlots` inexistente** | `types.ts` → `CharacterSheet` | ❌ Sem campo para separar Pact Slots de Spell Slots |
| **UI sem seção de Pact Magic** | `SpellsSection.tsx` | ❌ Não diferencia Pact Slots dos normais |
| **Nenhuma habilidade ativa** | `ClassAbilitiesSection.tsx` | ❌ Bruxo não aparece na seção "Habilidades Ativas" |

---

## Decisão Arquitetural: Pact Magic como `classResources`

> [!IMPORTANT]
> **A Pact Magic do Bruxo é fundamentalmente diferente dos spell slots normais.** Em vez de adicionar um novo campo `pactSlots` ao `CharacterSheet` (que quebraria o Supabase e requereria migrações de banco), usaremos o padrão já existente de **`classResources`** para representar os Pact Slots do Bruxo.

**Abordagem escolhida:**
- `classResources['pact_slots']` → Armazenará `current`/`max` dos Pact Slots
- `classResources['pact_slot_level']` → Armazenará o nível dos Pact Slots (informativo, ex: "Nível 5")
- `classResources['invocacoes_misticas']` → Contador de invocações conhecidas
- Na **UI** da SpellsSection, quando a classe for Bruxo, renderizaremos uma seção especial "Magia do Pacto" acima dos spell slots normais (que, para single-class Bruxo, estarão todos zerados).
- No **Short Rest**, restaurar `classResources['pact_slots']` para o max.

**Vantagens:**
- Zero migração de banco de dados
- Reutiliza a infraestrutura existente de recursos
- O RestModal já restaura `canalizar_divindade` em short rest — basta adicionar `pact_slots`

---

## Subclasses SRD (Otherworldly Patrons)

As subclasses do Bruxo pela SRD são:

| Subclasse (PT-BR) | Nome Original | Nível de Escolha |
|---|---|---|
| **O Corruptor** | The Fiend | Nível 1 |
| **O Arquifada** | The Archfey | Nível 1 |
| **O Grande Antigo** | The Great Old One | Nível 1 |

> [!NOTE]
> A SRD 5.1 oficial só disponibiliza O Corruptor (The Fiend) com habilidades completas. As outras duas serão listadas como `choices` mas sem features `requiresSubclass` detalhadas além das core.

---

## Bruxo Level-by-Level Features Mapping (1-20)

### Nível 1
- **Patrono Transcendental**: Escolha de subclasse (`isSubclassChoice: true`, `choices: ['O Corruptor', 'O Arquifada', 'O Grande Antigo']`)
- **Magia do Pacto**: Habilidade de conjurar magias usando Carisma. 1 Pact Slot de nível 1.
- **Bênção do Submundo (O Corruptor)**: Ao reduzir uma criatura hostil a 0 PV, ganha PVs temporários = mod Carisma + nível de Bruxo (min 1). (`requiresSubclass: 'O Corruptor'`)
- **Presença Feérica (O Arquifada)**: Como ação, cada criatura em 3m faz salvaguarda de Sabedoria ou fica enfeitiçada/amedrontada. (`requiresSubclass: 'O Arquifada'`)
- **Despertar da Mente (O Grande Antigo)**: Telepatia com criaturas a 9m. (`requiresSubclass: 'O Grande Antigo'`)

### Nível 2
- **Invocações Místicas**: Aprender 2 invocações da lista de Eldritch Invocations. 2 Pact Slots nível 1.

### Nível 3
- **Dádiva do Pacto**: Escolha entre Pacto da Corrente, Pacto da Lâmina ou Pacto do Tomo. (`choices`) 2 Pact Slots nível 2.

### Nível 4
- **Incremento no Valor de Habilidade (ASI)**: +2 em 1 atributo ou +1 em 2.

### Nível 5
- **Invocação Mística Adicional**: 3ª invocação. 2 Pact Slots nível 3.

### Nível 6
- **Característica do Patrono**:
  - **Resiliência do Submundo (O Corruptor)**: Pode escolher 1 tipo de dano ao descansar para ter resistência a ele. (`requiresSubclass: 'O Corruptor'`)

### Nível 7
- **Invocação Mística Adicional**: 4ª invocação. 2 Pact Slots nível 4.

### Nível 8
- **Incremento no Valor de Habilidade (ASI)**

### Nível 9
- **Invocação Mística Adicional**: 5ª invocação. 2 Pact Slots nível 5.

### Nível 10
- **Característica do Patrono**:
  - **Fortuna do Submundo (O Corruptor)**: Ao falhar num teste de habilidade ou salvaguarda, pode gastar 1d10 e adicionar ao resultado. 1 uso por descanso longo. (`requiresSubclass: 'O Corruptor'`)

### Nível 11
- **Arcanum Místico (6º Nível)**: Aprender 1 magia de 6º nível, conjurável 1x por descanso longo (sem usar pact slot). 3 Pact Slots nível 5.

### Nível 12
- **Invocação Mística Adicional**: 6ª invocação.
- **Incremento no Valor de Habilidade (ASI)**

### Nível 13
- **Arcanum Místico (7º Nível)**: Aprender 1 magia de 7º nível, 1x por descanso longo.

### Nível 14
- **Característica do Patrono**:
  - **Lançar no Inferno (O Corruptor)**: Ao acertar uma criatura, pode lançá-la no plano inferior por 10d10 de dano psíquico. 1x por descanso longo. (`requiresSubclass: 'O Corruptor'`)

### Nível 15
- **Invocação Mística Adicional**: 7ª invocação.
- **Arcanum Místico (8º Nível)**: Aprender 1 magia de 8º nível, 1x por descanso longo.

### Nível 16
- **Incremento no Valor de Habilidade (ASI)**

### Nível 17
- **Arcanum Místico (9º Nível)**: Aprender 1 magia de 9º nível, 1x por descanso longo. 4 Pact Slots nível 5.

### Nível 18
- **Invocação Mística Adicional**: 8ª invocação.

### Nível 19
- **Incremento no Valor de Habilidade (ASI)**

### Nível 20
- **Senhor Místico (Eldritch Master)**: 1x por descanso longo, pode gastar 1 minuto para recuperar todos os Pact Slots.

---

## Tabela de Progressão de Pact Slots

| Nível | Pact Slots | Nível do Slot | Invocações Conhecidas | Magias Conhecidas |
|-------|-----------|---------------|----------------------|-------------------|
| 1     | 1         | 1º            | —                    | 2                 |
| 2     | 2         | 1º            | 2                    | 3                 |
| 3     | 2         | 2º            | 2                    | 4                 |
| 4     | 2         | 2º            | 2                    | 5                 |
| 5     | 2         | 3º            | 3                    | 6                 |
| 6     | 2         | 3º            | 3                    | 7                 |
| 7     | 2         | 4º            | 4                    | 8                 |
| 8     | 2         | 4º            | 4                    | 9                 |
| 9     | 2         | 5º            | 5                    | 10                |
| 10    | 2         | 5º            | 5                    | 10                |
| 11    | 3         | 5º            | 5                    | 11                |
| 12    | 3         | 5º            | 6                    | 11                |
| 13    | 3         | 5º            | 6                    | 12                |
| 14    | 3         | 5º            | 6                    | 12                |
| 15    | 3         | 5º            | 7                    | 13                |
| 16    | 3         | 5º            | 7                    | 13                |
| 17    | 4         | 5º            | 7                    | 14                |
| 18    | 4         | 5º            | 8                    | 14                |
| 19    | 4         | 5º            | 8                    | 15                |
| 20    | 4         | 5º            | 8                    | 15                |

---

## 📋 Task Breakdown

### Task 1: Adicionar `CLASS_FEATURES_DB` do Bruxo em `dnd5e-data.ts`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P0
- **Dependencies**: Nenhuma
- **INPUT**: Mapeamento de features acima (níveis 1-20)
- **OUTPUT**: Chave `Bruxo` populada em `CLASS_FEATURES_DB` com ~25+ features, incluindo `isSubclassChoice`, `requiresSubclass`, `choices`, e `resourceCost`
- **VERIFY**: Tipagem válida `Omit<ClassFeature, 'id'>[]` para cada nível. Rodar `npx tsc --noEmit`.

---

### Task 2: Implementar Pact Slots e Invocações em `getClassResourcesForLevel`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P0
- **Dependencies**: Task 1
- **INPUT**: Função `getClassResourcesForLevel` em `dnd5e-calculator.ts`
- **OUTPUT**: Adicionar bloco `else if (c.name === 'Bruxo')` que cria:
  1. `resources['pact_slots']`: `{ label: 'Slots do Pacto', current: <tabela>, max: <tabela> }` baseado no nível
  2. `resources['pact_slot_level']`: `{ label: 'Nível do Slot do Pacto', current: <nível>, max: <nível> }` (informativo)
  3. `resources['invocacoes_misticas']`: `{ label: 'Invocações Místicas', current: <tabela>, max: <tabela> }` (informativo, contador)
  4. `resources['fortuna_submundo']` (nível 10+, se O Corruptor): 1 uso por descanso longo
  5. `resources['lancar_inferno']` (nível 14+, se O Corruptor): 1 uso por descanso longo
  6. `resources['senhor_mistico']` (nível 20): 1 uso por descanso longo
  7. `resources['arcanum_6']` a `resources['arcanum_9']` (níveis 11, 13, 15, 17): 1 uso cada por descanso longo
- **VERIFY**: Criar Bruxo nível 9, verificar que `pact_slots.max === 2` e `pact_slot_level.current === 5`.

---

### Task 3: Excluir Bruxo da Tabela Normal de Spell Slots em `recalculateSheetDerivedStats`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P0
- **Dependencies**: Task 2
- **INPUT**: Lógica de `casterLevel` em `recalculateSheetDerivedStats` (linhas ~516-576)
- **OUTPUT**:
  1. O Bruxo **NÃO** deve contribuir para `casterLevel` na tabela normal de multiclasse. Seus slots são separados.
  2. Em single-class Bruxo, os `spellSlots[1..9]` devem ficar **zerados** (o Bruxo usa `pact_slots` via `classResources`).
  3. Em **multiclasse** (ex: Bruxo 5 / Mago 5), o Bruxo não soma ao caster level, mas o Mago sim. O Bruxo mantém seus Pact Slots separadamente via classResources, e o Mago tem seus spell slots normais.
- **VERIFY**: Single-class Bruxo 5 deve ter `spellSlots[1..9]` todos com `total: 0` e `classResources.pact_slots.max === 2`. Multiclasse Bruxo 3 / Mago 5 deve ter spell slots normais de caster level 5 **+** 2 Pact Slots de nível 2.

---

### Task 4: Restaurar Pact Slots em `applyShortRest`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Dependencies**: Task 2
- **INPUT**: Função `applyShortRest` em `dnd5e-calculator.ts` (linhas ~860-905)
- **OUTPUT**: Adicionar lógica para restaurar `classResources['pact_slots']` no descanso curto, similar ao que já é feito com `canalizar_divindade`:
  ```typescript
  if (newResources['pact_slots']) {
    newResources['pact_slots'] = {
      ...newResources['pact_slots'],
      current: newResources['pact_slots'].max
    };
  }
  ```
- **VERIFY**: Bruxo gasta 1 pact slot → faz short rest → `pact_slots.current` volta ao max.

---

### Task 5: Renderizar Pact Slots na UI (`SpellsSection.tsx`)
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 2, Task 3
- **INPUT**: Componente `SpellsSection.tsx`
- **OUTPUT**: Quando `hasClass(sheet, 'Bruxo')`:
  1. Renderizar seção especial **"Magia do Pacto"** no topo (antes dos spell slots normais) mostrando:
     - Quantidade de Pact Slots (current/max)
     - Nível do Pact Slot (ex: "5º Nível")
     - Botões de gastar/recuperar slot
  2. Mostrar indicador visual de que Pact Slots se recuperam em **Descanso Curto** (badge/tooltip)
  3. Se single-class Bruxo, esconder os spell slots normais (que estão zerados)
  4. Se multiclasse, mostrar ambos: Pact Slots do Bruxo + Spell Slots normais da outra classe
- **VERIFY**: Abrir ficha de Bruxo puro → ver seção "Magia do Pacto" com slots funcionais. Bruxo/Mago multiclasse → ver ambas seções.

---

### Task 6: Adicionar Habilidades Ativas do Bruxo na `ClassAbilitiesSection.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 2
- **INPUT**: Componente `ClassAbilitiesSection.tsx`
- **OUTPUT**: Quando `hasClass(sheet, 'Bruxo')`:
  1. Renderizar botão de **Gastar Pact Slot** (semelhante ao Smite do Paladino) — o jogador escolhe o efeito (gastar o slot para conjurar)
  2. Exibir lista resumida de **Invocações Místicas** ativas (informativo)
  3. Se O Corruptor e nível 14+: botão ativo de **"Lançar no Inferno"** com contador de uso
- **VERIFY**: Bruxo nível 14 (Corruptor) → ver botão "Lançar no Inferno" com 1 uso e Pact Slots na seção ativa.

---

### Task 7: Escrever Suíte de Testes Unitários
- **Agent**: `test-engineer`
- **Skills**: `testing-patterns`
- **Priority**: P2
- **Dependencies**: Tasks 1-4
- **INPUT**: `lib/__tests__/dnd5e-calculator.test.ts`
- **OUTPUT**: Novo bloco `describe('Mecânicas do Bruxo (Warlock)')` testando:
  1. Features carregadas corretamente no nível 1 (com e sem O Corruptor)
  2. `classResources.pact_slots.max` correto nos breakpoints: nível 1 (1), nível 2 (2), nível 11 (3), nível 17 (4)
  3. `classResources.pact_slot_level.current` correto: nível 1 (1), nível 3 (2), nível 5 (3), nível 7 (4), nível 9 (5)
  4. Single-class Bruxo tem `spellSlots[1..9]` todos zerados
  5. Short rest restaura `pact_slots.current` ao max
  6. Multiclasse Bruxo 3 / Mago 5 mantém Pact Slots separados dos spell slots do Mago
  7. `calculateSpellLimits` retorna contagem correta de cantrips e magias conhecidas
- **VERIFY**: `npx vitest run` — todos os testes passam.

---

## Arquivos Afetados

| Arquivo | Tipo de Alteração | Task |
|---------|-------------------|------|
| [dnd5e-data.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-data.ts) | [MODIFY] Adicionar `Bruxo` ao `CLASS_FEATURES_DB` | Task 1 |
| [dnd5e-calculator.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-calculator.ts) | [MODIFY] `getClassResourcesForLevel`, `recalculateSheetDerivedStats`, `applyShortRest` | Tasks 2, 3, 4 |
| [SpellsSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/SpellsSection.tsx) | [MODIFY] Seção Pact Magic | Task 5 |
| [ClassAbilitiesSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/ClassAbilitiesSection.tsx) | [MODIFY] Habilidades ativas do Bruxo | Task 6 |
| [dnd5e-calculator.test.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/__tests__/dnd5e-calculator.test.ts) | [MODIFY] Testes unitários do Bruxo | Task 7 |

---

## User Review Required

> [!WARNING]
> **Decisão sobre Pact Slots como `classResources`:** Ao invés de adicionar um campo `pactSlots` no tipo `CharacterSheet` (que exigiria migração de banco Supabase + atualização de serialização), propomos reusar o sistema existente de `classResources`. Isso é pragmaticamente correto? Se preferir um campo dedicado, saiba que será necessária uma migração.

> [!IMPORTANT]
> **Escopo de subclasses:** O plano inclui features detalhadas apenas do **Corruptor (The Fiend)** como subclasse SRD completa. O Arquifada e O Grande Antigo são listados como opções mas com features genéricas. Deseja expandir as 3 subclasses com features detalhadas?

---

## Phase X: Verificação Final

- [ ] TypeScript sem erros: `npx tsc --noEmit`
- [ ] Lint limpo: `npm run lint`
- [ ] Testes passando: `npx vitest run`
- [ ] Teste manual: Criar Bruxo nível 1 (O Corruptor) → subir para nível 5 → verificar Pact Slots, Invocações e Features na UI
- [ ] Teste de Descanso Curto: Gastar Pact Slot → Short Rest → verificar restauração
- [ ] Teste de Multiclasse: Bruxo 5 / Mago 5 → spell slots do Mago separados dos Pact Slots
- [ ] Build bem-sucedido: `npm run build`
