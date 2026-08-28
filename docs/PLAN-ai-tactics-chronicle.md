# 📜 Plano de Implementação: IA Tática para Monstros no Combate & Auto-Crônica da Sessão (Session Scribe)

> **Status**: Planejado  
> **Área**: Inteligência Artificial / Co-Mestre Proativo / Combate & VTT / Narrativa & Crônica  
> **Prioridade**: P1 (Pilar IA - Fase 4)  
> **Arquivos Alvo**: `app/api/ai/monster-tactics/route.ts`, `app/api/ai/generate-session-chronicle/route.ts`, `components/combat/MonsterTacticsModal.tsx`, `components/session/SessionChronicleModal.tsx`, `components/CombatTracker.tsx`, `components/SessionStudio.tsx`, `lib/types.ts`

---

## 🎯 1. Objetivo & Visão Geral

Este plano implementa o pilar de **IA como Co-Mestre Proativo**, fornecendo assistência inteligente em tempo real durante a batalha e geração automática de conteúdo após as sessões:

1. **IA Tática para Monstros no Combate ("O que este Monstro/Lich faria agora?")**:
   - Um botão no `CombatTracker` que analisa o estado tático atual da arena (posições, PV restante, condições, quem está concentrando magia, CA) e cruza com a ficha/lore do monstro ativo.
   - Fornece recomendações táticas baseadas na pontuação de **Inteligência e Sabedoria** da criatura (ex: animais atacam o alvo mais próximo ou quem os feriu; Liches e Mind Flayers exploram testes de atributos fracos, quebram concentração e guardam reações).
   - Inclui falas de interpretação (*roleplay quote*) e planos de contingência.

2. **Auto-Crônica da Sessão (Session Scribe)**:
   - Compila todo o histórico da sessão (cenas visitadas, mensagens de chat, rolagens críticas, mortes de inimigos, magias marcantes e relógios de facção disparados).
   - A IA sintetiza uma crônica épica em prosa literária estruturada em atos, com destaques para cada personagem jogador e publicação com 1-clique no Feed da Campanha.

---

## 🧱 2. Arquitetura da Solução

```mermaid
graph TD
    subgraph IA Tática em Combate
        A[CombatTracker: Turno do Monstro] -->|Clique: O que este monstro faria?| B[MonsterTacticsModal]
        B --> C[app/api/ai/monster-tactics/route.ts]
        C --> D[Análise Heurística D&D 5e: INT/WIS + PVs + Concentração]
        D --> E[Gemini 2.5 Flash / OpenRouter / Fallback]
        E --> F[Retorno JSON: Ação Principal + Movimentação + Contingência + Roleplay Quote]
    end

    subgraph Auto-Crônica da Sessão (Session Scribe)
        G[SessionStudio / Live Cockpit: Encerrar Sessão] --> H[SessionChronicleModal]
        H --> I[Coleta de Logs: Cenas, Chat, Mortes, Rolagens Críticas, Clocks]
        I --> J[app/api/ai/generate-session-chronicle/route.ts]
        J --> K[Geração em Prosa Literária: Atos I, II, III + MVP Moments]
        K --> L[Publicar no Feed da Campanha: createFeedEvent]
    end
```

---

## 📋 3. Tarefas Detalhadas por Módulo

### 🔹 Módulo A: IA Tática para Monstros (`app/api/ai/monster-tactics/` & `components/combat/`)
- [ ] **Endpoint da API `app/api/ai/monster-tactics/route.ts`**:
  - Recebe: dados do monstro ativo (nome, HP/MaxHP, CA, stats STR/DEX/CON/INT/WIS/CHA, ações/magias), lista de alvos (jogadores, HP aproximado, CA, condições, concentração ativa) e tipo de terreno/ambiente.
  - Prompt especializado com diretrizes táticas oficiais de D&D 5e (*"The Monsters Know What They're Doing"*).
  - Retorno tipado em JSON:
    - `primaryAction`: Nome da ação recomendada + Alvo sugerido + Justificativa tática.
    - `movementAdvice`: Posicionamento ideal (manter distância, flanquear, buscar cobertura).
    - `bonusOrReaction`: Uso recomendado de ação bônus ou reação reservada.
    - `roleplayQuote`: Diálogo ou descrição sensorial da criatura ao agir.
- [ ] **Componente `MonsterTacticsModal.tsx`**:
  - Modal estilizado com tema obsidian/âmbar/púrpura.
  - Exibe cartões claros: *Ação Recomendada*, *Posicionamento*, *Contingência* e *Frase de Efeito*.
  - Botão de áudio para sintetizar fala com TTS da voz do NPC/Monstro (se configurado).
- [ ] **Integração no `CombatTracker.tsx`**:
  - Botão "Sugestão Tática da IA" no cabeçalho e no card do combatente ativo quando for do tipo `monster` ou `npc`.

---

### 🔹 Módulo B: Auto-Crônica da Sessão / Session Scribe (`app/api/ai/generate-session-chronicle/` & `components/session/`)
- [ ] **Endpoint da API `app/api/ai/generate-session-chronicle/route.ts`**:
  - Recebe: lista de cenas da sessão, logs de combate, mortes, rolagens críticas e tom narrativo (Épico, Grimdark, Poético, Histórico).
  - Gera narrativa literária rica em Markdown estruturada:
    - Título do Capítulo.
    - Resumo Executivo.
    - Crônica Narrativa em Prosa.
    - Momentos de Destaque dos Jogadores (MVP Moments).
    - Consequências & Tesouros Obtidos.
- [ ] **Componente `SessionChronicleModal.tsx`**:
  - Interface com seletor de tom narrativo (Heroico, Sombrio, Bardico).
  - Visualização formatada da crônica com editor para ajustes manuais do mestre antes de publicar.
  - Botão "Publicar no Feed da Campanha" que cria um `CampaignFeedEvent` com `eventType: 'story_recap'`.
- [ ] **Integração no `SessionStudio.tsx` e `LiveCockpit`**:
  - Botão "Gerar Crônica da Sessão (Session Scribe)" no painel de sessões e na finalização do Live Cockpit.

---

## 🔬 4. Plano de Verificação & Testes

### Testes Automatizados (Vitest)
1. **`monster-tactics.test.ts`**:
   - Validar formatação do prompt tático com atributos INT/WIS de monstros.
   - Validar fallback estruturado para quando a IA estiver offline.
2. **`session-chronicle.test.ts`**:
   - Validar síntese e agrupamento de logs de combate e cenas em formato de crônica.

### Testes Manuais
1. No `CombatTracker`, selecionar um Lich ou Dragão $\rightarrow$ clicar em "Sugestão Tática da IA" $\rightarrow$ verificar sugestão inteligente de magias/ações e alvo prioritário.
2. Encerrar uma sessão de combate com vários eventos $\rightarrow$ abrir o "Session Scribe" $\rightarrow$ gerar a crônica $\rightarrow$ publicar no feed da campanha e verificar exibição no mural.

---

## 🏁 5. Próximos Passos
- [ ] Revisar o plano
- [ ] Iniciar a implementação via aprovação do usuário.
