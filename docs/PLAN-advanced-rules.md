# Plano de Implementação: Regras Avançadas e Automações (D&D 5e)

> **Status:** 📝 Em Planejamento | **Prioridade:** 🌟 Premium (WOW) | **Tipo de Projeto:** WEB / RULES ENGINE / UI  
> **Chave do Plano:** `advanced-rules`

Este plano detalha a implementação de quatro sistemas mecânicos avançados de D&D 5e no Masters Codex: **Automação de Condições**, **Talentos Táticos de Combate (GWM, Sharpshooter, War Caster)**, **Cálculo de Capacidade de Carga e Sobrecarga (Variant Encumbrance)**, e **Mecânica Interativa de Concentração vs Dano**.

---

## 🎯 Escopo das Automações

### 1. Automação de Condições (Conditions)
*   **Modelo de Dados:** Adicionar `conditions?: ConditionType[]` à interface `CharacterSheet` no `lib/types.ts`.
*   **UI de Controle:** Adicionar um componente visual interativo de condições ativas (com botões de toggle) na `CombatSection.tsx`.
*   **Regra de Jogo:**
    *   Se possuir a condição `"Envenenado"` ou `"Atemorizado"` na ficha: forçar `advantageMode = 'disadvantage'` nas rolagens de ataque e testes de perícia.
    *   Se possuir `"Incapacitado"`, `"Paralisado"`, `"Petrificado"` ou `"Inconsciente"`: bloquear rolagens de ataque e testes de perícia, exibindo uma notificação de impedimento.

### 2. Talentos Táticos de Combate (Power Attack & War Caster)
*   **Ataque Poderoso (GWM / Sharpshooter):**
    *   Se o personagem tiver o talento *Mestre de Armas Grandes* ou *Atirador de Elite*, mostrar um checkbox "Ataque Poderoso (-5/+10) ⚔️" na `CombatSection.tsx`.
    *   Se marcado, subtrair 5 do modificador de ataque e somar 10 ao modificador de dano da arma antes da rolagem.
*   **Conjurador de Combate (War Caster):**
    *   Se possuir o talento *Conjurador de Combate* e a jogada for uma salvaguarda (saving throw) com o rótulo "Concentração", aplicar vantagem (`advantageMode = 'advantage'`) automaticamente.

### 3. Peso e Carga variantes (Variant Encumbrance)
*   **Cálculo de Peso:** Criar a função `calculateTotalWeight(sheet)` para somar o peso de todos os itens do inventário (`sheet.equipment`).
*   **Sobrecarga Dinâmica (`calculateDynamicSpeed`):**
    *   `Peso > Força × 5` (Carga Leve): Deslocamento reduzido em `10 pés`.
    *   `Peso > Força × 10` (Carga Pesada): Deslocamento reduzido em `20 pés` e desvantagem automática em testes de FOR/DES/CON.
    *   `Peso > Força × 15` (Carga Máxima): Deslocamento reduzido para `0`.
*   **UI do Inventário:** Adicionar uma barra de progresso visual de carga (estilo BG3) no inventário com marcadores para os limites.

### 4. Mecânica de Concentração vs Dano
*   **Detecção de Dano:** Quando o HP atual cair (`newHp < currentHp`), e a condição `"Concentração"` estiver ativa na ficha:
    *   Calcular a CD da salvaguarda: `CD = Math.max(10, Math.floor(danoSofrido / 2))`.
    *   Exibir um prompt interativo/modal perguntando: *"Você sofreu X de dano enquanto concentrado! Deseja realizar a Salvaguarda de Constituição CD Y?"*
    *   Se o teste falhar, remover automaticamente a condição `"Concentração"` da ficha do personagem e publicar a falha no chat.

---

## 🏗️ Proposta de Arquitetura e Arquivos

### 1. `lib/types.ts`
*   **Ação:** Adicionar `conditions?: ConditionType[]` ao `CharacterSheet`.

### 2. `lib/dnd5e-calculator.ts`
*   **Ação:** 
    *   Implementar `calculateTotalWeight(sheet)`.
    *   Atualizar `calculateDynamicSpeed` para aplicar redutores de velocidade de acordo com a Carga Pesada.
    *   Adicionar redutores e desvantagens de sobrecarga no `calculateSavingThrowTotal` e `calculateSkillTotal` se Carga Pesada for ativa.

### 3. `lib/dnd5e-dice.ts`
*   **Ação:**
    *   Em `executeCheckRoll`, interceptar se o personagem está `"Incapacitado"` para bloquear a ação.
    *   Se estiver `"Envenenado"` ou `"Atemorizado"` (e o teste for afetado), forçar desvantagem.
    *   Se for salvaguarda de "Concentração" e tiver *War Caster*, forçar vantagem.

### 4. `components/character-sheet/Sections/CombatSection.tsx`
*   **Ação:**
    *   Injetar o painel visual de condições D&D 5e com badges de toggle.
    *   Adicionar o checkbox de "Ataque Poderoso" condicionado aos talentos e ajustar as propriedades passadas ao `executeWeaponAttackRoll`.
    *   Interceptar a mudança de HP: se sofrer dano enquanto concentrado, disparar o prompt para a salvaguarda de Constituição.

---

## 📋 Tarefas (Task Breakdown)

### 🟩 Task 1: Modificar Banco de Dados e Ficha (`lib/types.ts` e `lib/dnd5e-calculator.ts`)
*   Adicionar `conditions` na interface `CharacterSheet`.
*   Criar função `calculateTotalWeight` e integrar regras de Carga Pesada na velocidade e atributos.

### 🟩 Task 2: Implementar Regras de Dados Avançadas (`lib/dnd5e-dice.ts`)
*   Automatizar as condições (Envenenado, Atemorizado desvantagens; Incapacitado bloqueio).
*   Automatizar vantagem em salvaguarda de concentração com talento *War Caster*.

### 🟩 Task 3: Atualizar UI de Combate e Prompt de Concentração (`CombatSection.tsx`)
*   Implementar painel visual de Condições na aba de combate.
*   Implementar checkbox de "Ataque Poderoso (-5/+10)".
*   Implementar o prompt interativo de teste de concentração ao perder HP.

### 🟩 Task 4: Escrever e Executar Testes Unitários
*   Testes no `dnd5e-calculator.test.ts` para carga e velocidade.
*   Testes no `dnd5e-dice.test.ts` para vantagens/desvantagens de condições e War Caster.
*   Validação final da compilação e build de produção.

---

## ✅ PHASE X COMPLETE
- Lint: ⬜
- Security: ⬜
- Build: ⬜
- Date: [Aguardando Aprovação]
