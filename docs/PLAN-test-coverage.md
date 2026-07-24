# Plano de Cobertura de Testes Automatizados (Vitest + Playwright)

> **Status:** ⏳ Aguardando Aprovação  
> **Prioridade:** P1 (Importante)  
> **Alvo:** Atingir ampla cobertura de testes unitários (regras, mappers e serviços) e fluxos Críticos E2E (Studio, Live Cockpit, Combate, Criação).
> **Tipo de Projeto:** WEB (Next.js + TypeScript + Supabase Client)

---

## 🎯 Objetivos de Engenharia

1. **Aumentar a Cobertura de Testes Unitários/Integração (Vitest):**
   - Cobrir os mapeadores de tipos (`lib/mappers.ts`).
   - Testar o motor de rolagem de dados e análise de strings (`lib/dnd5e-dice.ts`).
   - Testar o `srdService.ts` (Compêndio SRD) com suas regras de paginação, busca e fallback offline.
   - Testar a lógica dos serviços de banco (`campaignService`, `sessionService`, `worldService`) usando mocks do cliente Supabase e repositories.

2. **Garantir Fluxos Críticos de Usuário com Testes E2E (Playwright):**
   - Validar o fluxo de combate do **Live Cockpit** (iniciativa, turnos e alternância de abas do painel).
   - Validar o fluxo do **Worldbuilder Studio** (criação de campanha, criação de cenas, upload/configuração de texturas de grid).
   - Validar a montagem correta de elementos complexos como o Canvas 3D e o Lore Graph na interface do usuário.

---

## 🏗️ Estrutura de Arquivos Proposta

```plaintext
lib/
├── __tests__/
│   ├── dnd5e-calculator.test.ts   [EXISTENTE] Testes unitários do motor D&D
│   ├── dnd5e-dice.test.ts         [NOVO] Testes unitários para rolagem de dados (expressões e parse)
│   ├── mappers.test.ts            [NOVO] Testes unitários dos mapeadores de banco/entidades
│   ├── srdService.test.ts         [NOVO] Testes de integração/unitários do compêndio SRD e fallback
│   └── campaign-services.test.ts  [NOVO] Testes unitários de serviços com mocks do Supabase
```

```plaintext
e2e/
├── campaign-flow.spec.ts          [MODIFICADO] Expandido com fluxos adicionais de criação de cena
└── live-cockpit-combat.spec.ts    [NOVO] Fluxo de combate, trackers de iniciativa e tocador de áudio
```

---

## 📋 Detalhamento das Tarefas

### Módulo 1: Testes Unitários & Integração (Vitest)

#### Task 1: Testes Unitários de Rolagem de Dados e Parsing (`lib/dnd5e-dice.ts`)
- **Agente Responsável:** `test-engineer`
- **Skills Recomendadas:** `testing-patterns`, `clean-code`
- **Prioridade:** High
- **Dependências:** Nenhuma
- **Descrição:** Validar as funções de cálculo de rolagem de dados (D20, D8, etc.) e parse de strings complexas (como `2d6 + 3`, `1d20 - 1`).
- **INPUT:** `lib/dnd5e-dice.ts`
- **OUTPUT:** `lib/__tests__/dnd5e-dice.test.ts`
- **VERIFY:** Executar `npx vitest run lib/__tests__/dnd5e-dice.test.ts` e verificar se todas as expressões válidas passam e as inválidas tratam o erro.

#### Task 2: Testes Unitários de Mapeadores (`lib/mappers.ts`)
- **Agente Responsável:** `test-engineer`
- **Skills Recomendadas:** `testing-patterns`, `clean-code`
- **Prioridade:** Medium
- **Dependências:** Nenhuma
- **Descrição:** Validar que a conversão entre o schema do Supabase (Postgres) e os tipos do frontend TypeScript funciona perfeitamente para campanhas, fichas de personagens e cenas.
- **INPUT:** `lib/mappers.ts`
- **OUTPUT:** `lib/__tests__/mappers.test.ts`
- **VERIFY:** Executar `npx vitest run lib/__tests__/mappers.test.ts` e ver todos os casos de conversão passando com 100% de sucesso.

#### Task 3: Testes de Integração de Serviços de Banco (`lib/services/campaignService.ts`, etc.)
- **Agente Responsável:** `test-engineer`
- **Skills Recomendadas:** `testing-patterns`, `api-patterns`
- **Prioridade:** High
- **Dependências:** Task 2
- **Descrição:** Escrever testes simulando chamadas de banco e verificação do padrão Repository Factory com o Supabase mockado. Garante que os métodos de busca de campanhas, membros e sessões retornam os dados adequados.
- **INPUT:** `lib/services/`
- **OUTPUT:** `lib/__tests__/campaign-services.test.ts`
- **VERIFY:** Executar `npx vitest run lib/__tests__/campaign-services.test.ts` com o cliente Supabase mockado via Vitest `vi.mock`.

