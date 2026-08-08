# Plano de Implementação: Correções de Automações de Classes (D&D 5e)

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Regras de D&D, UI da Ficha de Personagem)  
> **Chave do Plano:** `class-fixes-automation`

Este plano detalha as correções técnicas necessárias para automatizar o bônus de nível 20 do Bárbaro (*Campeão Primitivo*), integrar a mecânica de *Talento Confiável* na interface de rolagens de perícias do Ladino e implementar pequenas automações contextuais para as características de *Inimigo Favorito* e *Explorador Natural* do Patrulheiro.

---

## 🎯 Gaps a Resolver

| Funcionalidade / Gap | Arquivo(s) Afetado(s) | Descrição do Problema / Proposta de Solução |
| :--- | :--- | :--- |
| **Bárbaro Nível 20 (Campeão Primitivo)** | `lib/dnd5e-calculator.ts` | O bônus de +4 em Força e Constituição e a elevação do limite máximo de atributos para 24 não são aplicados dinamicamente na ficha de personagem. <br>**Solução:** Ajustar a função `recalculateSheetDerivedStats` para injetar os bônus aos atributos caso a classe Bárbaro tenha nível 20. |
| **Talento Confiável (Ladino Nível 11)** | `components/character-sheet/Sections/SkillsSection.tsx` | A função de dados possui suporte a tratar d20 < 10 como 10, mas a interface não envia a flag automaticamente ao clicar nas perícias proficientes do Ladino Lvl 11+.<br>**Solução:** Identificar se o personagem tem nível de Ladino >= 11 e proficiência na perícia e injetar `reliableTalent: true` na chamada da rolagem. |
| **Automações de Patrulheiro (Inimigo/Terreno)** | `components/character-sheet/Sections/SkillsSection.tsx` & `CombatSection.tsx` | Características como *Inimigo Favorito* e *Explorador Natural* exigem que o jogador aplique vantagem manualmente. <br>**Solução:** Adicionar um checkbox sutil de "Contexto de Inimigo/Terreno Favorito" na interface de testes do Patrulheiro para forçar a vantagem em testes aplicáveis de Sobrevivência/Rastreamento/Conhecimento. |

---

## 🏗️ Proposta de Arquitetura & Alterações

### 1. Bárbaro Lvl 20: Campeão Primitivo
*   **Alteração em [dnd5e-calculator.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-calculator.ts):**
    *   Na função `recalculateSheetDerivedStats(sheet)`:
        *   Verificar se o personagem possui nível 20 de Bárbaro (usando `getClassLevel(sheet, 'Bárbaro') === 20`).
        *   Caso positivo, adicionar +4 ao score de Força (`str`) e Constituição (`con`).
        *   Garantir que a verificação dos modificadores considere esses bônus no recálculo de HP e ataques.

### 2. Ladino Lvl 11: Talento Confiável na Interface
*   **Alteração em [SkillsSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/SkillsSection.tsx):**
    *   No clique para realizar rolagens de perícias:
        *   Obter o nível de Ladino do personagem.
        *   Se o nível de Ladino for maior ou igual a 11 e o nível de proficiência da perícia clicada for `'proficient'` ou `'expertise'`, repassar `reliableTalent: true` na chamada do método `executeCheckRoll`.

### 3. Patrulheiro: Automação Contextual
*   **Alteração nas seções da Ficha:**
    *   Na [SkillsSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/SkillsSection.tsx), se o personagem for Patrulheiro, incluir um toggle sutil de "Inimigo/Terreno Favorito" no diálogo de rolagem.
    *   Ao ativar, o sistema rolará o teste de Sobrevivência/Rastreamento com Vantagem por padrão.

---

## 📋 Tarefas (Task Breakdown)

### 🟩 Milestone 1: Correções na Lógica de Cálculo (Bárbaro)
*   **Ações:**
    1. Ajustar `recalculateSheetDerivedStats` para aplicar o bônus de +4 em FOR e CON para Bárbaros lvl 20.
    2. Certificar que o cálculo derivado de HP máximo e os ataques corpo a corpo com Força absorvem o bônus de +4 instantaneamente.
*   **Verificação:** Criar um Bárbaro nível 20 com Força Base 16 e Constituição Base 16. O recalculador deve exibir pontuações finais de Força 20 (+5) e Constituição 20 (+5).

### 🟦 Milestone 2: Integração de Rolagens na UI (Ladino e Patrulheiro)
*   **Ações:**
    1. Integrar o cálculo de `reliableTalent` no gatilho de rolagem de perícias de [SkillsSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/SkillsSection.tsx).
    2. Adicionar o toggle opcional de bônus do Patrulheiro nas rolagens correspondentes.
*   **Verificação:** Simular rolagem de perícia proficiente em Ladino lvl 11. Se cair menos de 10 no d20, verificar se o valor computado é tratado como 10.

### 🟨 Milestone 3: Testes de Regressão e Unitários
*   **Ações:**
    1. Escrever testes unitários em `lib/__tests__/dnd5e-calculator.test.ts` para validar o bônus de Bárbaro Lvl 20.
    2. Escrever testes em `lib/__tests__/dnd5e-dice.test.ts` para verificar se `reliableTalent` altera corretamente o d20.
*   **Verificação:** `npm run test` passa com 100% de sucesso.

---

## 🧪 Fase X: Critérios de Verificação (Definition of Done)
- [ ] O linter e type checker passam (`npx tsc --noEmit`).
- [ ] Um Bárbaro nível 20 tem Força e Constituição aumentados em +4 e os pontos de vida aumentam de forma coerente.
- [ ] Um Ladino de nível 11 rolando perícia em que é proficiente nunca obtém menos de 10 na face do dado do teste no chat.
- [ ] Testes do calculador e rolador passam com sucesso.
