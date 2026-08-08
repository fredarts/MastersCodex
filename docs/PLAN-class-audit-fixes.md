# Plano de Implementação: Correção e Ajuste de Gaps de Classes (D&D 5e)

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB / BACKEND (Regras de Jogo, UI de Ficha)  
> **Chave do Plano:** `class-audit-fixes`

Este plano detalha as correções necessárias para sanar as lacunas encontradas na auditoria das classes do Masters Codex. O foco está em ativar as opções de subclasse para Paladino e Mago, consertar rolagens de acertos críticos para Bárbaros e Ladinos, e implementar a Canção de Descanso para Bardos.

---

## 🎯 Gaps a Resolver

| Funcionalidade | Arquivo(s) | Ação Proposta |
| :--- | :--- | :--- |
| **Opção de Subclasse do Paladino** | `lib/dnd5e-data.ts` | Adicionar a flag `"isSubclassChoice": true` na característica *Canalizar Divindade (Juramento)* no nível 3 do Paladino. |
| **Opção de Subclasse do Mago** | `lib/dnd5e-data.ts` | Adicionar a flag `"isSubclassChoice": true` na característica *Tradição Arcana* no nível 2 do Mago. |
| **Crítico Brutal (Bárbaro)** | `CombatSection.tsx` | Ajustar a função `rollWeaponDamage` para ler o nível de Bárbaro do personagem e adicionar +1d (Lvl 9), +2d (Lvl 13) ou +3d (Lvl 17) de dados de arma adicionais em acertos críticos. |
| **Ataque Furtivo Crítico (Ladino)** | `lib/dnd5e-dice.ts` & `CombatSection.tsx` | Ajustar `executeSneakAttackRoll` para aceitar um parâmetro `isCrit?: boolean`. Se verdadeiro, duplicar os d6 de Ataque Furtivo rolados. Adicionar checkbox na UI para indicar rolagem crítica. |
| **Canção de Descanso (Bardo)** | `lib/dnd5e-calculator.ts` | Ajustar `applyShortRest` para verificar se o personagem possui níveis de Bardo e rolar um dado extra de cura automática (+1d6 a +1d12) para cada descanso curto se o Bardo estiver presente. |

---

## 🏗️ Proposta de Implementação

### 1. Paladino e Mago Subclass Choices (`lib/dnd5e-data.ts`)
*   **Ação:** Localizar as habilidades `Canalizar Divindade (Juramento)` e `Tradição Arcana` no banco de dados e inserir a propriedade `isSubclassChoice: true` ao lado de `choices`.

### 2. Crítico Brutal do Bárbaro (`components/character-sheet/Sections/CombatSection.tsx`)
*   **Ação:** Na função `rollWeaponDamage(atk, isCrit)`:
    *   Verificar se o personagem tem níveis na classe "Bárbaro".
    *   Se for um crítico (`isCrit === true`), calcular os dados adicionais de Crítico Brutal:
        *   Nível 9 a 12: +1 dado
        *   Nível 13 a 16: +2 dados
        *   Nível 17+: +3 dados
    *   Adicionar esses dados ao total de dados rolados (`finalNumDice`).

### 3. Ataque Furtivo Crítico (`lib/dnd5e-dice.ts` & `CombatSection.tsx`)
*   **Ação:**
    *   Em `lib/dnd5e-dice.ts`, modificar `executeSneakAttackRoll` para:
        ```typescript
        export function executeSneakAttackRoll({
          sheet,
          visibility = 'public',
          secretMode = 'subtle_notice',
          isCrit = false,
        }: {
          sheet: CharacterSheet;
          visibility?: RollVisibility;
          secretMode?: SecretRollNotificationMode;
          isCrit?: boolean;
        })
        ```
    *   Se `isCrit === true`, dobrar o `numDice` de dados de ataque furtivo.
    *   Na `CombatSection.tsx` (aba de Ataque Furtivo do Ladino), incluir um controle toggle (checkbox/switch) estilizado "Ataque Crítico 🎯" ao lado do botão "Rolar Furtivo" para permitir ao jogador dobrar os dados se a arma original obteve um crítico.

### 4. Canção de Descanso do Bardo (`lib/dnd5e-calculator.ts`)
*   **Ação:** Em `applyShortRest`:
    *   Verificar se o personagem possui nível na classe "Bardo" (ou adicionar um campo opcional `hasSongOfRest` na chamada).
    *   Se tiver níveis de Bardo >= 2:
        *   Nível 2-8: Rolar +1d6 de cura bônus.
        *   Nível 9-12: Rolar +1d8 de cura bônus.
        *   Nível 13-16: Rolar +1d10 de cura bônus.
        *   Nível 17+: Rolar +1d12 de cura bônus.
    *   Somar o valor rolado ao `hpRecovered` e detalhar na mensagem ou dados do descanso.

---

## 📋 Tarefas (Task Breakdown)

### 🟩 Task 1: Correções nos Presets do Banco de Dados (`lib/dnd5e-data.ts`)
*   Adicionar flag `isSubclassChoice` no nível 3 do Paladino.
*   Adicionar flag `isSubclassChoice` no nível 2 do Mago.

### 🟩 Task 2: Implementar Dano de Críticos (Brutal e Furtivo) e Canção de Descanso
*   Atualizar a função `rollWeaponDamage` na `CombatSection.tsx` para computar o *Crítico Brutal* do Bárbaro.
*   Atualizar `executeSneakAttackRoll` em `lib/dnd5e-dice.ts` para dobrar os dados no crítico.
*   Integrar a interface do Ladino na `CombatSection.tsx` com opção de rolar crítico.
*   Ajustar `applyShortRest` em `lib/dnd5e-calculator.ts` para somar a *Canção de Descanso* do Bardo.

### 🟩 Task 3: Escrever Testes Unitários de Validação
*   Escrever testes no `dnd5e-calculator.test.ts` para verificar se `applyShortRest` adiciona cura bônus se houver Bardo.
*   Escrever testes no `dnd5e-dice.test.ts` para certificar que o Ataque Furtivo dobra os dados em caso de crítico.

---

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (0 errors)
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-08-08