#### Task 4: Testes do Serviço de Compêndio SRD (`lib/services/srdService.ts`)
- **Agente Responsável:** `test-engineer`
- **Skills Recomendadas:** `testing-patterns`, `clean-code`
- **Prioridade:** Medium
- **Dependências:** Nenhuma
- **Descrição:** Validar buscas de monstros, magias e itens pelo serviço, confirmando se o fallback local (`lib/srd-data.ts`) funciona quando o banco falha ou retorna vazio.
- **INPUT:** `lib/services/srdService.ts`
- **OUTPUT:** `lib/__tests__/srdService.test.ts`
- **VERIFY:** Executar `npx vitest run lib/__tests__/srdService.test.ts`.

---

### Módulo 2: Testes de Fluxo do Usuário E2E (Playwright)

#### Task 5: Expansão do Teste E2E de Criação de Campanha e Cena (`e2e/campaign-flow.spec.ts`)
- **Agente Responsável:** `qa-automation-engineer`
- **Skills Recomendadas:** `webapp-testing`, `clean-code`
- **Prioridade:** High
- **Dependências:** Nenhuma
- **Descrição:** Adicionar validações mais profundas no fluxo inicial: abrir a página principal, criar uma campanha, abrir o modal de nova cena e salvar uma cena configurando uma textura de grid.
- **INPUT:** `e2e/campaign-flow.spec.ts`
- **OUTPUT:** `e2e/campaign-flow.spec.ts` (modificado)
- **VERIFY:** Executar `npx playwright test e2e/campaign-flow.spec.ts` e confirmar a execução com sucesso.

#### Task 6: Teste E2E do Live Cockpit e Combate (`e2e/live-cockpit-combat.spec.ts`)
- **Agente Responsável:** `qa-automation-engineer`
- **Skills Recomendadas:** `webapp-testing`, `clean-code`
- **Prioridade:** Critical
- **Dependências:** Task 5
- **Descrição:** Escrever um teste E2E focado na tela do mestre (Studio Live Cockpit):
  - Acessar a tela do Studio de combate.
  - Verificar a visibilidade do CombatTracker e inicializar um turno.
  - Rolagem de iniciativa simulada e avanço do turno de combate.
  - Tocar uma faixa de áudio e alterar o volume (DOM / classes).
  - Garantir a presença do painel AI CoPilot e sua inicialização.
- **INPUT:** `components/LiveCockpitStudio.tsx`, `components/CombatTracker.tsx`
- **OUTPUT:** `e2e/live-cockpit-combat.spec.ts`
- **VERIFY:** Executar `npx playwright test e2e/live-cockpit-combat.spec.ts` e garantir que todos os elementos e interações cruciais passam sem quebras.

---

## 🔍 Plano de Verificação e Rollback

### Testes Automatizados (CI Local)
- Executar `npm run test` para rodar todos os testes unitários.
- Iniciar o servidor de desenvolvimento local com `npm run dev`.
- Rodar `npx playwright test` para a suíte completa de fluxos de ponta a ponta.

### Estratégia de Rollback
- Se qualquer teste unitário começar a falhar após modificações na base do código, reverteremos a branch de desenvolvimento para o último commit estável usando `git checkout -- <arquivo>` ou revert.
- Se o Playwright falhar por timeout ou flakiness no CI devido à renderização 3D, revisaremos os seletores do DOM e usaremos mecanismos de `waitForSelector` robustos em vez de tempos fixos (`page.waitForTimeout`).

---

## ✅ PHASE X: VERIFICATION CHECKLIST

Antes de finalizar o projeto de testes, os seguintes comandos devem rodar e passar com sucesso:

### 1. Lint & Compilação
- [ ] Executar `npm run lint` e corrigir qualquer aviso.
- [ ] Executar `npx tsc --noEmit` para garantir ausência de erros de tipagem no TypeScript.

### 2. Suíte de Testes Unitários
- [ ] Executar `npm run test` e verificar se todas as suítes no diretório `lib/__tests__` estão passando verde.

### 3. Suíte de Testes E2E (com Servidor Ativo)
- [ ] Iniciar o servidor Next dev.
- [ ] Executar `npx playwright test` e garantir o sucesso de todos os cenários.

### 4. Scripts de Validação Antigravity
- [ ] Executar o script de qualidade geral do projeto:
  ```bash
  python .agent/scripts/checklist.py .
  ```
- [ ] Garantir conformidade com as regras manuais (Sem tons de violeta/roxo indesejados, Socratic Gate respeitada).
