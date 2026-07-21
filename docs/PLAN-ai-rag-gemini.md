# PLAN-ai-rag-gemini: Integração Real de Inteligência Artificial (Gemini API + OpenRouter + RAG)

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js 15, Gemini API, OpenRouter API, RAG)

---

## 📖 Visão Geral (Overview)

A **Fase 3** substitui os textos estáticos mockados do `AICoPilot.tsx` por uma integração real com provedores de IA, suportando nativamente o **Google Gemini API** (Gemini 2.0 / 1.5 Flash) e o **OpenRouter API** (para uso de modelos gratuitos e outras alternativas como Llama 3, Claude, etc).

Com o **RAG (Retrieval-Augmented Generation) de Campanha**, a IA receberá o contexto vivo do Mundo ativo, da Cena em exibição, das Entidades de Lore (NPCs/Facções) e dos Combatentes em mesa. Assim, as narrações, descrições sensoriais e tesouros gerados serão 100% personalizados para a história atual do jogo.

---

## 🎯 Critérios de Sucesso (Success Criteria)

- [x] SDK oficial `@google/genai` instalado e suporte nativo via `fetch` para OpenRouter. Variáveis `GEMINI_API_KEY` e `OPENROUTER_API_KEY` documentadas em `.env.local.example`.
- [x] API Route `app/api/ai/narrate/route.ts` criada e funcional no Next.js Server com fallback multi-provedor (Gemini -> OpenRouter -> Demo).
- [x] Módulo RAG `lib/ai/campaign-rag.ts` criado para montar prompts ricos com o contexto do Mundo, Cena e Entidades ativas.
- [x] Componente `AICoPilot.tsx` refatorado para remover todos os `setTimeout` mockados e consumir a API de IA em tempo real.
- [x] Gerador de Loot Inteligente gerando itens e moedas coerentes com o bioma e CR do combate ativo.
- [x] Botão "Aplicar na Cena Ativa" permitindo salvar o texto gerado na propriedade `sensoryText` da cena atual com 1 clique.
- [x] Compilação de tipos TypeScript limpa (`npx tsc --noEmit`).
- [x] Build de produção aprovado (`npm run build`).

---

## 🛠️ Stack Tecnológica & Decisões

| Tecnologia | Uso Atual | Decisão na Fase 3 | Justificativa |
| :--- | :--- | :--- | :--- |
| **Google Gemini API** | Mockado (`setTimeout`) | SDK oficial `@google/genai` | Alta velocidade e ótimo suporte para geração em português. Provedor padrão se a chave estiver presente. |
| **OpenRouter API** | Nenhuma | Integração direta via `fetch` | Permite que os usuários utilizem modelos gratuitos (ex: Llama 3) ou outras alternativas premium usando o formato OpenAI. |
| **Next.js API Route** | Nenhuma | `app/api/ai/narrate/route.ts` | Proteger as chaves secretas no lado do servidor e abstrair qual provedor está sendo usado para o frontend. |
| **RAG de Campanha** | Nenhum | Módulo de contexto `lib/ai/campaign-rag.ts` | Injetar dados do Mundo (`WorldContext`), Cena (`SessionContext`) e Entidades no System Prompt da IA. |

---

## 📁 Estrutura de Arquivos Proposta

```
Masters Codex/
├── app/
│   └── api/
│       └── ai/
│           └── narrate/
│               └── route.ts       # [NOVO] Route handler para requisições Gemini API
├── lib/
│   └── ai/
│       └── campaign-rag.ts        # [NOVO] Helper de RAG para injeção de contexto de campanha
├── components/
│   └── AICoPilot.tsx              # [MODIFY] Consumo real da API com estados de loading e erro
├── .env.local.example             # [MODIFY] Inclusão de GEMINI_API_KEY e OPENROUTER_API_KEY
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Task 1: Instalar Dependências & Configurar Variáveis de Ambiente
- **Agente:** `devops-engineer` / `backend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P0 | **Dependências:** Nenhuma
- **Input:** `package.json` e `.env.local.example`.
- **Output:** Instalação do SDK `@google/genai` + configuração das variáveis `GEMINI_API_KEY` e `OPENROUTER_API_KEY`.
- **Verificação:** Presença no `package.json`.

### Task 2: Criar Helper RAG de Campanha (`lib/ai/campaign-rag.ts`)
- **Agente:** `backend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P0 | **Dependências:** Task 1
- **Input:** Tipos `World`, `GameScene`, `WorldEntity`, `Combatant`.
- **Output:** `lib/ai/campaign-rag.ts` exportando `buildCampaignPromptContext()`.
- **Verificação:** `npx tsc --noEmit`.

### Task 3: Criar Next.js API Route (`app/api/ai/narrate/route.ts`)
- **Agente:** `backend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Tasks 1 e 2
- **Input:** Prompt do usuário + contexto RAG da campanha.
- **Output:** Route POST retornando a narração refinada ou tesouro. A rota deve identificar se usará Gemini ou OpenRouter com base nas chaves configuradas (priorizando a que estiver presente).
- **Verificação:** `npx tsc --noEmit`.

### Task 4: Refatorar `AICoPilot.tsx` para Chamadas Reais de IA
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Prioridade:** P1 | **Dependências:** Task 3
- **Input:** `components/AICoPilot.tsx`.
- **Output:** Substituição do mock por chamadas `fetch('/api/ai/narrate')` com botão de cópia, loading spinner e tratamento de erros.
- **Verificação:** `npx tsc --noEmit`.

### Task 5: Integrar Botão "Aplicar na Cena Ativa"
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P2 | **Dependências:** Task 4
- **Input:** `AICoPilot.tsx` e `useSession()`.
- **Output:** Botão de 1-clique para salvar o texto gerado pela IA diretamente na cena ativa (`updateScene`).
- **Verificação:** `npx tsc --noEmit` & `npm run build`.

---

## 🧪 Fase X: Checklist de Verificação Final (Definition of Done)

- [ ] **Verificação de Tipagem:** `npx tsc --noEmit` sem erros.
- [ ] **Build de Produção:** `npm run build` gerado com sucesso.
- [ ] **Auditoria de Segurança:** `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] **Verificação Manual:** Gerar uma narração e um tesouro testando o fluxo com a chave do Gemini e, separadamente, com a do OpenRouter.
