# Plano de Implementação: Duração de Efeitos por Rodada no Combate

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js 16, TypeScript, Supabase Realtime)
> **Chave do Plano:** `effects-duration-tracker`

Este plano detalha o design técnico e as alterações necessárias para implementar o rastreamento automático de duração de efeitos e condições por rodada durante o combate. Os efeitos e condições (como Fúria, Concentração, Envenenado, etc.) terão suas durações decrementadas automaticamente no início do turno de cada combatente, expirando de forma limpa.

---

## User Review Required

> [!IMPORTANT]
> **Compatibilidade do Banco de Dados (JSONB):** Como os combatentes das cenas são serializados em uma coluna `combatants` do tipo `JSONB` no Supabase, a adição do campo opcional `statusDurations` não causará quebras nem necessita de migração SQL de banco de dados.

> [!TIP]
> **Diferenciação Visual:**
> - As condições padrão ativas do D&D 5e (como *Cego*, *Concentração*) com duração definida serão exibidas com uma tag vermelha indicando o tempo restante (ex: `Cego (3r)`).
> - Efeitos ou Buffs customizados (como *Fúria*, *Bênção*, *Velocidade*) serão exibidos em tags ciano/azul para facilitar a diferenciação visual entre condições físicas de debuff e bônus de combate.

---

## Proposed Changes

### [Core Types & Engines]

#### [MODIFY] [types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts)
*   **Ações:**
    1. Criar a interface `StatusDuration` contendo as propriedades `name` (string) e `remainingRounds` (number).
    2. Adicionar o campo opcional `statusDurations?: StatusDuration[]` na interface `Combatant`.

#### [MODIFY] [useCombatEngine.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/hooks/useCombatEngine.ts)
*   **Ações:**
    1. Atualizar a função `handleNextTurn` para interceptar quando o turno de um combatente se inicia (`idx === nextIndex`).
    2. No início do turno, decrementar a contagem `remainingRounds` de todos os seus efeitos ativos em `statusDurations`.
    3. Remover os efeitos que atingirem `remainingRounds <= 0`.
    4. Caso o efeito removido corresponda a uma condição ativa no array `conditions` do combatente, removê-la automaticamente também.
    5. Emitir eventos visuais de expiração (como o disparador de `masters_codex_combat_text` com o tipo `'status_expired'`).

---

### [User Interface & Components]

#### [MODIFY] [CombatantCard.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CombatantCard.tsx)
*   **Ações:**
    1. Atualizar a listagem de `conditions` ativas para renderizar a rodada restante caso exista um registro correspondente em `statusDurations` (ex: `Cego (3r)`).
    2. Adicionar renderização para buffs/status customizados salvos em `statusDurations` que não façam parte de `conditions` (usando cor diferenciada em ciano/azul).
    3. No popover de inserção de status, ao ativar uma condição, abrir um `window.prompt` solicitando a duração em rodadas (vazio ou 0 assume efeito infinito/sem tempo determinado).
    4. Adicionar um botão "+ Efeito Customizado" no final do popover de status para permitir ao mestre digitar livremente o nome de um efeito e sua duração em rodadas (ex: "Fúria", "10 rodadas").

#### [MODIFY] [CombatTracker.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/CombatTracker.tsx)
*   **Ações:**
    1. Replicar a mesma lógica de decremento automático de duração em `handleNextTurn` para garantir sincronia na tela solo do Mestre.
    2. Adicionar prompts de duração e exibição de contadores de rodadas nas tags de condições do tracker principal.

---

## Verification Plan

### Automated Tests
*   Criar um arquivo de teste específico em `lib/__tests__/combat-durations.test.ts` para validar:
    1. A adição de condições com duração e efeitos customizados em um combatente.
    2. O decremento correto de rodadas após transição de turno (`handleNextTurn`).
    3. A expiração e remoção automática de condições da ficha quando a duração zerar.

```bash
# Executar a suíte de testes de combate
npm run test lib/__tests__/combat-durations.test.ts
```

### Manual Verification
1. Abrir a mesa do Mestre, iniciar um combate e adicionar dois combatentes.
2. Aplicar a condição "Cego" em um combatente e definir a duração de 2 rodadas no prompt.
3. Adicionar o efeito customizado "Fúria" com duração de 1 rodada.
4. Passar os turnos e verificar se os contadores decrementam conforme o turno avança.
5. Garantir que no início do turno correspondente, "Fúria" desapareça após 1 rodada e "Cego" suma após 2 rodadas.
6. Verificar se as alterações refletem no console de logs e no visual dos jogadores.

---

## ✅ Phase X: Definition of Done
- Código estático validado sem lints.
- Testes de combat-durations executados e aprovados.
- Build de produção gerado com sucesso (`npm run build`).
